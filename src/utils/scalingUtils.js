const UNICODE_FRACTIONS = {
    '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8,
    '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
};

/**
 * Parses a string to extract the quantity.
 * Supports:
 * - Unicode Fractions: "½ cup" -> 0.5
 * - Mixed fractions: "1 1/2 cups" -> 1.5
 * - Simple fractions: "1/2 cup" -> 0.5
 * - Decimals/Integers: "1.5" or "2"
 * - Ranges: "1-2 cups" -> 1 (Parses the first number found)
 */
export const parseQuantity = (str) => {
    if (typeof str !== 'string') return null;

    const trimmed = str.trim();

    // 0. Check for Unicode Fractions at START (e.g., "½" or "1 ½")
    // Regex matches optional integer + space + unicode char
    const unicodeMatch = trimmed.match(/^(\d+)?\s?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/);
    if (unicodeMatch) {
        const whole = unicodeMatch[1] ? parseInt(unicodeMatch[1]) : 0;
        const fraction = UNICODE_FRACTIONS[unicodeMatch[2]] || 0;
        return whole + fraction;
    }

    // 1. Check for Mixed Fractions at START "1 1/2"
    // We restrict to start ^ because "Step 2: add 1/2 cup" shouldn't parse "Step 2" as quantity.
    // However, for ingredients list, usually quantity is first.
    const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixedMatch) {
        return parseInt(mixedMatch[1]) + (parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]));
    }

    // 2. Check for Fractions at START "1/2"
    const fractionMatch = trimmed.match(/^(\d+)\/(\d+)/);
    if (fractionMatch) {
        return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    }

    // 3. Check for Decimals/Integers at START "1.5" or "2" or "10-12"
    // This will greedily match "10" from "10-12"
    const numberMatch = trimmed.match(/^(\d+(\.\d+)?)/);
    if (numberMatch) {
        return parseFloat(numberMatch[0]);
    }

    return null;
};

/**
 * Formats a number back to a string.
 * User preference: "turn it to a decimal".
 * We display up to 2 decimal places, checking if it's an integer.
 */
export const formatQuantity = (num) => {
    if (!num && num !== 0) return '';

    // Check if effective integer (e.g. 2.00)
    if (Math.abs(num % 1) < 0.01) {
        return Math.round(num).toString();
    }

    // Otherwise return decimal, max 2 digits, strip trailing zeros
    // e.g. 1.50 -> 1.5, 1.25 -> 1.25, 0.3333 -> 0.33
    return parseFloat(num.toFixed(2)).toString();
};

/**
 * Scales an ingredient item.
 * LOGIC: (Quantity / OriginalServings) * NewServings
 * This calculates the single-person portion first, then multiplies.
 * 
 * @param {string|object} ingredient - The ingredient to scale.
 * @param {number} originalServings - The original recipe serving size.
 * @param {number} currentServings - The target serving size.
 */
export const scaleIngredient = (ingredient, originalServings, currentServings) => {
    if (!originalServings || !currentServings || originalServings === currentServings) {
        return ingredient;
    }

    const scaleLogic = (qty) => {
        // Step 1: Divide by default serving size
        const unitQty = qty / originalServings;
        // Step 2: Multiply by selected serving size
        return unitQty * currentServings;
    };

    // Handle Object structure: { amount: "2", item: "cups flour" }
    if (typeof ingredient === 'object' && ingredient !== null) {
        const amount = parseFloat(ingredient.amount);
        if (!isNaN(amount)) {
            const newAmount = scaleLogic(amount);
            return {
                ...ingredient,
                amount: formatQuantity(newAmount)
            };
        }
        return ingredient;
    }

    // Handle String: "2 cups flour"
    if (typeof ingredient === 'string') {
        const qty = parseQuantity(ingredient);
        if (qty !== null) {
            const newQty = scaleLogic(qty);
            const formattedNewQty = formatQuantity(newQty);

            // Reconstruct string
            const unicodeRegex = /^(\d+)?\s?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/;
            const mixedRegex = /^(\d+)\s+(\d+)\/(\d+)/;
            const fractionRegex = /^(\d+)\/(\d+)/;
            const numberRegex = /^(\d+(\.\d+)?)/;

            let matchLength = 0;
            if (unicodeRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(unicodeRegex)[0].length;
            else if (mixedRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(mixedRegex)[0].length;
            else if (fractionRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(fractionRegex)[0].length;
            else if (numberRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(numberRegex)[0].length;

            if (matchLength > 0) {
                return formattedNewQty + ingredient.trim().substring(matchLength);
            }
        }
        return ingredient;
    }

    return ingredient;
};
