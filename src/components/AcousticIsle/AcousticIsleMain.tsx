
"use client";

import React, { useState } from 'react';
import { JamSession } from './JamSession';
import { RoyaltyLedger } from './RoyaltyLedger';
import { Music, ShieldCheck, Globe, Info, LayoutDashboard, Database, Activity, Zap, Users, Sparkles } from 'lucide-react';
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
      <div className="flex flex-col min-h-screen lg:flex-row bg-background text-foreground selection:bg-accent/30 selection:text-accent font-body">
        {/* Sidebar / Navigation Hub */}
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
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Cultural Sandbox v1.0</span>
            </div>
          </div>

          <nav className="flex-1 space-y-8">
            <section>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-3 h-3" />
                Live Feed
              </h2>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 bg-white/5 text-foreground border border-white/5">
                  <Activity className="w-4 h-4 text-accent" />
                  Active Session
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:bg-white/5">
                  <Database className="w-4 h-4" />
                  Cultural Archive
                </Button>
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">Community Vault</h2>
              <RoyaltyLedger total={totalRoyalty} stems={activeStems} />
            </section>
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[10px] leading-relaxed text-muted-foreground italic">
                AcousticIsle uses a "Swarm" of AI agents to interpret your movements and sounds into protected indigenous music.
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Main Orchestration Area */}
        <section className="flex-1 relative flex flex-col p-4 md:p-10 lg:p-12 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!isJamming ? (
              <motion.div 
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: "circOut" }}
                className="max-w-3xl text-center space-y-10 relative z-10"
              >
                <div className="inline-block p-1 px-4 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-4 animate-pulse">
                  Gemini 3 Multi-Agent Prototype
                </div>
                <h2 className="text-5xl md:text-7xl font-headline font-bold leading-[0.9] tracking-tighter">
                  Jam with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">Live AI Swarm</span>.
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-2xl mx-auto py-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold">The Swarm</h3>
                    <p className="text-[11px] text-muted-foreground">3 specialized agents watch and listen to you simultaneously.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    <h3 className="text-sm font-bold">Interpretive Art</h3>
                    <p className="text-[11px] text-muted-foreground">The AI interprets your kinetic energy into indigenous drum loops and chants.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold">Ethical Ledger</h3>
                    <p className="text-[11px] text-muted-foreground">Every move you make logs real micro-royalties for community owners.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  <Button 
                    onClick={() => setIsJamming(true)}
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 text-white px-12 h-16 text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 group"
                  >
                    Enter the Sandbox
                    <Zap className="w-5 h-5 ml-2 group-hover:animate-spin" />
                  </Button>
                  <div className="text-left hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Requirement</p>
                    <p className="text-xs text-foreground/70">Camera & Mic Access Required</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <JamSession onRoyaltyUpdate={handleRoyaltyUpdate} />
            )}
          </AnimatePresence>

          {/* Background Ambient Elements */}
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        </section>
      </div>
    </FirebaseClientProvider>
  );
}
