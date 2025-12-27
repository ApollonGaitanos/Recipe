export const parseRecipe = async (input, useAI = false, language = 'en', mode = 'extract') => {
    // Validate input
    if (!input) {
        throw new Error('Please provide some recipe text or image to parse');
    }
    const isImage = typeof input === 'object' && input.imageBase64;
    // For Create Mode, simple text is valid even if short "Chicken and rice"
    const isCreateMode = mode === 'create';
    const isAIAction = mode === 'improve' || mode === 'translate';

    if (!isImage && !isCreateMode && !isAIAction && (typeof input !== 'string' || !input.trim())) {
        throw new Error('Invalid input provided');
    }

    const trimmedInput = isImage ? null : (typeof input === 'string' ? input.trim() : '');

    // Check if input is a URL (Only if NOT in create mode)
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!isCreateMode && urlRegex.test(trimmedInput)) {
        console.log("URL detected. Attempting Smart Hybrid Import...");

        // 1. Try Legacy/Client-side Scraper FIRST (Fastest, Best for JSON-LD)
        let legacyResult = null;
        try {
            legacyResult = await fetchRecipeFromUrl(trimmedInput);
        } catch (err) {
            console.warn("Legacy scraper failed:", err);
        }

        // 2. Evaluate Legacy Result
        const isLegacyGood = legacyResult &&
            typeof legacyResult.ingredients === 'string' && legacyResult.ingredients.length > 20 &&
            typeof legacyResult.instructions === 'string' && legacyResult.instructions.length > 20;

        if (isLegacyGood) {
            console.log("✅ Using Legacy Scraper result (High Confidence)");
            return legacyResult;
        }

        // 3. Fallback to AI (if enabled and legacy was poor/failed)
        if (useAI) {
            console.log("Legacy result poor/missing. Engaging AI backup...");
            try {
                // Determine what to send to AI
                // If we got *some* text from legacy (e.g. raw body text) but failed to parse, we could send that?
                // For now, let's Stick to sending the URL to the Edge Function as the AI Fallback.
                // The Edge Function has its own fetcher.
                return await extractWithAI({ ...input, text: trimmedInput, targetLanguage: language, mode }); // Pass URL as text or handle internally
            } catch (aiError) {
                console.error("AI Fallback failed:", aiError);
                if (legacyResult) return legacyResult; // Return weak legacy result if AI dies completely
                throw aiError;
            }
        }

        // 4. Default to Legacy (even if poor) if AI is OFF
        if (legacyResult) return legacyResult;
        throw new Error("Could not extract recipe from URL.");
    }

    // For text/image input: Try AI first if enabled (Always true for Create/Improve)
    if (useAI || isImage || isCreateMode || mode === 'improve' || mode === 'translate') {
        try {
            // Construct payload
            let payload = {};
            if (isImage) {
                payload = { ...input, targetLanguage: language, mode };
            } else if (typeof input === 'string') {
                payload = { text: input, targetLanguage: language, mode };
            } else {
                payload = { ...input, targetLanguage: language, mode };
            }

            const aiResult = await extractWithAI(payload);
            if (aiResult) {
                console.log(`✅ Recipe processed with AI (Mode: ${mode})`);
                return aiResult;
            }
        } catch (aiError) {
            console.warn(`AI processing (${mode}) failed:`, aiError);
            if (isImage || isCreateMode) { // Create/Image have no regex fallback
                throw new Error(`AI processing failed: ${aiError.message}`);
            }
        }
    }

    // Default: Parse as text with regex
    if (!trimmedInput) {
        throw new Error('No text available to parse.');
    }

    try {
        return parseRecipeFromText(trimmedInput);
    } catch (error) {
        console.error("Text parsing failed:", error);
        throw new Error(`Could not parse recipe text: ${error.message}`);
    }
};

