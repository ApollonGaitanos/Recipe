# AI Features Setup - Google Gemini Integration

## Overview
This project now includes two AI-powered features using Google Gemini:
1. **Smart Recipe Import** - Extract recipes from URLs or text
2. **Intelligent Portion Scaling** - Automatically adjust ingredient quantities

## Prerequisites
1. A Supabase project (you already have one)
2. Supabase CLI installed: `npm install -g supabase`
3. Google Gemini API key from https://aistudio.google.com/app/apikey

## Setup Instructions

### Step 1: Get Your Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (it looks like: `AIzaSy...`)

### Step 2: Link Your Supabase Project
```bash
# From your project root
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in your Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

### Step 3: Set the API Key as a Secret
```bash
supabase secrets set GEMINI_API_KEY=YOUR_API_KEY_HERE
```

### Step 4: Deploy the Edge Functions
```bash
# Deploy both functions
supabase functions deploy extract-recipe
supabase functions deploy scale-recipe
```

### Step 5: Test It Out!
1. Open your app
2. Click "Add Recipe"
3. Click the "Magic Import" button (✨)
4. Try pasting a recipe URL or text
5. Try the "Adjust" button next to servings to scale portions!

## How It Works

### Extract Recipe Function
- **Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/extract-recipe`
- **Input**: `{ source: "url or text", type: "url" | "text" }`
- **Output**: Structured recipe data (title, ingredients, instructions, etc.)

### Scale Recipe Function  
- **Endpoint**: `https://YOUR_PROJECT.supabase.co/functions/v1/scale-recipe`
- **Input**: `{ ingredients, currentServings, targetServings }`
- **Output**: Scaled ingredient list

## Costs
- **Free Tier**: 15 requests/min, 1500 requests/day
- **Typical Usage**: 
  - Recipe import: ~1 request
  - Portion scaling: ~1 request
- **Monthly estimate (100 imports + 50 scales)**: FREE or ~$0.05

## Troubleshooting

### "GEMINI_API_KEY not configured"
Make sure you set the secret: `supabase secrets set GEMINI_API_KEY=...`

### "Failed to extract recipe"
- Check that the URL is publicly accessible
- Try with direct text instead
- Some websites may block automated access

### Edge functions not working
1. Check they're deployed: `supabase functions list`
2. Check logs: `supabase functions logs extract-recipe`
3. Verify your API key is valid at https://aistudio.google.com/app/apikey

## Local Development (Optional)

To test functions locally:

```bash
# Set env var locally
export GEMINI_API_KEY=your_key_here

# Start local Edge Functions server
supabase functions serve

# Test in another terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/extract-recipe' \
  --header 'Content-Type: application/json' \
  --data '{"source":"https://example.com/recipe","type":"url"}'
```

## Files Created
- `supabase/functions/_shared/gemini.ts` - Shared Gemini API client
- `supabase/functions/extract-recipe/index.ts` - Recipe extraction function
- `supabase/functions/scale-recipe/index.ts` - Portion scaling function
- `src/components/PortionScalingModal.jsx` - Portion scaling UI
- Updated `src/components/MagicImportModal.jsx` - AI-powered import
- Updated `src/components/RecipeForm.jsx` - Added "Adjust" button
