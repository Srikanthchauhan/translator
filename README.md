# Vani AI - Real-time English to Hindi Translator

Vani is a premium AI-powered voice-to-voice translator that seamlessly converts English speech into natural-sounding Hindi audio in real-time. It leverages advanced LLMs and TTS engines to provide a low-latency, conversational experience.

🌐 **Live Demo**: https://vani-translator.vercel.app

## 🚀 Features

-   **Real-time Voice Translation**: Speak in English, and Vani responds instantly in Hindi.
-   **Zero-Latency Streaming**: Utilizes WebSocket streaming for immediate audio feedback.
-   **Natural Voice**: Powered by Edge-TTS (SwaraNeural) for high-quality Hindi speech.
-   **Intelligent Turn-Taking**: Adaptive Voice Activity Detection (VAD) to know when you pause or stop speaking.
-   **Smart Translation**: Uses Groq's Llama-3.1-8b-instant model to ensure context-aware translations (Shuddh Hindi).
-   **Premium UI**: A visually stunning interface built with Next.js, Framer Motion, and Glassmorphism effects.

## 🛠️ Tech Stack

### Backend
-   **Python** (FastAPI)
-   **Groq API** (Whisper for STT, Llama 3 for Translation)
-   **Edge-TTS** (Text-to-Speech)
-   **WebSockets** (Real-time communication)

### Frontend
-   **Next.js 14** (App Router, TypeScript)
-   **Tailwind CSS** (Styling)
-   **Framer Motion** (Animations)
-   **Lucide React** (Icons)
-   **Web Audio API** (Audio capture & playback)

## 📂 Project Structure

```
project-root/
├── backend/                # Python FastAPI Backend
│   ├── main.py             # Main server & WebSocket logic
│   ├── requirements.txt    # Python dependencies
│   └── .env                # API Keys (create this file)
│
├── frontend/               # Next.js Frontend
│   ├── app/                # App router pages
│   │   ├── page.tsx        # Main interface
│   │   └── globals.css     # Global styles & animations
│   ├── hooks/              # Custom React hooks
│   │   └── useAudioStream.ts # Audio streaming logic
│   └── package.json        # Frontend dependencies
└── README.md               # Project Documentation
```

## ⚡ Getting Started

### Prerequisites
-   Python 3.8+
-   Node.js 18+
-   A [Groq API Key](https://console.groq.com/)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3.  Create a `.env` file in the `backend/` directory:
    ```env
    GROQ_API_KEY=your_gsk_key_here
    ```

4.  Start the server:
    ```bash
    uvicorn main:app --reload
    ```
    The backend will run on `http://127.0.0.1:8000`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:3000`.

## 🎮 How to Use

1.  Open `http://localhost:3000` in your browser.
2.  Allow microphone access when prompted.
3.  Click the **Mic Button** to start listening.
4.  Speak a sentence in **English**.
5.  Wait a moment—Vani will transcribe your speech and automatically reply in **Hindi**.
6.  Click the Mic button again to stop.

## 🤝 Contributing

Feel free to submit issues and enhancement requests.
