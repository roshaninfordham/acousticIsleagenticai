/**
 * GET /api/stats
 * 
 * Returns real-time platform metrics for the landing page.
 */

import { NextResponse } from 'next/server';
import { getLedgerStats } from '@/store/local-ledger';

export async function GET() {
    const stats = getLedgerStats();

    return NextResponse.json({
        totalRoyalties: stats.totalRoyalties,
        totalEvents: stats.totalEvents,
        communitiesServed: stats.communities.length,
        avgRoyaltyPerEvent: stats.totalEvents > 0 ? stats.totalRoyalties / stats.totalEvents : 0,
        topCommunity: stats.communities.sort((a: any, b: any) => b.totalAmount - a.totalAmount)[0] || null,
        recentEvents: stats.recentEvents.slice(0, 3),
        temporalWorkflows: stats.totalEvents, // Each event is a workflow
    });
}
