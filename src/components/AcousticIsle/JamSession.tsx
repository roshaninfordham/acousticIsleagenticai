"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Mic, StopCircle, RefreshCw, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Visualizer } from './Visualizer';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { Progress } from '@/components/ui/progress';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopSession = useCallback(() => {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setStatus("Session stopped.");
  }, []);

  const processChunk = async (audioBlob: Blob, videoBlob: Blob) => {
    setIsProcessing(true);
    try {
      const audioDataUri = await blobToDataUri(audioBlob);
      const videoDataUri = await blobToDataUri(videoBlob);

      setStatus("AI Analyzing context...");
      const result = await generateDynamicAccompaniment({
        audioDataUri,
        videoDataUri
      });

      if (result) {
        setBpm(result.bpm);
        setCurrentStem(result.play_stem);
        onRoyaltyUpdate(result.royalty_split, result.play_stem);
        setStatus("Jamming with: " + result.play_stem.replace(/_/g, ' '));
        // Simulate energy detection based on BPM for UI visual
        setEnergy(Math.min(100, (result.bpm / 180) * 100));
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setStatus("Analysis hiccup. Retrying...");
    } finally {
      setIsProcessing(false);
    }
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      
      setIsRecording(true);
      setStatus("Capturing multimodal stream...");

      // Capture loop
      intervalRef.current = setInterval(() => {
        captureSnippet();
      }, 5000); // Send snippet every 5 seconds for analysis

    } catch (err) {
      console.error("Error accessing media devices:", err);
      setStatus("Media access denied.");
    }
  };

  const captureSnippet = async () => {
    if (!streamRef.current) return;

    // Use a simple snapshot for video since full video blob is heavy for quick demo flows
    // In a real app we'd use MediaRecorder for both
    const videoBlob = await captureVideoFrame();
    const audioBlob = await captureAudioSnippet();

    if (audioBlob && videoBlob) {
      processChunk(audioBlob, videoBlob);
    }
  };

  const captureVideoFrame = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) return resolve(null);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      canvas.width = 320;
      canvas.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
    });
  };

  const captureAudioSnippet = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!streamRef.current) return resolve(null);
      
      const recorder = new MediaRecorder(streamRef.current);
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
      
      recorder.start();
      setTimeout(() => recorder.stop(), 2000); // 2 second audio chunk
    });
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
    <div className="w-full max-w-5xl space-y-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Input Monitors */}
        <div className="space-y-6 md:col-span-2">
          <Card className="glass-panel overflow-hidden relative group border-white/5">
            <div className="aspect-video bg-black/40 flex items-center justify-center relative">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                       <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Ready for your performance</p>
                  </div>
                </div>
              )}

              {/* HUD Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <Badge className="bg-red-500/80 hover:bg-red-500/80 text-white gap-2 border-none">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tempo</p>
                    <p className="text-2xl font-headline font-bold text-accent">{bpm ? `${bpm} BPM` : '--'}</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Status</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {isProcessing && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                      {status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <Button onClick={startSession} className="bg-primary hover:bg-primary/90 text-white gap-2">
                      <Zap className="w-4 h-4 fill-white" />
                      Initialize
                    </Button>
                  ) : (
                    <Button onClick={stopSession} variant="destructive" className="gap-2">
                      <StopCircle className="w-4 h-4" />
                      End Jam
                    </Button>
                  )}
                </div>
              </div>

              {/* Visualizer reactive to volume */}
              <div className="h-16 w-full bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                <Visualizer active={isRecording} bpm={bpm || 0} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: AI Intelligence Panel */}
        <div className="space-y-6">
          <Card className="glass-panel p-6 border-white/5 h-full flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-headline font-semibold">AI Intelligence</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    <span>Kinetic Energy</span>
                    <span>{Math.round(energy)}%</span>
                  </div>
                  <Progress value={energy} className="h-2 bg-white/5" />
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest">Recommended Stem</p>
                  <p className="text-sm font-medium truncate italic">
                    {currentStem ? currentStem.replace(/_/g, ' ') : "Analyzing your vibe..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] leading-relaxed text-center">
                Ethnomusicologist DJ Agent is currently syncing with heritage database
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}