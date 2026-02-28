
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Search, Activity, Eye, Mic, Zap, ShieldCheck } from 'lucide-react';
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
      label: 'Vision Agent', 
      sub: 'Watching your energy',
      icon: Eye, 
      color: 'text-blue-400', 
      active: isRecording 
    },
    { 
      id: 'audio', 
      label: 'Audio Agent', 
      sub: 'Listening to your beat',
      icon: Mic, 
      color: 'text-indigo-400', 
      active: isRecording && isProcessing
    },
    { 
      id: 'gemini', 
      label: 'Ethno-Musicologist', 
      sub: 'Interpreting culture',
      icon: Cpu, 
      color: 'text-primary', 
      active: step === 'thinking' 
    },
    { 
      id: 'llamaindex', 
      label: 'Heritage Engine', 
      sub: 'Searching the catalog',
      icon: Search, 
      color: 'text-accent', 
      active: step === 'retrieving' 
    },
    { 
      id: 'firestore', 
      label: 'Durable Ledger', 
      sub: 'Securing royalties',
      icon: Database, 
      color: 'text-emerald-400', 
      active: step === 'logging' 
    },
  ];

  return (
    <div className="relative w-full h-64 flex items-center justify-between px-12 bg-white/[0.02] rounded-[2.5rem] border border-white/5 overflow-hidden group shadow-inner">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Background Flow Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

      {nodes.map((node, index) => {
        const Icon = node.icon;
        const isActive = node.active;

        return (
          <React.Fragment key={node.id}>
            <div className="relative flex flex-col items-center gap-5 z-10 w-48">
              <motion.div
                animate={isActive ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    "0 0 0px rgba(122, 210, 240, 0)", 
                    "0 0 40px rgba(122, 210, 240, 0.3)", 
                    "0 0 0px rgba(122, 210, 240, 0)"
                  ] 
                } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={cn(
                  "w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all duration-700",
                  isActive ? "bg-white/10 border-white/20 scale-110 shadow-2xl" : "bg-white/[0.02] border-white/5 grayscale",
                  "border-2 backdrop-blur-md"
                )}
              >
                <Icon className={cn("w-9 h-9", isActive ? node.color : "text-muted-foreground")} />
                
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.4, 0], scale: 1.5 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-[1.5rem] border-2 border-accent pointer-events-none" 
                  />
                )}
              </motion.div>
              
              <div className="text-center space-y-1.5">
                <p className={cn(
                  "text-[12px] font-bold uppercase tracking-[0.15em] transition-colors leading-none",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {node.label}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                  {node.sub}
                </p>
              </div>
            </div>

            {index < nodes.length - 1 && (
              <div className="flex-1 h-px relative mx-4">
                <AnimatePresence>
                  {isActive && (
                    <>
                      <motion.div
                        initial={{ left: "-10%", opacity: 0 }}
                        animate={{ left: "110%", opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_20px_#7AD2F0]"
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Durable Status Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
         <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[1em]">The AI Orchestration Swarm</span>
      </div>
    </div>
  );
}
