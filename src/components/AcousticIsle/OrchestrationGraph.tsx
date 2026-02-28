
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
      id: 'vision', 
      label: 'Telemetry Specialist', 
      sub: 'Scanning Biometrics',
      icon: Eye, 
      color: 'text-blue-400', 
      active: isRecording 
    },
    { 
      id: 'audio', 
      label: 'Rhythmic Analyst', 
      sub: 'Detecting Beat/BPM',
      icon: Mic, 
      color: 'text-indigo-400', 
      active: isRecording && isProcessing
    },
    { 
      id: 'dj', 
      label: 'Ethnomusicologist DJ', 
      sub: 'Orchestrating Style',
      icon: Cpu, 
      color: 'text-primary', 
      active: step === 'thinking' 
    },
    { 
      id: 'heritage', 
      label: 'LlamaIndex Engine', 
      sub: 'Semantic Retrieval',
      icon: Search, 
      color: 'text-accent', 
      active: step === 'retrieving' 
    },
    { 
      id: 'ledger', 
      label: 'Durable Ledger', 
      sub: 'Securing Royalties',
      icon: Database, 
      color: 'text-emerald-400', 
      active: step === 'logging' 
    },
  ];

  return (
    <div className="relative w-full h-72 flex items-center justify-between px-16 bg-white/[0.02] rounded-[3rem] border border-white/5 overflow-hidden group shadow-2xl">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Background Flow Line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

      {nodes.map((node, index) => {
        const Icon = node.icon;
        const isActive = node.active;

        return (
          <React.Fragment key={node.id}>
            <div className="relative flex flex-col items-center gap-6 z-10 w-48">
              <motion.div
                animate={isActive ? { 
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    "0 0 0px rgba(122, 210, 240, 0)", 
                    "0 0 50px rgba(122, 210, 240, 0.4)", 
                    "0 0 0px rgba(122, 210, 240, 0)"
                  ] 
                } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className={cn(
                  "w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-700",
                  isActive ? "bg-white/10 border-white/20 scale-110 shadow-2xl" : "bg-white/[0.02] border-white/5 grayscale opacity-50",
                  "border-2 backdrop-blur-xl"
                )}
              >
                <Icon className={cn("w-9 h-9", isActive ? node.color : "text-muted-foreground")} />
                
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.5, 0], scale: 1.6 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-[2rem] border-2 border-accent pointer-events-none" 
                  />
                )}
              </motion.div>
              
              <div className="text-center space-y-2">
                <p className={cn(
                  "text-[12px] font-black uppercase tracking-[0.2em] transition-colors leading-none",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {node.label}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                  {node.sub}
                </p>
              </div>
            </div>

            {index < nodes.length - 1 && (
              <div className="flex-1 h-px relative mx-2">
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ left: "-20%", opacity: 0 }}
                      animate={{ left: "120%", opacity: [0, 1, 1, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-1/2 -translate-y-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_25px_#7AD2F0]"
                    />
                  )}
                </AnimatePresence>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Durable Status Badge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
         <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/10" />
         <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.8em]">Multi-Agent Orchestration Swarm</span>
         <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {isRetry && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-2 px-4 py-1 font-bold animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            DURABLE_EXECUTION_RETRY_ACTIVE
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
