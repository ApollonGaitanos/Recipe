
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.454.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.454.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { filename, filetype } = await req.json();

        if (!filename || !filetype) {
            throw new Error("Missing filename or filetype");
        }

        const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
        const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
        const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
        const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
            throw new Error("Missing R2 configuration");
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

        // Generate Pre-signed URL for PUT
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: filetype,
        });

        const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 3600 });
        const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`; // Or custom domain if set

        return new Response(
            JSON.stringify({
                uploadUrl: presignedUrl,
                publicUrl: publicUrl, // Note: This assumes 'r2.dev' or user has to map it. 
                // Ideally user maps a domain, but for now we construct a likely one or ask user.
                // Actually better to just return the Key and let frontend construct if needed, 
                // or just return the URL if the bucket is public.
                // R2 buckets are private by default, public access needs a domain.
                // Assuming the user will allow public access to this bucket.
                // Let's rely on a variable or default to generic.
                key: key
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }
});
