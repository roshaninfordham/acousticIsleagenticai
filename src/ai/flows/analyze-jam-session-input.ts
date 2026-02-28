'use server';
/**
 * @fileOverview An AI agent that analyzes live audio and video input to understand user's musical intent and mood.
 *
 * - analyzeJamSessionInput - A function that handles the analysis of multimodal jam session input.
 * - AnalyzeJamSessionInput - The input type for the analyzeJamSessionInput function.
 * - AnalyzeJamSessionOutput - The return type for the analyzeJamSessionInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeJamSessionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A short chunk of user's audio input (e.g., humming, tapping a beat) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  videoDataUri: z
    .string()
    .describe(
      "A short chunk of user's video input (e.g., physical movement) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeJamSessionInput = z.infer<typeof AnalyzeJamSessionInputSchema>;

const AnalyzeJamSessionOutputSchema = z.object({
  bpm: z.number().describe("The estimated Beats Per Minute (BPM) of the user's audio input."),
  energyLevel: z.number().min(1).max(10).describe("The user's energy level from 1 (low) to 10 (high) based on video input and audio intensity."),
  nextStemId: z.string().describe("The ID of the culturally accurate audio stem that should be played next based on the analysis."),
});
export type AnalyzeJamSessionOutput = z.infer<typeof AnalyzeJamSessionOutputSchema>;

export async function analyzeJamSessionInput(input: AnalyzeJamSessionInput): Promise<AnalyzeJamSessionOutput> {
  return analyzeJamSessionInputFlow(input);
}

const analyzeJamSessionPrompt = ai.definePrompt({
  name: 'analyzeJamSessionPrompt',
  input: {schema: AnalyzeJamSessionInputSchema},
  output: {schema: AnalyzeJamSessionOutputSchema},
  model: 'googleai/gemini-1.5-pro',
  prompt: [
    {
      text: `You are an "Ethnomusicologist DJ" AI. Your task is to analyze short chunks of user audio and video input to determine their current musical intent and mood.\n\nAnalyze the provided audio for rhythm, pitch, and intensity, and the video for physical energy and movement.\n\nBased on your analysis, determine:\n1. The estimated Beats Per Minute (BPM) of the user's audio input.\n2. The user's energy level on a scale from 1 (low) to 10 (high), considering both physical movement from video and audio intensity.\n3. The ID of an appropriate culturally accurate audio stem that should be played next to accompany the user. This is a placeholder for a real stem ID from a database. For this exercise, use creative, descriptive string IDs like "slow_ambient_vocal_chant", "high_tempo_percussion_loop", "mid_tempo_flute_melody", etc., that match the detected mood and rhythm.\n\nReturn your analysis as a JSON object with the following structure:\n${
        JSON.stringify(
          AnalyzeJamSessionOutputSchema.parse({
            bpm: 0,
            energyLevel: 0,
            nextStemId: '',
          }),
          null,
          2
        )
      }\n\nConsider the following:\n- If the user is tapping faster and moving more energetically, suggest a higher BPM and energy level, and a more upbeat stem.\n- If the user is humming a slow melody and moving subtly, suggest a lower BPM and energy level, and a more ambient stem.\n`,
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
      throw new Error('Failed to generate output from AI model.');
    }
    return output;
  }
);
