
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    // 1. CORS Handling
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {

        // 2. Input Parsing
        const { text, imageBase64, imageType, url, targetLanguage, mode } = await req.json()

        // Validate presence of EITHER text OR image OR url
        if ((!text || typeof text !== 'string' || text.trim().length < 10) && !imageBase64 && !url) {
            throw new Error('Please provide recipe text, an image, or a URL.')
        }

        // 3. API Configuration
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('Gemini API key not configured')
        }

        // 6. API Call with Fallback Logic
        // We will try these models in order. 
        // Strategy: High Limit -> specific versions -> experimental -> legacy
        const MODELS_TO_TRY = [
            'gemini-3-flash-preview',     // Newest Flash (Fast & Capable)
            'gemini-3-pro-preview',       // Newest Pro (High Reasoning)
            'gemini-1.5-flash',           // Standard Alias (High Quota usually)
            'gemini-1.5-flash-latest',    // Explicit latest
            'gemini-1.5-flash-001',       // Specific stable version
            'gemini-1.5-flash-002',       // Specific updated version
            'gemini-1.5-flash-8b',        // Lightweight 8b variant
            'gemini-2.0-flash-exp',       // Experimental 2.0 (often free)
            'gemini-1.0-pro'              // Legacy fallback
        ];

        let lastError = null;
        let successfulModel = null;
        let responseData = null;

        for (const model of MODELS_TO_TRY) {
            try {
                console.log(`Attempting model: ${model}...`);
                const CURRENT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

                const response = await fetch(CURRENT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const status = response.status;
                    const errorText = await response.text();

                    // If Quota (429) or Not Found (404), continue to next model
                    if (status === 429 || status === 404) {
                        console.warn(`Model ${model} failed (${status}). Trying next... Error: ${errorText.substring(0, 200)}`);
                        lastError = new Error(`Model ${model} failed (${status}): ${errorText}`);
                        continue;
                    }

                    // Other errors (500, 400 bad request) might be fatal, but let's try others just in case it's model specific
                    console.warn(`Model ${model} encountered error ${status}. Retrying...`);
                    lastError = new Error(`Model ${model} failed (${status}): ${errorText}`);
                    continue;
                }

                const data = await response.json();

                // Validate content existence before declaring success
                if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.warn(`Model ${model} returned empty content. Trying next...`);
                    lastError = new Error(`Model ${model} returned invalid structure.`);
                    continue;
                }

                responseData = data;
                successfulModel = model;
                console.log(`Success! Using model: ${model}`);
                break; // Exit loop on success

            } catch (err) {
                console.error(`Unexpected error with ${model}:`, err.message);
                lastError = err;
                // Continue to next model
            }
        }

        if (!responseData || !successfulModel) {
            console.error('All models failed.');
            throw lastError || new Error('All available AI models failed to respond.');
        }

        const data = responseData;

        // Data is already parsed in the loop

        // 8. Response Parsing
        const candidate = data.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts?.[0]?.text) {
            console.error('Invalid Gemini Response:', JSON.stringify(data));
            throw new Error(`Gemini returned an empty or invalid response. Raw data: ${JSON.stringify(data)}`);
        }

        let aiText = candidate.content.parts[0].text.trim();

        // Extract JSON using regex from first { to last }
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in response:', aiText);
            throw new Error(`AI response did not contain valid JSON structure. Raw output: ${aiText.substring(0, 500)}...`);
        }

        const jsonString = jsonMatch[0];

        let recipeData;
        try {
            recipeData = JSON.parse(jsonString);
        } catch (e) {
            console.error('JSON Parse Error. Raw text:', jsonString);
            throw new Error(`Failed to parse AI response as JSON. Raw output: ${jsonString.substring(0, 500)}...`);
        }

        // Check for specific error from AI
        if (recipeData.error) {
            throw new Error(recipeData.error);
        }

        // validate minimal structure
        if (!recipeData.title) {
            throw new Error('AI response missing title');
        }

        // HELPER: Join arrays to strings for Frontend
        const formatParam = (param) => {
            if (Array.isArray(param)) return param.join('\n');
            return param || '';
        };

        // 9. Success Response
        return new Response(JSON.stringify({
            title: recipeData.title,
            ingredients: formatParam(recipeData.ingredients),
            instructions: formatParam(recipeData.instructions),
            prepTime: parseInt(recipeData.prepTime) || 0,
            cookTime: parseInt(recipeData.cookTime) || 0,
            servings: parseInt(recipeData.servings) || 0,
            tags: recipeData.tags || ''
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Edge Function Error:', error.message);
        return new Response(JSON.stringify({
            error: error.message || 'Internal Server Error'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                // CORS Headers for Error Response too
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});
