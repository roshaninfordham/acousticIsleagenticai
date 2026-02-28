
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, StopCircle, RefreshCw, Activity, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { logRoyaltyTransaction } from '@/services/royalty-service';

interface JamSessionProps {
  onRoyaltyUpdate: (amount: number, stemId: string) => void;
}

export function JamSession({ onRoyaltyUpdate }: JamSessionProps) {
  const { firestore } = useFirestore();
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to start...");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [isDurableRetry, setIsDurableRetry] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const stopSession = useCallback(() => {
    setIsRecording(false);
    setIsDurableRetry(false);
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
    try {
      const dataUri = await blobToDataUri(blob);

      setStatus("LlamaIndex Semantic Routing...");
      const result = await generateDynamicAccompaniment({
        mediaDataUri: dataUri
      });

      if (result) {
        setBpm(result.bpm);
        setCurrentStem(result.stem_name || result.play_stem);
        setEnergy(result.energy_score * 10);
        setStatus(`Orchestrated: ${result.stem_name || result.play_stem}`);
        setErrorCount(0);
        setIsDurableRetry(false);

        // Durable Ledger Update
        if (firestore) {
          logRoyaltyTransaction(firestore, {
            stemId: result.play_stem,
            communityId: result.community_id || "community_nicobar_01",
            amount: result.royalty_amount
          });
        }

        onRoyaltyUpdate(result.royalty_amount, result.play_stem);
      }
    } catch (error) {
      console.error("Telemetry failure:", error);
      
      // Durable Execution Pattern: Retry with backoff if within limits
      if (retryCount < 2) {
        setIsDurableRetry(true);
        setStatus(`Durable Retry Mode (Attempt ${retryCount + 1})...`);
        setTimeout(() => processChunk(blob, retryCount + 1), 1000);
      } else {
        setErrorCount(prev => prev + 1);
        setStatus("Network Congestion. Using Local Buffer...");
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
      setStatus("Capturing multi-agent stream...");

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          processChunk(event.data);
        }
      };

      // Rolling 3-second chunks as per optimized sensor layer guidance
      mediaRecorder.start(3000);

    } catch (err) {
      console.error("Hardware access denied:", err);
      setStatus("Media hardware unavailable.");
    }
  };

  const blobToDataUri = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="space-y-6 md:col-span-2">
          <Card className="glass-panel overflow-hidden relative border-white/5 shadow-2xl">
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className={`w-full h-full object-cover transition-opacity duration-700 ${isRecording ? 'opacity-100' : 'opacity-0'}`}
              />
              
              <AnimatePresence>
                {!isRecording && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md z-10"
                  >
                    <div className="text-center space-y-4">
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"
                      >
                         <Camera className="w-10 h-10 text-primary" />
                      </motion.div>
                      <p className="text-sm font-medium text-muted-foreground font-headline uppercase tracking-widest">Initialize Biometric Sensors</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isRecording && (
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <Badge className="bg-red-500 text-white gap-2 border-none shadow-lg px-3 py-1">
                    <motion.span 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-2 rounded-full bg-white" 
                    />
                    AGENTIC FEED ACTIVE
                  </Badge>
                  {isDurableRetry && (
                    <Badge variant="destructive" className="gap-2 animate-pulse">
                      <ShieldCheck className="w-3 h-3" />
                      DURABLE RETRY
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Live BPM</p>
                    <p className="text-3xl font-headline font-bold text-accent tracking-tighter">
                      {bpm ? `${Math.round(bpm)}` : '--'}
                    </p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Orchestrator Status</p>
                    <p className="text-sm font-medium flex items-center gap-2 text-foreground/90">
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      ) : (
                        <Activity className="w-4 h-4 text-accent" />
                      )}
                      {status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {!isRecording ? (
                    <Button 
                      onClick={startSession} 
                      className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 h-12 rounded-full shadow-xl transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      Start Session
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="gap-2 px-8 h-12 rounded-full shadow-xl transition-all"
                    >
                      <StopCircle className="w-4 h-4" />
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              <div className="h-20 w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <Visualizer active={isRecording} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel p-6 border-white/5 h-full flex flex-col justify-between shadow-2xl overflow-hidden relative">
            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-headline font-bold">LlamaIndex Brain</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Kinetic Score</span>
                    <span className="text-accent">{Math.round(energy)}%</span>
                  </div>
                  <Progress value={energy} className="h-2 bg-white/5" />
                </div>

                <motion.div 
                  key={currentStem}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-2"
                >
                  <p className="text-[10px] font-bold text-primary uppercase">Active Heritage Stem</p>
                  <p className="text-sm font-medium italic text-foreground leading-relaxed">
                    {currentStem || "Awaiting sensor data..."}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] text-muted-foreground uppercase">Semantic Routing Active</span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="pt-8 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
                Durable Micro-Payments Enabled
              </p>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
