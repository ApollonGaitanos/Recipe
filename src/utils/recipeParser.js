export const parseRecipe = async (input, useAI = false) => {
    // Validate input
    if (!input || typeof input !== 'string' || !input.trim()) {
        throw new Error('Please provide some recipe text to parse');
    }

    const trimmedInput = input.trim();

    // Check if input is a URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (urlRegex.test(trimmedInput)) {
        try {
            return await fetchRecipeFromUrl(trimmedInput);
        } catch (error) {
            console.error("URL Fetch failed:", error);
            throw new Error(`Could not fetch recipe from URL: ${error.message}`);
        }
    }

    // For text input: Try AI first if enabled
    if (useAI) {
        try {
            const aiResult = await extractWithAI(trimmedInput);
            if (aiResult) {
                console.log('✅ Recipe extracted with AI');
                return aiResult;
            }
        } catch (aiError) {
            console.warn('AI extraction failed, falling back to regex:', aiError);
        }
    }

    // Default: Parse as text with regex
    try {
        return parseRecipeFromText(trimmedInput);
    } catch (error) {
        console.error("Text parsing failed:", error);
        throw new Error(`Could not parse recipe text: ${error.message}`);
    }
};

// AI Extraction function
const extractWithAI = async (text) => {
    const { supabase } = await import('../supabaseClient');
    const { data, error } = await supabase.functions.invoke('ai-extract-recipe', {
        body: { text }
    });

    if (error || (data && data.error)) {
        throw new Error(error?.message || data?.error || 'AI extraction failed');
    }

    return data;
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
