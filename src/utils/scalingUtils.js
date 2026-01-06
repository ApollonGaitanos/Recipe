/**
 * Parses a string to extract the quantity.
 * Supports:
 * - Mixed fractions: "1 1/2 cups" -> 1.5
 * - Simple fractions: "1/2 cup" -> 0.5
 * - Decimals/Integers: "1.5" or "2"
 * - Ranges: "1-2 cups" -> 1 (Parses the first number found)
 */
export const parseQuantity = (str) => {
    if (typeof str !== 'string') return null;

    const trimmed = str.trim();

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
            const mixedRegex = /^(\d+)\s+(\d+)\/(\d+)/;
            const fractionRegex = /^(\d+)\/(\d+)/;
            const numberRegex = /^(\d+(\.\d+)?)/;

            let matchLength = 0;
            if (mixedRegex.test(ingredient.trim())) matchLength = ingredient.trim().match(mixedRegex)[0].length;
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
