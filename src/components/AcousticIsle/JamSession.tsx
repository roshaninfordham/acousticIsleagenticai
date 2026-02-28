
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, StopCircle, RefreshCw, Activity, Zap, ShieldCheck, Cpu, Mic, Eye, Database, Info, Move, Music2, AlertCircle } from 'lucide-react';
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
  const [bpm, setBpm] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Awaiting hardware initialization...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDurableRetry, setIsDurableRetry] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrchestrationStep>('idle');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

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
    setStatus("Session Paused.");
  }, []);

  const processChunk = async (blob: Blob, retryCount = 0) => {
    if (!isRecording) return;
    setIsProcessing(true);
    setCurrentStep('thinking');
    
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setStatus("Gemini 3: Analyzing multimodal energy...");
      
      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Swarm Decision: ${result.stem_name || result.play_stem}`);
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
            setStatus("Watching for kinetic shifts...");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Inference failure:", error);
      if (retryCount < 2) {
        setIsDurableRetry(true);
        setStatus(`Durable Execution: Resyncing Swarm (Attempt ${retryCount + 1})...`);
        setTimeout(() => processChunk(blob, retryCount + 1), 1000);
      } else {
        setStatus("Lost sync. Holding current musical state...");
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
      
      setHasPermissions(true);
      setIsRecording(true);
      setCurrentStep('sensing');
      setStatus("Swarm is active. Start your performance!");

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0 && isRecording) {
          processChunk(event.data);
        }
      };

      mediaRecorder.start(3000);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setHasPermissions(false);
      setStatus("Hardware permissions required.");
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl space-y-12"
    >
      {/* Visual map of the Agentic Swarm */}
      <OrchestrationGraph 
        isRecording={isRecording} 
        isProcessing={isProcessing} 
        isRetry={isDurableRetry} 
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
              
              <AnimatePresence>
                {!isRecording && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-2xl z-20"
                  >
                    <div className="text-center space-y-10 p-10 max-w-lg">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.15, 1],
                          boxShadow: ["0 0 0px #8C5CD7", "0 0 60px #8C5CD7", "0 0 0px #8C5CD7"]
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-24 h-24 rounded-[2rem] bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto"
                      >
                         <Zap className="w-10 h-10 text-primary" />
                      </motion.div>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <p className="text-[12px] font-black text-accent uppercase tracking-[0.5em]">Agent Protocol v1.0</p>
                          <h2 className="text-3xl font-bold font-headline leading-tight">Prepare to Lead the Swarm</h2>
                          <p className="text-sm text-muted-foreground">The AI will interpret your movements into protected indigenous music.</p>
                        </div>
                        
                        <div className="flex flex-col gap-4 text-left p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                <Move className="w-4 h-4 text-accent" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed"><span className="text-white font-bold">The Telemetry Specialist</span> watches your body movement to determine energy levels.</p>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Mic className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed"><span className="text-white font-bold">The Rhythmic Analyst</span> listens to your humming or tapping to detect the BPM.</p>
                          </div>
                        </div>

                        {hasPermissions === false && (
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hardware Blocked</AlertTitle>
                            <AlertDescription>Please enable Camera/Mic access in your browser to start the swarm.</AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HUD Overlays */}
              {isRecording && (
                <>
                  <div className="absolute top-8 left-8 z-30 flex flex-col gap-4">
                    <Badge className="bg-red-500/90 backdrop-blur-xl text-white gap-3 border-none shadow-2xl px-5 py-2 font-black tracking-[0.2em] text-[11px]">
                      <motion.span 
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_white]" 
                      />
                      SWARM_FEED_ACTIVE
                    </Badge>
                  </div>
                  <div className="absolute bottom-8 right-8 z-30">
                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-2 h-8 bg-accent animate-pulse rounded-full" />
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Inference State</p>
                        <p className="text-[10px] font-bold text-accent">{isProcessing ? "THINKING..." : "SENSING"}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-10 space-y-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-10 w-full md:w-auto">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Detected Tempo</p>
                    <p className="text-5xl font-headline font-bold text-accent tracking-tighter tabular-nums">
                      {bpm ? `${Math.round(bpm)}` : '---'}
                    </p>
                  </div>
                  <div className="h-20 w-px bg-white/10" />
                  <div className="space-y-3 flex-1 min-w-[300px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Agent Conversation</p>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 transition-all hover:bg-white/[0.05]">
                      {isProcessing ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Cpu className="w-5 h-5 text-accent" />
                      )}
                      <span className="text-sm font-bold text-foreground/90 truncate tracking-tight">
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  {!isRecording ? (
                    <Button 
                      onClick={startSession} 
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white gap-4 px-12 h-20 rounded-full shadow-[0_0_40px_rgba(140,92,215,0.4)] transition-all hover:scale-105 font-black text-lg group"
                    >
                      <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      Initialize Swarm
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="w-full md:w-auto gap-4 px-12 h-20 rounded-full shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all hover:scale-105 font-black text-lg"
                    >
                      <StopCircle className="w-6 h-6" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-32 w-full bg-black/50 rounded-[2.5rem] border border-white/5 overflow-hidden relative shadow-inner group">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
                <Visualizer active={isRecording} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card p-10 border-white/5 h-full flex flex-col shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database className="w-48 h-48 text-accent -rotate-12" />
            </div>
            
            <div className="space-y-12 relative z-10 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <ShieldCheck className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold tracking-tight">Ethical Match</h3>
                </div>
                <p className="text-[11px] text-muted-foreground uppercase font-black tracking-[0.4em] ml-16">Heritage Routing Layer</p>
              </div>

              <div className="space-y-12">
                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Kinetic Energy</p>
                      <p className="text-4xl font-headline font-bold text-accent tabular-nums">{Math.round(energy)}%</p>
                    </div>
                  </div>
                  <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${energy}%` }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent shadow-[0_0_20px_rgba(122,210,240,0.6)]"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStem}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 space-y-6 relative overflow-hidden backdrop-blur-xl shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-[4rem] blur-2xl" />
                    <div className="space-y-3 relative z-10">
                      <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Current Heritage Decision</p>
                      <p className="text-2xl font-headline font-bold text-foreground leading-tight tracking-tight">
                        {currentStem || "Begin live feed..."}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-10 mt-auto border-t border-white/10">
              <div className="p-6 rounded-3xl bg-accent/5 border border-accent/10 space-y-3">
                 <p className="text-[10px] text-accent uppercase font-black tracking-widest flex items-center gap-2">
                   <Info className="w-3 h-3" />
                   Swarm Logic
                 </p>
                 <p className="text-xs text-foreground/70 leading-relaxed font-light">
                   The <span className="text-white font-bold">Ethnomusicologist DJ</span> agent cross-references your live video/audio feed against the LlamaIndex heritage catalog to select valid cultural stems.
                 </p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
