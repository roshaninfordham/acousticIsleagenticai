"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Database, TrendingUp, History, Shield, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

interface RoyaltyEvent {
  id: string;
  stemId: string;
  communityId: string;
  amount: number;
  timestamp: string;
  workflowId?: string;
}

interface RoyaltyLedgerProps {
  total: number;
  stems: { id: string; name: string; amount: string }[];
}

export function RoyaltyLedger({ total: localTotal, stems: localStems }: RoyaltyLedgerProps) {
  const [events, setEvents] = useState<RoyaltyEvent[]>([]);
  const [totalRoyalties, setTotalRoyalties] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.recentEvents || []);
        setTotalRoyalties(data.totalRoyalties || 0);
      }
    } catch (e) {
      // Silently fail — local state is the fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll ledger every 3 seconds for fresh data
  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 3000);
    return () => clearInterval(interval);
  }, [fetchLedger]);

  const displayTotal = totalRoyalties > 0 ? totalRoyalties : localTotal;
  const displayEvents = events.length > 0 ? events : localStems.map((s, i) => ({
    id: `local_${i}`,
    stemId: s.id,
    communityId: 'community_nicobar_01',
    amount: parseFloat(s.amount.replace('$', '')),
    timestamp: new Date().toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
          <Database className="w-3 h-3 text-accent" />
          Heritage Vault
        </h2>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-8 rounded-3xl bg-accent/5 border border-accent/10 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <TrendingUp className="absolute -top-4 -right-4 w-24 h-24 text-accent/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />

          <motion.p
            key={displayTotal}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-headline font-bold text-accent tracking-tighter relative z-10"
          >
            ${displayTotal.toFixed(4)}
          </motion.p>

          <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 relative z-10">
            <CheckCircle2 className="w-3 h-3 text-accent" />
            <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Local Durable Ledger</p>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
          <History className="w-3 h-3 text-primary" />
          Real-time Audit
        </h2>
        <ScrollArea className="h-64 rounded-2xl border border-white/5 p-5 bg-white/[0.01] backdrop-blur-sm">
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {displayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                    <Shield className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic uppercase tracking-widest">
                    {isLoading ? 'Loading ledger...' : 'Awaiting first transaction...'}
                  </p>
                </div>
              ) : (
                displayEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="group/item"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[11px] font-bold text-foreground block truncate uppercase tracking-tight">
                          {event.stemId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-mono block">
                          TXN: {event.id.substring(0, 12)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-accent tabular-nums bg-accent/10 px-2 py-1 rounded-lg border border-accent/10 block">
                          +${event.amount.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <Separator className="bg-white/5 mt-4 group-last/item:hidden" />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
