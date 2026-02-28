"use client";

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  active: boolean;
  bpm: number;
}

export function Visualizer({ active, bpm }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let offset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (active) {
        const speed = bpm ? bpm / 120 : 1;
        offset += 0.05 * speed;

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#7AD2F0'; // Accent color
        ctx.beginPath();
        
        const bars = 40;
        const barWidth = w / bars;
        
        for (let i = 0; i < bars; i++) {
          const x = i * barWidth;
          // Create some dynamic motion
          const noise = Math.sin(offset + i * 0.3) * 15;
          const noise2 = Math.cos(offset * 0.5 + i * 0.1) * 10;
          const barHeight = 20 + noise + noise2;
          
          const gradient = ctx.createLinearGradient(0, h/2 - barHeight/2, 0, h/2 + barHeight/2);
          gradient.addColorStop(0, '#8C5CD7'); // Primary
          gradient.addColorStop(1, '#7AD2F0'); // Accent
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 2, h / 2 - barHeight / 2, barWidth - 4, barHeight);
        }
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
      width={800} 
      height={100} 
      className="w-full h-full"
    />
  );
}