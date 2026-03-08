'use server';
/**
 * @fileOverview A Genkit flow for processing a scanned clothing item.
 * It attempts to remove the background, suggests a name, and generates relevant tags.
 * It also detects if multiple items are in the image.
 *
 * - processClothingItem - A function that handles the item processing.
 * - ProcessClothingItemInput - The input type for the function.
 * - ProcessClothingItemOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessClothingItemInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a clothing item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  selectedItemName: z
    .string()
    .optional()
    .describe("If the user selected a specific item from a multi-item detection, this is the item name to focus on."),
});
export type ProcessClothingItemInput = z.infer<
  typeof ProcessClothingItemInputSchema
>;

const ProcessClothingItemOutputSchema = z.object({
  processedPhotoDataUri: z
    .string()
    .describe('The data URI of the clothing item (background removed if possible, otherwise original).'),
  itemName: z.string().describe('A suggested name for the clothing item.'),
  tags: z
    .array(z.string())
    .describe(
      "An array of suggested tags for the item, in ALL CAPS, starting with '#'."
    ),
  multipleItemsDetected: z
    .boolean()
    .describe('Whether multiple distinct clothing items were detected in the image.'),
  detectedItems: z
    .array(z.string())
    .optional()
    .describe('If multiple items detected, list of item names found in the image.'),
});
export type ProcessClothingItemOutput = z.infer<
  typeof ProcessClothingItemOutputSchema
>;

const processClothingItemFlow = ai.defineFlow(
  {
    name: 'processClothingItemFlow',
    inputSchema: ProcessClothingItemInputSchema,
    outputSchema: ProcessClothingItemOutputSchema,
  },
  async ({ photoDataUri, selectedItemName }) => {
    // Step 1: Generate name and tags using gemini-2.5-flash
    const focusInstruction = selectedItemName
      ? `\nIMPORTANT: The user has selected "${selectedItemName}" as the item of interest. Focus ONLY on that item for naming and tagging. Ignore other items in the image.`
      : '';

    const fallbackModels = [
      'googleai/gemini-2.5-pro',
      'googleai/gemini-pro-latest',
      'googleai/gemini-2.5-flash',
      'googleai/gemini-flash-latest',
      'googleai/gemini-2.0-flash'
    ];

    let taggingResponse: any = null;
    let lastError: any = null;

    for (const model of fallbackModels) {
      try {
        taggingResponse = await ai.generate({
          model: model,
          prompt: [
            { media: { url: photoDataUri } },
            {
              text: `Analyze the clothing item(s) and accessories in this image.${focusInstruction}

FIRST, determine if the image contains MULTIPLE DISTINCT clothing items OR accessories. 
- Accessories like sunglasses, hats, watches, bags, and jewelry COUNT as distinct items.
- A person wearing a shirt AND sunglasses = MULTIPLE items.
- A single outfit on a person = count individual pieces (e.g., shirt + pants = MULTIPLE).
- A jacket with a visible shirt underneath = MULTIPLE.
- One standalone clothing piece or one single accessory = SINGLE item.

Provide a JSON response with:
1. "multipleItemsDetected": true/false — whether 2+ distinct items (including accessories) are visible.
2. "detectedItems": ["item1 name", "item2 name", ...] — list ALL distinct items found (only if multipleItemsDetected is true). Be specific (e.g., "Blue Tank Top", "Black Sunglasses").
3. "itemName": A short name for the PRIMARY item (or the selected item if specified), following this format: Color + Attribute (if applicable) + Item Type.
   - Keep names SHORT (2-4 words max).
   - Color MUST come first.
   - Examples: "Blue Denim Jacket", "Black Sunglasses", "White Linen Shirt".
4. "tags": 4-6 relevant tags for the primary item.

Tags should be in ALL CAPS starting with '#'. Include tags for:
- Color (e.g., #BLUE, #BLACK, #WHITE)
- Type (e.g., #SHIRT, #PANTS, #SUNGLASSES, #ACCESSORIES)
- Material if apparent (e.g., #DENIM, #LEATHER, #METAL)
- Style (e.g., #CASUAL, #FORMAL, #SPORTSWEAR)
- Season/Weather (e.g., #SUMMER, #WINTER)

JSON format: {"multipleItemsDetected": boolean, "detectedItems": ["string"], "itemName": "string", "tags": ["string"]}
Return ONLY the JSON, no markdown code blocks.`,
            },
          ],
        });
        break; // Success, exit loop
      } catch (error: any) {
        console.warn(`[AI Fallback] ${model} failed:`, error.message || error);
        lastError = error;
      }
    }

    if (!taggingResponse) {
      let errorMessage = 'All AI models are temporarily exhausted due to high traffic limits. Please retry later.';
      if (lastError && lastError.message) {
        const match = lastError.message.match(/Please retry in ([\d\.]+s)/);
        if (match && match[1]) {
          errorMessage = `AI Quota Exhausted. Please retry in ${match[1]}.`;
        }
      }
      throw new Error(errorMessage);
    }

    if (!taggingResponse.text) {
      throw new Error('Failed to generate name and tags.');
    }

    let taggingOutput;
    try {
      const jsonString = taggingResponse.text.replace(/```json\n?/, '').replace(/```$/, '').trim();
      taggingOutput = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse JSON:', taggingResponse.text, e);
      throw new Error('Failed to parse name and tags from AI.');
    }

    // If multiple items detected AND no item was selected yet, return early with the detected items list
    if (taggingOutput.multipleItemsDetected && !selectedItemName && taggingOutput.detectedItems?.length > 1) {
      return {
        processedPhotoDataUri: photoDataUri,
        itemName: taggingOutput.itemName || 'Multiple Items',
        tags: taggingOutput.tags || [],
        multipleItemsDetected: true,
        detectedItems: taggingOutput.detectedItems,
      };
    }

    // Step 2: Attempt background removal using gemini-2.5-flash-image
    let processedImageUri = photoDataUri;
    try {
      const imageResponse = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image',
        prompt: [
          { media: { url: photoDataUri } },
          {
            text: `Remove the background from this image. Extract ONLY the specific clothing item or accessory${selectedItemName ? ` "${selectedItemName}"` : ''} and place it on a pure white background. Remove any other people, body parts, hangers, mannequins, or unrelated objects. Show just the requested item displayed cleanly on white.`,
          },
        ],
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      if (imageResponse.media?.url) {
        processedImageUri = imageResponse.media.url;
        console.log('Background removal successful.');
      }
    } catch (imageError) {
      console.warn('Background removal unavailable (quota/model issue). Using original photo.', imageError);
    }

    return {
      processedPhotoDataUri: processedImageUri,
      itemName: taggingOutput.itemName,
      tags: taggingOutput.tags,
      multipleItemsDetected: false,
      detectedItems: undefined,
    };
  }
);

export async function processClothingItem(
  input: ProcessClothingItemInput
): Promise<ProcessClothingItemOutput> {
  return processClothingItemFlow(input);
}
