
"use client";

import React, { useState } from 'react';
import { JamSession } from './JamSession';
import { RoyaltyLedger } from './RoyaltyLedger';
import { Music, ShieldCheck, Globe, LayoutDashboard, Database, Activity, Zap, Users, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

export function AcousticIsleMain() {
  const [isJamming, setIsJamming] = useState(false);
  const [totalRoyalty, setTotalRoyalty] = useState(0);
  const [activeStems, setActiveStems] = useState<{ id: string; name: string; amount: string }[]>([]);

  const handleRoyaltyUpdate = (amount: number, stemId: string) => {
    setTotalRoyalty((prev) => prev + amount);
    setActiveStems((prev) => {
      const exists = prev.find(s => s.id === stemId);
      if (exists) return prev;
      return [...prev, { id: stemId, name: stemId.replace(/_/g, ' '), amount: `$${amount.toFixed(4)}` }];
    });
  };

  return (
    <FirebaseClientProvider>
      <div className="flex flex-col min-h-screen lg:flex-row bg-background text-foreground selection:bg-accent/30 selection:text-accent font-body overflow-hidden">
        {/* Futuristic Sidebar */}
        <motion.aside 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 p-8 flex flex-col glass-card z-20"
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3 bg-primary rounded-2xl shadow-2xl shadow-primary/40 group cursor-pointer overflow-hidden relative">
              <Music className="w-6 h-6 text-white relative z-10" />
              <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-headline tracking-tighter leading-none">AcousticIsle</h1>
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Hackathon Prototype</span>
            </div>
          </div>

          <nav className="flex-1 space-y-8">
            <section>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-3 h-3" />
                Interface
              </h2>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-3 border border-white/5 ${isJamming ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
                  onClick={() => setIsJamming(true)}
                >
                  <Activity className="w-4 h-4 text-accent" />
                  Live Sandbox
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-muted-foreground hover:bg-white/5"
                  onClick={() => setIsJamming(false)}
                >
                  <Globe className="w-4 h-4" />
                  Cultural Archive
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mb-4">Durable Ledger</h2>
              <RoyaltyLedger total={totalRoyalty} stems={activeStems} />
            </section>
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                AcousticIsle uses Gemini 3 & LlamaIndex to automate musical heritage provenance.
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Main Interface Area */}
        <section className="flex-1 relative flex flex-col p-4 md:p-10 lg:p-12 items-center justify-center overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isJamming ? (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl text-center space-y-10 relative z-10 py-12"
              >
                <div className="inline-block p-1 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4">
                  Multi-Agent Orchestration
                </div>
                <h2 className="text-5xl md:text-8xl font-headline font-bold leading-[0.9] tracking-tighter">
                  Bridge the Gap with <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Autonomous Heritage</span>.
                </h2>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
                  Capture your biometric telemetry and delegate musical decisions to a swarm of AI experts.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto py-6">
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.07] transition-colors group">
                    <Users className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-accent">1. Sensing</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Move or make sounds. Our sensors capture every subtle shift in your presence.</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.07] transition-colors group">
                    <Sparkles className="w-8 h-8 text-accent group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-accent">2. Swarm</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Gemini 3 agents analyze your energy to retrieve the perfect cultural loop.</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.07] transition-colors group">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-accent">3. Ledger</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Every jam session writes an immutable micro-payment to the community vault.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                  <Button 
                    onClick={() => setIsJamming(true)}
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white px-16 h-20 text-xl rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 group"
                  >
                    Enter the Sandbox
                    <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">
                  <HelpCircle className="w-4 h-4" />
                  <span>Works best with camera and mic enabled</span>
                </div>
              </motion.div>
            ) : (
              <JamSession onRoyaltyUpdate={handleRoyaltyUpdate} />
            )}
          </AnimatePresence>

          {/* Background Ambient Elements */}
          <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] -z-10 animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />
        </section>
      </div>
    </FirebaseClientProvider>
  );
}
