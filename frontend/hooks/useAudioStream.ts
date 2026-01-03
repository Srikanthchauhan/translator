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
    const wsUrl = 'ws://localhost:8000/ws/translate';
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
    if (!navigator.mediaDevices) return;

    // Reset transcripts on a new start if preferred, or keep them.
    // setTranscripts([]);

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextRef.current = ctx;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(2048, 1, 1); // Reduced buffer for lower latency

      processor.onaudioprocess = (e) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Volume calculation for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(rms);

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        socketRef.current.send(pcmData.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      processorRef.current = processor;
      setIsRecording(true);

      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }

    } catch (err) {
      console.error("Error accessing mic", err);
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
