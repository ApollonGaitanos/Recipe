import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
            temperature: 0.2, // Low temperature for consistent, factual extraction
            topP: 0.8,
            topK: 40,
        }
    });

    try {
        const fullPrompt = systemInstruction
            ? `${systemInstruction}\n\n${prompt}`
            : prompt;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error(`AI processing failed: ${error.message}`);
    }
}

export function parseJSONResponse(text: string): any {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid JSON response from AI');
    }
}
