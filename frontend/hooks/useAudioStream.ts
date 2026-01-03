import { useRef, useState, useCallback, useEffect } from 'react';

interface TranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isPartial?: boolean;
}

export function useAudioStream() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [volume, setVolume] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef<number>(0);

  // Initialize WebSocket
  const connectWebSocket = useCallback(() => {
    // Use environment variable or fallback to production URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('Environment API URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('Using API URL:', apiUrl);
    const wsUrl = apiUrl.replace('https', 'wss').replace('http', 'ws') + '/ws/translate';
    console.log('WebSocket URL:', wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log(`Connected to backend at ${wsUrl}`);
    };

    ws.onmessage = async (event) => {
      const data = event.data;

      if (typeof data === 'string') {
        try {
          const json = JSON.parse(data);
          if (json.type === 'transcript' || json.type === 'transcript_partial') {
            handleTranscript(json);
          } else if ((json.type === 'audio' || json.type === 'audio_chunk') && json.format === 'mp3') {
            const binaryString = window.atob(json.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            queueAudioMp3(bytes.buffer);
          }
        } catch (e) {
          console.error("Error parsing JSON", e);
        }
      }
    };

    ws.onclose = () => {
      console.log('Disconnected');
      // Optional: Reconnect logic
      // setTimeout(connectWebSocket, 3000);
    };
    ws.onerror = (err) => console.error('WS Error', err);

    socketRef.current = ws;
  }, []);

  const handleTranscript = (json: any) => {
    setTranscripts(prev => {
      // Find if we already have this role's item (especially if it was partial)
      // Logic: if it's the assistant, we often update the last assistant message
      const last = prev[prev.length - 1];

      if (last && last.role === json.role && (last.isPartial || json.type === 'transcript_partial')) {
        const newArr = [...prev];
        newArr[prev.length - 1] = {
          ...last,
          text: json.text,
          isPartial: json.type === 'transcript_partial'
        };
        return newArr;
      }

      // If it's a final transcript but we didn't have a partial, or if it's a new turn
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        role: json.role,
        text: json.text,
        isPartial: json.type === 'transcript_partial'
      }];
    });
  };

  const queueAudioMp3 = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioQueueRef.current.push(audioBuffer);

      // If not currently playing, start the playback loop
      if (!isPlayingRef.current) {
        processQueue();
      }
    } catch (e) {
      console.error("Error decoding MP3", e);
    }
  };

  const processQueue = async () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const buffer = audioQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const currentTime = ctx.currentTime;
    // Schedule with a tiny buffer if needed, but usually nextStartTimeRef is perfect
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime + 0.05; // Small buffer to prevent clipping
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;

    // When this chunk finishes, check the queue again
    source.onended = () => {
      processQueue();
    };
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert('Your browser does not support media devices. Please use a modern browser like Chrome, Edge, or Firefox.');
      return;
    }

    // Reset transcripts on a new start if preferred, or keep them.
    // setTranscripts([]);

    try {
      // Request microphone access first - this will trigger browser permission prompt
      console.log('🎤 Requesting microphone access...');
      console.log('Browser:', navigator.userAgent);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      const tracks = stream.getAudioTracks();
      console.log('✅ Microphone access granted!');
      console.log('Audio tracks:', tracks);
      tracks.forEach(track => {
        console.log(`Track label: ${track.label}`);
        console.log(`Track settings:`, track.getSettings());
      });
      
      // Now enumerate devices after permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log('📱 Available audio input devices:', audioInputs.length);
      audioInputs.forEach((device, i) => {
        console.log(`  ${i + 1}. ${device.label || 'Unknown device'} (${device.deviceId.substring(0, 20)}...)`);
      });

      if (audioInputs.length === 0) {
        alert('⚠️ No microphone devices found.\n\nPlease:\n1. Connect a microphone or headset\n2. Check Windows Sound Settings\n3. Refresh this page');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Create AudioContext AFTER getting the stream (Firefox fix)
      // Use default sample rate to avoid conflicts with input device
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext || (window as any).mozAudioContext;
      if (!AudioContextClass) {
        alert('Your browser does not support Web Audio API. Please update your browser.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      console.log(`🎵 AudioContext created with sample rate: ${ctx.sampleRate}Hz`);

      const source = ctx.createMediaStreamSource(stream);
      
      // Use createScriptProcessor for compatibility, but with fallback
      const processor = ctx.createScriptProcessor ? 
        ctx.createScriptProcessor(2048, 1, 1) : 
        (ctx as any).createJavaScriptNode(2048, 1, 1);
      
      console.log('🎵 Audio processor created:', processor);

      processor.onaudioprocess = (e) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const sampleRate = e.inputBuffer.sampleRate;

        // Volume calculation for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(rms);

        // Resample to 16000 Hz if needed (for Whisper compatibility)
        let dataToSend = inputData;
        if (sampleRate !== 16000) {
          const targetSampleRate = 16000;
          const ratio = sampleRate / targetSampleRate;
          const newLength = Math.round(inputData.length / ratio);
          const resampledData = new Float32Array(newLength);
          
          for (let i = 0; i < newLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
            const t = srcIndex - srcIndexFloor;
            
            resampledData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
          }
          dataToSend = resampledData;
        }

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(dataToSend.length);
        for (let i = 0; i < dataToSend.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, dataToSend[i])) * 0x7FFF;
        }

        socketRef.current.send(pcmData.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      processorRef.current = processor;
      
      console.log('🔴 Setting isRecording to TRUE');
      setIsRecording(true);

      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
      
      console.log('✅ Recording started successfully!');

    } catch (err) {
      console.error("❌ Error accessing mic", err);
      // Provide user-friendly error message
      const error = err as Error;
      if (error.name === 'NotFoundError') {
        alert('❌ NO MICROPHONE FOUND\n\nYour computer has no microphone detected.\n\nPlease:\n1. Connect a USB microphone\n2. Connect headphones with built-in mic\n3. Enable built-in mic in Windows Sound Settings\n4. Refresh this page after connecting');
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('❌ MICROPHONE ACCESS DENIED\n\nPlease allow microphone access:\n1. Click the lock/info icon in address bar\n2. Allow microphone permission\n3. Refresh the page');
      } else {
        alert(`❌ Microphone Error: ${error.name || 'Unknown'}\n\n${error.message || 'Unknown error'}\n\nTry:\n• Restart browser\n• Check browser microphone settings\n• Connect a different microphone`);
      }
    }
  };

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
    }

    // Send signal to backend to process the buffer
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'process' }));
    }

    setIsRecording(false);
    setVolume(0);
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      socketRef.current?.close();
    };
  }, [connectWebSocket]);

  return {
    isRecording,
    isPlaying,
    startRecording,
    stopRecording,
    transcripts,
    volume
  };
}
