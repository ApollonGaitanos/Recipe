
/**
 * Safely parses recipe data which might be:
 * 1. An Array of objects/strings (already parsed)
 * 2. A JSON string representing an Array or Object
 * 3. A newline-separated string (legacy format)
 * 4. A single string
 * 
 * @param {any} data - The input data to parse
 * @returns {Array} - Always returns an array. Empty array if invalid.
 */
export const parseSmartList = (data) => {
    if (!data) return [];

    // 1. Already an Array?
    if (Array.isArray(data)) {
        // Check for "Double Encoded" arrays e.g. ["[{...}]"]
        if (data.length === 1 && typeof data[0] === 'string') {
            const potentialJson = data[0].trim();
            if (potentialJson.startsWith('[') || potentialJson.startsWith('{')) {
                try {
                    const parsed = JSON.parse(potentialJson);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    // Not valid JSON, stick with original array
                }
            }
        }
        return data;
    }

    // 2. String handling
    if (typeof data === 'string') {
        const trimmed = data.trim();

        // A. Is it likely JSON?
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
                if (typeof parsed === 'object') return [parsed]; // Handle single object case
            } catch (e) {
                console.warn("Failed to parse structured data string:", e);
                // Fallthrough to newline split if JSON parse fails
            }
        }

        // B. Fallback: Split by newline
        return trimmed.split('\n').map(line => line.trim()).filter(Boolean);
    }

    // 3. Unknown type (Object? Number?)
    return [data];
};

/**
 * Formats an ingredient item for display.
 * Handles objects {amount, item, name} or simple strings.
 */
export const formatIngredient = (ing) => {
    if (!ing) return '';
    if (typeof ing === 'string') return ing;

    // Handle Object
    const amount = ing.amount || ing.qty || '';
    const item = ing.item || ing.name || ing.ingredient || '';

    // Clean assembly
    if (amount && item) return `${amount} ${item}`.trim();
    return (amount || item || JSON.stringify(ing)).trim();
};

/**
 * Formats a tool item for display.
 */
export const formatTool = (tool) => {
    if (!tool) return '';
    if (typeof tool === 'string') return tool;
    return tool.text || tool.name || tool.tool || JSON.stringify(tool);
};

/**
 * Formats an instruction step for display.
 */
export const formatInstruction = (step) => {
    if (!step) return '';
    if (typeof step === 'string') return step;
    return step.text || step.step || step.description || JSON.stringify(step);
};
