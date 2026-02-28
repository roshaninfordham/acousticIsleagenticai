"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, StopCircle, RefreshCw, Activity, Zap, ShieldCheck, Cpu, Mic, Eye, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { logRoyaltyTransaction } from '@/services/royalty-service';
import { OrchestrationGraph } from './OrchestrationGraph';

interface JamSessionProps {
  onRoyaltyUpdate: (amount: number, stemId: string) => void;
}

type OrchestrationStep = 'idle' | 'sensing' | 'thinking' | 'retrieving' | 'logging';

export function JamSession({ onRoyaltyUpdate }: JamSessionProps) {
  const { firestore } = useFirestore();
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Initializing hardware...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDurableRetry, setIsDurableRetry] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrchestrationStep>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const stopSession = useCallback(() => {
    setIsRecording(false);
    setIsDurableRetry(false);
    setCurrentStep('idle');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus("Session ended.");
  }, []);

  const processChunk = async (blob: Blob, retryCount = 0) => {
    setIsProcessing(true);
    setCurrentStep('thinking');
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setStatus("Gemini 3 Pro Multimodal Orchestration...");
      
      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Heritage Orchestrated: ${result.stem_name || result.play_stem}`);
        setIsDurableRetry(false);

        setCurrentStep('logging');
        if (firestore) {
          logRoyaltyTransaction(firestore, {
            stemId: result.play_stem,
            communityId: result.community_id || "community_nicobar_01",
            amount: result.royalty_amount
          });
        }

        onRoyaltyUpdate(result.royalty_amount, result.play_stem);
        
        setTimeout(() => {
          if (isRecording) {
            setCurrentStep('sensing');
            setStatus("Monitoring Biometric Feed...");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Telemetry failure:", error);
      if (retryCount < 2) {
        setIsDurableRetry(true);
        setStatus(`Durable Execution: Self-Healing Attempt ${retryCount + 1}...`);
        setTimeout(() => processChunk(blob, retryCount + 1), 1000);
      } else {
        setStatus("Buffering Local Telemetry...");
        setCurrentStep('sensing');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setIsRecording(true);
      setCurrentStep('sensing');
      setStatus("Establishing Secure Telemetry Tunnel...");

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          processChunk(event.data);
        }
      };

      mediaRecorder.start(3000);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setStatus("Media Hardware Access Required.");
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl space-y-8"
    >
      <OrchestrationGraph 
        isRecording={isRecording} 
        isProcessing={isProcessing} 
        isRetry={isDurableRetry} 
        step={currentStep} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 space-y-8">
          <Card className="glass-card overflow-hidden relative border-white/5">
            <div className="aspect-video bg-black flex items-center justify-center relative hud-border">
              <div className="scanline" />
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transition-all duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0 scale-105 blur-md'}`}
              />
              
              <AnimatePresence>
                {!isRecording && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-xl z-20"
                  >
                    <div className="text-center space-y-6">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto shadow-2xl shadow-primary/20"
                      >
                         <Camera className="w-12 h-12 text-primary" />
                      </motion.div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-accent uppercase tracking-[0.4em]">Biometric Hub Offline</p>
                        <p className="text-sm text-muted-foreground">Awaiting hardware initialization...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HUD Overlays */}
              {isRecording && (
                <>
                  <div className="absolute top-6 left-6 z-30 flex flex-col gap-3">
                    <Badge className="bg-red-500/80 backdrop-blur-md text-white gap-2 border-none shadow-xl px-4 py-1.5 font-bold tracking-widest text-[10px]">
                      <motion.span 
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" 
                      />
                      GEMINI 3 MULTIMODAL LIVE
                    </Badge>
                    <div className="flex gap-2">
                      <div className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-2">
                         <Eye className="w-3 h-3 text-accent" />
                         <span className="text-[9px] font-bold text-white uppercase">Vision Agent Active</span>
                      </div>
                      <div className="p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg flex items-center gap-2">
                         <Mic className="w-3 h-3 text-primary" />
                         <span className="text-[9px] font-bold text-white uppercase">Audio Agent Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-6 z-30 text-right">
                    <p className="text-[8px] font-bold text-accent/50 uppercase tracking-widest mb-1">Latency Optimization</p>
                    <p className="text-xs font-mono text-accent">DURABLE_LOOP_SECURED</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Telemetry BPM</p>
                    <p className="text-4xl font-headline font-bold text-accent tracking-tighter">
                      {bpm ? `${Math.round(bpm)}` : '000'}
                    </p>
                  </div>
                  <div className="h-16 w-px bg-white/5" />
                  <div className="space-y-2 flex-1">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Agentic Status</p>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Cpu className="w-4 h-4 text-accent" />
                      )}
                      <span className="text-xs font-medium text-foreground/80 truncate">
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  {!isRecording ? (
                    <Button 
                      onClick={startSession} 
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white gap-3 px-10 h-14 rounded-full shadow-2xl transition-all hover:scale-105 font-bold"
                    >
                      <Zap className="w-5 h-5" />
                      Connect Sensors
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="w-full md:w-auto gap-3 px-10 h-14 rounded-full shadow-2xl transition-all hover:scale-105 font-bold"
                    >
                      <StopCircle className="w-5 h-5" />
                      End Session
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-24 w-full bg-black/60 rounded-2xl border border-white/5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                <Visualizer active={isRecording} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card p-8 border-white/5 h-full flex flex-col shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="w-32 h-32 text-accent -rotate-12" />
            </div>
            
            <div className="space-y-10 relative z-10 flex-1">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-headline font-bold">Heritage Engine</h3>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest ml-12">LlamaIndex Semantic Core</p>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Kinetic Energy</p>
                      <p className="text-2xl font-headline font-bold text-accent">{Math.round(energy)}%</p>
                    </div>
                  </div>
                  <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${energy}%` }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(122,210,240,0.5)]"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStem}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="p-6 rounded-2xl bg-primary/10 border border-primary/20 space-y-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-accent/5 rounded-bl-full" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Active Cultural Stem</p>
                      <p className="text-lg font-headline font-bold text-foreground leading-tight">
                        {currentStem || "Awaiting Biometrics..."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                         <div className="w-1 h-3 bg-accent/40 rounded-full animate-pulse" />
                         <div className="w-1 h-3 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                         <div className="w-1 h-3 bg-accent/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Autonomous Sync</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-8 mt-auto border-t border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                   <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Durable Status</p>
                   <p className="text-[10px] font-bold text-accent">READ_WRITE_SECURED</p>
                </div>
                <div className="p-2 bg-accent/10 rounded-lg">
                   <ShieldCheck className="w-4 h-4 text-accent" />
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
