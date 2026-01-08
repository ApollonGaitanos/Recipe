
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Log the incoming request method
    console.log(`[Edge Function] Received ${req.method} request`);

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        console.log('[Edge Function] Handling OPTIONS request');
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Authentication (Manual JWT Check)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("[Edge Function] Missing Authorization header");
            return new Response(
                JSON.stringify({ error: "Unauthorized: Missing token" }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log("[Edge Function] Verifying JWT...");
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            console.error("[Edge Function] Invalid Token:", authError);
            return new Response(
                JSON.stringify({ error: "Unauthorized: Invalid token" }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[Edge Function] User authenticated: ${user.id}`);


        // 2. Parse Request Body
        console.log("[Edge Function] Reading request body...");
        const body = await req.json(); // Read once
        console.log("[Edge Function] Request body:", JSON.stringify(body));

        const { filename, filetype } = body;

        // Basic Validation
        if (!filename || !filetype) {
            console.error("[Edge Function] Missing filename or filetype");
            return new Response(
                JSON.stringify({ error: "Missing filename or filetype" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        // Environment Variable Check
        const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
        const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
        const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
        const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
            console.error("[Edge Function] Missing R2 Environment Variables");
            return new Response(
                JSON.stringify({ error: "Server Configuration Error: Missing R2 credentials" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        console.log("[Edge Function] Initializing S3 Client...");
        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            forcePathStyle: true,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        // Use User ID in filename for basic path isolation (optional but good practice)
        // const key = `recipes/${user.id}/${crypto.randomUUID()}-${filename}`;
        // Staying consistent with current single folder structure for now
        const key = `recipes/${crypto.randomUUID()}-${filename}`;
        console.log(`[Edge Function] Generated key: ${key}`);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: filetype,
        });

        console.log("[Edge Function] Generating presigned URL...");
        const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
        console.log("[Edge Function] Presigned URL generated successfully.");

        const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;

        return new Response(
            JSON.stringify({
                uploadUrl: presignedUrl,
                publicUrl: publicUrl,
                key: key
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );

    } catch (error) {
        console.error("[Edge Function] Critical Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }
});
