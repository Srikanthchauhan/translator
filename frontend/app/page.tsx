"use client";

import React, { useState, useEffect } from 'react';
import { useAudioStream } from '../hooks/useAudioStream';
import { Mic, MicOff, Volume2, Languages, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const { isRecording, isPlaying, startRecording, stopRecording, transcripts, volume } = useAudioStream();
    const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');

    const lastTranscript = transcripts[transcripts.length - 1];

    useEffect(() => {
        if (!isRecording) {
            setStatus('idle');
        } else if (isPlaying) {
            setStatus('speaking');
        } else if (lastTranscript?.role === 'user' && !isPlaying) {
            // After user speaks, if we are not playing audio, we are likely thinking
            setStatus('thinking');
        } else if (isRecording) {
            setStatus('listening');
        }
    }, [isRecording, isPlaying, lastTranscript]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-between p-4 text-white relative overflow-hidden font-sans">
            {/* Optimized Video Background */}
            <div className="absolute inset-0 z-0">
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.6)' }}
                >
                    <source src="/background.mp4" type="video/mp4" />
                </video>
                {/* Lighter overlay */}
                <div className="absolute inset-0 bg-black/30"></div>
            </div>

            {/* Lightweight particle effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <div className="absolute top-[30%] left-[20%] w-16 h-16 bg-blue-500/20 rounded-full blur-[20px] forward-particle" />
                <div className="absolute bottom-[40%] right-[25%] w-20 h-20 bg-purple-500/20 rounded-full blur-[25px] forward-particle" style={{ animationDelay: '-3s' }} />
            </div>

            {/* Main Content Container - Above Background */}
            <div className="z-20 flex flex-col items-center justify-center flex-1 text-center w-full max-w-md mx-auto space-y-6">

                {/* Recording Status Indicator - Prominent for Firefox compatibility */}
                {isRecording && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex items-center gap-3"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-3 h-3 bg-white rounded-full"
                        />
                        <span className="text-white font-semibold text-sm">Recording...</span>
                    </motion.div>
                )}

                {/* Compact Header Section - Instant Load */}
                <div className="flex flex-col items-center space-y-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Languages className="w-3 h-3 text-blue-400" />
                        <span className="text-[8px] font-bold tracking-[0.15em] uppercase text-blue-100/70">EN ↔ HI</span>
                        <Zap className="w-3 h-3 text-yellow-400" />
                    </div>

                    <p className="text-blue-100/60 text-sm font-light tracking-wide h-5 max-w-xs mx-auto">
                        {status === 'idle' && "Ready to translate"}
                        {status === 'listening' && "Listening..."}
                        {status === 'thinking' && "Processing..."}
                        {status === 'speaking' && "Speaking in Hindi..."}
                    </p>
                </div>

                {/* Compact Interactive Visualization */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                    {/* Ripple Effects during recording */}
                    <AnimatePresence>
                        {isRecording && (
                            <>
                                {[0, 1].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1.8, opacity: 0 }}
                                        exit={{ scale: 0.8, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 2, delay: i * 1, ease: "easeOut" }}
                                        className="absolute inset-0 rounded-full border border-blue-400/40"
                                    />
                                ))}
                            </>
                        )}
                    </AnimatePresence>

                    {/* Compact Visualizer Circle with Video */}
                    <motion.div
                        animate={{
                            scale: status === 'speaking' ? [1, 1.05, 1] : 1,
                            borderColor: status === 'listening' ? "rgba(59, 130, 246, 0.6)" : status === 'speaking' ? "rgba(34, 197, 94, 0.4)" : "rgba(255, 255, 255, 0.1)",
                            background: status === 'listening'
                                ? "radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)"
                                : status === 'speaking'
                                    ? "radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(0,0,0,0) 70%)"
                                    : "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)"
                        }}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full glass flex items-center justify-center transition-all duration-700 relative group overflow-hidden"
                    >
                        {/* Optimized video */}
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                            preload="metadata"
                            className={`w-24 h-24 md:w-32 md:h-32 object-cover rounded-full transition-transform duration-300 ${
                                status === 'listening' ? 'scale-110' : 
                                status === 'speaking' ? 'scale-105' : 
                                'scale-100'
                            }`}
                        >
                            <source src="/logo.mp4" type="video/mp4" />
                        </video>
                        
                        {/* Status icon overlay when needed */}
                        {status === 'speaking' && (
                            <div className="absolute top-2 right-2 bg-emerald-500/80 rounded-full p-1">
                                <Volume2 className="w-4 h-4 text-white" />
                            </div>
                        )}
                        
                        {/* Fallback animation if video doesn't load */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${status !== 'idle' ? 'opacity-0' : 'opacity-20'}`}>
                            <div className="flex items-center gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            height: [4, 12, 4],
                                            opacity: [0.3, 0.8, 0.3]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1,
                                            delay: i * 0.2
                                        }}
                                        className="w-1 bg-white/40 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Compact Control Section */}
                <div className="flex flex-col items-center space-y-4 w-full">
                    {/* Compact Transcript Display */}
                    <div className="min-h-[60px] w-full max-w-sm px-4 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {lastTranscript && status !== 'idle' ? (
                                <motion.div
                                    key={lastTranscript.id + (lastTranscript.isPartial ? '_part' : '_full')}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="px-4 py-3 rounded-2xl glass text-sm md:text-base text-white/90 font-medium leading-relaxed shadow-lg w-full border border-white/10"
                                >
                                    <span className={`text-[8px] uppercase tracking-widest font-bold block mb-1 ${lastTranscript.role === 'user' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                        {lastTranscript.role === 'user' ? 'You' : 'Vani'}
                                    </span>
                                    {lastTranscript.text}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.5 }}
                                    className="text-white/20 italic text-xs tracking-wider"
                                >
                                    TAP TO START
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Compact Power Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`group relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isRecording
                                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                                : 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                        }`}
                    >
                        <div className={`absolute inset-[-4px] rounded-full border transition-all duration-500 ${
                            isRecording ? 'border-red-500/50 scale-110 animate-ping' : 'border-white/20'
                        }`} />

                        {isRecording ? (
                            <MicOff className="w-6 h-6 md:w-8 md:h-8 text-white relative z-10" />
                        ) : (
                            <Mic className="w-6 h-6 md:w-8 md:h-8 text-black relative z-10" />
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Compact Footer */}
            <div className="text-[8px] tracking-[0.3em] uppercase text-white/60 font-bold z-20 pb-4 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
                Vani AI • Real-time Translation
            </div>
        </main>
    );
}
