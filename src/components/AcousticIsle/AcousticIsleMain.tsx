
"use client";

import React, { useState, useEffect } from 'react';
import { JamSession } from './JamSession';
import { RoyaltyLedger } from './RoyaltyLedger';
import { Music, ShieldCheck, Globe, Activity, Zap, Users, Sparkles, ChevronRight, HelpCircle, AlertTriangle, Cpu, Database, Search, ArrowRight, Eye, Mic, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AcousticIsleMain() {
  const [isJamming, setIsJamming] = useState(false);
  const [totalRoyalty, setTotalRoyalty] = useState(0);
  const [activeStems, setActiveStems] = useState<{ id: string; name: string; amount: string }[]>([]);
  const [liveStats, setLiveStats] = useState({ totalRoyalties: 0, communitiesServed: 0, temporalWorkflows: 0 });

  const handleRoyaltyUpdate = (amount: number, stemId: string) => {
    setTotalRoyalty((prev) => prev + amount);
    setActiveStems((prev) => {
      const exists = prev.find(s => s.id === stemId);
      if (exists) return prev;
      return [...prev, { id: stemId, name: stemId.replace(/_/g, ' '), amount: `$${amount.toFixed(4)}` }];
    });
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setLiveStats({
            totalRoyalties: data.totalRoyalties || 0,
            communitiesServed: data.communitiesServed || 0,
            temporalWorkflows: data.temporalWorkflows || 0,
          });
        }
      } catch { }
    };
    poll();
    const i = setInterval(poll, 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background text-foreground font-body">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 xl:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 glass-card z-20 flex flex-col h-auto lg:h-screen">
        <div className="flex items-center gap-3 p-5 pb-3 shrink-0">
          <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/30">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-headline tracking-tighter leading-none">AcousticIsle</h1>
            <span className="text-[8px] font-bold text-accent uppercase tracking-widest">AI Heritage Platform</span>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 pb-5 space-y-5">
            <section>
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className={`w-full justify-start gap-2 text-[11px] h-8 ${isJamming ? 'bg-white/10 text-foreground border border-white/10' : 'text-muted-foreground'}`} onClick={() => setIsJamming(true)}>
                  <Activity className="w-3 h-3 text-accent" /> Live Sandbox
                </Button>
                <Button variant="ghost" size="sm" className={`w-full justify-start gap-2 text-[11px] h-8 ${!isJamming ? 'bg-white/10 text-foreground border border-white/10' : 'text-muted-foreground'}`} onClick={() => setIsJamming(false)}>
                  <Globe className="w-3 h-3" /> Overview
                </Button>
              </div>
            </section>
            <section>
              <RoyaltyLedger total={totalRoyalty} stems={activeStems} />
            </section>
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5 shrink-0">
          <p className="text-[8px] leading-relaxed text-muted-foreground/60">
            Gemini 2.0 Flash • LlamaIndex • Temporal Cloud • YouTube Data API
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isJamming ? (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full">

              {/* Hero */}
              <section className="relative flex flex-col items-center justify-center py-16 md:py-20 px-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold tracking-[0.3em] uppercase mb-6">
                    <Zap className="w-3 h-3" /> Gemini 3 NYC Hackathon 2025
                  </div>
                </motion.div>

                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-[0.9] tracking-tighter max-w-4xl">
                  Empowering Indigenous<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">Musical Heritage</span>
                  <br />Through AI
                </motion.h2>

                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mt-6 leading-relaxed">
                  Move, speak, clap, or wave — our AI watches, listens, and pays royalties to indigenous communities. <strong className="text-foreground">Every interaction preserves a culture.</strong>
                </motion.p>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-8">
                  <Button onClick={() => setIsJamming(true)} size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 text-base rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 group">
                    Launch Live Sandbox
                    <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>

                {/* Live Metrics */}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 flex items-center gap-8 md:gap-12">
                  {[
                    { label: 'Royalties Paid', value: `$${(liveStats.totalRoyalties || totalRoyalty).toFixed(4)}`, icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Communities', value: String(liveStats.communitiesServed || activeStems.length), icon: Users, color: 'text-accent' },
                    { label: 'Workflows', value: String(liveStats.temporalWorkflows), icon: BarChart3, color: 'text-primary' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-xl md:text-2xl font-headline font-bold tabular-nums">{value}</span>
                      </div>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em]">{label}</span>
                    </div>
                  ))}
                </motion.div>
              </section>

              {/* Problem / Solution */}
              <section className="px-6 md:px-12 lg:px-16 py-10 max-w-5xl mx-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-xl"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                      <h3 className="text-base font-headline font-bold">The Problem</h3>
                    </div>
                    <ul className="space-y-1.5 text-[12px] text-muted-foreground leading-relaxed">
                      <li className="flex gap-2"><span className="text-red-400 shrink-0">•</span>$2.5B+ yearly in unreported indigenous music royalties</li>
                      <li className="flex gap-2"><span className="text-red-400 shrink-0">•</span>Cultural heritage exploited without compensation</li>
                      <li className="flex gap-2"><span className="text-red-400 shrink-0">•</span>No real-time creator-community connection</li>
                    </ul>
                  </motion.div>

                  <motion.div initial={{ x: 20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }} className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                      <h3 className="text-base font-headline font-bold">Our Solution</h3>
                    </div>
                    <ul className="space-y-1.5 text-[12px] text-muted-foreground leading-relaxed">
                      <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Real-time AI analysis via Gemini 2.0 Flash</li>
                      <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Semantic heritage retrieval via LlamaIndex</li>
                      <li className="flex gap-2"><span className="text-emerald-400 shrink-0">✓</span>Durable micro-royalties via Temporal Cloud</li>
                    </ul>
                  </motion.div>
                </div>
              </section>

              {/* Agent Pipeline */}
              <section className="px-6 md:px-12 lg:px-16 py-10 max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-xl md:text-2xl font-headline font-bold tracking-tighter">Multi-Agent Pipeline</h3>
                  <p className="text-xs text-muted-foreground mt-1">Five autonomous agents, powered by cutting-edge AI</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { icon: Eye, title: 'Telemetry', powered: 'WebRTC', color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10', num: '01' },
                    { icon: Mic, title: 'Analyst', powered: 'Gemini 2.0', color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/10', num: '02' },
                    { icon: Cpu, title: 'DJ Agent', powered: 'Genkit', color: 'text-primary', bg: 'bg-primary/5 border-primary/10', num: '03' },
                    { icon: Search, title: 'Heritage', powered: 'LlamaIndex', color: 'text-accent', bg: 'bg-accent/5 border-accent/10', num: '04' },
                    { icon: Database, title: 'Ledger', powered: 'Temporal', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10', num: '05' },
                  ].map(({ icon: Icon, title, powered, color, bg, num }, i) => (
                    <motion.div key={num} initial={{ y: 15, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                      className={`p-4 rounded-xl border ${bg} space-y-2 text-center relative group hover:scale-[1.03] transition-transform`}
                    >
                      {i < 4 && <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10"><ArrowRight className="w-3 h-3 text-white/15" /></div>}
                      <Icon className={`w-5 h-5 ${color} mx-auto`} />
                      <p className="text-[10px] font-bold uppercase tracking-wider">{title}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider bg-white/5 border border-white/10 ${color}`}>
                        ⚡ {powered}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Tech Stack */}
              <section className="px-6 md:px-12 py-8 max-w-5xl mx-auto">
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { name: 'Gemini 2.0 Flash', color: 'border-yellow-500/20 text-yellow-300' },
                    { name: 'LlamaIndex', color: 'border-cyan-500/20 text-cyan-300' },
                    { name: 'Temporal Cloud', color: 'border-emerald-500/20 text-emerald-300' },
                    { name: 'Genkit', color: 'border-primary/20 text-primary' },
                    { name: 'YouTube Data API', color: 'border-red-500/20 text-red-300' },
                    { name: 'Next.js 15', color: 'border-white/20 text-white/80' },
                    { name: 'WebRTC', color: 'border-blue-500/20 text-blue-300' },
                  ].map(({ name, color }) => (
                    <div key={name} className={`px-3 py-1.5 rounded-lg border ${color} bg-white/[0.02] text-[10px] font-bold`}>{name}</div>
                  ))}
                </div>
              </section>

              {/* Bottom CTA */}
              <section className="px-6 py-12 text-center">
                <Button onClick={() => setIsJamming(true)} size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 h-14 text-base rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/40 group">
                  Try It Now <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="mt-3 text-[9px] text-muted-foreground/40 uppercase tracking-widest flex items-center justify-center gap-2">
                  <HelpCircle className="w-3 h-3" /> Camera + mic required. No data leaves your device.
                </p>
              </section>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center min-h-full p-4 md:p-6">
              <JamSession onRoyaltyUpdate={handleRoyaltyUpdate} />
            </div>
          )}
        </AnimatePresence>

        {/* Background */}
        <div className="fixed top-1/4 -left-20 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="fixed bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
      </main>
    </div>
  );
}
