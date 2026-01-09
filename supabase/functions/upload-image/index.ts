
import { S3Client } from "npm:@aws-sdk/client-s3";
import { createPresignedPost } from "npm:@aws-sdk/s3-presigned-post";
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
        const body = await req.json();
        const { filename, filetype, filesize } = body;

        // 3. Strict Input Validation (SECURITY FIX)
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

        // Basic Validation
        if (!filename || !filetype || !ALLOWED_MIME_TYPES.includes(filetype)) {
            return new Response(
                JSON.stringify({ error: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }

        if (!filesize || typeof filesize !== 'number' || filesize > MAX_FILE_SIZE) {
            return new Response(
                JSON.stringify({ error: "Invalid file size. Max limit is 5MB." }),
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
            throw new Error("Server Configuration Error: Missing R2 credentials");
        }

        const S3 = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        const key = `recipes/${crypto.randomUUID()}-${filename}`;

        // 4. Generate Presigned POST Policy (Flooding Protection)
        // This enforces content-length-range on the server side (R2)
        const { url, fields } = await createPresignedPost(S3, {
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Conditions: [
                ['content-length-range', 0, MAX_FILE_SIZE], // Strict Size Limit
                ['eq', '$Content-Type', filetype], // Strict Type Limit
            ],
            Fields: {
                // Determine Success Status (204 is common for CORS usage)
                success_action_status: '201',
                'Content-Type': filetype,
            },
            Expires: 600, // 10 minutes
        });

        const publicUrl = `https://pub-b961e51ead5a440db1b7069b36b1e006.r2.dev/${key}`;

        return new Response(
            JSON.stringify({
                uploadUrl: url,
                fields: fields,
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