// AI Extraction function
const extractWithAI = async (input) => {
    const { supabase } = await import('../supabaseClient');

    // Construct body based on input type
    const body = typeof input === 'string'
        ? { text: input }
        : { ...input }; // Spread input directly

    // Ensure text is set for image-only input if missing
    if (!body.text && !body.url && body.imageBase64) {
        body.text = 'Extract recipe from this image';
    }

    // Use direct fetch to get better error details
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Get function URL - handles local vs production
    const functionUrl = import.meta.env.VITE_SUPABASE_URL
        ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-extract-recipe`
        : 'http://localhost:54321/functions/v1/ai-extract-recipe';

    console.log(`Sending AI request (${body.mode || 'extract'}) to:`, functionUrl);

    const headers = {
        'Content-Type': 'application/json',
    };

    // Add auth header if we have a token (optional for this function but good practice)
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Edge Function Error (${response.status}):`, errorText);
            throw new Error(`Server Error ${response.status}: ${errorText || 'Unknown error'}`);
        }

        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        return data;

    } catch (networkError) {
        console.error("Network/Fetch Error:", networkError);
        throw new Error(`Network Error: ${networkError.message}`);
    }
};

// --- URL Fetching & JSON-LD Extraction ---

const fetchRecipeFromUrl = async (url) => {
    // Try Edge Function first (more reliable)
    try {
        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase.functions.invoke('scrape-recipe', {
            body: { url }
        });

        if (!error && data && !data.error) {
            console.log('✅ Recipe scraped via Edge Function');
            return data;
        }

        console.warn('Edge Function failed, falling back to client-side:', error || data.error);
    } catch (edgeFunctionError) {
        console.warn('Edge Function not available, using client-side parser:', edgeFunctionError);
    }

    // Fallback: Client-side parsing (original method)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();

    if (!data.contents) throw new Error("No content found");

    const html = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Try to find JSON-LD (Best Accuracy)
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (let script of scripts) {
        try {
            const json = JSON.parse(script.innerText);
            // JSON-LD can be an array or a graph or a single object
            const findRecipe = (obj) => {
                if (Array.isArray(obj)) return obj.find(findRecipe);
                if (obj['@graph']) return obj['@graph'].find(findRecipe);
                if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) return obj;
                return null;
            };

            const recipeData = findRecipe(json);
            if (recipeData) {
                return parseJsonLd(recipeData);
            }
        } catch (e) {
            console.error("Error parsing JSON-LD", e);
        }
    }

    // 2. Fallback: Parse visible text from the HTML body
    doc.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
    return parseRecipeFromText(doc.body.innerText);
};

// Helper to clean text (decode HTML entities & separate lines)
const cleanText = (str) => {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value.replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ').trim();
};

const parseJsonLd = (data) => {
    // ... existing parseDuration logic ... 
    const parseDuration = (isoStr) => {
        if (!isoStr) return '';
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/i;
        const match = isoStr.match(regex);
        if (!match) return '';
        const hours = parseInt(match[1] || 0);
        const mins = parseInt(match[2] || 0);
        return (hours * 60) + mins;
    };

    const cleanList = (list) => {
        if (!list) return '';
        if (typeof list === 'string') return cleanText(list);
        if (Array.isArray(list)) return list.map(cleanText).join('\n');
        return '';
    };

    const extractInstructions = (inst) => {
        if (!inst) return '';
        if (typeof inst === 'string') return cleanText(inst);
        if (Array.isArray(inst)) {
            return inst.map(i => cleanText(i.text || i.name || i)).join('\n');
        }
        return '';
    };

    return {
        title: cleanText(data.name) || '',
        prepTime: parseDuration(data.prepTime) || '',
        cookTime: parseDuration(data.cookTime) || '',
        servings: parseInt(data.recipeYield) || '',
        ingredients: cleanList(data.recipeIngredient),
        instructions: extractInstructions(data.recipeInstructions)
    };
};


// --- Text Parsing (Original + Enhanced) ---

