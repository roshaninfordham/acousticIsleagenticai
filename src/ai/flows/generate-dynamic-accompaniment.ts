
'use server';
/**
 * @fileOverview The "AcousticIsle Brain" - A multimodal Genkit flow using Gemini 3 Flash
 * for high-speed semantic orchestration and heritage retrieval.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { retrieveBestStem } from '@/services/stem-retrieval-service';

const GenerateDynamicAccompanimentInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A 3-second multimodal snippet as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDynamicAccompanimentInput = z.infer<typeof GenerateDynamicAccompanimentInputSchema>;

const GenerateDynamicAccompanimentOutputSchema = z.object({
  play_stem: z.string().describe('The identified musical stem ID from the heritage database.'),
  stem_name: z.string().describe('The human-readable name of the stem.'),
  bpm: z.number().describe('The detected BPM of the performance.'),
  energy_score: z.number().min(1).max(10).describe('The kinetic energy score from 1-10.'),
  royalty_amount: z.number().describe('The micro-royalty amount in USD.'),
  analysis_summary: z.string().describe('A brief technical summary of the AI orchestration decision.'),
  community_id: z.string().describe('The ID of the indigenous community owning this heritage.'),
});
export type GenerateDynamicAccompanimentOutput = z.infer<typeof GenerateDynamicAccompanimentOutputSchema>;

const retrieveHeritageStem = ai.defineTool(
  {
    name: 'retrieveHeritageStem',
    description: 'Retrieves the most culturally appropriate audio stem based on user mood and energy using LlamaIndex.',
    inputSchema: z.object({
      context: z.string().describe('The musical context (e.g., "high energy dancing").'),
    }),
    outputSchema: z.any(),
  },
  async (input) => {
    return await retrieveBestStem(input.context);
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
  model: 'googleai/gemini-3-flash-preview',
  tools: [retrieveHeritageStem],
  prompt: `You are the Lead Orchestrator for AcousticIsle. 
Use your multimodal vision to cross-reference video and audio telemetry.

1. Analyze Kinetic Energy: Analyze the user's movement (dancing, swaying, or stationary) from the video.
2. Analyze Rhythm: Detect BPM and rhythmic patterns from the audio.
3. Retrieve Heritage: Use 'retrieveHeritageStem' to find the best matching indigenous stem from our semantic database.

Calculate a micro-royalty based on usage intensity (more movement = higher intensity).

Input Stream: {{media url=mediaDataUri}}`,
});

const generateDynamicAccompanimentFlow = ai.defineFlow(
  {
    name: 'generateDynamicAccompanimentFlow',
    inputSchema: GenerateDynamicAccompanimentInputSchema,
    outputSchema: GenerateDynamicAccompanimentOutputSchema,
  },
  async (input) => {
    const { output } = await dynamicAccompanimentPrompt(input);
    if (!output) {
      throw new Error('Failed to orchestrate musical decision with Gemini 3 Flash.');
    }
    return output;
  }
);
