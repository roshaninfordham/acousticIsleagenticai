
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Database, Search, Eye, Mic, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      label: 'Telemetry',
      sub: 'Scanning Biometrics',
      poweredBy: 'WebRTC + Canvas',
      powerColor: 'text-blue-300',
      icon: Eye,
      color: 'text-blue-400',
      bgActive: 'bg-blue-500/10 border-blue-400/30',
      glowColor: 'rgba(96, 165, 250, 0.4)',
      active: isRecording,
    },
    {
      id: 'audio',
      label: 'Rhythmic Analyst',
      sub: 'Detecting BPM',
      poweredBy: 'Gemini 2.0 Flash',
      powerColor: 'text-yellow-300',
      icon: Mic,
      color: 'text-indigo-400',
      bgActive: 'bg-indigo-500/10 border-indigo-400/30',
      glowColor: 'rgba(129, 140, 248, 0.4)',
      active: isRecording && isProcessing,
    },
    {
      id: 'dj',
      label: 'Ethnomusicologist',
      sub: 'Orchestrating Style',
      poweredBy: 'Gemini + Genkit',
      powerColor: 'text-yellow-300',
      icon: Cpu,
      color: 'text-primary',
      bgActive: 'bg-primary/10 border-primary/30',
      glowColor: 'rgba(140, 92, 215, 0.4)',
      active: step === 'thinking',
    },
    {
      id: 'heritage',
      label: 'Heritage Engine',
      sub: 'Semantic Retrieval',
      poweredBy: 'LlamaIndex + Gemini',
      powerColor: 'text-cyan-300',
      icon: Search,
      color: 'text-accent',
      bgActive: 'bg-accent/10 border-accent/30',
      glowColor: 'rgba(122, 210, 240, 0.4)',
      active: step === 'retrieving',
    },
    {
      id: 'ledger',
      label: 'Durable Ledger',
      sub: 'Securing Royalties',
      poweredBy: 'Temporal Cloud',
      powerColor: 'text-emerald-300',
      icon: Database,
      color: 'text-emerald-400',
      bgActive: 'bg-emerald-500/10 border-emerald-400/30',
      glowColor: 'rgba(52, 211, 153, 0.4)',
      active: step === 'logging',
    },
  ];

  // Determine which connections are "flowing"
  const getConnectionState = (index: number) => {
    if (step === 'thinking' && index <= 1) return true;
    if (step === 'retrieving' && index <= 2) return true;
    if (step === 'logging' && index <= 3) return true;
    return false;
  };

  return (
    <div className="relative w-full py-6 px-4 md:px-8 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* HUD Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Title */}
      <div className="flex items-center justify-center gap-3 mb-5">
        <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-white/10" />
        <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">Multi-Agent Orchestration Pipeline</span>
        <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {/* Nodes Grid */}
      <div className="flex items-center justify-between gap-1 md:gap-2 relative">
        {nodes.map((node, index) => {
          const Icon = node.icon;
          const isActive = node.active;
          const isFlowing = getConnectionState(index);

          return (
            <React.Fragment key={node.id}>
              {/* Node */}
              <div className="relative flex flex-col items-center gap-2 z-10 flex-1 min-w-0">
                <motion.div
                  animate={isActive ? {
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      `0 0 0px ${node.glowColor.replace('0.4', '0')}`,
                      `0 0 30px ${node.glowColor}`,
                      `0 0 0px ${node.glowColor.replace('0.4', '0')}`,
                    ]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 border",
                    isActive ? node.bgActive : "bg-white/[0.02] border-white/5 grayscale opacity-40",
                    "backdrop-blur-xl relative"
                  )}
                >
                  <Icon className={cn("w-5 h-5 md:w-6 md:h-6", isActive ? node.color : "text-muted-foreground")} />

                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 0.4, 0], scale: 1.5 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={cn("absolute inset-0 rounded-xl md:rounded-2xl border-2 pointer-events-none",
                        node.color === 'text-accent' ? 'border-accent' :
                          node.color === 'text-primary' ? 'border-primary' :
                            node.color === 'text-emerald-400' ? 'border-emerald-400' :
                              node.color === 'text-blue-400' ? 'border-blue-400' : 'border-indigo-400'
                      )}
                    />
                  )}
                </motion.div>

                {/* Labels */}
                <div className="text-center space-y-0.5 max-w-full">
                  <p className={cn(
                    "text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-colors leading-tight truncate",
                    isActive ? "text-foreground" : "text-muted-foreground/60"
                  )}>
                    {node.label}
                  </p>
                  <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest truncate">
                    {node.sub}
                  </p>
                  {/* Powered By Label */}
                  <div className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-wider mt-1 transition-all border",
                    isActive
                      ? `bg-white/5 ${node.powerColor} border-white/10`
                      : "bg-transparent text-muted-foreground/30 border-transparent"
                  )}>
                    ⚡ {node.poweredBy}
                  </div>
                </div>
              </div>

              {/* Connection line with animated flow */}
              {index < nodes.length - 1 && (
                <div className="flex-shrink-0 w-6 md:w-10 h-px relative self-start mt-6 md:mt-7">
                  {/* Static track */}
                  <div className="absolute inset-0 bg-white/5 rounded-full" />

                  {/* Animated data packet */}
                  <AnimatePresence>
                    {isFlowing && (
                      <motion.div
                        initial={{ left: "-30%", opacity: 0 }}
                        animate={{ left: "130%", opacity: [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear", delay: index * 0.15 }}
                        className="absolute top-1/2 -translate-y-1/2 w-4 md:w-6 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_#7AD2F0] rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Retry Badge */}
      {isRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mt-4"
        >
          <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 gap-2 px-4 py-1 font-bold animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            DURABLE_EXECUTION_RETRY
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