const parseRecipeFromText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const result = {
        title: '',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: '',
        instructions: ''
    };

    if (lines.length === 0) return result;

    // --- 1. Identify Sections ---
    const ingKeywords = ['ingredients', 'υλικά', 'shopping list', 'what you need', 'components'];
    const instKeywords = ['instructions', 'directions', 'method', 'εκτέλεση', 'οδηγίες', 'preparation', 'process', 'steps'];

    let ingStartIndex = -1;
    let instStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        const cleanLine = line.replace(/[:\-]/g, '').trim();

        if (ingStartIndex === -1 && ingKeywords.some(k => cleanLine === k || cleanLine.startsWith(k + ' '))) {
            ingStartIndex = i;
        }
        if (instStartIndex === -1 && instKeywords.some(k => cleanLine === k || cleanLine.startsWith(k + ' '))) {
            instStartIndex = i;
        }
    }

    // --- 2. Extract Title ---
    for (let i = 0; i < lines.length; i++) {
        if (i === ingStartIndex) break;
        if (hasTimeMetadata(lines[i])) continue;
        result.title = lines[i];
        break;
    }

    // --- 3. Extract Time & Servings (Enhanced) ---
    // Composite time extraction: "1 hr 10 mins" or "1 ώρα 10 λεπτά"

    const extractCompositeTime = (text, labelRegex) => {
        // Look for the label first, e.g. "Prep Time: ..."
        const labelMatch = text.match(labelRegex);
        if (!labelMatch) return null;

        // Take the chunk after the label
        const chunk = text.slice(labelMatch.index + labelMatch[0].length, labelMatch.index + labelMatch[0].length + 20); // 20 chars should cover the time

        // Match hours and minutes
        const hrMatch = chunk.match(/(\d+)\s*(?:h|hr|hour|hours|ώρα|ώρες|wres)/i);
        const minMatch = chunk.match(/(\d+)\s*(?:m|min|minute|minutes|λεπτά|λ)/i);

        let total = 0;
        if (hrMatch) total += parseInt(hrMatch[1]) * 60;
        if (minMatch) total += parseInt(minMatch[1]);

        return total > 0 ? total : null;
    };

    const fullText = text;

    // Prep
    const prepLabel = /(?:prep|preparation|προετοιμασία)(?:[\s:]*time)?[:\s]+/i;
    result.prepTime = extractCompositeTime(fullText, prepLabel) || ''; // Fallback to basic math if needed but logic handles composite

    // Cook
    // Handles "psinoume for X time" or "Cooking time X"
    const cookLabel = /(?:cook|cooking|μαγείρεμα|ψησιμο|ψηνουμε)(?:[\s:]*time|(?:\s+για))?[:\s]+/i;
    result.cookTime = extractCompositeTime(fullText, cookLabel) || '';

    // Servings
    const servRegex = /(\d+)\s*(?:servings|people|portions|μερίδες|άτομα)/i;
    const servMatch = fullText.match(servRegex);
    if (servMatch) result.servings = servMatch[1];


    // --- 4. Extract Ingredients ---
    if (ingStartIndex !== -1) {
        let endIndex = instStartIndex !== -1 && instStartIndex > ingStartIndex ? instStartIndex : lines.length;
        const rawIngs = lines.slice(ingStartIndex + 1, endIndex);
        result.ingredients = rawIngs.map(l => l.replace(/^[\u2022\-\*]\s*/, '')).join('\n');
    }

    // --- 5. Extract Instructions ---
    if (instStartIndex !== -1) {
        let endIndex = lines.length;
        if (ingStartIndex > instStartIndex) endIndex = ingStartIndex; // if reversed
        const rawInst = lines.slice(instStartIndex + 1, endIndex);
        result.instructions = rawInst.join('\n');
    }

    // --- 6. Fallback: If no sections detected, intelligently split ---
    if (!result.ingredients && !result.instructions && lines.length > 2) {
        // Skip the title line
        const startIdx = result.title ? 1 : 0;
        const contentLines = lines.slice(startIdx);

        // Simple heuristic: Split at roughly the middle
        // Ingredients tend to be in the first half, instructions in the second
        const midpoint = Math.floor(contentLines.length / 2);

        result.ingredients = contentLines.slice(0, midpoint).join('\n');
        result.instructions = contentLines.slice(midpoint).join('\n');
    }

    return result;
};

// Helper
function hasTimeMetadata(line) {
    const keywords = ['prep', 'cook', 'time', 'total', 'servings', 'yield', 'προετοιμασία', 'μαγείρεμα', 'χρόνος', 'μερίδες', 'ψήνουμε'];
    const lower = line.toLowerCase();
    return keywords.some(k => lower.includes(k) && /\d/.test(lower));
}
