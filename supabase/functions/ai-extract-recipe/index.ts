
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
        const { text, imageBase64, imageType, url, targetLanguage } = await req.json()

        // Validate presence of EITHER text OR image OR url
        if ((!text || typeof text !== 'string' || text.trim().length < 10) && !imageBase64 && !url) {
            throw new Error('Please provide recipe text, an image, or a URL.')
        }

        // 3. API Configuration
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('Gemini API key not configured')
        }

        // Using gemini-2.5-flash-lite as the definitive free-tier model (1,000 req/day).
        // 'flash' models have restricted quotas (20/day). '2.0-flash' is paid.
        const MODEL_NAME = 'gemini-2.5-flash-lite';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

        // 4. Input Processing
        let processingText = text || '';

        // If URL provided, fetch and scrape text
        if (url) {
            console.log(`Fetching URL: ${url}`);
            try {
                // Use a realistic browser User-Agent to avoid simple 403 blocks
                const urlResp = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5'
                    }
                });

                if (!urlResp.ok) throw new Error(`Failed to fetch URL (${urlResp.status} ${urlResp.statusText})`);

                const html = await urlResp.text();

                // Simple HTML-to-Text cleanup
                // 1. Remove scripts and styles
                let cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");

                // 2. Remove tags (keep newlines)
                cleanHtml = cleanHtml.replace(/<\/(div|p|h\d|li|br)>/gim, "\n");
                // Remove all other tags
                processingText = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

                // ANTI-HALLUCINATION CHECK
                // If content is too short, it's likely a captcha, login page, or error.
                // Gemini will hallucinate cookies if given empty text.
                if (processingText.length < 500) {
                    console.error("URL Content too short:", processingText);
                    throw new Error("Could not read recipe content (Page blocked or empty). Try pasting the recipe text instead.");
                }

                // Truncate if too long
                if (processingText.length > 30000) {
                    processingText = processingText.substring(0, 30000);
                }

                console.log(`Extracted ${processingText.length} chars from URL.`);

            } catch (fetchErr) {
                throw new Error(`URL Processing Failed: ${fetchErr.message}`);
            }
        }

        const systemPrompt = `You are a PRECISE DATA EXTRACTOR. Your job is to extract recipe data exactly as it appears in the source, but FORMATTED correctly.

RULES:
1. **CONTENT INTEGRITY**: DO NOT change ingredient names or quantities. DO NOT add "salt and pepper" if not listed. DO NOT invent steps.
2. **FORMATTING REPAIR**: You MUST fix broken layout.
    - If instructions are a single block of text, split them into numbered steps.
    - If ingredients are a comma-separated list, split them into newlines.
    - Fix capitalization and spacing.

Return ONLY valid JSON with this exact structure:
{
  "title": "Exact Title from Source",
  "ingredients": "Ingredient 1\\nIngredient 2",
  "instructions": "1. Step one.\\n2. Step two.",
  "prepTime": 0,
  "cookTime": 0,
  "servings": 0,
  "tags": "tag1, tag2"
}

IMPORTANT:
- **NO HALLUCINATIONS**: If input has no recipe, return {"error": "No recipe content found"}.
- **LANGUAGE LOGIC**:
   - Source is Greek -> Output Greek.
   - Source is English -> Output English.
   - Source is Other -> Translate to **${targetLanguage || 'English'}**.

Recipe to extract:`;

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

        // Add URL Text if provided
        if (url && processingText) {
            parts.push({ text: `\n\n${processingText}` });
        }

        const payload = {
            contents: [{ parts }],
            generationConfig: {
                temperature: 0.1, // Very low temp for precision
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

        // Check for specific error from AI
        if (recipeData.error) {
            throw new Error(recipeData.error);
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
