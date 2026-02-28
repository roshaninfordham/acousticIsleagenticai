/**
 * Temporal Worker for AcousticIsle.
 * 
 * Run alongside the Next.js dev server:
 *   npm run temporal:worker
 * 
 * Connects to Temporal Cloud and polls the 'acoustic-isle' task queue.
 */

import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    const apiKey = process.env.TEMPORAL_API_KEY;
    const namespace = process.env.TEMPORAL_NAMESPACE;
    const address = process.env.TEMPORAL_ADDRESS;

    if (!apiKey || !namespace || !address) {
        console.error('❌ Missing TEMPORAL_API_KEY, TEMPORAL_NAMESPACE, or TEMPORAL_ADDRESS');
        console.error('   Set these in .env.local and try again.');
        process.exit(1);
    }

    console.log('🎵 AcousticIsle Temporal Worker');
    console.log(`   Namespace: ${namespace}`);
    console.log(`   Address: ${address}`);
    console.log('   Connecting...');

    const connection = await NativeConnection.connect({
        address,
        apiKey,
        tls: true,
    });

    const worker = await Worker.create({
        connection,
        namespace,
        taskQueue: 'acoustic-isle',
        workflowsPath: require.resolve('./workflows'),
        activities,
    });

    console.log('');
    console.log('✅ Worker online! Polling task queue: acoustic-isle');
    console.log('   📡 analyzeAndRetrieveStemActivity (Gemini + LlamaIndex)');
    console.log('   💰 logRoyaltyActivity (Local Ledger)');
    console.log('');
    console.log('   Waiting for workflow tasks...');

    await worker.run();
}

run().catch((err) => {
    console.error('❌ Worker failed:', err);
    process.exit(1);
});
