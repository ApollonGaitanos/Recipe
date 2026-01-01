// --- Helper Functions (Hoisted) ---

async function extractWithAI(input) {
    const { supabase } = await import('../supabaseClient');

    // Construct body based on input type
    const body = typeof input === 'string'
        ? { text: input }
        : { ...input };

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

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
        if (data.error) throw new Error(data.error);
        return data;

    } catch (networkError) {
        console.error("Network/Fetch Error:", networkError);
        throw new Error(`Network Error: ${networkError.message}`);
    }
}

// --- Main Export ---

export const parseRecipe = async (input, language = 'en', taskMode = 'extract') => {
    // Validate input
    if (!input) throw new Error('Please provide some recipe text or image to parse');

    const isImage = typeof input === 'object' && input.imageBase64;
    const isCreateMode = taskMode === 'create';

    if (!isImage && !isCreateMode && (typeof input !== 'string' || !input.trim())) {
        throw new Error('Invalid input provided');
    }

    const trimmedInput = isImage ? null : (typeof input === 'string' ? input.trim() : '');

    try {
        // Construct payload
        let payload = {};
        if (isImage) {
            payload = { ...input, targetLanguage: language, mode: taskMode };
        } else if (typeof input === 'string') {
            const urlRegex = /^(http|https):\/\/[^ "]+$/;

            // If it's a URL in extract mode, pass it as 'url'
            if (urlRegex.test(trimmedInput) && !isCreateMode) {
                payload = { url: trimmedInput, targetLanguage: language, mode: taskMode };
            } else {
                // Fix for Backend 10-char limit: Prepend context for short create prompts
                const finalText = isCreateMode ? `Create a recipe for: ${trimmedInput}` : trimmedInput;
                payload = { text: finalText, targetLanguage: language, mode: taskMode };
            }
        } else {
            payload = { ...input, targetLanguage: language, mode: taskMode };
        }

        console.log(`🧠 AI Processing (${taskMode})...`);
        const aiResult = await extractWithAI(payload);

        if (aiResult) {
            console.log(`✅ AI Success`);
            return aiResult;
        } else {
            throw new Error("AI returned empty result");
        }

    } catch (aiError) {
        console.error(`AI processing (${taskMode}) failed:`, aiError);
        throw new Error(`AI processing failed: ${aiError.message}`);
    }
};
