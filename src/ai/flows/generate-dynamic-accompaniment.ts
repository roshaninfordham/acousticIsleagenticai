
'use server';
/**
 * @fileOverview The "AcousticIsle Brain" - A multimodal Genkit flow that orchestrates 
 * musical decisions based on physical and rhythmic telemetry.
 *
 * - generateDynamicAccompaniment - Primary orchestrator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDynamicAccompanimentInputSchema = z.object({
  mediaDataUri: z
    .string()
    .describe(
      "A 3-second multimodal snippet (webm/mp4) as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDynamicAccompanimentInput = z.infer<typeof GenerateDynamicAccompanimentInputSchema>;

const GenerateDynamicAccompanimentOutputSchema = z.object({
  play_stem: z.string().describe('The identified musical stem (e.g., "high_energy_percussion").'),
  bpm: z.number().describe('The detected BPM of the performance.'),
  energy_score: z.number().min(1).max(10).describe('The kinetic energy score from 1-10.'),
  royalty_amount: z.number().describe('The micro-royalty amount in USD (e.g., 0.05).'),
  analysis_summary: z.string().describe('A brief technical summary of the AI orchestration decision.'),
  community_id: z.string().describe('The ID of the indigenous community owning this heritage.'),
});
export type GenerateDynamicAccompanimentOutput = z.infer<typeof GenerateDynamicAccompanimentOutputSchema>;

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
  prompt: `You are the "Ethnomusicologist DJ" Lead Orchestrator for AcousticIsle. 
Your goal is to cross-reference video and audio telemetry to protect and promote indigenous musical heritage.

Analyze the provided 3-second multimodal stream:
1. **Telemetry Analyst Layer**: Observe the kinetic energy. Is the user dancing, swaying, or stationary? Assign an energy score (1-10).
2. **Rhythmic Analyst Layer**: Listen for tapping, humming, or vocalizing. Calculate the approximate BPM.
3. **Heritage Selection**: Based on the data, select a culturally accurate stem. 
   - Low energy/BPM: Ambient vocal chants or flute melodies.
   - High energy/BPM: Rhythmic bamboo percussion loops or group chants.

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
