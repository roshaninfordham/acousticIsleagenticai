
"use client";

import React, { useState } from 'react';
import { JamSession } from './JamSession';
import { RoyaltyLedger } from './RoyaltyLedger';
import { Music, ShieldCheck, Globe, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider } from '@/firebase';

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
      <div className="flex flex-col min-h-screen lg:flex-row bg-background overflow-hidden">
        {/* Sidebar / Branding */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/5 p-8 flex flex-col glass-panel z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold font-headline tracking-tight">AcousticIsle</h1>
          </div>

          <nav className="flex-1 space-y-6">
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Vision</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                Directly targeting the massive bottleneck of music metadata provenance and rights orchestration.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Tech Core</h2>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Durable Multi-Agent Team</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/70">
                <Globe className="w-4 h-4 text-accent" />
                <span>Fractional Rights Ledger</span>
              </div>
            </section>

            <section className="pt-6">
               <RoyaltyLedger total={totalRoyalty} stems={activeStems} />
            </section>
          </nav>

          <footer className="mt-auto pt-10">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <Info className="w-4 h-4" />
              Developer Specs
            </Button>
          </footer>
        </aside>

        {/* Main Jam Area */}
        <section className="flex-1 relative flex flex-col p-4 md:p-10 lg:p-20 items-center justify-center">
          {!isJamming ? (
            <div className="max-w-xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-block p-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-2">
                Multi-Agent Rights Orchestration
              </div>
              <h2 className="text-4xl md:text-6xl font-headline font-bold leading-tight">
                Jam with <span className="text-accent">Durable</span> Heritage.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Experience the first AI-native sandbox that automatically orchestrates fractional royalties for indigenous communities.
              </p>
              <Button 
                onClick={() => setIsJamming(true)}
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-10 h-14 text-lg rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/30"
              >
                Start Session
              </Button>
            </div>
          ) : (
            <JamSession onRoyaltyUpdate={handleRoyaltyUpdate} />
          )}

          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
        </section>
      </div>
    </FirebaseClientProvider>
  );
}
