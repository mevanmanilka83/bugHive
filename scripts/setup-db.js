require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS public.bug_relationships (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      source_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
      target_id UUID NOT NULL REFERENCES public.bugs(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      confidence NUMERIC NOT NULL DEFAULT 1.0,
      origin TEXT NOT NULL DEFAULT 'manual',
      evidence_ref TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(source_id, target_id, type)
    );
  `;
    // Using Prisma if available or standard fetch if run_sql doesn't exist
    // actually there's no way to run arbitrary DDL SQL via pgrest easily without a predefined rpc function.
    // We'll see if `run_sql` exists from a previous step.
    const { data, error } = await supabase.rpc('run_sql', { sql: query });

    if (error) {
        console.error("RPC Error (may not exist):", error.message);
    } else {
        console.log("Table check passed via RPC.");
    }
}

createTable();
