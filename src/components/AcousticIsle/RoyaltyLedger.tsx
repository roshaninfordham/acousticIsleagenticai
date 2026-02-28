
"use client";

import React from 'react';
import { Database, TrendingUp, History, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

interface RoyaltyLedgerProps {
  total: number;
  stems: { id: string; name: string; amount: string }[];
}

export function RoyaltyLedger({ total: localTotal, stems: localStems }: RoyaltyLedgerProps) {
  const { firestore } = useFirestore();

  // Subscribe to real-time Community Vault data
  const communitiesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'communities');
  }, [firestore]);
  const { data: communities } = useCollection(communitiesQuery);

  // Subscribe to real-time Stem Ledger events
  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'royaltyEvents'), orderBy('timestamp', 'desc'), limit(10));
  }, [firestore]);
  const { data: events } = useCollection(eventsQuery);

  // Calculate vault total from Firestore (primary) or local state (fallback)
  const firestoreTotal = communities?.reduce((acc, c) => acc + (c.currentRoyaltyBalance || 0), 0) || 0;
  const displayTotal = firestoreTotal > 0 ? firestoreTotal : localTotal;

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
            ${displayTotal.toFixed(4)}
          </p>
          <p className="text-[10px] font-medium text-accent/70 uppercase tracking-widest mt-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Verifiable Ledger
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <History className="w-3 h-3" />
          Live Ledger
        </h2>
        <ScrollArea className="h-56 rounded-xl border border-white/5 p-4 bg-white/[0.02]">
          {(events || []).length === 0 && localStems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <p className="text-xs text-muted-foreground italic">Syncing with blockchain-inspired ledger...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prioritize live events from Firestore */}
              {(events || []).map((event, idx) => (
                <div key={event.id} className="flex flex-col gap-1 animate-in fade-in slide-in-from-left-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-foreground capitalize truncate max-w-[140px]">
                      {event.stemId.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      +${event.amount.toFixed(4)}
                    </span>
                  </div>
                  <Separator className="bg-white/5 mt-2" />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          * AcousticIsle uses autonomous agents to audit rights orchestration in real-time.
        </p>
      </div>
    </div>
  );
}
