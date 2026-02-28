
'use server';
/**
 * @fileOverview The "AcousticIsle Brain" - A multimodal Genkit flow that orchestrates 
 * musical decisions based on physical and rhythmic telemetry.
 *
 * - Now integrates LlamaIndex for semantic heritage retrieval.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { retrieveBestStem } from '@/services/stem-retrieval-service';

const GenerateDynamicAccompanimentInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A 3-second multimodal snippet (webm/mp4) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

// Tool for Semantic Retrieval using LlamaIndex
const retrieveHeritageStem = ai.defineTool(
  {
    name: 'retrieveHeritageStem',
    description: 'Retrieves the most culturally appropriate audio stem based on user mood and energy.',
    inputSchema: z.object({
      context: z.string().describe('The musical context (e.g., "high energy dancing", "slow swaying").'),
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
  model: 'googleai/gemini-2.5-flash',
  tools: [retrieveHeritageStem],
  prompt: `You are the "Ethnomusicologist DJ" Lead Orchestrator for AcousticIsle. 
Your goal is to cross-reference video and audio telemetry to protect and promote indigenous musical heritage.

Analyze the provided 3-second multimodal stream:
1. **Telemetry Analyst Layer**: Observe the kinetic energy. Is the user dancing, swaying, or stationary? Assign an energy score (1-10).
2. **Rhythmic Analyst Layer**: Listen for tapping, humming, or vocalizing. Calculate the approximate BPM.
3. **Heritage Retrieval**: Use the 'retrieveHeritageStem' tool to find a culturally accurate stem based on the energy and rhythm.

Calculate a micro-royalty (royalty_amount) between $0.01 and $0.10 based on the complexity and duration of the usage.

Return your decision in strict JSON format.

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
      throw new Error('Failed to orchestrate musical decision.');
    }
    return output;
  }
);
