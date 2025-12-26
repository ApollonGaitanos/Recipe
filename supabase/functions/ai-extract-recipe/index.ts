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

        // Get OpenAI API key from environment
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: `You are a recipe extraction assistant. Extract recipe data from any format (messy notes, OCR text, screenshots, etc.) and return ONLY valid JSON with this exact structure:
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
- Return ONLY the JSON, no markdown, no explanation`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000,
            })
        })

        if (!openaiResponse.ok) {
            const error = await openaiResponse.text()
            console.error('OpenAI API error:', error)
            throw new Error(`OpenAI API failed: ${openaiResponse.statusText}`)
        }

        const openaiData = await openaiResponse.json()
        const aiResponse = openaiData.choices[0]?.message?.content

        if (!aiResponse) {
            throw new Error('No response from AI')
        }

        // Parse AI response
        let recipeData
        try {
            // Remove markdown code blocks if present
            const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
            recipeData = JSON.parse(cleanJson)
        } catch (parseError) {
            console.error('Failed to parse AI response:', aiResponse)
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
