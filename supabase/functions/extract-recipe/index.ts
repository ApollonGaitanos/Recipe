import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini, parseJSONResponse } from "../_shared/gemini.ts";

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
        const { source, type } = await req.json();

        if (!source || !type) {
            throw new Error('Missing required fields: source and type');
        }

        let content = source;

        // If it's a URL, fetch the content
        if (type === 'url') {
            try {
                const response = await fetch(source);
                content = await response.text();
            } catch (error) {
                throw new Error(`Failed to fetch URL: ${error.message}`);
            }
        }

        // AI prompt for recipe extraction
        const systemInstruction = `You are a recipe extraction AI. Extract recipe information from the provided text and return ONLY a valid JSON object with this exact structure:
{
  "title": "Recipe Name",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "ingredients": "1 cup flour\\n2 eggs\\n1 tsp salt",
  "instructions": "Step 1: Mix flour\\nStep 2: Add eggs\\nStep 3: Bake",
  "tags": ["dinner", "easy"]
}

Rules:
- Times in minutes (numbers only)
- Ingredients: one per line, separated by \\n
- Instructions: numbered steps, separated by \\n
- Tags: array of relevant keywords
- If information is missing, use reasonable defaults
- Return ONLY the JSON, no explanation`;

        const prompt = `Extract recipe from this content:\n\n${content.slice(0, 8000)}`; // Limit to 8000 chars

        const aiResponse = await callGemini(prompt, systemInstruction);
        const recipeData = parseJSONResponse(aiResponse);

        // Validate required fields
        if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
            throw new Error('AI failed to extract required recipe fields');
        }

        return new Response(
            JSON.stringify({ success: true, data: recipeData }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Extract recipe error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to extract recipe'
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
