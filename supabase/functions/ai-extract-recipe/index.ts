import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        })
    }

    try {
        const { text } = await req.json()

        // Validate input
        if (!text || typeof text !== 'string' || text.trim().length < 10) {
            throw new Error('Please provide recipe text (at least 10 characters)')
        }

        // Get Gemini API key from environment
        const apiKey = Deno.env.get('GEMINI_API_KEY')
        if (!apiKey) {
            throw new Error('Gemini API key not configured')
        }

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Extract recipe data from this text and return ONLY valid JSON with this exact structure:
{
  "title": "Recipe Title",
  "ingredients": "ingredient 1\\ningredient 2\\ningredient 3",
  "instructions": "step 1\\nstep 2\\nstep 3",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "tags": "dinner, italian"
}

Rules:
- ingredients: newline-separated list
- instructions: newline-separated steps
- prepTime/cookTime: numbers in minutes (0 if not mentioned)
- servings: number (0 if not mentioned)
- tags: comma-separated categories
- Return ONLY the JSON, no markdown, no explanation

Recipe text:
${text}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1000,
                    }
                })
            }
        )

        if (!geminiResponse.ok) {
            const error = await geminiResponse.text()
            console.error('Gemini API error:', error)
            throw new Error(`Gemini API failed: ${geminiResponse.statusText}`)
        }

        const geminiData = await geminiResponse.json()
        const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

        if (!aiResponse) {
            throw new Error('No response from Gemini AI')
        }

        // Parse AI response
        let recipeData
        try {
            // Remove markdown code blocks if present
            const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
            recipeData = JSON.parse(cleanJson)
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', aiResponse)
            throw new Error('AI returned invalid JSON')
        }

        // Validate required fields
        if (!recipeData.title) {
            throw new Error('AI could not extract a recipe title')
        }

        // Return the extracted recipe
        return new Response(JSON.stringify({
            ...recipeData,
            // Ensure proper types
            prepTime: parseInt(recipeData.prepTime) || 0,
            cookTime: parseInt(recipeData.cookTime) || 0,
            servings: parseInt(recipeData.servings) || 0,
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })

    } catch (error) {
        console.error('AI Extract Recipe Error:', error)
        return new Response(JSON.stringify({
            error: error.message || 'Failed to extract recipe with AI'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })
    }
})
