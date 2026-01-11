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

    try {
        // Use supabase.functions.invoke for automatic auth handling (User Token or Anon Key)
        // This solves "Invalid JWT" issues by ensuring the client handles header attachment and refreshing.
        // Explicitly get session to ensure we are sending the User Token, not Anon Key.
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {};

        const { data, error } = await supabase.functions.invoke('ai-extract-recipe', {
            body: body,
            headers: headers
        });

        if (error) {
            console.error('Edge Function Error:', error);
            // If it's a context/response error, try to extract details
            const message = error.context?.json ? (await error.context.json()).error : error.message;
            throw new Error(message || 'Unknown Edge Function Error');
        }

        if (!data) throw new Error('AI returned empty response');
        if (data.error) throw new Error(data.error);

        return data;

    } catch (err) {
        console.error("AI Invoke Error:", err);
        throw new Error(`AI Service Error: ${err.message}`);
    }
}

// --- Main Export ---

export const parseRecipe = async (input, language = 'en', taskMode = 'extract') => {
    // Validate input
    if (!input) throw new Error('Please provide some recipe text or image to parse');

    const isImage = typeof input === 'object' && input.imageBase64;
    const isCreateMode = taskMode === 'create';

    const isObjectWithText = typeof input === 'object' && input.text;

    if (!isImage && !isCreateMode && (typeof input !== 'string' || !input.trim()) && !isObjectWithText) {
        throw new Error('Invalid input provided');
    }

    const trimmedInput = isImage ? null : (typeof input === 'string' ? input.trim() : (input.text || ''));

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
