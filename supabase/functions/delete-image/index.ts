
import { S3Client, DeleteObjectCommand } from "npm:@aws-sdk/client-s3";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Validate Auth (Manual Verification for Security)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Get the user from the JWT
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', details: authError }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Parse Request
        const { recipeId, imageUrl } = await req.json();

        if (!recipeId || !imageUrl) {
            return new Response(
                JSON.stringify({ error: 'Missing recipeId or imageUrl' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[delete-image] User ${user.email} requesting delete for recipe ${recipeId}`);

        // 3. Verify Ownership & Get Recipe Data
        // uses the Service Role logic? No, we should use the CLIENT's permissions effectively, 
        // OR use Service Role but manually check user_id. 
        // Using standard client might be restricted by RLS if we are doing complex things?
        // Actually, to update the row, the user needs RLS permission. 
        // But to call R2, we need env vars.
        // Let's stick to the pattern: Fetch recipe as anon (or service?) to check owner.
        // Better: Fetch recipe and check user_id manually to be absolutely safe against RLS bypasses (though unlikely here).

        const { data: recipe, error: dbError } = await supabase
            .from('recipes')
            .select('user_id, image_url')
            .eq('id', recipeId)
            .single();

        if (dbError || !recipe) {
            return new Response(
                JSON.stringify({ error: 'Recipe not found or access denied' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // STRICT OWNERSHIP CHECK
        if (recipe.user_id !== user.id) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: You do not own this recipe' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // INTEGRITY CHECK
        if (recipe.image_url !== imageUrl) {
            // STRICT SECURITY: Only allow deleting the currently attached image.
            console.error(`[delete-image] Blocked attempt to delete unmatched image. Recipe: ${recipeId}, Request: ${imageUrl}, DB: ${recipe.image_url}`);

            return new Response(
                JSON.stringify({ error: 'Forbidden: You can only delete the active recipe image' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Extract Key from URL
        // URL format: https://pub-....r2.dev/UUID-filename.jpg
        // We need just the "UUID-filename.jpg" part.
        const urlObj = new URL(imageUrl);
        const key = urlObj.pathname.substring(1); // remove leading slash

        if (!key) {
            throw new Error('Could not parse key from URL');
        }

        // 5. Delete from R2
        const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
        const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
        const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
        const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        console.log(`[delete-image] Deleting object key: ${key}`);

        await S3.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        }));

        // 6. Update Database (Clear image_url)
        // We use the Service Role to ensure this write happens regardless of complex RLS, 
        // though we ALREADY verified ownership above.
        // Actually, just using the same 'supabase' client (which is anon?) might fail if RLS is strict.
        // But 'supabase' initialized with ANON key acts as the user IF we set session? 
        // No, we didn't set session. We just got 'user' from `getUser(token)`.
        // To update, we should probably use a Service Role client for the DB operation to ensure reliability,
        // since we have already performed the "Security Gatekeeping" manually.

        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { error: updateError } = await supabaseAdmin
            .from('recipes')
            .update({ image_url: null })
            .eq('id', recipeId);

        if (updateError) {
            throw updateError;
        }

        return new Response(
            JSON.stringify({ message: 'Image deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[delete-image] Error:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
