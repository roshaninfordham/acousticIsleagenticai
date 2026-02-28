
"use client";

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  active: boolean;
  stream: MediaStream | null;
  bpm: number;
}

export function Visualizer({ active, stream, bpm }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (active && stream && !audioContextRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      sourceRef.current = source;
    }

    if (!active && audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
      dataArrayRef.current = null;
      sourceRef.current = null;
    }
  }, [active, stream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (active && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        const barWidth = (w / dataArrayRef.current.length) * 2.5;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const barHeight = (dataArrayRef.current[i] / 255) * h;
          
          const gradient = ctx.createLinearGradient(0, h, 0, 0);
          gradient.addColorStop(0, 'rgba(140, 92, 215, 0.2)'); // Primary low
          gradient.addColorStop(0.5, 'rgba(122, 210, 240, 0.8)'); // Accent mid
          gradient.addColorStop(1, 'rgba(122, 210, 240, 1)'); // Accent high
          
          ctx.fillStyle = gradient;
          // Draw symmetric bars from middle
          ctx.fillRect(x, h/2 - barHeight/2, barWidth - 2, barHeight);
          
          x += barWidth + 1;
        }

        // Add a pulsing "heartbeat" line if BPM exists
        if (bpm > 0) {
          const time = Date.now() / 1000;
          const beat = Math.sin(time * (bpm / 60) * Math.PI * 2) * 10;
          ctx.strokeStyle = 'rgba(122, 210, 240, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h/2 + beat);
          ctx.lineTo(w, h/2 + beat);
          ctx.stroke();
        }
      } else {
        // Flatline idle state
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrame);
  }, [active, bpm]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1200} 
      height={120} 
      className="w-full h-full"
    />
  );
}
