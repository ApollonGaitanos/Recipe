import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"

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
        const { url } = await req.json()

        // Validate URL
        if (!url || typeof url !== 'string') {
            throw new Error('URL is required')
        }

        // Fetch the recipe page
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)',
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.statusText}`)
        }

        const html = await response.text()
        const doc = new DOMParser().parseFromString(html, 'text/html')

        if (!doc) {
            throw new Error('Failed to parse HTML')
        }

        // Try JSON-LD first (most reliable)
        const jsonLdData = extractJsonLd(doc)
        if (jsonLdData) {
            return new Response(JSON.stringify(jsonLdData), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }

        // Fallback to microdata/schema.org
        const microdataResult = extractMicrodata(doc)
        if (microdataResult) {
            return new Response(JSON.stringify(microdataResult), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }

        // Last resort: HTML pattern matching
        throw new Error('Could not find structured recipe data on this page')

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message || 'Failed to scrape recipe'
        }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })
    }
})

// Extract JSON-LD structured data
function extractJsonLd(doc: any) {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]')

    for (const script of scripts) {
        try {
            const json = JSON.parse(script.textContent)
            const recipe = findRecipe(json)

            if (recipe) {
                return parseJsonLdRecipe(recipe)
            }
        } catch (e) {
            console.error('JSON-LD parse error:', e)
        }
    }

    return null
}

// Recursively find Recipe object in JSON-LD
function findRecipe(obj: any): any {
    if (!obj) return null

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const found = findRecipe(item)
            if (found) return found
        }
        return null
    }

    if (obj['@graph']) {
        return findRecipe(obj['@graph'])
    }

    const type = obj['@type']
    if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) {
        return obj
    }

    return null
}

// Parse JSON-LD Recipe object
function parseJsonLdRecipe(data: any) {
    const parseDuration = (iso: string) => {
        if (!iso) return ''
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i)
        if (!match) return ''
        const hours = parseInt(match[1] || '0')
        const mins = parseInt(match[2] || '0')
        return hours * 60 + mins
    }

    const cleanList = (list: any) => {
        if (!list) return ''
        if (typeof list === 'string') return list
        if (Array.isArray(list)) return list.join('\n')
        return ''
    }

    const extractInstructions = (inst: any) => {
        if (!inst) return ''
        if (typeof inst === 'string') return inst
        if (Array.isArray(inst)) {
            return inst.map(i => {
                if (typeof i === 'string') return i
                return i.text || i.name || ''
            }).filter(t => t).join('\n')
        }
        if (inst.text) return inst.text
        return ''
    }

    return {
        title: data.name || '',
        prepTime: parseDuration(data.prepTime) || '',
        cookTime: parseDuration(data.cookTime) || '',
        servings: parseInt(data.recipeYield) || '',
        ingredients: cleanList(data.recipeIngredient),
        instructions: extractInstructions(data.recipeInstructions),
        tags: data.recipeCategory ? [data.recipeCategory].flat().join(', ') : ''
    }
}

// Extract microdata/schema.org markup
function extractMicrodata(doc: any) {
    const recipeDiv = doc.querySelector('[itemtype*="schema.org/Recipe"]')
    if (!recipeDiv) return null

    const getProp = (name: string) => {
        const el = recipeDiv.querySelector(`[itemprop="${name}"]`)
        return el?.textContent?.trim() || ''
    }

    const getListProp = (name: string) => {
        const elements = recipeDiv.querySelectorAll(`[itemprop="${name}"]`)
        return Array.from(elements).map((el: any) => el.textContent?.trim()).filter(Boolean).join('\n')
    }

    const parseDuration = (text: string) => {
        const match = text.match(/(\d+)\s*(hour|hr|h|minute|min|m)/i)
        if (!match) return ''
        const val = parseInt(match[1])
        const unit = match[2].toLowerCase()
        if (unit.startsWith('h')) return val * 60
        return val
    }

    return {
        title: getProp('name'),
        prepTime: parseDuration(getProp('prepTime')) || '',
        cookTime: parseDuration(getProp('cookTime')) || '',
        servings: getProp('recipeYield'),
        ingredients: getListProp('recipeIngredient'),
        instructions: getListProp('recipeInstructions'),
        tags: getProp('recipeCategory')
    }
}
