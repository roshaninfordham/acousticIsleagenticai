/**
 * Temporal Workflow: ProcessFrame
 * 
 * Orchestrates the AcousticIsle 3-agent pipeline with durable execution guarantees:
 *   1. Sensing + Swarm: Analyze frame with Gemini → Retrieve heritage stem via LlamaIndex
 *   2. Ledger: Log micro-royalty to the durable local ledger
 * 
 * Temporal ensures:
 *   - Automatic retries on AI API failures (up to 3 attempts)
 *   - Exactly-once royalty logging (no duplicate transactions)
 *   - Full execution history visible in Temporal Cloud UI
 */

import { proxyActivities, defineSignal, setHandler } from '@temporalio/workflow';
import type * as activities from './activities';

// Proxy activities with retry policies
const { analyzeAndRetrieveStemActivity } = proxyActivities<typeof activities>({
    startToCloseTimeout: '60 seconds',
    retry: {
        maximumAttempts: 3,
        initialInterval: '2 seconds',
        backoffCoefficient: 2,
    },
});

const { logRoyaltyActivity } = proxyActivities<typeof activities>({
    startToCloseTimeout: '10 seconds',
    retry: {
        maximumAttempts: 5,
        initialInterval: '1 second',
    },
});

export interface ProcessFrameInput {
    frameDataUri: string;
    sessionId: string;
}

export interface ProcessFrameResult {
    play_stem: string;
    stem_name: string;
    bpm: number;
    energy_score: number;
    royalty_amount: number;
    analysis_summary: string;
    community_id: string;
}

/**
 * Workflow: Process a single camera frame through the full agent pipeline.
 * 
 * Each frame analysis is a separate workflow execution, giving us:
 *   - Individual retry/failure handling per frame
 *   - Complete audit trail in Temporal Cloud UI
 *   - Guaranteed royalty logging even if the browser disconnects
 */
export async function processFrameWorkflow(
    input: ProcessFrameInput
): Promise<ProcessFrameResult> {
    // Stage 1+2: Sensing + Swarm — Gemini analyzes frame, LlamaIndex retrieves stem
    const analysisResult = await analyzeAndRetrieveStemActivity({
        frameDataUri: input.frameDataUri,
        sessionId: input.sessionId,
    });

    // Stage 3: Ledger — Log royalty with durable guarantee
    await logRoyaltyActivity({
        stemId: analysisResult.play_stem,
        communityId: analysisResult.community_id,
        amount: analysisResult.royalty_amount,
        workflowId: `${input.sessionId}-${Date.now()}`,
    });

    return analysisResult;
}
