
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StopCircle, Activity, Zap, Cpu, Mic, Eye, Database, Move, AlertCircle, Loader2, Gauge, Info, Terminal, Radio, Music, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { motion, AnimatePresence } from 'framer-motion';
import { OrchestrationGraph } from './OrchestrationGraph';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface JamSessionProps {
  onRoyaltyUpdate: (amount: number, stemId: string) => void;
}

type OrchestrationStep = 'idle' | 'sensing' | 'thinking' | 'retrieving' | 'logging';

// Musical scale frequencies for generative audio
const SCALES = {
  pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25],
  minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
  ambient: [130.81, 164.81, 196.00, 220.00, 261.63, 329.63],
};

export function JamSession({ onRoyaltyUpdate }: JamSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [localEnergy, setLocalEnergy] = useState<number>(0);
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("System Ready. Awaiting Mission Command.");
  const [logs, setLogs] = useState<string[]>(["[KERNEL] Initialization successful.", "[SWARM] Agents awaiting hardware link."]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrchestrationStep>('idle');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [inferenceCount, setInferenceCount] = useState(0);
  const [orchestrationMode, setOrchestrationMode] = useState<string>('detecting');
  const [youtubeVideo, setYoutubeVideo] = useState<{ videoId: string; title: string; channelTitle: string; thumbnailUrl: string; embedUrl: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recordingRef = useRef(false);
  const inferenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-8), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Real-time motion detection with actual frame differencing
  useEffect(() => {
    let animationFrame: number;
    const detectMotion = () => {
      if (recordingRef.current && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);

          if (prevFrameRef.current) {
            let diff = 0;
            const prevData = prevFrameRef.current.data;
            const currData = currentFrame.data;
            for (let i = 0; i < currData.length; i += 16) {
              diff += Math.abs(currData[i] - prevData[i]);
              diff += Math.abs(currData[i + 1] - prevData[i + 1]);
              diff += Math.abs(currData[i + 2] - prevData[i + 2]);
            }
            const normalizedDiff = diff / (currData.length / 16) / 3;
            const energyVal = Math.min(100, Math.max(0, normalizedDiff * 4));
            setLocalEnergy(prev => prev * 0.7 + energyVal * 0.3);
          }
          prevFrameRef.current = currentFrame;
        }
      }
      animationFrame = requestAnimationFrame(detectMotion);
    };
    detectMotion();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Capture a JPEG frame from the video feed
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return null;

    let canvas = captureCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, 640, 480);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  // Rich audio response
  const triggerAudioResponse = useCallback((energyLevel: number, detectedBpm: number, stemType?: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const scale = stemType === 'Percussion' ? SCALES.pentatonic :
        stemType === 'Vocal' ? SCALES.minor : SCALES.ambient;

      const noteCount = Math.max(2, Math.min(6, Math.floor(energyLevel / 2)));
      const noteDuration = 60 / detectedBpm;

      for (let i = 0; i < noteCount; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        const noteIndex = Math.floor(Math.random() * scale.length);
        osc.frequency.setValueAtTime(scale[noteIndex], now + i * noteDuration);
        osc.type = energyLevel > 6 ? 'sawtooth' : energyLevel > 3 ? 'triangle' : 'sine';

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + energyLevel * 200, now);
        filter.Q.setValueAtTime(2, now);

        gain.gain.setValueAtTime(0, now + i * noteDuration);
        gain.gain.linearRampToValueAtTime(0.08, now + i * noteDuration + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteDuration + noteDuration * 0.9);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * noteDuration);
        osc.stop(now + i * noteDuration + noteDuration);
      }

      if (energyLevel > 5) {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.frequency.setValueAtTime(55, now);
        subOsc.type = 'sine';
        subGain.gain.setValueAtTime(0.06, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.5);
      }
    } catch (e) {
      console.warn("Audio Context blocked by browser policy.");
    }
  }, []);

  const stopSession = useCallback(() => {
    recordingRef.current = false;
    setIsRecording(false);
    setIsCalibrating(false);
    setCurrentStep('idle');
    if (inferenceTimerRef.current) {
      clearInterval(inferenceTimerRef.current);
      inferenceTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    prevFrameRef.current = null;
    setStatus("Mission Deactivated.");
    addLog("Hardware link severed.");
  }, []);

  // The core inference loop — routes through /api/orchestrate (Temporal → direct fallback)
  const runInference = useCallback(async () => {
    if (!recordingRef.current || isProcessing) return;

    setIsProcessing(true);
    setCurrentStep('thinking');
    addLog("SWARM: Capturing multimodal snapshot...");

    try {
      const frameDataUri = captureFrame();
      if (!frameDataUri) {
        addLog("WARN: No frame captured, retrying next cycle...");
        setIsProcessing(false);
        setCurrentStep('sensing');
        return;
      }

      addLog("TEMPORAL: Dispatching to orchestration pipeline...");

      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameDataUri,
          sessionId: sessionIdRef.current,
        }),
      });

      const result = await response.json();

      if (result && recordingRef.current) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setOrchestrationMode(result.orchestration || 'unknown');
        setStatus(`Swarm Decision: ${result.stem_name} (Energy: ${result.energy_score}/10)`);
        addLog(`LLAMAINDEX: Heritage match → "${result.stem_name}"`);
        addLog(`MODE: ${(result.orchestration || 'direct').toUpperCase()} | ${result.analysis_summary?.substring(0, 60) || ''}`);

        if (result.youtube) {
          setYoutubeVideo(result.youtube);
          addLog(`YOUTUBE: "${result.youtube.title.substring(0, 40)}" ▶`);
        }

        triggerAudioResponse(result.energy_score, result.bpm, undefined);

        setCurrentStep('logging');
        onRoyaltyUpdate(result.royalty_amount, result.play_stem);
        addLog(`LEDGER: $${result.royalty_amount.toFixed(4)} secured for ${result.community_id}`);
        setInferenceCount(prev => prev + 1);

        setTimeout(() => {
          if (recordingRef.current) {
            setCurrentStep('sensing');
            setStatus("Scanning for kinetic shifts...");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Inference failure:", error);
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Pipeline error'}`);
      addLog("RETRY: Re-syncing on next cycle...");
      setCurrentStep('sensing');
    } finally {
      setIsProcessing(false);
    }
  }, [captureFrame, onRoyaltyUpdate, triggerAudioResponse, isProcessing]);

  const startSession = async () => {
    setIsCalibrating(true);
    setStatus("Establishing secure hardware link...");
    addLog("CALIBRATING: Vision & Audio sensors...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 24 },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      setHasPermissions(true);

      setTimeout(() => {
        setIsCalibrating(false);
        setIsRecording(true);
        recordingRef.current = true;
        setCurrentStep('sensing');
        setStatus("Swarm Online: Move or Sound to Lead.");
        addLog("AGENTS ONLINE: Telemetry loop engaged (5s cycle).");

        setTimeout(() => {
          if (recordingRef.current) runInference();
        }, 2000);

        inferenceTimerRef.current = setInterval(() => {
          if (recordingRef.current && !document.hidden) {
            runInference();
          }
        }, 5000);
      }, 1500);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setHasPermissions(false);
      setIsCalibrating(false);
      setStatus("Permissions Error: Check Browser.");
      addLog("CRITICAL: Hardware link failed. Enable Camera/Mic.");
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl space-y-10"
    >
      <OrchestrationGraph
        isRecording={isRecording}
        isProcessing={isProcessing}
        isRetry={false}
        step={currentStep}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card overflow-hidden relative border-white/5 shadow-2xl group">
            <div className="aspect-video bg-black flex items-center justify-center relative hud-border">
              <div className="scanline" />
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-all duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0 scale-105 blur-lg'}`}
              />
              <canvas ref={canvasRef} className="hidden" width="160" height="120" />

              {isRecording && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {/* Kinetic Feedback Bars */}
                  <div className="absolute top-1/2 left-6 -translate-y-1/2 flex flex-col gap-3">
                    <div className="w-1.5 h-48 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        animate={{ height: `${localEnergy}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="w-full bg-accent shadow-[0_0_15px_#7AD2F0]"
                      />
                    </div>
                    <span className="text-[9px] font-black text-accent uppercase vertical-text tracking-widest">KINETIC_FLUX</span>
                  </div>

                  <motion.div
                    animate={{ opacity: [0.1, 0.25, 0.1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"
                  />

                  <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                      <span className="text-[10px] font-mono text-accent font-bold tracking-tighter">
                        {orchestrationMode === 'temporal' ? 'TEMPORAL_DURABLE_EXEC' : 'DIRECT_SWARM_SYNC'}
                      </span>
                      <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#7AD2F0]" />
                    </div>
                  </div>

                  <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                    <Cpu className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-mono text-primary font-bold">INFERENCES: {inferenceCount}</span>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {(!isRecording && !isCalibrating) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-2xl z-20"
                  >
                    <div className="text-center space-y-8 p-10 max-w-lg">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          boxShadow: ["0 0 0px #8C5CD7", "0 0 40px #8C5CD7", "0 0 0px #8C5CD7"]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="w-24 h-24 rounded-[2.5rem] bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto"
                      >
                        <Zap className="w-10 h-10 text-primary" />
                      </motion.div>
                      <div className="space-y-4">
                        <h2 className="text-4xl font-bold font-headline tracking-tighter">Initialize Interface</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-[0.3em] font-bold">Move for Energy • Speak for Rhythm</p>

                        {hasPermissions === false && (
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hardware Required</AlertTitle>
                            <AlertDescription className="text-[11px]">Please enable Camera/Mic in browser settings.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {isCalibrating && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl z-30"
                  >
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-accent animate-spin mb-8" />
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-accent/20 animate-ping" />
                    </div>
                    <p className="text-sm font-black text-accent uppercase tracking-[0.5em] animate-pulse">Sensors_Calibrating</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-10 space-y-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-10 w-full md:w-auto">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Tempo (BPM)</p>
                    <p className="text-6xl font-headline font-bold text-accent tracking-tighter tabular-nums">
                      {bpm ? `${Math.round(bpm)}` : '---'}
                    </p>
                  </div>
                  <div className="h-20 w-px bg-white/10" />
                  <div className="space-y-4 flex-1">
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Live Status</p>
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-5 min-w-[340px]">
                      {isProcessing ? (
                        <div className="relative">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <div className="absolute inset-0 animate-ping bg-primary/20 rounded-full" />
                        </div>
                      ) : (
                        <Activity className="w-6 h-6 text-accent" />
                      )}
                      <span className="text-xs font-bold text-foreground/90 truncate tracking-tight">
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  {!isRecording ? (
                    <Button
                      onClick={startSession}
                      disabled={isCalibrating}
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white gap-4 px-12 h-20 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 font-black text-base uppercase tracking-widest group"
                    >
                      {isCalibrating ? "Syncing..." : "Launch Swarm"}
                      <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopSession}
                      variant="destructive"
                      className="w-full md:w-auto gap-4 px-12 h-20 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 font-black text-base uppercase tracking-widest"
                    >
                      <StopCircle className="w-6 h-6" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-32 w-full bg-black/50 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-inner">
                <Visualizer active={isRecording} stream={streamRef.current} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card p-10 border-white/5 h-full flex flex-col shadow-2xl">
            <div className="space-y-12 relative z-10 flex-1">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-accent/20 rounded-2xl shadow-inner">
                  <Gauge className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-2xl font-headline font-bold tracking-tighter leading-none">Mission Logs</h3>
              </div>

              <div className="space-y-8">
                <div className="p-6 rounded-2xl bg-black/60 border border-white/5 font-mono text-[11px] space-y-3 h-80 overflow-hidden relative">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-3 text-primary">
                      <Terminal className="w-4 h-4" />
                      <span className="font-black uppercase tracking-widest">REALTIME_TELEMETRY</span>
                    </div>
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  </div>
                  <div className="space-y-2 scrollbar-hide overflow-y-auto h-[calc(100%-40px)]">
                    {logs.map((log, i) => (
                      <div key={i} className="text-muted-foreground/90 animate-in slide-in-from-left-2 duration-500">
                        {log}
                      </div>
                    ))}
                    {isProcessing && <div className="text-accent animate-pulse font-bold">{'>'}{'>'}  SWARM_INFERENCE_IN_PROGRESS...</div>}
                  </div>
                </div>

                <div className="space-y-5 pt-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">Kinetic Score</p>
                    <p className="text-3xl font-headline font-bold text-accent tabular-nums">
                      {Math.round(isRecording ? localEnergy : 0)}%
                    </p>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${isRecording ? localEnergy : 0}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStem}
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="p-8 rounded-[2rem] bg-white/[0.04] border border-white/10 space-y-4 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Music className="w-16 h-16 text-accent" />
                    </div>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em]">Active Heritage Stem</p>
                    <p className="text-xl font-headline font-bold text-foreground leading-tight tracking-tight">
                      {currentStem || "Awaiting Telemetry..."}
                    </p>
                    {currentStem && (
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 12, 4] }}
                              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                              className="w-1 bg-accent rounded-full"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Synths Engaged</span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {youtubeVideo && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-3"
                  >
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em] flex items-center gap-1.5">
                      <Volume2 className="w-3 h-3" />
                      YouTube Heritage Reference
                    </p>
                    <a href={`https://youtube.com/watch?v=${youtubeVideo.videoId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group/yt hover:bg-white/5 rounded-lg p-1.5 transition-colors">
                      {youtubeVideo.thumbnailUrl && (
                        <img src={youtubeVideo.thumbnailUrl} alt="" className="w-20 h-12 rounded-lg object-cover border border-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-foreground font-bold truncate group-hover/yt:text-red-400 transition-colors">{youtubeVideo.title}</p>
                        <p className="text-[9px] text-muted-foreground">{youtubeVideo.channelTitle}</p>
                      </div>
                    </a>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="pt-8 mt-auto border-t border-white/5">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Guide: Move for energy, sound for tempo.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
