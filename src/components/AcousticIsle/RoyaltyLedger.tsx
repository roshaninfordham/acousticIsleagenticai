"use client";

import React from 'react';
import { Database, TrendingUp, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface RoyaltyLedgerProps {
  total: number;
  stems: { id: string; name: string; amount: string }[];
}

export function RoyaltyLedger({ total, stems }: RoyaltyLedgerProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3" />
          Community Vault
        </h2>
        <div className="p-6 rounded-2xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center relative overflow-hidden group">
          <TrendingUp className="absolute top-2 right-2 w-10 h-10 text-accent/5 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
          <p className="text-4xl font-headline font-bold text-accent tracking-tighter">
            ${total.toFixed(4)}
          </p>
          <p className="text-[10px] font-medium text-accent/70 uppercase tracking-widest mt-1">Live Micro-Royalties</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <History className="w-3 h-3" />
          Stem Ledger
        </h2>
        <ScrollArea className="h-48 rounded-xl border border-white/5 p-4 bg-white/[0.02]">
          {stems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-xs text-muted-foreground italic">No stems activated yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stems.map((stem, idx) => (
                <div key={stem.id + idx} className="flex flex-col gap-1 animate-in fade-in slide-in-from-left-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-foreground capitalize truncate max-w-[140px]">
                      {stem.name}
                    </span>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      {stem.amount}
                    </span>
                  </div>
                  {idx < stems.length - 1 && <Separator className="bg-white/5 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          * Each transaction is logged on a verifiable ledger ensuring direct transparency for indigenous contributors.
        </p>
      </div>
    </div>
  );
}