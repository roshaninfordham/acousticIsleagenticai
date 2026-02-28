
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StopCircle, Activity, Zap, Cpu, Mic, Eye, Database, Move, AlertCircle, Loader2, Gauge } from 'lucide-react';
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
  const [status, setStatus] = useState<string>("Ready to initialize agents.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<OrchestrationStep>('idle');
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    setStatus("Swarm deactivated.");
  }, []);

  const processChunk = async (blob: Blob) => {
    if (!isRecording) return;
    setIsProcessing(true);
    setCurrentStep('thinking');
    
    try {
      const reader = new FileReader();
      const dataUri = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setStatus("Gemini 3: Analyzing kinetic & rhythmic telemetry...");
      
      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result) {
        setCurrentStep('retrieving');
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Swarm Decision: Playing ${result.stem_name}`);

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
            setStatus("Watching for biometric shifts...");
          }
        }, 1500);
      }
    } catch (error) {
      console.error("Inference failure:", error);
      setStatus("Sync lost. Retrying swarm connection...");
      setCurrentStep('sensing');
    } finally {
      setIsProcessing(false);
    }
  };

  const startSession = async () => {
    setIsCalibrating(true);
    setStatus("Establishing secure hardware link...");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: 30 }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setHasPermissions(true);
      
      // Artificial delay for futuristic calibration feel
      setTimeout(() => {
        setIsCalibrating(false);
        setIsRecording(true);
        setCurrentStep('sensing');
        setStatus("Swarm Active: Move or make sound to lead.");

        const options = { mimeType: 'video/webm;codecs=vp8,opus' };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0 && isRecording) {
            processChunk(event.data);
          }
        };

        // Emit every 5 seconds for deeper analysis as requested
        mediaRecorder.start(5000);
      }, 2000);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setHasPermissions(false);
      setIsCalibrating(false);
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
                        <h2 className="text-3xl font-bold font-headline tracking-tight">Lead the Musical Swarm</h2>
                        <div className="grid grid-cols-2 gap-4 text-left">
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                             <div className="flex items-center gap-2 text-accent">
                               <Move className="w-4 h-4" />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Vision</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed">Sway, dance, or move your hands to set the energy.</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                             <div className="flex items-center gap-2 text-primary">
                               <Mic className="w-4 h-4" />
                               <span className="text-[10px] font-bold uppercase tracking-widest">Audio</span>
                             </div>
                             <p className="text-[10px] text-muted-foreground leading-relaxed">Hum, tap, or sing to set the rhythmic tempo.</p>
                          </div>
                        </div>

                        {hasPermissions === false && (
                          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-left">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hardware Access Required</AlertTitle>
                            <AlertDescription className="text-[11px]">Please enable Camera and Microphone to interact with the swarm.</AlertDescription>
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
                    <p className="text-sm font-bold text-accent uppercase tracking-[0.4em] animate-pulse">Sensors Calibrating...</p>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Establishing secure telemetry link</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isRecording && (
                <>
                  <div className="absolute top-8 left-8 z-30">
                    <Badge className="bg-red-500/90 backdrop-blur-xl text-white gap-3 border-none shadow-2xl px-5 py-2 font-black tracking-[0.2em] text-[10px]">
                      <motion.span 
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 rounded-full bg-white" 
                      />
                      SWARM_ORCHESTRATION_ACTIVE
                    </Badge>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-20">
                     <div className="absolute inset-0 border border-accent/20 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
                     <div className="h-full w-full flex items-center justify-center">
                        <div className="w-[80%] h-[80%] border-2 border-dashed border-accent/10 rounded-full animate-[spin_20s_linear_infinite]" />
                     </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="p-10 space-y-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-10 w-full md:w-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Tempo (BPM)</p>
                    <p className="text-5xl font-headline font-bold text-accent tracking-tighter tabular-nums">
                      {bpm ? `${Math.round(bpm)}` : '---'}
                    </p>
                  </div>
                  <div className="h-16 w-px bg-white/10" />
                  <div className="space-y-3 flex-1 min-w-[320px]">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Agent Conversation</p>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4">
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
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white gap-4 px-12 h-20 rounded-full shadow-2xl transition-all hover:scale-105 font-black text-lg group"
                    >
                      {isCalibrating ? "Starting..." : "Initialize Swarm"}
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="w-full md:w-auto gap-4 px-12 h-20 rounded-full shadow-2xl transition-all hover:scale-105 font-black text-lg"
                    >
                      <StopCircle className="w-6 h-6" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-32 w-full bg-black/40 rounded-[2.5rem] border border-white/5 overflow-hidden relative group">
                <Visualizer active={isRecording} stream={streamRef.current} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card p-10 border-white/5 h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="space-y-12 relative z-10 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-2xl">
                    <Gauge className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold tracking-tight">Live Telemetry</h3>
                </div>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Kinetic Intensity</p>
                    <p className="text-3xl font-headline font-bold text-accent">{Math.round(energy)}%</p>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${energy}%` }}
                      className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_15px_rgba(122,210,240,0.5)]"
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={currentStem}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 space-y-4 relative overflow-hidden backdrop-blur-xl shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-[3rem] blur-xl" />
                    <div className="space-y-2 relative z-10">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Active Heritage Loop</p>
                      <p className="text-xl font-headline font-bold text-foreground leading-tight">
                        {currentStem || "Awaiting Performance..."}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="pt-10 mt-auto border-t border-white/10">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                 <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-relaxed">
                   The <span className="text-white">Swarm</span> interprets your presence. Minimal movements or sounds are amplified through our <span className="text-accent">Multimodal Ingestion Pipeline</span>.
                 </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
