/**
 * Local in-memory royalty ledger - replaces Firestore for local-only operation.
 * Persists to a JSON file on disk for durability across restarts.
 */

import fs from 'fs';
import path from 'path';

export interface RoyaltyEvent {
    id: string;
    stemId: string;
    communityId: string;
    amount: number;
    timestamp: string;
    workflowId?: string;
}

export interface CommunityBalance {
    communityId: string;
    currentRoyaltyBalance: number;
    lastUpdated: string;
    eventCount: number;
}

interface LedgerState {
    events: RoyaltyEvent[];
    communities: Record<string, CommunityBalance>;
}

const STORAGE_DIR = path.join(process.cwd(), 'storage');
const LEDGER_FILE = path.join(STORAGE_DIR, 'ledger.json');

// Singleton state
let state: LedgerState = { events: [], communities: {} };
let loaded = false;

function ensureStorageDir() {
    if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
}

function loadState(): LedgerState {
    if (loaded) return state;
    try {
        ensureStorageDir();
        if (fs.existsSync(LEDGER_FILE)) {
            const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
            state = JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[Ledger] Failed to load state, starting fresh:', e);
        state = { events: [], communities: {} };
    }
    loaded = true;
    return state;
}

function saveState() {
    try {
        ensureStorageDir();
        fs.writeFileSync(LEDGER_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.warn('[Ledger] Failed to persist state:', e);
    }
}

function generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

export function addRoyaltyEvent(data: {
    stemId: string;
    communityId: string;
    amount: number;
    workflowId?: string;
}): RoyaltyEvent {
    loadState();

    const event: RoyaltyEvent = {
        id: generateId(),
        stemId: data.stemId,
        communityId: data.communityId,
        amount: data.amount,
        timestamp: new Date().toISOString(),
        workflowId: data.workflowId,
    };

    state.events.push(event);

    // Update community balance
    if (!state.communities[data.communityId]) {
        state.communities[data.communityId] = {
            communityId: data.communityId,
            currentRoyaltyBalance: 0,
            lastUpdated: event.timestamp,
            eventCount: 0,
        };
    }
    state.communities[data.communityId].currentRoyaltyBalance += data.amount;
    state.communities[data.communityId].lastUpdated = event.timestamp;
    state.communities[data.communityId].eventCount += 1;

    saveState();
    return event;
}

export function getRecentEvents(limit: number = 20): RoyaltyEvent[] {
    loadState();
    return state.events.slice(-limit).reverse();
}

export function getCommunityBalances(): CommunityBalance[] {
    loadState();
    return Object.values(state.communities);
}

export function getTotalRoyalties(): number {
    loadState();
    return Object.values(state.communities).reduce(
        (sum, c) => sum + c.currentRoyaltyBalance,
        0
    );
}

export function getLedgerStats() {
    loadState();
    return {
        totalEvents: state.events.length,
        totalRoyalties: getTotalRoyalties(),
        communities: getCommunityBalances(),
        recentEvents: getRecentEvents(10),
    };
}
