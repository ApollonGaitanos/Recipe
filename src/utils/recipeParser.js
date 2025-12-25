export const parseRecipe = (text) => {
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
    // We look for known headers to split the text.
    // Keywords for Ingredients
    const ingKeywords = ['ingredients', 'υλικά', 'shopping list', 'what you need', 'components'];
    // Keywords for Instructions
    const instKeywords = ['instructions', 'directions', 'method', 'εκτέλεση', 'οδηγίες', 'preparation', 'process'];

    let ingStartIndex = -1;
    let instStartIndex = -1;

    // Find the first occurrence of these headers
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        // Remove common punctuation for checking
        const cleanLine = line.replace(/[:\-]/g, '').trim();

        if (ingStartIndex === -1 && ingKeywords.some(k => cleanLine === k || cleanLine.startsWith(k + ' '))) {
            ingStartIndex = i;
        }
        if (instStartIndex === -1 && instKeywords.some(k => cleanLine === k || cleanLine.startsWith(k + ' '))) {
            instStartIndex = i;
        }
    }

    // --- 2. Extract Title ---
    // If ingredients start heavily down, the first line is likely the title.
    // If ingredients start immediately (line 0), maybe there is no title or it's above.
    // We assume the first non-empty line that isn't a "Time" metadata line is the title.
    for (let i = 0; i < lines.length; i++) {
        if (i === ingStartIndex) break; // Don't go into ingredients
        // Skip if it looks like metadata (e.g. "Prep: 10m")
        if (hasTimeMetadata(lines[i])) continue;

        // This is likely the title
        result.title = lines[i];
        break;
    }

    // --- 3. Extract Time & Servings (Metadata) ---
    // We scan the first chunk of lines (before ingredients) and also the whole text just in case.
    const timeRegex = /(\d+)\s*(min|minute|minutes|m|hr|hour|hours|h|λεπτά|λ|ώρες|ώρα|wres)\b/i;
    const servRegex = /(\d+)\s*(servings|people|portions|μερίδες|άτομα)/i;

    // Helper to normalize time to minutes
    const toMinutes = (val, unit) => {
        val = parseInt(val);
        if (['hr', 'hour', 'hours', 'h', 'ώρες', 'ώρα'].some(u => unit.toLowerCase().startsWith(u))) {
            return val * 60;
        }
        return val;
    };

    // Scan for Prep/Cook specific labels
    const fullText = text; // Search in full text for "Prep: 10m" patterns

    // Prep
    const prepMatch = fullText.match(/(?:prep|preparation|προετοιμασία)[:\s]+(\d+)\s*([a-zα-ω]+)/i);
    if (prepMatch) result.prepTime = toMinutes(prepMatch[1], prepMatch[2]);

    // Cook
    const cookMatch = fullText.match(/(?:cook|cooking|μαγείρεμα|ψησιμο)[:\s]+(\d+)\s*([a-zα-ω]+)/i);
    if (cookMatch) result.cookTime = toMinutes(cookMatch[1], cookMatch[2]);

    // Servings
    const servMatch = fullText.match(servRegex);
    if (servMatch) result.servings = servMatch[1];


    // --- 4. Extract Ingredients ---
    if (ingStartIndex !== -1) {
        let endIndex = instStartIndex !== -1 && instStartIndex > ingStartIndex ? instStartIndex : lines.length;

        // Collect lines, removing the header itself
        const rawIngs = lines.slice(ingStartIndex + 1, endIndex);

        // Clean up bullets
        result.ingredients = rawIngs.map(l => l.replace(/^[\u2022\-\*]\s*/, '')).join('\n');
    }

    // --- 5. Extract Instructions ---
    if (instStartIndex !== -1) {
        let endIndex = lines.length;
        // If ingredients follow instructions (rare but possible)
        if (ingStartIndex > instStartIndex) endIndex = ingStartIndex;

        const rawInst = lines.slice(instStartIndex + 1, endIndex);
        result.instructions = rawInst.join('\n');
    }

    return result;
};

// Helper to check if a line is just metadata like "Prep time: 10m"
function hasTimeMetadata(line) {
    const keywords = ['prep', 'cook', 'time', 'total', 'servings', 'yield', 'προετοιμασία', 'μαγείρεμα', 'χρόνος', 'μερίδες'];
    const lower = line.toLowerCase();
    return keywords.some(k => lower.includes(k) && /\d/.test(lower));
}
