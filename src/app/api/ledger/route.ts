/**
 * GET /api/ledger
 * 
 * Returns recent royalty events and community balances from the local ledger.
 * Used by the RoyaltyLedger component to display real-time audit data.
 */

import { NextResponse } from 'next/server';
import { getLedgerStats } from '@/store/local-ledger';

export async function GET() {
    try {
        const stats = getLedgerStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('[API] Ledger read error:', error);
        return NextResponse.json({
            totalEvents: 0,
            totalRoyalties: 0,
            communities: [],
            recentEvents: [],
        });
    }
}
