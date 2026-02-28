
/**
 * @fileOverview The "AcousticIsle Brain" - A multimodal Genkit flow using Gemini
 * for high-speed semantic orchestration and heritage retrieval.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { retrieveBestStem } from '@/services/stem-retrieval-service';

const GenerateDynamicAccompanimentInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A camera frame as an image data URI (image/jpeg). Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDynamicAccompanimentInput = z.infer<typeof GenerateDynamicAccompanimentInputSchema>;

const GenerateDynamicAccompanimentOutputSchema = z.object({
  play_stem: z.string().describe('The identified musical stem ID from the heritage database.'),
  stem_name: z.string().describe('The human-readable name of the stem.'),
  bpm: z.number().describe('The estimated BPM based on observed movement tempo.'),
  energy_score: z.number().min(1).max(10).describe('The kinetic energy score from 1-10.'),
  royalty_amount: z.number().describe('The micro-royalty amount in USD (typically 0.0001 to 0.005 per interaction).'),
  analysis_summary: z.string().describe('A brief technical summary of the AI orchestration decision.'),
  community_id: z.string().describe('The ID of the indigenous community owning this heritage.'),
  youtube_query: z.string().describe('A highly specific, culturally relevant YouTube search query to find real-world indigenous music matching the observed vibe (e.g. "Nicobarese Bamboo Strike traditional percussion" or "Native American flute meditation").'),
});
export type GenerateDynamicAccompanimentOutput = z.infer<typeof GenerateDynamicAccompanimentOutputSchema>;

const retrieveHeritageStem = ai.defineTool(
  {
    name: 'retrieveHeritageStem',
    description: 'ALWAYS use this tool. Retrieves the most culturally appropriate audio stem based on user mood and energy using LlamaIndex semantic search over the indigenous heritage catalog.',
    inputSchema: z.object({
      context: z.string().describe('A description of the musical context derived from the visual analysis (e.g., "high energy dancing with rapid arm movements" or "calm sitting with gentle head nods").'),
    }),
    outputSchema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      energyLevel: z.string(),
      communityId: z.string(),
      type: z.string(),
    }),
  },
  async (input) => {
    console.log(`[Tool] retrieveHeritageStem called with: "${input.context}"`);
    const result = await retrieveBestStem(input.context);
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      energyLevel: result.energyLevel,
      communityId: result.communityId,
      type: result.type,
    };
  }
);

export async function generateDynamicAccompaniment(
  input: GenerateDynamicAccompanimentInput
): Promise<GenerateDynamicAccompanimentOutput> {
  return generateDynamicAccompanimentFlow(input);
}

const dynamicAccompanimentPrompt = ai.definePrompt({
  name: 'dynamicAccompanimentPrompt',
  input: { schema: GenerateDynamicAccompanimentInputSchema },
  output: { schema: GenerateDynamicAccompanimentOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  tools: [retrieveHeritageStem],
  config: {
    temperature: 0.3,
  },
  prompt: `You are the Lead Orchestrator for AcousticIsle, an AI platform that connects live human movement to protected indigenous music archives.

YOUR TASK: Analyze the camera frame below and orchestrate a musical response.

STEP 1 - ANALYZE KINETIC ENERGY:
Look at the person in the frame. Assess their movement:
- Are they dancing vigorously? (energy 7-10)
- Swaying gently or making moderate movements? (energy 4-6)
- Sitting still or barely moving? (energy 1-3)
Estimate a BPM based on their apparent rhythm (60-160 range).

STEP 2 - RETRIEVE HERITAGE STEM:
You MUST call the 'retrieveHeritageStem' tool with a description of what you observe.
For example: "energetic dancing, high movement, fast rhythm" or "calm and still, meditative posture"

STEP 3 - CALCULATE ROYALTY:
Set royalty_amount based on energy: energy_score * 0.0005

STEP 4 - Cultural Pairing & YouTube Query:
Generate a 'youtube_query' that translates this vibe into a specific indigenous music search term. (e.g. "Maori Haka traditional chant" or "Andean panpipe fast rhythm"). This grounds the visual telemetry in real-world ethnomusicology.

STEP 5 - RETURN RESULT:
Use the stem returned by the tool to populate play_stem (the stem id), stem_name, and community_id. Include your youtube_query.

Input Frame: {{media url=mediaDataUri}}`,
});

const generateDynamicAccompanimentFlow = ai.defineFlow(
  {
    name: 'generateDynamicAccompanimentFlow',
    inputSchema: GenerateDynamicAccompanimentInputSchema,
    outputSchema: GenerateDynamicAccompanimentOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await dynamicAccompanimentPrompt(input);
      if (!output) {
        console.warn('[Flow] Gemini returned null output, using fallback');
        return createFallbackOutput();
      }
      console.log(`[Flow] Orchestration complete: stem=${output.stem_name}, energy=${output.energy_score}, bpm=${output.bpm}`);
      return output;
    } catch (error) {
      console.error('[Flow] Gemini orchestration failed:', error);
      return createFallbackOutput();
    }
  }
);

function createFallbackOutput(): GenerateDynamicAccompanimentOutput {
  return {
    play_stem: 'flute_melody_mid_01',
    stem_name: 'Coastal Flute Melody',
    bpm: 90,
    energy_score: 5,
    royalty_amount: 0.0025,
    analysis_summary: 'Fallback: Using default stem due to inference timeout.',
    community_id: 'community_nicobar_01',
    youtube_query: 'indigenous meditation chant traditional',
  };
}
