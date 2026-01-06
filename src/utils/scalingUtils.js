/**
 * Parses a string to extract the quantity.
 * Supports:
 * - Decimals: "1.5 cups" -> 1.5
 * - Fractions: "1/2 cup" -> 0.5
 * - Mixed numbers: "1 1/2 cups" -> 1.5
 * - Ranges: "1-2 cups" -> 1.5 (takes average for scaling simple logic, or just lower bound? Let's take lower bound for safety or just parsing the first number)
 * Actually for scaling "1-2", ideally we scale both. But for MVP let's parse the first number found at the start.
 */
export const parseQuantity = (str) => {
    if (typeof str !== 'string') return null;

    // Check for mixed fractions first "1 1/2"
    const mixedMatch = str.trim().match(/^(\d+)\s+(\d+)\/(\d+)/);
    if (mixedMatch) {
        return parseInt(mixedMatch[1]) + (parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]));
    }

    // Check for simple fractions "1/2"
    const fractionMatch = str.trim().match(/^(\d+)\/(\d+)/);
    if (fractionMatch) {
        return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
    }

    // Check for decimals or integers "1.5" or "2"
    const numberMatch = str.trim().match(/^(\d+(\.\d+)?)/);
    if (numberMatch) {
        return parseFloat(numberMatch[0]);
    }

    return null;
};

/**
 * Formats a number back to a string, preferring fractions for common values.
 */
export const formatQuantity = (num) => {
    if (!num) return '';

    // Tolerance for float comparison
    const tolerance = 0.05;

    const whole = Math.floor(num);
    const decimal = num - whole;

    let fraction = '';

    if (Math.abs(decimal - 0.25) < tolerance) fraction = '1/4';
    else if (Math.abs(decimal - 0.33) < tolerance) fraction = '1/3';
    else if (Math.abs(decimal - 0.5) < tolerance) fraction = '1/2';
    else if (Math.abs(decimal - 0.66) < tolerance) fraction = '2/3';
    else if (Math.abs(decimal - 0.75) < tolerance) fraction = '3/4';

    if (whole === 0 && fraction) return fraction;
    if (whole > 0 && fraction) return `${whole} ${fraction}`;
    if (fraction === '' && decimal > 0.1) return num.toFixed(1).replace(/\.0$/, ''); // rounding to 1 decimal for weird numbers
    return whole.toString();
};

/**
 * Scales an ingredient item based on the serving ratio.
 * @param {string|object} ingredient - The ingredient to scale.
 * @param {number} originalServings - The original recipe serving size.
 * @param {number} currentServings - The target serving size.
 */
export const scaleIngredient = (ingredient, originalServings, currentServings) => {
    if (!originalServings || !currentServings || originalServings === currentServings) {
        return ingredient;
    }

    const ratio = currentServings / originalServings;

    // Handle Object structure: { amount: "2", item: "cups flour" } or similar
    if (typeof ingredient === 'object' && ingredient !== null) {
        // We only scale if there's a numeric amount
        const amount = parseFloat(ingredient.amount);
        if (!isNaN(amount)) {
            const newAmount = amount * ratio;
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
            const newQty = qty * ratio;
            const formattedNewQty = formatQuantity(newQty);

            // Reconstruct string: replace the original number part with new one
            // We use the same regex logic to locate the part to replace
            // "1 1/2 cups" -> replace "1 1/2" with formattedNewQty
            // "2 cups" -> replace "2"

            // Regex to match the starting number/fraction again
            const mixedRegex = /^(\d+)\s+(\d+)\/(\d+)/;
            const fractionRegex = /^(\d+)\/(\d+)/;
            const numberRegex = /^(\d+(\.\d+)?)/;

            let matchLength = 0;
            if (mixedRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(mixedRegex)[0].length;
            else if (fractionRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(fractionRegex)[0].length;
            else if (numberRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(numberRegex)[0].length;

            if (matchLength > 0) {
                // Carefully slice to keep original whitespace structure if necessary, though trim() usage might affect it. 
                // Simple replacement at start of string:
                return formattedNewQty + ingredient.trim().substring(matchLength);
            }
        }
        return ingredient;
    }

    return ingredient;
};
