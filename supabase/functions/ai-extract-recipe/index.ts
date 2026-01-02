
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

        if (url) {
            console.log(`Fetching URL: ${url}`);

            // Strategy:
            // 1. Try Jina.ai Reader (Best for LLMs, handles content extraction)
            // 2. Try Direct Fetch (Fastest if it works)
            // 3. Try AllOrigins (Proxy for simple CORS/403 blocks)

            try {
                // 1. Jina AI Reader
                console.log("Attempting Jina AI Reader...");
                const jinaApiKey = Deno.env.get('JINA_API_KEY');
                const jinaHeaders = {
                    'User-Agent': 'RecipeApp/1.0',
                    'Accept': 'text/plain'
                };
                if (jinaApiKey) {
                    jinaHeaders['Authorization'] = `Bearer ${jinaApiKey}`;
                }

                const jinaResp = await fetch(`https://r.jina.ai/${url}`, {
                    headers: jinaHeaders
                });

                if (jinaResp.ok) {
                    const jinaText = await jinaResp.text();
                    // Jina returns "Title\n\nURL\n\nContent..."
                    if (jinaText.length > 200 && !jinaText.includes("Cloudflare") && !jinaText.includes("Verify you are human")) {
                        processingText = jinaText;
                        console.log(`Jina AI success: ${processingText.length} chars.`);
                    } else {
                        throw new Error("Jina returned captcha or empty content");
                    }
                } else {
                    throw new Error(`Jina failed: ${jinaResp.status}`);
                }

            } catch (jinaError) {
                console.warn(`Jina Reader failed (${jinaError.message}). Falling back...`);

                try {
                    // 2. Direct Fetch (Fallback)
                    console.log("Attempting Direct Fetch...");
                    const urlResp = await fetch(url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5'
                        }
                    });

                    if (!urlResp.ok) throw new Error(`Direct fetch failed: ${urlResp.status}`);

                    const htmlContent = await urlResp.text();

                    // Cleanup HTML
                    let cleanHtml = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
                    cleanHtml = cleanHtml.replace(/<\/(div|p|h\d|li|br)>/gim, "\n");
                    processingText = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

                } catch (directError) {
                    console.warn(`Direct fetch failed (${directError.message}). Trying AllOrigins...`);

                    try {
                        // 3. AllOrigins Proxy (Last Resort)
                        const proxyResp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                        if (!proxyResp.ok) throw new Error("Proxy response not OK");

                        const proxyData = await proxyResp.json();
                        if (!proxyData.contents) throw new Error("Proxy returned no content");

                        let cleanHtml = proxyData.contents.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");
                        cleanHtml = cleanHtml.replace(/<\/(div|p|h\d|li|br)>/gim, "\n");
                        processingText = cleanHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

                    } catch (proxyError) {
                        // If all fail, we proceed with empty text. 
                        // The AI prompt will catch it and return "No recipe content found".
                        console.error(`All fetch methods failed. Error: ${proxyError.message}`);
                    }
                }
            }

            // Global Length Check / Truncation
            if (processingText) {
                if (processingText.length > 30000) {
                    processingText = processingText.substring(0, 30000);
                }
                console.log(`Final Extracted Text Length: ${processingText.length}`);
            }
        }

        // 5. Construct Prompt based on MODE (default: extract)
        const selectedMode = mode || 'extract';
        let systemPrompt = "";
        let temperature = 0.1;

        const jsonStructure = `
Return the output in this strict JSON structure:
{
  "title": "Recipe Title",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["tag1", "tag2"],
  "ingredients": [
    { "amount": "200g", "name": "Flour" }
  ],
  "instructions": [
    "Step 1 text",
    "Step 2 text"
  ],
  "detectedLanguage": "en" 
}
- "detectedLanguage": The ISO 639-1 code (e.g. "en", "el", "fr") of the language the recipe is written in.
- "title": String.
- "prepTime", "cookTime", "servings": Integer numbers only (in minutes). Calculate totals if ranges are given. Attempt to infer from text if missing.
- "tags": Array of strings (e.g. ["dinner", "italian", "healthy"]).
- "ingredients": Array of OBJECTS. "amount" must include number AND unit (e.g. "1 tbsp", "150g"). "name" is the ingredient name. The UNIT itself must be in the target language (e.g. "tbsp" -> "κ.σ.", "g" -> "γρ").
- "instructions": Array of strings. Each string is ONE step. NO numbering.
- SPLIT instructions into distinct steps.
- Returns only valid JSON.`;

        switch (selectedMode) {
            case 'create':
                temperature = 0.8; // High Creativity for detailed, rich content
                systemPrompt = `You are a WORLD-CLASS EXPERT CHEF known for highly-rated, crowd-pleasing recipes.
Your goal is to create the MOST POPULAR and WIDELY USED version of the requested dish.

RULES:
1. **POPULARITY FIRST**: Default to the version most people know and cook.
2. **RICH DETAIL**: Be specific with ingredients (e.g., "San Marzano Tomatoes") and explain *why* in steps.
3. **LANGUAGE**: Detect the language of the User Input. The Output MUST be in the SAME language.

EXAMPLE:
Input: "Spaghetti Carbonara"
Output: { "title": "Spaghetti Carbonara", "ingredients": [{"amount": "200g", "name": "Guanciale"}], "instructions": ["Cook guanciale until crispy..."] }

Input: "Σπαγγέτι Καρμπονάρα"
Output: { "title": "Σπαγγέτι Καρμπονάρα", "ingredients": [{"amount": "200γρ", "name": "Γκουαντσιάλε"}], "instructions": ["Μαγειρέψτε το γκουαντσιάλε..."] }

${jsonStructure}`;
                break;

            case 'improve':
                temperature = 0.3;
                systemPrompt = `You are a EXPERT COPYWRITER for recipes.
Your goal is to REWRITE THE INSTRUCTIONS to be clearer, easier to follow, and more detailed.

CRITICAL RULES:
1. **DO NOT CHANGE INGREDIENTS**: Keep the ingredient list EXACTLY as is.
2. **CLARIFY STEPS**: Rewrite the instructions to be more explanatory. Add "why".
3. **LANGUAGE**: Detect the language of the input recipe. The Output MUST be in the SAME language.
   - If Input is Greek -> Output Greek.
   - If Input is English -> Output English.
   - DO NOT TRANSLATE.

EXAMPLE:
Input: { "instructions": ["mix flour and water"] }
Output: { "instructions": ["In a large bowl, mix the flour and water until combined."] }

Input: { "instructions": ["ανακατεύουμε αλεύρι και νερό"] }
Output: { "instructions": ["Σε ένα μεγάλο μπολ, ανακατεύουμε το αλεύρι με το νερό μέχρι να ομογενοποιηθούν."] }

${jsonStructure}`;
                break;

            case 'translate':
                temperature = 0.1; // Strict
                const langName = targetLanguage === 'el' ? 'Greek' : (targetLanguage === 'en' ? 'English' : targetLanguage);
                systemPrompt = `You are a PROFESSIONAL TRANSLATOR. Your task is to translate the JSON content into **${langName}**.

INSTRUCTIONS:
1. Translate the 'title' value.
2. Translate ALL 'ingredients' values ('amount' and 'name').
3. Translate ALL 'instructions' strings.
4. Translate ALL 'tags'.
5. Convert measurements to metric (grams/ml) if translating to Greek/European languages.
6. DO NOT translate the JSON keys (keep "ingredients", "instructions", etc. strictly as is).

EXAMPLE:
Input: { "title": "Cake", "ingredients": [{ "amount": "1 cup", "name": "Flour" }] }
Output (Greek): { "title": "Κέικ", "ingredients": [{ "amount": "250γρ", "name": "Αλεύρι" }] }

${jsonStructure}`;
                break;

            case 'extract':
            default:
                temperature = 0.2; // Moderate strictness to allow "Repair"
                systemPrompt = `You are a SMART RECIPE FORMATTER.
Your job is to read the input and structure it into a perfect recipe JSON.

RULES:
1. **CONTENT INTEGRITY**: Extract the recipe EXACTLY as provided. Do NOT change the style, tone, or core instructions.
2. **SMART REPAIR**: If the input is unstructured or missing minor details (e.g., temperature), FORMAT and INFER logical fixes.
3. **LANGUAGE**: 
   - Detect the language of the input.
   - The Output MUST be in the SAME language.
   - DO NOT TRANSLATE (even if it is a different language like French or German).

EXAMPLE:
Input URL/Text: "Just mix 2 cups flour and 1 cup water, bake at 350 for 20 mins."
Output: { "ingredients": [{"amount": "2 cups", "name": "flour"}, {"amount": "1 cup", "name": "water"}], "instructions": ["Preheat oven to 350°F.", "Mix flour and water.", "Bake for 20 minutes."] }

${jsonStructure}

IMPORTANT:
- **NO HALLUCINATIONS**: If input has absolutely no recipe content, return {"error": "No recipe content found"}.`;
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
        // Strategy: 
        // - Text/URL: Use Gemma models (High RPD Limit)
        // - Image: Must use Gemini models (Visual support)

        const TEXT_MODELS = [
            'gemma-3-27b-it',             // High Quota, Smart
            'gemma-3-12b-it',             // High Quota, Fast
            'gemini-2.5-flash-lite',      // Experimental High Quota
            'gemini-1.5-flash',           // Fallback
            'gemini-1.5-pro'
        ];

        const VISUAL_MODELS = [
            'gemini-2.0-flash-exp',       // Experimental (Often separate quota)
            'gemini-1.5-flash',           // Standard
            'gemini-1.5-pro',
            'gemini-1.5-flash-8b'
        ];

        const availableModels = (imageBase64) ? VISUAL_MODELS : TEXT_MODELS;

        let lastError = null;
        let successfulModel = null;
        let responseData = null;

        for (const model of availableModels) {
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

        // 3. Fix missing commas between objects (e.g. } { -> }, {)
        cleanJson = cleanJson.replace(/}\s*\{/g, '}, {');

        // 4. Fix unescaped newlines in strings (rare but happens)
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
            tags: recipeData.tags || '',
            detectedLanguage: recipeData.detectedLanguage || 'en'
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
