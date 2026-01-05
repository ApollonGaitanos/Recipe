
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

            // Strategy: Triple Fallback
            // 1. Direct Fetch (Mimic Browser)
            // 2. AllOrigins (Proxy A)
            // 3. CorsProxy.io (Proxy B)

            const standardHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Upgrade-Insecure-Requests': '1'
            };

            const cleanContent = (html: string) => {
                let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "") // excessive noise
                    .replace(/<\/(div|p|h\d|li|br)>/gim, "\n");
                return clean.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
            };

            try {
                // 1. Direct Fetch
                console.log("Attempting Direct Fetch...");
                const urlResp = await fetch(url, { headers: standardHeaders });
                if (!urlResp.ok && urlResp.status !== 403) throw new Error(`Direct fetch failed: ${urlResp.status}`);
                // If 403, it's likely a block, so throw to trigger catch immediately
                if (urlResp.status === 403) throw new Error("Blocked by WAF (403)");

                processingText = cleanContent(await urlResp.text());

            } catch (directError) {
                console.warn(`Direct fetch failed (${directError.message}). Trying AllOrigins...`);

                try {
                    // 2. AllOrigins Proxy (Fallback A)
                    const proxyResp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                    if (!proxyResp.ok) throw new Error("AllOrigins failed");
                    const proxyData = await proxyResp.json();
                    if (!proxyData.contents) throw new Error("No content from AllOrigins");

                    processingText = cleanContent(proxyData.contents);

                } catch (proxyError) {
                    console.warn(`AllOrigins failed (${proxyError.message}). Trying CorsProxy...`);

                    try {
                        // 3. CorsProxy.io (Fallback B - different IP pool)
                        const cpResp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { headers: standardHeaders });
                        if (!cpResp.ok) throw new Error("CorsProxy failed");

                        processingText = cleanContent(await cpResp.text());

                    } catch (finalError) {
                        console.error(`All fetch methods failed. Last error: ${finalError.message}`);
                        // processingText remains empty, triggering the validation error below
                    }
                }
            }

            // Global Length Check / Truncation
            if (processingText) {
                if (processingText.length > 35000) {
                    processingText = processingText.substring(0, 35000);
                }
                console.log(`Final Extracted Text Length: ${processingText.length}`);
            }
        }

        // 5. Validation: Ensure we have content to send to AI
        if (url && (!processingText || processingText.trim().length < 50)) {
            console.warn(`URL Fetch failed for ${url}. Extracted text length: ${processingText?.length || 0}`);
            throw new Error('Could not retrieve content from this URL. The website might be using security protection (like Cloudflare) or is empty. Please try manually copying and pasting the recipe text.');
        }

        // 6. Construct Prompt based on MODE (default: extract)
        const selectedMode = mode || 'extract';
        let systemPrompt = "";
        let temperature = 0.1;

        const jsonStructure = `
Return the output in this strict JSON structure:
{
  "title": "Recipe Title",
  "description": "A brief, appetizing summary of the dish.",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["tag1", "tag2"],
  "tools": ["Tool 1", "Tool 2"],
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
- "description": String. 2-3 sentences describing the dish, its flavor profile, or origin.
- "prepTime", "cookTime", "servings": Integer numbers only (in minutes). Calculate totals if ranges are given. Attempt to infer from text if missing.
- "tags": Array of strings (e.g. ["dinner", "italian", "healthy"]).
- "tools": Array of strings (e.g. ["Large pot", "Whisk", "Oven"]). List specific equipment needed.
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
3. **COMPLETE DATA**: Fill in ALL fields, including tools and description.
4. **LANGUAGE**: Detect the language of the User Input. The Output MUST be in the SAME language.

EXAMPLE:
Input: "Spaghetti Carbonara"
Output: { "title": "Spaghetti Carbonara", "description": "A classic Roman pasta dish...", "tools": ["Large Pot"], "ingredients": [{"amount": "200g", "name": "Guanciale"}], "instructions": ["Cook guanciale until crispy..."] }

Input: "Σπαγγέτι Καρμπονάρα"
Output: { "title": "Σπαγγέτι Καρμπονάρα", "description": "Μια κλασική ρωμαϊκή συνταγή...", "tools": ["Μεγάλη κατσαρόλα"], "ingredients": [{"amount": "200γρ", "name": "Γκουαντσιάλε"}], "instructions": ["Μαγειρέψτε το γκουαντσιάλε..."] }

${jsonStructure}`;
                break;

            case 'improve':
                temperature = 0.3;
                systemPrompt = `You are a EXPERT COPYWRITER for recipes.
Your goal is to REWRITE THE INSTRUCTIONS to be clearer, easier to follow, and more detailed. Also improve the description.

CRITICAL RULES:
1. **DO NOT CHANGE INGREDIENTS**: Keep the ingredient list EXACTLY as is.
2. **CLARIFY STEPS**: Rewrite the instructions to be more explanatory. Add "why".
3. **ADD METADATA**: Ensure tools and description are populated/improved.
4. **LANGUAGE**: Detect the language of the input recipe. The Output MUST be in the SAME language.
   - If Input is Greek -> Output Greek.
   - If Input is English -> Output English.
   - DO NOT TRANSLATE.

EXAMPLE:
Input: { "instructions": ["mix flour and water"] }
Output: { "instructions": ["In a large bowl, mix the flour and water until combined."], "tools": ["Large Bowl"] }

Input: { "instructions": ["ανακατεύουμε αλεύρι και νερό"] }
Output: { "instructions": ["Σε ένα μεγάλο μπολ, ανακατεύουμε το αλεύρι με το νερό μέχρι να ομογενοποιηθούν."], "tools": ["Μεγάλο μπολ"] }

${jsonStructure}`;
                break;

            case 'translate':
                temperature = 0.1; // Strict
                const langName = targetLanguage === 'el' ? 'Greek' : (targetLanguage === 'en' ? 'English' : targetLanguage);
                systemPrompt = `You are a PROFESSIONAL TRANSLATOR. Your task is to translate the JSON content into **${langName}**.

INSTRUCTIONS:
1. Translate the 'title' and 'description'.
2. Translate ALL 'ingredients' values ('amount' and 'name').
3. Translate ALL 'instructions' strings.
4. Translate ALL 'tags' and 'tools'.
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
3. **COMPLETE METADATA**: Extract or infer tools, description, and tags if not explicitly listed.
4. **LANGUAGE**: 
   - Detect the language of the input.
   - The Output MUST be in the SAME language.
   - DO NOT TRANSLATE (even if it is a different language like French or German).

EXAMPLE:
Input URL/Text: "Just mix 2 cups flour and 1 cup water, bake at 350 for 20 mins."
Output: { "ingredients": [{"amount": "2 cups", "name": "flour"}, {"amount": "1 cup", "name": "water"}], "instructions": ["Preheat oven to 350°F.", "Mix flour and water.", "Bake for 20 minutes."], "tools": ["Oven", "Bowl"], "description": "A simple flour and water mixture." }

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
            'gemma-3-27b-it',             // Try Instruct version first (standard)
            'gemma-3-27b',                // Exact match from list
            'gemma-3-12b-it',             // Try Instruct version first
            'gemma-3-12b',                // Exact match from list
            'gemini-3-flash',             // New High Performance
            'gemini-2.5-flash',           // Stable High Performance
            'gemini-2.5-flash-lite'       // Cost effective fallback
        ];

        const VISUAL_MODELS = [
            'gemini-3-flash',            // Best Vision Performance
            'gemini-2.5-flash',
            'gemini-2.5-flash-lite',
            'gemma-3-27b-it',            // Experimental Multimodal support
            'gemma-3-12b-it'
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
            tools: recipeData.tools || [], // New Field
            description: recipeData.description || '', // New Field
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
