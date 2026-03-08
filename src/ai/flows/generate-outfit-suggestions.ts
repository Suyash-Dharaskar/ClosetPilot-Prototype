'use server';
/**
 * @fileOverview A Genkit flow for generating outfit suggestions based on an occasion.
 *
 * - generateOutfitSuggestions - A function that handles the outfit generation process.
 * - GenerateOutfitSuggestionsInput - The input type for the generateOutfitSuggestions function.
 * - GenerateOutfitSuggestionsOutput - The return type for the generateOutfitSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClosetItemForAISchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});

const GenerateOutfitSuggestionsInputSchema = z.object({
  occasion: z.string().describe("The occasion for which outfit suggestions are needed, e.g., 'Casual coffee chat', 'Dinner party', 'Job interview'."),
  clarifyingContext: z.string().optional().describe("Additional context gathered from clarifying questions, e.g., 'Time: Evening, Weather: Cool, Venue: Upscale lounge, Vibe: Smart casual'."),
  closetItems: z.array(ClosetItemForAISchema).describe("A list of clothing items available in the user's closet.")
});
export type GenerateOutfitSuggestionsInput = z.infer<typeof GenerateOutfitSuggestionsInputSchema>;

const SuggestedOutfitItemSchema = z.object({
  type: z.enum(['Top', 'Bottom', 'Footwear']).describe('The type of clothing item, either Top, Bottom, or Footwear.'),
  name: z.string().describe("The name of the clothing item from the user's closet, e.g., \"White Linen Shirt\"."),
});

const OutfitCombinationSchema = z.object({
  matchPercentage: z.number().int().min(0).max(100).describe('A percentage indicating how well this specific outfit combination matches the occasion.'),
  outfitSuggestions: z.array(SuggestedOutfitItemSchema).min(3).max(3).describe("An array of exactly three clothing item suggestions from the user's closet: one for Top, one for Bottom, and one for Footwear."),
  aiRationale: z.string().describe("A brief explanation from the AI stylist explaining why these specific items were chosen for the given occasion."),
});

const GenerateOutfitSuggestionsOutputSchema = z.object({
  combinations: z.array(OutfitCombinationSchema).min(3).max(5).describe("An array of 3 to 5 different outfit combinations, each with its own match percentage, outfit items, and rationale. Combinations should be ordered from best match to least match."),
});
export type GenerateOutfitSuggestionsOutput = z.infer<typeof GenerateOutfitSuggestionsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateOutfitSuggestionsPrompt',
  input: { schema: GenerateOutfitSuggestionsInputSchema },
  output: { schema: GenerateOutfitSuggestionsOutputSchema },
  prompt: `You are an expert personal stylist. Your task is to create 3 to 5 DIFFERENT complete outfit combinations (each with a Top, Bottom, and Footwear) for a given occasion FROM the user's available closet items. You must only choose from the items provided. Each combination should be distinct and use different items where possible.

Occasion: {{{occasion}}}

{{#if clarifyingContext}}
Additional Context: {{{clarifyingContext}}}
Use this extra context to make more precise and tailored outfit recommendations.
{{/if}}

Available Closet Items (with their names and descriptive tags):
{{#each closetItems}}
- Name: {{name}}, Tags: [{{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}]
{{/each}}

For each combination:
- Select one Top, one Bottom, and one Footwear item.
- Provide an individual match percentage for how well that specific outfit suits the occasion.
- Provide a brief rationale explaining why those items work together for this occasion.
- Order combinations from best match (highest percentage) to least match.
- Make each combination meaningfully different; avoid repeating the same items across combinations.

Your output must be a JSON object matching the specified schema. Only return items that exist in the provided list.`
});

const generateOutfitSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateOutfitSuggestionsFlow',
    inputSchema: GenerateOutfitSuggestionsInputSchema,
    outputSchema: GenerateOutfitSuggestionsOutputSchema,
  },
  async (input) => {
    const fallbackModels = [
      'googleai/gemini-2.5-pro',
      'googleai/gemini-pro-latest',
      'googleai/gemini-2.5-flash',
      'googleai/gemini-flash-latest',
      'googleai/gemini-2.0-flash'
    ];

    let lastError: any = null;

    for (const model of fallbackModels) {
      try {
        const { output } = await prompt(input, { model });
        return output!;
      } catch (error: any) {
        console.warn(`[AI Fallback] ${model} failed:`, error.message || error);
        lastError = error;
      }
    }

    // If loop finishes without returning, all models are exhausted
    let errorMessage = 'All AI models are temporarily exhausted due to high traffic limits. Please retry later.';

    if (lastError && lastError.message) {
      const match = lastError.message.match(/Please retry in ([\d\.]+s)/);
      if (match && match[1]) {
        errorMessage = `AI Quota Exhausted. Please retry in ${match[1]}.`;
      }
    }

    throw new Error(errorMessage);
  }
);

export async function generateOutfitSuggestions(input: GenerateOutfitSuggestionsInput): Promise<GenerateOutfitSuggestionsOutput> {
  return generateOutfitSuggestionsFlow(input);
}
