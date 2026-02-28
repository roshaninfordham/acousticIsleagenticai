"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Globe, Mic, Video, Zap, Search, ShieldCheck, Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrchestrationGraphProps {
  isRecording: boolean;
  isProcessing: boolean;
  isRetry: boolean;
  step: 'idle' | 'sensing' | 'thinking' | 'retrieving' | 'logging';
}

export function OrchestrationGraph({ isRecording, isProcessing, isRetry, step }: OrchestrationGraphProps) {
  const nodes = [
    { 
      id: 'sensors', 
      label: 'Telemetry Specialist', 
      sub: 'Biometric Sensors',
      icon: Eye, 
      color: 'text-blue-400', 
      active: isRecording 
    },
    { 
      id: 'gemini', 
      label: 'Rhythmic Analyst', 
      sub: 'Gemini 3 Pro',
      icon: Cpu, 
      color: 'text-primary', 
      active: isProcessing || step === 'thinking' 
    },
    { 
      id: 'llamaindex', 
      label: 'Ethnomusicologist', 
      sub: 'LlamaIndex Retrieval',
      icon: Search, 
      color: 'text-accent', 
      active: step === 'retrieving' 
    },
    { 
      id: 'firestore', 
      label: 'Durable Ledger', 
      sub: 'Community Vault',
      icon: Database, 
      color: 'text-green-400', 
      active: step === 'logging' 
    },
  ];

  return (
    <div className="relative w-full h-56 flex items-center justify-between px-10 bg-white/[0.02] rounded-[2rem] border border-white/5 overflow-hidden group">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Background Flow Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -translate-y-1/2" />

      {nodes.map((node, index) => {
        const Icon = node.icon;
        const isActive = node.active;

        return (
          <React.Fragment key={node.id}>
            <div className="relative flex flex-col items-center gap-4 z-10 w-40">
              <motion.div
                animate={isActive ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    "0 0 0px rgba(122, 210, 240, 0)", 
                    "0 0 30px rgba(122, 210, 240, 0.2)", 
                    "0 0 0px rgba(122, 210, 240, 0)"
                  ] 
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700",
                  isActive ? "bg-white/10 border-white/20 scale-110" : "bg-white/[0.02] border-white/5 grayscale",
                  "border-2"
                )}
              >
                <Icon className={cn("w-7 h-7", isActive ? node.color : "text-muted-foreground")} />
                
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl pulse-ring border-2 pointer-events-none opacity-40" />
                )}
              </motion.div>
              
              <div className="text-center space-y-1">
                <p className={cn(
                  "text-[11px] font-bold uppercase tracking-widest transition-colors leading-none",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {node.label}
                </p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">
                  {node.sub}
                </p>
              </div>
            </div>

            {index < nodes.length - 1 && (
              <div className="flex-1 h-px relative mx-2">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ left: "-10%", opacity: 0 }}
                      animate={{ left: "110%", opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-1/2 -translate-y-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_#7AD2F0]"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Self-Healing Status Indicator */}
      <AnimatePresence>
        {isRetry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-5 py-1.5 rounded-full backdrop-blur-md"
          >
            <Activity className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Durable Execution: Self-Healing Active</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
