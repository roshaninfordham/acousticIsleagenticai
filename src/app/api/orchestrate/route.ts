/**
 * POST /api/orchestrate
 * 
 * Receives a camera frame, orchestrates the 3-agent pipeline.
 * Strategy: Try Temporal (with 15s timeout) → Direct Gemini → Fallback
 * Enriches results with YouTube heritage video references.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicAccompaniment } from '@/ai/flows/generate-dynamic-accompaniment';
import { addRoyaltyEvent } from '@/store/local-ledger';
import { getYouTubeHeritageForEnergy } from '@/services/youtube-heritage-service';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Temporal timeout')), ms)),
    ]);
}

async function tryTemporalExecution(frameDataUri: string, sessionId: string): Promise<any | null> {
    try {
        const { getTemporalClient, TASK_QUEUE } = await import('@/temporal/temporal-client');
        const client = await getTemporalClient();
        if (!client) return null;

        const workflowId = `frame-${sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        console.log(`[API] Starting Temporal workflow: ${workflowId}`);

        const handle = await client.workflow.start('processFrameWorkflow', {
            args: [{ frameDataUri, sessionId }],
            taskQueue: TASK_QUEUE,
            workflowId,
        });

        const result = await withTimeout(handle.result(), 15000);
        console.log(`[API] Temporal workflow completed: ${workflowId}`);
        return { ...result, orchestration: 'temporal', workflowId };
    } catch (error) {
        console.warn(`[API] Temporal unavailable/timed out, falling back to direct:`,
            error instanceof Error ? error.message : error);
        return null;
    }
}

async function enrichWithYouTube(result: any): Promise<any> {
    try {
        const ytVideo = await getYouTubeHeritageForEnergy(result.energy_score || 5);
        if (ytVideo) {
            return {
                ...result,
                youtube: {
                    videoId: ytVideo.videoId,
                    title: ytVideo.title,
                    channelTitle: ytVideo.channelTitle,
                    thumbnailUrl: ytVideo.thumbnailUrl,
                    embedUrl: ytVideo.embedUrl,
                },
            };
        }
    } catch (e) {
        console.warn('[API] YouTube enrichment skipped:', e);
    }
    return result;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { frameDataUri, sessionId } = body;

        if (!frameDataUri || !sessionId) {
            return NextResponse.json({ error: 'Missing frameDataUri or sessionId' }, { status: 400 });
        }

        // Try Temporal first (15s timeout)
        let result = await tryTemporalExecution(frameDataUri, sessionId);

        if (!result) {
            // Direct execution fallback
            console.log(`[API] Direct execution mode`);
            const aiResult = await generateDynamicAccompaniment({ mediaDataUri: frameDataUri });
            result = { ...aiResult, orchestration: 'direct' };
        }

        // Log royalty to local ledger
        addRoyaltyEvent({
            stemId: result.play_stem,
            communityId: result.community_id,
            amount: result.royalty_amount,
        });

        // Enrich with YouTube heritage video
        result = await enrichWithYouTube(result);

        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Orchestration error:', error);
        return NextResponse.json({
            play_stem: 'flute_melody_mid_01',
            stem_name: 'Coastal Flute Melody',
            bpm: 90,
            energy_score: 5,
            royalty_amount: 0.0025,
            analysis_summary: 'Fallback: Pipeline error, using default stem.',
            community_id: 'community_nicobar_01',
            orchestration: 'fallback',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
