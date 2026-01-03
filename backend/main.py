import asyncio
import os
import json
import base64
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import AsyncGroq
import edge_tts
import io
import wave
import traceback
import re

# Load environment variables
load_dotenv()

app = FastAPI(title="Vani AI API", version="1.0.0")

# Production-ready CORS settings for free deployment
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vani-translator.vercel.app",  # Your specific domain
    "https://*.vercel.app",  # All Vercel apps
    "https://*.onrender.com",  # Render.com apps
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Credentials Check
groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key or "gsk_" not in groq_api_key:
    print("\n❌ Error: GROQ_API_KEY is missing or invalid in .env file.")
    exit(1)

# Clients
groq_client = AsyncGroq(api_key=groq_api_key)

# Audio Configuration
SAMPLE_RATE = 16000
CHANNELS = 1

# System Prompt - Optimized for speed
SYSTEM_PROMPT = """You are Vani. Translate English to Hindi. Be concise (1-2 sentences max). Use clear Hindi only."""

def split_into_sentences(text):
    """Splits text into sentences based on Hindi/English punctuation."""
    # Split by Hindi purna viram (।), exclamation, question mark, or English equivalents
    sentences = re.split(r'([।!?|])', text)
    res = []
    for i in range(0, len(sentences) - 1, 2):
        s = sentences[i].strip() + sentences[i+1]
        if s: res.append(s)
    
    # Handle the last part if no punctuation
    last = sentences[-1].strip()
    if last: res.append(last)
    return res

async def generate_and_send_audio(websocket: WebSocket, text: str):
    """Generates high-quality TTS for a sentence and sends it smoothly."""
    try:
        # Use high-quality voice with optimal settings for clarity
        communicate = edge_tts.Communicate(
            text, 
            "hi-IN-SwaraNeural", 
            rate="+0%",  # Normal speed for clarity
            volume="+0%"  # Normal volume
        )
        
        # Collect all audio data first for smooth playback
        audio_data = bytearray()
        
        async for bit in communicate.stream():
            if bit["type"] == "audio":
                audio_data.extend(bit["data"])
        
        # Send complete audio in one piece for smooth playback
        if audio_data:
            await websocket.send_json({
                "type": "audio",
                "format": "mp3", 
                "data": base64.b64encode(audio_data).decode('utf-8')
            })
        
        print(f"🔊 Clear TTS: {text[:20]}...")
    except Exception as e:
        print(f"❌ TTS Error: {e}")

@app.get("/")
def root():
    return {"message": "Vani AI Backend is running", "docs": "/docs", "health": "/health"}

@app.get("/health")
def health(): 
    """Health check endpoint for Render.com"""
    return {"status": "healthy", "service": "Vani AI Backend"}

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 Client Connected to Vani AI")

    audio_buffer = bytearray()
    conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Adaptive VAD parameters - Optimized for speed
    is_speaking = False
    silence_counter = 0
    # Reduced silence for instant response: 1 chunk = ~250ms
    REQUIRED_SILENCE_CHUNKS = 1
    
    try:
        while True:
            try:
                # Receive generic message (text or binary)
                message = await websocket.receive()
                
                if "bytes" in message:
                    # Collect Audio
                    data = message["bytes"]
                    audio_buffer.extend(data)
                
                elif "text" in message:
                    # Process Command
                    command = json.loads(message["text"])
                    if command.get("type") == "process":
                        print(f"🛑 Manual Stop. Processing {len(audio_buffer)} bytes...")
                        
                        process_buffer = audio_buffer[:]
                        audio_buffer = bytearray() # Clear buffer

                        if len(process_buffer) < 1600: # Reduced minimum for faster processing
                            continue

                        # 1. Prepare WAV in memory
                        current_audio = io.BytesIO()
                        with wave.open(current_audio, 'wb') as wav_file:
                            wav_file.setnchannels(CHANNELS)
                            wav_file.setsampwidth(2)
                            wav_file.setframerate(SAMPLE_RATE)
                            wav_file.writeframes(process_buffer)
                        
                        # 2. Ultra-fast Transcription
                        try:
                            transcript = await groq_client.audio.transcriptions.create(
                                model="whisper-large-v3", 
                                file=("audio.wav", current_audio.getvalue()),
                                language="en",
                                temperature=0.0
                            )
                            text = transcript.text.strip()
                            
                            # Filter hallucinations/noise
                            if len(text) < 2 or text.lower() in ["thank you.", "bye.", "thanks.", "subtitle by", "thanks for watching"]:
                                print("🔇 Filtered out noise.")
                                continue

                            print(f"👤 User: {text}")
                            await websocket.send_json({"type": "transcript", "role": "user", "text": text})
                            conversation_history.append({"role": "user", "content": text})

                            # 3. Ultra-fast LLM Response + High-Quality TTS
                            chat_stream = await groq_client.chat.completions.create(
                                model="llama-3.1-8b-instant", 
                                messages=conversation_history,
                                stream=True,
                                temperature=0.3,
                                max_tokens=100
                            )

                            full_response = ""
                            current_sentence = ""
                            
                            async for chunk in chat_stream:
                                if chunk.choices[0].delta.content:
                                    content = chunk.choices[0].delta.content
                                    full_response += content
                                    current_sentence += content
                                    
                                    # Send partial text to UI
                                    await websocket.send_json({
                                        "type": "transcript_partial",
                                        "role": "assistant",
                                        "text": full_response
                                    })

                                    # Generate TTS only on complete sentences for smooth audio
                                    if any(punct in content for punct in ['।', '!', '?', '|', '.']):
                                        sentence_to_speak = current_sentence.strip()
                                        if len(sentence_to_speak) > 5:  # Longer minimum for better quality
                                            await generate_and_send_audio(websocket, sentence_to_speak)
                                            current_sentence = ""
                            
                            # Handle any remaining text
                            if current_sentence.strip() and len(current_sentence.strip()) > 3:
                                await generate_and_send_audio(websocket, current_sentence.strip())

                            print(f"🤖 Vani: {full_response}")
                            await websocket.send_json({"type": "transcript", "role": "assistant", "text": full_response, "isPartial": False})
                            conversation_history.append({"role": "assistant", "content": full_response})

                            # Keep history manageable
                            if len(conversation_history) > 10:
                                conversation_history = [conversation_history[0]] + conversation_history[-9:]

                        except Exception as e:
                            print(f"❌ Processing Error: {e}")
                            traceback.print_exc()

            except WebSocketDisconnect:
                print("🔌 Client Disconnected")
                break
            except Exception as e:
                print(f"⚠️ Loop Error: {e}")
                # traceback.print_exc()
                break

    except Exception as e:
        print(f"💀 Main Thread Error: {e}")
    finally:
        print("🔌 Connection Cleaned Up")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
