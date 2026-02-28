/**
 * Temporal Activities for the AcousticIsle 3-Agent Pipeline.
 * Each activity maps to one agent in the orchestration swarm.
 * 
 * NOTE: Uses relative imports (not @/) so the standalone worker can resolve them.
 */

import { generateDynamicAccompaniment } from '../ai/flows/generate-dynamic-accompaniment';
import { addRoyaltyEvent } from '../store/local-ledger';

export interface FrameAnalysisInput {
    frameDataUri: string;
    sessionId: string;
}

export interface FrameAnalysisResult {
    play_stem: string;
    stem_name: string;
    bpm: number;
    energy_score: number;
    royalty_amount: number;
    analysis_summary: string;
    community_id: string;
}

export interface RoyaltyInput {
    stemId: string;
    communityId: string;
    amount: number;
    workflowId: string;
}

/**
 * Activity 1+2: Analyze frame with Gemini and retrieve heritage stem via LlamaIndex.
 */
export async function analyzeAndRetrieveStemActivity(
    input: FrameAnalysisInput
): Promise<FrameAnalysisResult> {
    console.log(`[Activity] analyzeAndRetrieveStem: Processing frame for session ${input.sessionId}`);

    const result = await generateDynamicAccompaniment({
        mediaDataUri: input.frameDataUri,
    });

    console.log(`[Activity] Result: stem="${result.stem_name}", energy=${result.energy_score}, bpm=${result.bpm}`);

    return {
        play_stem: result.play_stem,
        stem_name: result.stem_name,
        bpm: result.bpm,
        energy_score: result.energy_score,
        royalty_amount: result.royalty_amount,
        analysis_summary: result.analysis_summary,
        community_id: result.community_id,
    };
}

/**
 * Activity 3: Log royalty to the durable local ledger.
 */
export async function logRoyaltyActivity(input: RoyaltyInput): Promise<void> {
    console.log(`[Activity] logRoyalty: $${input.amount.toFixed(4)} for ${input.stemId} → ${input.communityId}`);

    addRoyaltyEvent({
        stemId: input.stemId,
        communityId: input.communityId,
        amount: input.amount,
        workflowId: input.workflowId,
    });

    console.log(`[Activity] Royalty secured in local ledger.`);
}
