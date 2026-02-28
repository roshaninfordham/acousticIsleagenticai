
// Server-only module (imported by server actions)

/**
 * @fileOverview Enhanced LlamaIndex service for semantic retrieval of musical heritage.
 * Configures Gemini as the LLM and embedding model for culturally-aware stem matching.
 */

import {
  Document,
  VectorStoreIndex,
  Settings,
  GEMINI_MODEL,
  GEMINI_EMBEDDING_MODEL,
} from 'llamaindex';
import { Gemini, GeminiEmbedding } from 'llamaindex';

// Configure LlamaIndex to use Gemini (not OpenAI default)
// LlamaIndex reads from GOOGLE_API_KEY env var
if (!process.env.GOOGLE_API_KEY && process.env.GOOGLE_GENAI_API_KEY) {
  process.env.GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
}

Settings.llm = new Gemini({
  model: GEMINI_MODEL.GEMINI_2_0_FLASH,
});

Settings.embedModel = new GeminiEmbedding({
  model: GEMINI_EMBEDDING_MODEL.TEXT_EMBEDDING_004,
});

// Comprehensive catalog of indigenous heritage audio stems
const AUDIO_STEM_CATALOG = [
  {
    id: "ambient_vocal_chant_01",
    name: "Nicobarese Morning Chant",
    description: "A low-energy, atmospheric vocal chant used during sunrise ceremonies. Ambient, calming, and deeply spiritual. Best for still or meditative states.",
    energyLevel: "Calm",
    communityId: "community_nicobar_01",
    type: "Vocal",
    bpmRange: [60, 80],
  },
  {
    id: "bamboo_percussion_fast_01",
    name: "High-Tempo Bamboo Loop",
    description: "Intense, rhythmic bamboo percussion from communal harvest festivals. High energy, suitable for vigorous dancing and celebration.",
    energyLevel: "Energetic",
    communityId: "community_nicobar_02",
    type: "Percussion",
    bpmRange: [120, 160],
  },
  {
    id: "flute_melody_mid_01",
    name: "Coastal Flute Melody",
    description: "A mid-tempo melody mimicking the ocean waves, played during fishing season gatherings. Balanced energy, melodic and swaying.",
    energyLevel: "Rhythmic",
    communityId: "community_nicobar_01",
    type: "Melodic",
    bpmRange: [90, 110],
  },
  {
    id: "drum_circle_intense_01",
    name: "Sacred Drum Circle",
    description: "Powerful polyrhythmic drumming from ceremonial gatherings. Driving, intense energy that builds progressively. For active movement and dancing.",
    energyLevel: "Intense",
    communityId: "community_nicobar_02",
    type: "Percussion",
    bpmRange: [100, 140],
  },
  {
    id: "string_drone_ambient_01",
    name: "Twilight String Drone",
    description: "Deep resonant string drone used during evening storytelling. Hypnotic and contemplative, creating an atmosphere of reflection.",
    energyLevel: "Ambient",
    communityId: "community_nicobar_01",
    type: "Drone",
    bpmRange: [40, 60],
  },
  {
    id: "vocal_rhythm_mid_01",
    name: "Call-and-Response Chant",
    description: "Rhythmic group vocal pattern used in community work songs. Moderate energy with strong rhythmic pulse, encouraging participation.",
    energyLevel: "Moderate",
    communityId: "community_nicobar_03",
    type: "Vocal",
    bpmRange: [85, 105],
  },
  {
    id: "water_percussion_gentle_01",
    name: "River Stone Percussion",
    description: "Gentle percussion using river stones and water vessels. Light, playful energy suited for casual movement and gentle swaying.",
    energyLevel: "Gentle",
    communityId: "community_nicobar_03",
    type: "Percussion",
    bpmRange: [70, 95],
  },
];

// Cache the index to avoid re-building on every request
let cachedIndex: VectorStoreIndex | null = null;

async function getOrBuildIndex(): Promise<VectorStoreIndex> {
  if (cachedIndex) return cachedIndex;

  const documents = AUDIO_STEM_CATALOG.map(stem => new Document({
    text: `Heritage Stem: "${stem.name}" — ${stem.description} Energy Level: ${stem.energyLevel}. Type: ${stem.type}. BPM Range: ${stem.bpmRange[0]}-${stem.bpmRange[1]}. Owned by indigenous community: ${stem.communityId}.`,
    id_: stem.id,
    metadata: { ...stem }
  }));

  cachedIndex = await VectorStoreIndex.fromDocuments(documents);
  return cachedIndex;
}

export async function retrieveBestStem(queryText: string) {
  try {
    console.log(`[LlamaIndex] Querying for context: "${queryText}"`);

    const index = await getOrBuildIndex();
    const queryEngine = index.asQueryEngine();

    const response = await queryEngine.query({
      query: `Given the user's current state: "${queryText}", select the single most culturally appropriate audio stem from the Nicobarese heritage catalog. Consider energy level, movement intensity, and emotional tone. Return ONLY the stem name.`
    });

    const responseText = response.toString();
    console.log(`[LlamaIndex] Response: ${responseText}`);

    // Find best match from catalog
    const bestMatch = AUDIO_STEM_CATALOG.find(s =>
      responseText.toLowerCase().includes(s.name.toLowerCase()) ||
      responseText.toLowerCase().includes(s.id.toLowerCase())
    ) || AUDIO_STEM_CATALOG[0];

    console.log(`[LlamaIndex] Matched stem: ${bestMatch.name} (${bestMatch.id})`);
    return bestMatch;
  } catch (error) {
    console.error("[LlamaIndex] Retrieval Error:", error);
    // Fallback to energy-based heuristic
    const lowerQuery = queryText.toLowerCase();
    if (lowerQuery.includes('high') || lowerQuery.includes('danc') || lowerQuery.includes('intense')) {
      return AUDIO_STEM_CATALOG[1]; // bamboo percussion
    } else if (lowerQuery.includes('calm') || lowerQuery.includes('still') || lowerQuery.includes('quiet')) {
      return AUDIO_STEM_CATALOG[0]; // morning chant  
    }
    return AUDIO_STEM_CATALOG[2]; // coastal flute as safe default
  }
}

export { AUDIO_STEM_CATALOG };
