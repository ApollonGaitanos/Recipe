
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

        // 4. Input Processing
        let processingText = text || '';

        // If URL provided, fetch and scrape text
        // Only fetch URL if we are in 'extract' mode or if specific URL is given for other modes (rare)
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

        // 5. Construct Prompt based on MODE (default: extract)
        const selectedMode = mode || 'extract';
        let systemPrompt = "";
        let temperature = 0.1;

        const jsonStructure = `
Return ONLY valid JSON with this exact structure:
{
  "title": "Exact Title",
  "ingredients": [
    {"amount": "1 κ.σ.", "name": "Ελαιόλαδο"},
    {"amount": "200γρ", "name": "Αλεύρι"}
  ],
  "instructions": ["Step one.", "Step two.", "Step three."],
  "prepTime": 0,
  "cookTime": 0,
  "servings": 0,
  "tags": ["tag1", "tag2"]
}

RULES:
- "tags": Array of strings (e.g. ["dinner", "italian", "healthy"]).
- "ingredients": Array of OBJECTS. "amount" must include number AND unit (e.g. "1 tbsp", "150g"). "name" is the ingredient name. The UNIT itself must be in the target language (e.g. "tbsp" -> "κ.σ.", "g" -> "γρ").
- "instructions": Array of strings. Each string is ONE step. NO numbering.
- SPLIT instructions into distinct steps.
- DO NOT return "tags" as a single comma-separated string. IT MUST BE AN ARRAY.
- Returns only valid JSON.`;

        switch (selectedMode) {
            case 'create':
                temperature = 0.8; // High Creativity for detailed, rich content
                systemPrompt = `You are a WORLD-CLASS EXPERT CHEF known for highly-rated, crowd-pleasing recipes.
Your goal is to create the MOST POPULAR and WIDELY USED version of the requested dish.

RULES:
1. **POPULARITY FIRST**: Default to the version most people know and cook (e.g. the "standard" version). Do NOT prioritize strict historical authenticity unless the user specifically asks for "authentic" or "traditional".
2. **RICH DETAIL**:
   - **Ingredients**: Be specific (e.g., "San Marzano Tomatoes" instead of "Tomatoes").
   - **Instructions**: Write distinct, detailed steps. Explain *why* (e.g., "Sauté until golden to release aromatics"). Avoid generic brevity.
3. **Language**: Detect the language of the User Input. The Output MUST be in the SAME language as the User Input. This includes MEASUREMENT UNITS (e.g. usage 'γρ' instead of 'g' for Greek).
${jsonStructure}`;
                break;

            case 'improve':
                temperature = 0.4; // Slightly Creative
                systemPrompt = `You are a MICHELIN CONSULTANT. Analyze the provided recipe and IMPROVE it.
RULES:
1. Fix errors, inconsistencies, or unclear steps.
2. Suggest better techniques or essential missing ingredients (e.g. balancing acid/salt).
3. Do NOT change the core identity of the dish.
4. Language: Keep the original language of the recipe.
${jsonStructure}`;
                break;

            case 'translate':
                temperature = 0.1; // Strict
                systemPrompt = `You are a PROFESSIONAL TRANSLATOR. Translate the recipe to **${targetLanguage === 'el' ? 'Greek' : 'English'}**.
RULES:
1. Translate Title, Ingredients, Instructions, and Tags.
2. Convert measurements to metric if appropriate for the target language (e.g. cups to grams for EU/Greek). TRANSLATE THE UNIT NAME ITSELF (e.g. 'cups' -> 'φλιτζάνια', 'oz' -> 'γρ').
3. Keep the exact same meaning.
${jsonStructure}`;
                break;

            case 'extract':
            default:
                temperature = 0.1; // Strict
                systemPrompt = `You are a PRECISE DATA EXTRACTOR. Your job is to extract recipe data exactly as it appears in the source, but FORMATTED correctly.

RULES:
1. **CONTENT INTEGRITY**: DO NOT change ingredient names or quantities. DO NOT add "salt and pepper" if not listed. DO NOT invent steps.
2. **FORMATTING REPAIR (AGGRESSIVE)**:
    - **Instructions**: **SPLIT BLOCKS OF TEXT.** If a paragraph contains multiple steps (e.g. "Mix flour. Then add sugar."), you MUST split them into separate strings in the array.
    - **Ingredients**: Split into a clean list of strings.
    - **DO NOT NUMBER** the output strings.
    - **Language Logic**:
       - Source is Greek -> Output Greek.
       - Source is English -> Output English.
       - Source is Other -> Translate to **${targetLanguage || 'English'}**.

${jsonStructure}

IMPORTANT:
- **NO HALLUCINATIONS**: If input has no recipe, return {"error": "No recipe content found"}.`;
                break;
        }

        const parts = [{ text: systemPrompt }];

        // Add User Text/Context
        if (text) {
            const label = selectedMode === 'improve' || selectedMode === 'translate' ? "Recipe Context:" : "User Input:";
            parts.push({ text: `\n\n${label} ${text}` });
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
            parts.push({ text: `\n\nWebsite Content: ${processingText}` });
        }

        const payload = {
            contents: [{ parts }],
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: 4096,
                responseMimeType: "application/json"
            }
        };

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

        // SANITIZATION:
        // 1. Remove Markdown code blocks if regex didn't catch them
        let cleanJson = jsonString.replace(/```json/g, '').replace(/```/g, '');

        // 2. Remove Trailing Commas (Common AI mistake)
        // Replaces ", }" with "}" and ", ]" with "]"
        cleanJson = cleanJson.replace(/,(\s*[}\]])/g, '$1');

        // 3. Fix unescaped newlines in strings (rare but happens)
        // This is risky with regex, sticking to comma fix for now.

        let recipeData;
        try {
            recipeData = JSON.parse(cleanJson);
        } catch (e) {
            console.error('JSON Parse Error. Data:', cleanJson);

            // Fallback: Try a more aggressive cleanup or use a loose parser if available
            // For now, throw details
            throw new Error(`Failed to parse AI response as JSON. Error: ${e.message}. Cleaned output: ${cleanJson.substring(0, 500)}...`);
        }

        // Check for specific error from AI
        if (recipeData.error) {
            throw new Error(recipeData.error);
        }

        // validate minimal structure
        if (!recipeData.title) {
            throw new Error('AI response missing title');
        }

        // HELPER: Join arrays to strings for Frontend (Instructions only)
        const formatInstructions = (param) => {
            if (Array.isArray(param)) return param.join('\n');
            return param || '';
        };

        // 9. Success Response
        return new Response(JSON.stringify({
            title: recipeData.title,
            ingredients: recipeData.ingredients, // Return structured array directly
            instructions: formatInstructions(recipeData.instructions),
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
