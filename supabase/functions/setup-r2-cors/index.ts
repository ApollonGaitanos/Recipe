
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "npm:@aws-sdk/client-s3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        return new Response(
            JSON.stringify({ error: "Missing R2 Environment Variables" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const S3 = new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        if (req.method === 'GET') {
            console.log(`Checking CORS for bucket: ${R2_BUCKET_NAME}`);
            try {
                const data = await S3.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET_NAME }));
                return new Response(
                    JSON.stringify({ message: "Current CORS Configuration", rules: data.CORSRules }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            } catch (err) {
                if (err.name === 'NoSuchCORSConfiguration') {
                    return new Response(
                        JSON.stringify({ message: "No CORS Configuration found for this bucket." }),
                        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
                throw err;
            }
        }

        if (req.method === 'POST') {
            console.log(`Setting CORS for bucket: ${R2_BUCKET_NAME}`);

            const command = new PutBucketCorsCommand({
                Bucket: R2_BUCKET_NAME,
                CORSConfiguration: {
                    CORSRules: [
                        {
                            AllowedHeaders: ["*"],
                            AllowedMethods: ["PUT", "POST", "GET", "DELETE", "HEAD"],
                            AllowedOrigins: ["*"], // Verify this is applied
                            ExposeHeaders: ["ETag"],
                            MaxAgeSeconds: 3000,
                        },
                    ],
                },
            });

            await S3.send(command);
            console.log("CORS configuration applied successfully.");

            return new Response(
                JSON.stringify({ message: "CORS configuration applied successfully to R2 bucket." }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                },
            );
        }

        return new Response("Method not allowed", { status: 405, headers: corsHeaders });

    } catch (error) {
        console.error("Error setting/getting CORS:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal Server Error" }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        );
    }
});
