
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StopCircle, Activity, Zap, Cpu, Mic, Eye, Database, Move, AlertCircle, Loader2, Gauge, Info, Terminal, Radio, Music, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { logRoyaltyTransaction } from '@/services/royalty-service';
import { OrchestrationGraph } from './OrchestrationGraph';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface JamSessionProps {
  onRoyaltyUpdate: (amount: number, stemId: string) => void;
}

type OrchestrationStep = 'idle' | 'sensing' | 'thinking' | 'retrieving' | 'logging';

export function JamSession({ onRoyaltyUpdate }: JamSessionProps) {
  const { firestore } = useFirestore();
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recordingRef = useRef(false);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Real-time Motion Detection for "Zero-Latency" HUD
  useEffect(() => {
    let animationFrame: number;
    const detectMotion = () => {
      if (recordingRef.current && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let total = 0;
          for (let i = 0; i < frame.data.length; i += 40) { // Sample pixels
            total += frame.data[i];
          }
          // Very simple movement proxy: variance in brightness
          const avg = total / (frame.data.length / 40);
          setLocalEnergy(Math.min(100, Math.max(0, (avg / 255) * 100)));
        }
      }
      animationFrame = requestAnimationFrame(detectMotion);
    };
    detectMotion();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const triggerAudioResponse = (energyLevel: number, detectedBpm: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(150 + (energyLevel * 40), ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn("Audio Context blocked by browser policy.");
    }
  };

  const stopSession = useCallback(() => {
    recordingRef.current = false;
    setIsRecording(false);
    setIsCalibrating(false);
    setCurrentStep('idle');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus("Mission Deactivated.");
    addLog("Hardware link severed.");
  }, []);

  const processChunk = async (blob: Blob) => {
    if (!recordingRef.current) return;
    setIsProcessing(true);
    setCurrentStep('thinking');
    addLog("SWARM: Analyzing multimodal packet (3s window)...");
    
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result && recordingRef.current) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Swarm Decision: Active Stem - ${result.stem_name}`);
        addLog(`LLAMAINDEX: Cultural match: ${result.stem_name}`);
        
        triggerAudioResponse(result.energy_score, result.bpm);

        setCurrentStep('logging');
        if (firestore) {
          logRoyaltyTransaction(firestore, {
            stemId: result.play_stem,
            communityId: result.community_id || "community_nicobar_01",
            amount: result.royalty_amount
          });
        }

        onRoyaltyUpdate(result.royalty_amount, result.play_stem);
        addLog(`LEDGER: $${result.royalty_amount.toFixed(4)} secured.`);
        
        setTimeout(() => {
          if (recordingRef.current) {
            setCurrentStep('sensing');
            setStatus("Scanning for kinetic shifts...");
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Inference failure:", error);
      addLog("RETRY: Re-syncing multimodal link...");
      setCurrentStep('sensing');
    } finally {
      setIsProcessing(false);
    }
  };

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
        addLog("AGENTS ONLINE: Telemetry loop engaged.");

        const options = { mimeType: 'video/webm;codecs=vp8,opus' };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && recordingRef.current) {
            processChunk(event.data);
          }
        };

        // 3-second chunks for snappier feedback
        mediaRecorder.start(3000);
      }, 1500);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setHasPermissions(false);
      setIsCalibrating(false);
      setStatus("Permissions Error: Check Browser.");
      addLog("CRITICAL: Hardware link failed.");
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
                  {/* Kinetic Feedback Bars - REFRESHING INSTANTLY */}
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

                  {/* Multi-Agent HUD Overlay */}
                  <motion.div 
                    animate={{ opacity: [0.1, 0.25, 0.1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" 
                  />
                  
                  <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                       <span className="text-[10px] font-mono text-accent font-bold tracking-tighter">SWARM_SYNC_STREAMING</span>
                       <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#7AD2F0]" />
                    </div>
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
                    {isProcessing && <div className="text-accent animate-pulse font-bold">{'>'}{'>'} SWARM_INFERENCE_IN_PROGRESS...</div>}
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

