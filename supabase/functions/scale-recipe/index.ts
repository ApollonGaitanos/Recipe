import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini } from "../_shared/gemini.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ingredients, currentServings, targetServings } = await req.json();

        if (!ingredients || !currentServings || !targetServings) {
            throw new Error('Missing required fields: ingredients, currentServings, targetServings');
        }

        if (currentServings <= 0 || targetServings <= 0) {
            throw new Error('Servings must be positive numbers');
        }

        const scalingFactor = targetServings / currentServings;

        // AI prompt for intelligent scaling
        const systemInstruction = `You are a recipe scaling AI. Scale ingredient quantities accurately.

Rules:
- Multiply all quantities by exactly ${scalingFactor}
- Preserve units (cups, tbsp, tsp, oz, g, ml, etc.)
- Handle fractions intelligently (e.g., 1/2 cup → 3/4 cup if scaling by 1.5)
- Round to practical measurements (e.g., 1.33 cups → 1 1/3 cups)
- For "pinch", "dash", "to taste" - keep as-is or scale minimally
- Maintain original formatting (one ingredient per line)
- Do NOT add explanations, return ONLY the scaled ingredient list`;

        const prompt = `Original servings: ${currentServings}
Target servings: ${targetServings}
Scaling factor: ${scalingFactor}

Scale these ingredients:
${ingredients}`;

        const scaledIngredients = await callGemini(prompt, systemInstruction);

        // Clean up the response (remove any markdown formatting)
        const cleanedIngredients = scaledIngredients
            .replace(/```.*?\n/g, '')
            .replace(/```/g, '')
            .trim();

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    scaledIngredients: cleanedIngredients,
                    scalingFactor: scalingFactor.toFixed(2)
                }
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Scale recipe error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to scale recipe'
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );
    }
});
