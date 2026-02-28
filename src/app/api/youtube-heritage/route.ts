/**
 * GET /api/youtube-heritage?energy=5
 * 
 * Searches YouTube for indigenous music matching the given energy level.
 * Returns embed-ready video references for the UI player.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeHeritageForEnergy, searchYouTubeHeritage } from '@/services/youtube-heritage-service';

export async function GET(request: NextRequest) {
    const energy = parseInt(request.nextUrl.searchParams.get('energy') || '5');

    try {
        let level: 'calm' | 'moderate' | 'energetic';
        if (energy <= 3) level = 'calm';
        else if (energy <= 6) level = 'moderate';
        else level = 'energetic';

        const results = await searchYouTubeHeritage(level, 5);
        return NextResponse.json({ results, energyLevel: level });
    } catch (error) {
        console.error('[API] YouTube heritage search error:', error);
        return NextResponse.json({ results: [], energyLevel: 'moderate' });
    }
}
