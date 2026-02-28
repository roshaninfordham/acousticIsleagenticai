'use server';
/**
 * @fileOverview A Genkit flow for the AcousticIsle application that analyzes multimodal
 * user input (audio and video) and dynamically suggests culturally accurate musical
 * accompaniments from the Andaman Islands heritage.
 *
 * - generateDynamicAccompaniment - A function that handles the dynamic accompaniment generation process.
 * - GenerateDynamicAccompanimentInput - The input type for the generateDynamicAccompaniment function.
 * - GenerateDynamicAccompanimentOutput - The return type for the generateDynamicAccompaniment function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateDynamicAccompanimentInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A 3-second audio snippet, as a data URI that must include a MIME type (e.g., audio/webm) and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  videoDataUri: z
    .string()
    .describe(
      "A 3-second video snippet, as a data URI that must include a MIME type (e.g., video/webm) and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDynamicAccompanimentInput = z.infer<typeof GenerateDynamicAccompanimentInputSchema>;

const GenerateDynamicAccompanimentOutputSchema = z.object({
  play_stem: z
    .string()
    .describe(
      'The file name or identifier of the culturally accurate musical stem to play next (e.g., "high_energy_bamboo.mp3").'
    ),
  bpm: z.number().describe("The detected BPM (Beats Per Minute) of the user's input."),
  royalty_split: z.string().describe('The micro-royalty amount for the community for using this stem (e.g., "$0.02").'),
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
  prompt: `You are an "Ethnomusicologist DJ" AI agent specializing in the musical heritage of the Andaman Islands.
Your task is to analyze multimodal input from a user's live performance (audio and video) and suggest a dynamic, culturally accurate musical accompaniment.

Analyze the user's provided audio and video snippets to determine:
1.  **BPM**: Estimate the Beats Per Minute from the user's audio input.
2.  **Kinetic Energy**: Assess the user's physical energy level from the video (e.g., swaying slowly, dancing energetically).

Based on this analysis, select an appropriate musical stem from the Andaman Islands heritage. The selection should dynamically transition to match the user's performance. For example, if the user starts tapping faster and moving more energetically, suggest a high-tempo, rhythmic percussion loop. If the user is slower and more ambient, suggest a vocal chant.

Provide your output in a strict JSON format with the following fields:
-   "play_stem": A string representing the file name or identifier of the musical stem to play. This should be culturally accurate and reflect the detected energy and BPM.
-   "bpm": A number representing the estimated BPM.
-   "royalty_split": A string representing a simulated micro-royalty amount for the community.

Audio input: {{media url=audioDataUri}}
Video input: {{media url=videoDataUri}}`,
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
      throw new Error('Failed to generate dynamic accompaniment.');
    }
    return output;
  }
);
