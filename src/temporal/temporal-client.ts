/**
 * Temporal Client singleton for use in Next.js API routes.
 * Connects to Temporal Cloud with API key authentication.
 * Falls back to direct execution if Temporal is unavailable.
 */

import { Client, Connection } from '@temporalio/client';

let clientInstance: Client | null = null;
let connectionFailed = false;

export async function getTemporalClient(): Promise<Client | null> {
    if (clientInstance) return clientInstance;
    if (connectionFailed) return null;

    const apiKey = process.env.TEMPORAL_API_KEY;
    const namespace = process.env.TEMPORAL_NAMESPACE;
    const address = process.env.TEMPORAL_ADDRESS;

    if (!apiKey || !namespace || !address) {
        console.warn('[Temporal] Missing TEMPORAL_API_KEY, TEMPORAL_NAMESPACE, or TEMPORAL_ADDRESS. Running in direct mode (no Temporal).');
        connectionFailed = true;
        return null;
    }

    try {
        const connection = await Connection.connect({
            address,
            apiKey,
            tls: true,
        });

        clientInstance = new Client({
            connection,
            namespace,
        });

        console.log(`[Temporal] Connected to ${address} (namespace: ${namespace})`);
        return clientInstance;
    } catch (error) {
        console.error('[Temporal] Failed to connect to Temporal Cloud:', error);
        console.warn('[Temporal] Falling back to direct execution mode.');
        connectionFailed = true;
        return null;
    }
}

export const TASK_QUEUE = 'acoustic-isle';
