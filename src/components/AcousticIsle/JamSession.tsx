
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StopCircle, Activity, Zap, Cpu, Mic, Eye, Database, Move, AlertCircle, Loader2, Gauge, Info, Terminal, Radio } from 'lucide-react';
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
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("System Ready. Awaiting Mission Command.");
  const [logs, setLogs] = useState<string[]>(["[KERNEL] Initialization successful.", "[SWARM] Agents awaiting hardware link."]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrchestrationStep>('idle');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const stopSession = useCallback(() => {
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
    if (!isRecording) return;
    setIsProcessing(true);
    setCurrentStep('thinking');
    addLog("Orchestrator: Analyzing 5s multimodal packet...");
    
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Agent Decision: Playing ${result.stem_name}`);
        addLog(`LlamaIndex: Heritage retrieved (${result.stem_name})`);

        setCurrentStep('logging');
        if (firestore) {
          logRoyaltyTransaction(firestore, {
            stemId: result.play_stem,
            communityId: result.community_id || "community_nicobar_01",
            amount: result.royalty_amount
          });
        }

        onRoyaltyUpdate(result.royalty_amount, result.play_stem);
        addLog(`Ledger: Micro-payment of $${result.royalty_amount.toFixed(4)} secured.`);
        
        setTimeout(() => {
          if (isRecording) {
            setCurrentStep('sensing');
            setStatus("Scanning for biometric shifts...");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Inference failure:", error);
      setStatus("Sync lost. Durable Execution enabled.");
      addLog("SYNC ALERT: Retrying multimodal link...");
      setCurrentStep('sensing');
    } finally {
      setIsProcessing(false);
    }
  };

  const startSession = async () => {
    setIsCalibrating(true);
    setStatus("Establishing secure hardware link...");
    addLog("Calibrating Vision & Audio sensors...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: 30 }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setHasPermissions(true);
      
      setTimeout(() => {
        setIsCalibrating(false);
        setIsRecording(true);
        setCurrentStep('sensing');
        setStatus("Swarm Online: Move or Sound to Lead.");
        addLog("Agents Online. Telemetry loop started.");

        const options = { mimeType: 'video/webm;codecs=vp8,opus' };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && isRecording) {
            processChunk(event.data);
          }
        };

        // 5-second window for deeper reasoning
        mediaRecorder.start(5000);
      }, 2000);

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
              
              {isRecording && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="absolute top-0 left-0 w-full h-full border-[20px] border-accent/5" />
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-2">
                    <div className="w-1 h-20 bg-accent/20 rounded-full overflow-hidden">
                       <motion.div 
                        animate={{ height: [`${energy}%`, `${energy * 0.8}%`, `${energy * 1.1}%`] }}
                        className="w-full bg-accent" 
                       />
                    </div>
                    <span className="text-[8px] font-bold text-accent uppercase vertical-text">KINETIC</span>
                  </div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
                  <div className="absolute top-4 left-4 flex gap-4">
                     <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded border border-white/10">
                        <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                        <span className="text-[8px] font-mono">MISSION_LIVE</span>
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
                        className="w-20 h-20 rounded-[2rem] bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto"
                      >
                         <Zap className="w-8 h-8 text-primary" />
                      </motion.div>
                      <div className="space-y-4">
                        <h2 className="text-3xl font-bold font-headline tracking-tight">Mission Control</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em]">Move your body or make sounds to trigger the Swarm.</p>
                        
                        {hasPermissions === false && (
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hardware Access Required</AlertTitle>
                            <AlertDescription className="text-[11px]">Please enable Camera and Microphone in browser settings.</AlertDescription>
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
                    className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl z-30"
                  >
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
                    <p className="text-sm font-bold text-accent uppercase tracking-[0.4em] animate-pulse">Sensors Warming Up...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Tempo (BPM)</p>
                    <p className="text-5xl font-headline font-bold text-accent tracking-tighter tabular-nums">
                      {bpm ? `${Math.round(bpm)}` : '---'}
                    </p>
                  </div>
                  <div className="h-16 w-px bg-white/10" />
                  <div className="space-y-3 flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Active Command</p>
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-4 min-w-[300px]">
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Activity className="w-5 h-5 text-accent" />
                      )}
                      <span className="text-xs font-bold text-foreground/80 truncate tracking-tight">
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
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white gap-4 px-10 h-16 rounded-full shadow-2xl transition-all hover:scale-105 font-black text-sm uppercase tracking-widest"
                    >
                      {isCalibrating ? "Initializing..." : "Initialize Swarm"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="w-full md:w-auto gap-4 px-10 h-16 rounded-full shadow-2xl transition-all hover:scale-105 font-black text-sm uppercase tracking-widest"
                    >
                      <StopCircle className="w-6 h-6" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-24 w-full bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative">
                <Visualizer active={isRecording} stream={streamRef.current} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card p-8 border-white/5 h-full flex flex-col shadow-2xl">
            <div className="space-y-10 relative z-10 flex-1">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-xl">
                  <Gauge className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-headline font-bold tracking-tight">Mission Logs</h3>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[10px] space-y-2 h-48 overflow-hidden">
                  <div className="flex items-center gap-2 text-primary border-b border-white/5 pb-2 mb-2">
                    <Terminal className="w-3 h-3" />
                    <span className="font-bold">LIVE TELEMETRY FEED</span>
                  </div>
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground/80 animate-in slide-in-from-left-2">
                      {log}
                    </div>
                  ))}
                  {isProcessing && <div className="text-accent animate-pulse">&gt;&gt; INFERENCE IN PROGRESS...</div>}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kinetic Intensity</p>
                    <p className="text-2xl font-headline font-bold text-accent">{Math.round(energy)}%</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${energy}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStem}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
                  >
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Active Stem</p>
                    <p className="text-lg font-headline font-bold text-foreground leading-tight">
                      {currentStem || "Awaiting Telemetry..."}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            <div className="pt-8 mt-auto border-t border-white/5">
               <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Info className="w-4 h-4 text-accent" />
                  Guide: Move for energy, Sound for tempo.
               </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
