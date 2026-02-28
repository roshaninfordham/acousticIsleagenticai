"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Globe, Mic, Video, Zap, Search, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrchestrationGraphProps {
  isRecording: boolean;
  isProcessing: boolean;
  isRetry: boolean;
  step: 'idle' | 'sensing' | 'thinking' | 'retrieving' | 'logging';
}

export function OrchestrationGraph({ isRecording, isProcessing, isRetry, step }: OrchestrationGraphProps) {
  const nodes = [
    { id: 'sensors', label: 'Sensors', icon: Video, color: 'text-blue-400', active: isRecording },
    { id: 'gemini', label: 'Gemini 3', icon: Cpu, color: 'text-primary', active: isProcessing || step === 'thinking' },
    { id: 'llamaindex', label: 'LlamaIndex', icon: Search, color: 'text-accent', active: step === 'retrieving' },
    { id: 'firestore', label: 'Firestore', icon: Database, color: 'text-green-400', active: step === 'logging' },
  ];

  return (
    <div className="relative w-full h-48 flex items-center justify-between px-8 bg-white/[0.02] rounded-3xl border border-white/5 overflow-hidden">
      {/* Background Grid/Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      </div>

      {nodes.map((node, index) => {
        const Icon = node.icon;
        const isActive = node.active;

        return (
          <React.Fragment key={node.id}>
            <div className="relative flex flex-col items-center gap-3 z-10">
              <motion.div
                animate={isActive ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: ["0 0 0px rgba(122, 210, 240, 0)", "0 0 20px rgba(122, 210, 240, 0.3)", "0 0 0px rgba(122, 210, 240, 0)"] 
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isActive ? "bg-white/10 border-white/20" : "bg-white/[0.02] border-white/5",
                  "border"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive ? node.color : "text-muted-foreground")} />
                
                {/* Active Pulse Rings */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={cn("absolute inset-0 rounded-2xl border-2 pointer-events-none", node.color.replace('text-', 'border-'))}
                  />
                )}
              </motion.div>
              <span className={cn("text-[10px] font-bold uppercase tracking-widest transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
                {node.label}
              </span>
            </div>

            {/* Connection Lines */}
            {index < nodes.length - 1 && (
              <div className="flex-1 h-px bg-white/5 relative mx-4">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ left: "0%" }}
                      animate={{ left: "100%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute top-1/2 -translate-y-1/2 w-8 h-px bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_10px_#7AD2F0]"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Durable Retry Indicator Overlay */}
      <AnimatePresence>
        {isRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-destructive/10 border border-destructive/20 px-3 py-1 rounded-full"
          >
            <ShieldCheck className="w-3 h-3 text-destructive" />
            <span className="text-[9px] font-bold text-destructive uppercase tracking-tighter">Durable Execution: Self-Healing</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
