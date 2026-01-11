
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2";

// --- SSRF Protection Helper (STRICT) ---
const isSafeUrl = (urlString: string): boolean => {
    try {
        const url = new URL(urlString);

        // 1. Protocol must be HTTPS
        if (url.protocol !== 'https:') return false;

        // 2. Block IP Literals (IPv4 & IPv6)
        // This regex checks if the hostname looks like an IP address
        // IPv4: 1.2.3.4
        // IPv6: [::1] or similar
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$|^\[[\da-fA-F:]+\]$|^[\da-fA-F:]+$/.test(url.hostname);
        if (isIp) return false;

        // 3. Block Localhost / Local domains explicitly
        if (url.hostname === 'localhost' || url.hostname.endsWith('.local')) return false;

        // 4. DNS Rebinding / Private Range Defense
        // Since we cannot resolve DNS inside Deno Deploy easily without trusted bindings,
        // relying on "No IP Literals" + "HTTPS Only" is a strong defense.
        // Public trusted infrastructure usually has valid SSL certs.
        // An attacker pointing a domain to 127.0.0.1 won't have a valid cert for that domain,
        // so the HTTPS handshake will fail (unless we mistakenly ignore SSL errors).

        return true;
    } catch (e) {
        return false;
    }
};

// --- Safe Fetcher (Handles Redirects Manually) ---
async function safeFetch(initialUrl: string, headers: any, maxRedirects = 5) {
    let currentUrl = initialUrl;
    let redirectCount = 0;

    while (redirectCount < maxRedirects) {
        if (!isSafeUrl(currentUrl)) {
            throw new Error(`Security Violation: Access to ${currentUrl} is blocked.`);
        }

        console.log(`[SafeFetch] Requesting: ${currentUrl}`);

        // Manual redirect handling to validate every hop
        const response = await fetch(currentUrl, {
            headers: headers,
            redirect: 'manual'
        });

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');
            if (!location) throw new Error("Redirect response missing Location header");

            // Handle relative or absolute redirects
            const nextUrl = new URL(location, currentUrl).toString();
            currentUrl = nextUrl;
            redirectCount++;
            continue;
        }

        return response;
    }

    throw new Error("Too many redirects");
}

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
        // 1. VERIFY AUTHENTICATION (STRICT)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error("Unauthorized: Missing Authorization header");
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            throw new Error("Unauthorized: Invalid Token");
        }


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
            // 1. Direct Fetch (Safe Mode)
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
                // 1. Extract JSON-LD (Schema.org Recipe Data) - CRITICAL for SPAs/Modern Sites
                const jsonLdMatches = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gim);
                const jsonLdContent = jsonLdMatches ? jsonLdMatches.join("\n\n") : "";

                // 2. Remove Scripts, Styles, SVG (Noise)
                let clean = html
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
                    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gim, "")
                    .replace(/<video\b[^>]*>([\s\S]*?)<\/video>/gim, "")
                    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "")
                    .replace(/<!--[\s\S]*?-->/g, ""); // Remove comments

                // 3. Collapse whitespace (Max 2 newlines)
                clean = clean.replace(/[ \t]+/g, " ")
                    .replace(/\n\s*\n\s*\n+/g, "\n\n")
                    .trim();

                // 4. Return Combined Content (JSON-LD First)
                return `--- REQUESTED METADATA (JSON-LD) ---\n${jsonLdContent}\n\n--- PAGE CONTENT ---\n${clean}`;
            };

            try {
                // 1. Direct Fetch (SECURE)
                console.log("Attempting Direct Fetch...");

                // Using safeFetch instead of direct fetch
                const urlResp = await safeFetch(url, standardHeaders);

                // 403/401/503 usually means blocked -> Throw to trigger proxy
                if (!urlResp.ok) {
                    throw new Error(`Direct fetch failed with status: ${urlResp.status}`);
                }

                const rawText = await urlResp.text();
                if (rawText.length < 500) throw new Error("Direct fetch returned too little content (likely bot block).");

                processingText = cleanContent(rawText);

            } catch (directError) {
                console.warn(`Direct fetch failed (${directError.message}). Trying AllOrigins...`);

                try {
                    // 2. AllOrigins Proxy (Fallback A)
                    // Note: AllOrigins returns JSON with "contents"
                    const proxyResp = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                    if (!proxyResp.ok) throw new Error(`AllOrigins status: ${proxyResp.status}`);

                    const proxyData = await proxyResp.json();
                    if (!proxyData.contents) throw new Error("No 'contents' field from AllOrigins");
                    if (proxyData.contents.length < 500) throw new Error("AllOrigins returned too little content.");

                    processingText = cleanContent(proxyData.contents);

                } catch (proxyError) {
                    console.warn(`AllOrigins failed (${proxyError.message}). Trying CorsProxy...`);

                    try {
                        // 3. CorsProxy.io (Fallback B)
                        const cpResp = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { headers: standardHeaders });
                        if (!cpResp.ok) throw new Error(`CorsProxy status: ${cpResp.status}`);

                        const rawCpText = await cpResp.text();
                        if (rawCpText.length < 500) throw new Error("CorsProxy returned too little content.");

                        processingText = cleanContent(rawCpText);

                    } catch (finalError) {
                        console.error(`ALL fetch methods failed. Last error: ${finalError.message}`);
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
            throw new Error('Could not retrieve meaningful content from this URL. Please try manually copying and pasting the recipe text.');
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
  "nutrition": {
    "calories": "500",
    "protein": "30g",
    "carbs": "50g",
    "fat": "20g"
  },
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
- "nutrition": Object. ESTIMATE the nutritional values PER SERVING based on the ingredients if not provided in the text. Return strings with units (e.g. "500 kcal", "20g").
- SPLIT instructions into distinct steps.
- Returns only valid JSON.`;

        switch (selectedMode) {
            case 'create':
                // Persona: Culinary Historian & Chef
                temperature = 0.3; // Low creativity for standard/traditional results
                systemPrompt = `You are a CULINARY HISTORIAN and EXPERT CHEF.
Your goal is to provide the MOST TRADITIONAL, STANDARD, and AUTHENTIC recipe for the requested dish.

LOGIC:
1. **TRADITION and AUTHENTICITY**: If the user asks for "Carbonara", provide the AUTHENTIC Roman version (Guanciale, Pecorino, Eggs, Pepper. NO Cream). Do not offer variations unless explicitly asked.
2. **PANTRY STAPLES**: If the user lists ingredients (e.g., "Eggs, Flour"), create a BASIC recipe using ONLY those ingredients + standard pantry staples (Water, Oil, Salt, Pepper). Do NOT assume or add fancy ingredients (like Butter or Milk) unless necessary for chemistry.
3. **COMPLETE METADATA**: You MUST populate "tools" (e.g. "Skillet", "Whisk") and "description" (appetizing summary).
4. **NUTRITION**: You MUST provide estimated nutrition per serving.
5. **LANGUAGE**: Detect the language of the User Input. The Output MUST be in the SAME language.

EXAMPLE:
Input: "Carbonara"
Output: { "title": "Spaghetti Carbonara", "description": "The authentic Roman classic using guanciale and pecorino romano.", "tools": ["Large Pot", "Skillet", "Bowl"], "ingredients": [{"amount": "200g", "name": "Guanciale"}, {"amount": "100g", "name": "Pecorino Romano"}, {"amount": "4", "name": "Large Eggs"}, {"amount": "400g", "name": "Spaghetti"}, {"amount": "", "name": "Black Pepper"}], "instructions": ["Boil pasta...", "Crisp guanciale...", "Mix eggs and cheese..."] }

${jsonStructure}`;
                break;

            case 'improve':
                // Persona: Cooking Instructor (Sous Chef)
                temperature = 0.5; // Balanced help
                systemPrompt = `You are a HELPFUL COOKING INSTRUCTOR.
Your goal is to ENHANCE the instructions with useful tips and visual cues WITHOUT altering the core method or ingredients.

LOGIC:
1. **NON-DESTRUCTIVE**: Do NOT add new ingredients. Do NOT change temperatures or main steps.
2. **ADD VISUAL CUES**: "Mix until combined" -> "Mix until combined and no dry flour remains (approx 2 mins)."
3. **INFER TOOLS**: Look at the steps and ingredients to populate the "tools" array (e.g. if it says "whisk", add "Whisk").
4. **DESCRIPTION**: If the description is empty or boring, write a better one.
5. **NUTRITION**: ESTIMATE calories and macros per serving based on the ingredients.
6. **LANGUAGE**: Keep the input language.

EXAMPLE:
Input Instructions: ["Mix flour and water", "Knead"]
Output Instructions: ["In a large mixing bowl, combine the flour and lukewarm water until a shaggy dough forms.", "Transfer to a clean surface and knead steadily for 8-10 minutes until the dough is smooth and elastic (it should spring back when poked)."]
Output Tools: ["Large Mixing Bowl", "Clean Surface"]

${jsonStructure}`;
                break;

            case 'translate':
                // Persona: Technical Translator
                temperature = 0.1; // Strict
                const langName = targetLanguage === 'el' ? 'Greek' : (targetLanguage === 'en' ? 'English' : targetLanguage);
                console.log(`[DEBUG] Translation Request. Target Code: ${targetLanguage}, Lang Name: ${langName}`);

                const translateStructure = `
Return the output in this strict JSON structure:
{
  "title": "[TRANSLATED TITLE IN ${langName.toUpperCase()}]",
  "description": "[TRANSLATED DESCRIPTION IN ${langName.toUpperCase()}]",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": ["[TRANSLATED TAG 1]", "[TRANSLATED TAG 2]"],
  "tools": ["[TRANSLATED TOOL 1]", "[TRANSLATED TOOL 2]"],
  "ingredients": [
    { "amount": "200g", "name": "[TRANSLATED INGREDIENT NAME]" }
  ],
  "instructions": [
    "[TRANSLATED STEP 1]",
    "[TRANSLATED STEP 2]"
  ],
  "nutrition": {
    "calories": "500",
    "protein": "30g",
    "carbs": "50g",
    "fat": "20g"
  },
  "detectedLanguage": "${targetLanguage}" 
}
- "detectedLanguage": "${targetLanguage}"
- "title": String (in ${langName}).
- "description": String (in ${langName}).
- "ingredients": Array. "name" MUST be in ${langName}. Units MUST be localized.
- "instructions": Array of strings. MUST be in ${langName}.
`;

                systemPrompt = `You are a TECHNICAL TRANSLATOR.
Your task is to translate the JSON content into **${langName}** with strict 1:1 mapping.

LOGIC:
1. **MANDATORY**: The content of the values (title, ingredients, instructions) MUST be in **${langName}**.
2. **STRICT TRANSLATION**: Translate Title, Description, Ingredient Names, Tools, Instructions, and Tags.
3. **NUTRITION**: Copy the nutrition values if present, or estimate them if missing.
3. **UNIT CONVERSION**: If formatting for Greek/European output, convert 'cups'/'oz' to 'grams'/'ml' where appropriate.
4. **NO RE-INTERPRETATION**: Do not change the cooking method or add steps. Just translate.
5. **KEYS IMMUTABLE**: Keep JSON keys exactly as is (e.g. "title": "...") but translate the value.
6. **ANTI-ECHO**: Do NOT return the input text as is. You MUST translate it.

${translateStructure}`;
                break;

            case 'extract':
            default:
                // Persona: Data Entry Specialist ("Xerox" Mode)
                temperature = 0.0; // Deterministic
                systemPrompt = `You are a PRECISE DATA ENTRY SPECIALIST.
Your job is to EXTRACT the recipe from the input (URL/Text/Image) exactly as it appears.

LOGIC:
1. **DIGITAL TWIN (XEROX MODE)**: Copy the title, ingredients, and instructions EXACTLY as they appear in the source.
2. **NO ALTERATIONS**: If the source says "mix 10 mins", output "mix 10 mins". Do not "fix" it to "mix 10 minutes".
3. **NO HALLUCINATIONS**: Do not add ingredients or steps that are not in the source text/image.
4. **ENRICHMENT**: You ARE allowed to estimate "nutrition" and "tools" if they are missing from the source.
5. **STRUCTURE ONLY**: Your only job is to format the existing data into the JSON structure.
6. **LANGUAGE**: Keep the original language of the source.

${jsonStructure}`;
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
                maxOutputTokens: 8000, // Increased for larger recipes
                responseMimeType: "application/json"
            }
        };

        // 6. API Call with Fallback Logic
        // - Text/URL: Use Gemma models (High RPD Limit)
        // - Image: Must use Gemini models (Visual support)

        const TEXT_MODELS = [
            'gemini-3-flash',             // Priority 1: Best Quality (Low Limit)
            'gemini-2.5-flash',           // Priority 2: Standard (Low Limit)
            'gemini-2.5-flash-lite',      // Priority 3: Efficient (Low Limit)
            'gemma-3-27b-it',             // Priority 4: High Limit Backup (14k RPD!)
            'gemma-3-12b-it'              // Priority 5: High Limit Backup (14k RPD!)
        ];

        const VISUAL_MODELS = [
            'gemini-3-flash',             // Priority 1: Best Vision
            'gemini-2.5-flash',           // Priority 2: Stable Vision
            'gemini-2.5-flash-lite'       // Priority 3: Vision Fallback
        ];

        const availableModels = (imageBase64) ? VISUAL_MODELS : TEXT_MODELS;

        let lastError = null;
        let successfulModel = null;
        let responseData = null;

        for (const model of availableModels) {
            try {
                console.log(`Trying model: ${model}...`);
                const CURRENT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

                // Config Logic: Gemma does NOT support JSON mode. Gemini DOES.
                const isGemma = model.includes('gemma');
                const modelConfig = {
                    temperature: temperature,
                    maxOutputTokens: 8000,
                };

                // Only add JSON mode for Gemini
                if (!isGemma) {
                    modelConfig.responseMimeType = "application/json";
                }

                const currentPayload = {
                    contents: [{ parts }],
                    generationConfig: modelConfig
                };

                const response = await fetch(CURRENT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify(currentPayload)
                });

                if (!response.ok) {
                    const status = response.status;
                    const errorText = await response.text();

                    console.warn(`[Model Choice] ${model} failed. Status: ${status}. Error: ${errorText.substring(0, 200)}`); // Increased log length

                    // Specific handling for 404 (Model not found/deprecated)
                    if (status === 404) {
                        lastError = new Error(`Model ${model} not found (404)`);
                        continue;
                    }
                    // Specific handling for 429 (Quota)
                    if (status === 429) {
                        lastError = new Error(`Model ${model} quota exceeded (429)`);
                        continue;
                    }

                    lastError = new Error(`Model ${model} error (${status}): ${errorText}`);
                    continue;
                }

                const data = await response.json();

                // Validate content existence
                if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.warn(`[Model Choice] ${model} returned empty/invalid structure.`);
                    lastError = new Error(`Model ${model} returned invalid structure.`);
                    continue;
                }

                responseData = data;
                successfulModel = model;
                console.log(`✅ Success! Using model: ${model}`);
                break; // Exit loop on success

            } catch (err) {
                console.error(`Unexpected network/system error with ${model}:`, err.message);
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
            nutrition: recipeData.nutrition || {}, // New Field
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
