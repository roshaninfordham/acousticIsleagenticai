
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, StopCircle, RefreshCw, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface JamSessionProps {
  onRoyaltyUpdate: (amount: string, stemId: string) => void;
}

export function JamSession({ onRoyaltyUpdate }: JamSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number>(0);
  const [currentStem, setCurrentStem] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to start...");
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const stopSession = useCallback(() => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus("Session ended.");
  }, []);

  const processChunk = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const dataUri = await blobToDataUri(blob);

      setStatus("AI Analyzing performance...");
      // We send the same blob for both audio and video fields since it's a multimodal webm
      const result = await generateDynamicAccompaniment({
        audioDataUri: dataUri,
        videoDataUri: dataUri
      });

      if (result) {
        setBpm(result.bpm);
        setCurrentStem(result.play_stem);
        onRoyaltyUpdate(result.royalty_split, result.play_stem);
        setStatus("Accompaniment: " + result.play_stem.replace(/_/g, ' '));
        setEnergy(Math.min(100, (result.bpm / 180) * 100));
      }
    } catch (error) {
      console.error("AI Telemetry failed:", error);
      setStatus("Telemetry sync error. Retrying...");
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
      setStatus("Capturing biometric stream...");

      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          processChunk(event.data);
        }
      };

      // Start capturing 3-second rolling chunks
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Multimodal Monitors */}
        <div className="space-y-6 md:col-span-2">
          <Card className="glass-panel overflow-hidden relative group border-white/5 shadow-2xl">
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
                      <p className="text-sm font-medium text-muted-foreground font-headline">Initialize Biometric Sensors</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* HUD Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <Badge className="bg-red-500/90 hover:bg-red-500/90 text-white gap-2 border-none shadow-lg">
                    <motion.span 
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="w-2 h-2 rounded-full bg-white" 
                    />
                    BIO-STREAM LIVE
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tempo</p>
                    <p className="text-3xl font-headline font-bold text-accent tracking-tighter">
                      {bpm ? `${Math.round(bpm)}` : '--'} <span className="text-xs text-muted-foreground font-normal">BPM</span>
                    </p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Telemetry</p>
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
                      className="bg-primary hover:bg-primary/90 text-white gap-2 px-8 h-12 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      Start Jamming
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopSession} 
                      variant="destructive" 
                      className="gap-2 px-8 h-12 rounded-full shadow-lg shadow-destructive/20 transition-all hover:scale-105"
                    >
                      <StopCircle className="w-4 h-4" />
                      End Session
                    </Button>
                  )}
                </div>
              </div>

              {/* Visualizer reactive to sensors */}
              <div className="h-20 w-full bg-black/40 rounded-xl border border-white/5 overflow-hidden shadow-inner">
                <Visualizer active={isRecording} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Agent Intelligence Panel */}
        <div className="space-y-6">
          <Card className="glass-panel p-6 border-white/5 h-full flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Activity className="w-24 h-24" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg font-headline font-bold tracking-tight">Agent Decision</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    <span>Kinetic Intensity</span>
                    <span className="text-accent">{Math.round(energy)}%</span>
                  </div>
                  <Progress value={energy} className="h-2 bg-white/5" />
                </div>

                <motion.div 
                  key={currentStem}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="p-5 rounded-2xl bg-primary/10 border border-primary/20 space-y-3 backdrop-blur-sm"
                >
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Active Heritage Stem</p>
                  <p className="text-sm font-semibold italic text-foreground leading-relaxed">
                    {currentStem ? currentStem.replace(/_/g, ' ') : "Awaiting user input..."}
                  </p>
                </motion.div>
              </div>
            </div>

            <div className="pt-8 space-y-4 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-[0.3em] font-medium leading-loose">
                Syncing with Protected Music Metadata Ledger
              </p>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
