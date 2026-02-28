'use server';
/**
 * @fileOverview An AI agent that analyzes live audio and video input using Gemini 3 Pro.
 * Optimized for complex reasoning about rhythmic and physical telemetry.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJamSessionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A short chunk of user's audio input as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  videoDataUri: z
    .string()
    .describe(
      "A short chunk of user's video input as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeJamSessionInput = z.infer<typeof AnalyzeJamSessionInputSchema>;

const AnalyzeJamSessionOutputSchema = z.object({
  bpm: z.number().describe("The estimated Beats Per Minute (BPM) of the user's audio input."),
  energyLevel: z.number().min(1).max(10).describe("The user's energy level from 1-10."),
  nextStemId: z.string().describe("The ID of the culturally accurate audio stem that should be played next."),
  reasoning: z.string().describe("Short technical reasoning for the biometric analysis."),
});
export type AnalyzeJamSessionOutput = z.infer<typeof AnalyzeJamSessionOutputSchema>;

export async function analyzeJamSessionInput(input: AnalyzeJamSessionInput): Promise<AnalyzeJamSessionOutput> {
  return analyzeJamSessionInputFlow(input);
}

const analyzeJamSessionPrompt = ai.definePrompt({
  name: 'analyzeJamSessionPrompt',
  input: {schema: AnalyzeJamSessionInputSchema},
  output: {schema: AnalyzeJamSessionOutputSchema},
  model: 'googleai/gemini-3-pro-preview',
  prompt: [
    {
      text: `You are the "Telemetry Specialist" for AcousticIsle. Analyze the user's multimodal input.
      
      Audio: Detect rhythm, pitch, and syncopation.
      Video: Detect kinetic energy, intensity of movement, and environmental mood.
      
      Return a precise BPM, an energy score (1-10), and select a nextStemId that matches the "vibe" (e.g., "fast_tribal_drum", "slow_zen_chant").
      
      Output reasoning in a single sentence.`,
    },
    {media: {url: '{{{audioDataUri}}}'}},
    {media: {url: '{{{videoDataUri}}}'}},
  ],
});

const analyzeJamSessionInputFlow = ai.defineFlow(
  {
    name: 'analyzeJamSessionInputFlow',
    inputSchema: AnalyzeJamSessionInputSchema,
    outputSchema: AnalyzeJamSessionOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeJamSessionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate output from Gemini 3 Pro.');
    }
    return output;
  }
);
