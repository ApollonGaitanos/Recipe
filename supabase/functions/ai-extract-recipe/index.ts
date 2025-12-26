
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
        const { text, imageBase64, imageType } = await req.json()

        // Validate presence of EITHER text OR image
        if ((!text || typeof text !== 'string' || text.trim().length < 10) && !imageBase64) {
            throw new Error('Please provide recipe text (at least 10 chars) or an image.')
        }

        // 3. API Configuration
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('Gemini API key not configured')
        }

        // Using gemini-flash-latest as it is the confirmed available model alias
        // Using v1beta endpoint with x-goog-api-key header
        const MODEL_NAME = 'gemini-flash-latest';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

        // 4. API Request Construction
        const systemPrompt = `You are a professional recipe formatter. Extract and CLEAN UP this recipe text into a polished, professional format.

Return ONLY valid JSON with this exact structure:
{
  "title": "Professional Recipe Title",
  "ingredients": "2 cups all-purpose flour\\n1 cup granulated sugar",
  "instructions": "Preheat oven to 350°F (175°C).\\nMix ingredients.",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 8,
  "tags": "dessert, cake"
}

IMPORTANT FORMATTING RULES:
1. **Title**: Make it proper and appetizing.
2. **Ingredients**: One per line, standard measurements, remove casual language.
3. **Instructions**: One clear step per line, start with verbs, remove casual language.
4. **Times**: In minutes (0 if missing).
5. **Servings**: Number (0 if missing).
6. **Tags**: Relevant categories.
7. **LANGUAGE**: Detect the language of the input text (e.g., Greek, English) and generate the **Title**, **Ingredients**, and **Instructions** IN THAT SAME LANGUAGE. Do not translate unless explicitly asked.

Recipe to format:`;

        const parts = [{ text: systemPrompt }];

        // Add User Text if provided
        if (text) {
            parts.push({ text: `\n\n${text}` });
        }

        // Add Image if provided
        if (imageBase64) {
            parts.push({
                inlineData: {
                    mimeType: imageType || "image/jpeg",
                    data: imageBase64
                }
            });
        }

        const payload = {
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: "application/json"
            }
        };


        // 5. API Call
        console.log(`Sending request to ${MODEL_NAME}...`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(payload)
        });

        // 6. Error Handling
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            throw new Error(`Gemini API Failed (${response.status}): ${errorText}`);
        }

        const data = await response.json();

        // 7. Response Parsing
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

        // validate minimal structure
        if (!recipeData.title) {
            throw new Error('AI response missing title');
        }

        // 8. Success Response
        return new Response(JSON.stringify({
            ...recipeData,
            prepTime: parseInt(recipeData.prepTime) || 0,
            cookTime: parseInt(recipeData.cookTime) || 0,
            servings: parseInt(recipeData.servings) || 0,
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
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
});
