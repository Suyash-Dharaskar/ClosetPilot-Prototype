'use server';
/**
 * @fileOverview A Genkit flow for generating MECE clarifying questions
 * based on an occasion, to help the AI stylist make better outfit suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateClarifyingQuestionsInputSchema = z.object({
    occasion: z.string().describe("The occasion described by the user, e.g., 'coffee date', 'job interview'."),
});
export type GenerateClarifyingQuestionsInput = z.infer<typeof GenerateClarifyingQuestionsInputSchema>;

const ClarifyingQuestionSchema = z.object({
    id: z.string().describe("A short unique ID for the question, e.g., 'time_of_day', 'weather'."),
    question: z.string().describe("A short, conversational clarifying question."),
    emoji: z.string().describe("A single relevant emoji for the question."),
    options: z.array(z.string()).min(2).max(5).describe("2-5 short chip options for the user to pick from."),
});

const GenerateClarifyingQuestionsOutputSchema = z.object({
    questions: z.array(ClarifyingQuestionSchema).min(3).max(4).describe("3-4 MECE clarifying questions to better understand the occasion context."),
});
export type GenerateClarifyingQuestionsOutput = z.infer<typeof GenerateClarifyingQuestionsOutputSchema>;

const prompt = ai.definePrompt({
    name: 'generateClarifyingQuestionsPrompt',
    input: { schema: GenerateClarifyingQuestionsInputSchema },
    output: { schema: GenerateClarifyingQuestionsOutputSchema },
    prompt: `You are an expert personal stylist. The user wants outfit suggestions for: "{{{occasion}}}"

Generate exactly 3-4 MECE (Mutually Exclusive, Collectively Exhaustive) clarifying questions that will help you make BETTER outfit recommendations. Each question should have 2-5 short chip options.

Think about what matters for dressing well:
- Time of day (affects formality, lighting)
- Weather/temperature (affects layering, fabric)
- Setting/venue (indoor, outdoor, upscale, casual)
- Vibe/mood they want to project (relaxed, impressive, trendy, classic)

Keep questions SHORT and conversational. Keep chip options to 1-3 words each.
Each question needs a relevant emoji.

Example for "coffee date":
- ☀️ "What time of day?" → ["Morning", "Afternoon", "Evening"]
- 🌡️ "How's the weather?" → ["Hot", "Warm", "Cool", "Cold"]
- 📍 "What kind of place?" → ["Cozy cafe", "Outdoor", "Upscale lounge"]
- ✨ "What vibe?" → ["Casual", "Smart casual", "Trendy"]`,
});

const generateClarifyingQuestionsFlow = ai.defineFlow(
    {
        name: 'generateClarifyingQuestionsFlow',
        inputSchema: GenerateClarifyingQuestionsInputSchema,
        outputSchema: GenerateClarifyingQuestionsOutputSchema,
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

export async function generateClarifyingQuestions(
    input: GenerateClarifyingQuestionsInput
): Promise<GenerateClarifyingQuestionsOutput> {
    return generateClarifyingQuestionsFlow(input);
}
