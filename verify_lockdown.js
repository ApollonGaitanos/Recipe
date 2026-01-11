import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'; // Try to load .env if available, or just use process.env

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; // React App usually has VITE_ prefix
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Missing Environment Variables. Please run with env vars set.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Testing strict lockdown of 'recipe_signals' for ANON user...");

async function test() {
    const { data, error } = await supabase
        .from('recipe_signals')
        .select('*')
        .limit(1);

    if (error) {
        // We EXPECT an error (401 or similar)
        // Actually, RLS usually returns empty list [] if user has no access but SELECT is allowed.
        // But we REVOKED SELECT. So we expect a PG error or Supabase error.
        console.log("✅ SUCCESS: Access denied as expected.");
        console.log(`Error: ${error.message} (Code: ${error.code})`);
    } else {
        // If we get data, it's a fail.
        // If we get empty list [], checking if it's because of RLS or open access.
        // If REVOKE worked, we should NOT get 200 OK.
        console.error("❌ FAILURE: Access should be denied but returned data or empty list (Status 200).");
        console.log("Data:", data);
    }
}

test();
