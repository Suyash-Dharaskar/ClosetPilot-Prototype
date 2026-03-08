'use server';
/**
 * @fileOverview A travel packing suggestions AI agent.
 *
 * - generatePackingSuggestions - A function that handles the packing suggestion generation process.
 * - GeneratePackingSuggestionsInput - The input type for the generatePackingSuggestions function.
 * - GeneratePackingSuggestionsOutput - The return type for the generatePackingSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClosetItemForAISchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
});

const GeneratePackingSuggestionsInputSchema = z.object({
  destination: z.string().describe('The travel destination.'),
  travelDates: z.string().describe('The travel dates, e.g., "Dec 1 - Dec 7".'),
  luggageLimit: z.string().describe('The declared luggage capacity (e.g., Backpack, Carry-On, Checked).'),
  mainVibes: z.array(z.string()).describe('The primary activities or themes for the trip.'),
  temperatureUnit: z.enum(['C', 'F']).describe('User preferred temperature unit.'),
  closetItems: z.array(ClosetItemForAISchema).describe("A list of clothing items available in the user's closet.")
});
export type GeneratePackingSuggestionsInput = z.infer<
  typeof GeneratePackingSuggestionsInputSchema
>;

const SuggestedPackingItemSchema = z.object({
  name: z.string().describe("The name of the clothing item from the user's closet."),
});

const PackingStrategySchema = z.object({
  strategyName: z.string().describe('Name of the packing strategy, e.g. "Light Packer", "Be Prepared", "Full Coverage".'),
  strategyDescription: z.string().describe('A one-line description of the strategy approach.'),
  mustHaveItems: z
    .array(SuggestedPackingItemSchema)
    .describe("A list of essential items from the user's closet to pack for this strategy."),
  niceToHaveItems: z
    .array(SuggestedPackingItemSchema)
    .describe("A list of optional, good-to-have items from the user's closet for this strategy."),
});

const GeneratePackingSuggestionsOutputSchema = z.object({
  weatherAlert: z
    .string()
    .describe('A brief summary of the weather forecast for the destination.'),
  strategies: z
    .array(PackingStrategySchema)
    .describe('2-3 different packing strategies, from minimal to comprehensive. Order from lightest to most prepared.'),
});
export type GeneratePackingSuggestionsOutput = z.infer<
  typeof GeneratePackingSuggestionsOutputSchema
>;

// Helper function to simulate weather fetching
async function getMockWeather(
  destination: string,
  travelDates: string,
  unit: 'C' | 'F'
): Promise<string> {
  const getTemp = (celsius: number) => {
    return unit === 'F' ? Math.round((celsius * 9 / 5) + 32) : celsius;
  };

  if (destination.toLowerCase().includes('manali')) {
    return `Forecast: ${getTemp(12)} ${unit} to ${getTemp(4)} ${unit}, partly cloudy with a chance of light snow.`;
  }
  if (destination.toLowerCase().includes('goa')) {
    return `Forecast: ${getTemp(34)} ${unit} to ${getTemp(26)} ${unit}, sunny and humid with occasional sea breeze.`;
  }
  if (destination.toLowerCase().includes('mumbai')) {
    return `Forecast: ${getTemp(32)} ${unit} to ${getTemp(24)} ${unit}, warm and humid.`;
  }
  return `Forecast: ${getTemp(25)} ${unit} to ${getTemp(15)} ${unit}, sunny with a light breeze.`;
}

const generatePackingSuggestionsPrompt = ai.definePrompt({
  name: 'generatePackingSuggestionsPrompt',
  input: {
    schema: GeneratePackingSuggestionsInputSchema.extend({
      weatherInfo: z
        .string()
        .describe('The current weather forecast for the destination.'),
    }),
  },
  output: { schema: GeneratePackingSuggestionsOutputSchema },
  prompt: `You are an AI travel assistant specialized in packing suggestions. Your task is to create 2-3 different packing strategies by selecting items from the user's available closet.

Destination: {{{destination}}}
Travel Dates: {{{travelDates}}}
Weather Information: {{{weatherInfo}}}
Luggage Limit: {{{luggageLimit}}}
Main Trip Vibes: [{{#each mainVibes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}]

Available Closet Items (with their names and descriptive tags):
{{#each closetItems}}
- Name: {{name}}, Tags: [{{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}]
{{/each}}

Create exactly 3 different packing strategies ordered from lightest to most prepared:
1. "Light Packer" — Minimal essentials only, strictly adhering to the {{{luggageLimit}}} capacity constraints. Optimize heavily for the requested vibes.
2. "Smart Traveler" — A balanced mix of essentials and versatile pieces perfectly tailored for the requested trip vibes.
3. "Be Prepared" — Comprehensive packing for any situation while honoring the requested themes.

CRITICAL INSTRUCTIONS:
- You must carefully consider the "Main Trip Vibes" and select outfits/items that match these activities (e.g. if nightlife, include going-out clothes).
- You must respect the "Luggage Limit" constraint. "Backpack" means strictly fewer items than "Checked".
- For EACH strategy, select appropriate "Must Have" (essential) and "Nice to Have" (optional) items from the user's closet.
- Also, provide a concise but informative weather alert.
- IMPORTANT: Only return items that exist in the provided closet list. Use the exact item names from the list.`,
});

const generatePackingSuggestionsFlow = ai.defineFlow(
  {
    name: 'generatePackingSuggestionsFlow',
    inputSchema: GeneratePackingSuggestionsInputSchema,
    outputSchema: GeneratePackingSuggestionsOutputSchema,
  },
  async input => {
    const weatherInfo = await getMockWeather(
      input.destination,
      input.travelDates,
      input.temperatureUnit
    );

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
        const { output } = await generatePackingSuggestionsPrompt(
          {
            ...input,
            weatherInfo,
          },
          { model }
        );
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

export async function generatePackingSuggestions(
  input: GeneratePackingSuggestionsInput
): Promise<GeneratePackingSuggestionsOutput> {
  return generatePackingSuggestionsFlow(input);
}
