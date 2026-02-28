/**
 * YouTube Heritage Service
 * Uses YouTube Data API v3 to search for real indigenous music content
 * and enrich the stem catalog with actual playable references.
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

export interface YouTubeHeritageStem {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    description: string;
    embedUrl: string;
}

// Pre-defined search queries mapping energy levels to indigenous music styles
const HERITAGE_QUERIES: Record<string, string[]> = {
    calm: [
        'indigenous meditation chant traditional',
        'native ambient music spiritual ceremony',
        'tribal flute meditation peaceful',
    ],
    moderate: [
        'indigenous rhythmic folk music traditional',
        'native community music gathering song',
        'tribal percussion moderate rhythm cultural',
    ],
    energetic: [
        'indigenous dance music traditional drums',
        'native celebration music percussion',
        'tribal festival dance high energy drums',
    ],
};

// Cache results to avoid rate limits
const searchCache = new Map<string, YouTubeHeritageStem[]>();

export async function searchYouTubeHeritage(
    energyLevel: 'calm' | 'moderate' | 'energetic',
    maxResults: number = 3
): Promise<YouTubeHeritageStem[]> {
    const cacheKey = `${energyLevel}-${maxResults}`;
    if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey)!;
    }

    if (!YOUTUBE_API_KEY) {
        console.warn('[YouTube] No YOUTUBE_API_KEY set, skipping YouTube search');
        return [];
    }

    const queries = HERITAGE_QUERIES[energyLevel] || HERITAGE_QUERIES.moderate;
    const query = queries[Math.floor(Math.random() * queries.length)];

    try {
        const params = new URLSearchParams({
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: String(maxResults),
            videoCategoryId: '10', // Music category
            key: YOUTUBE_API_KEY,
            videoEmbeddable: 'true',
            videoSyndicated: 'true',
        });

        const response = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`);
        if (!response.ok) {
            console.error('[YouTube] API Error:', response.status, await response.text());
            return [];
        }

        const data = await response.json();
        const results: YouTubeHeritageStem[] = (data.items || []).map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
            description: item.snippet.description,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}?autoplay=1&controls=0`,
        }));

        searchCache.set(cacheKey, results);
        console.log(`[YouTube] Found ${results.length} heritage tracks for "${energyLevel}": ${results.map(r => r.title).join(', ')}`);
        return results;
    } catch (error) {
        console.error('[YouTube] Search failed:', error);
        return [];
    }
}

/**
 * Get a YouTube heritage stem based on energy score (1-10)
 */
export async function getYouTubeHeritageForEnergy(energyScore: number): Promise<YouTubeHeritageStem | null> {
    let level: 'calm' | 'moderate' | 'energetic';
    if (energyScore <= 3) level = 'calm';
    else if (energyScore <= 6) level = 'moderate';
    else level = 'energetic';

    const results = await searchYouTubeHeritage(level, 5);
    if (results.length === 0) return null;

    // Return a random result for variety
    return results[Math.floor(Math.random() * results.length)];
}
