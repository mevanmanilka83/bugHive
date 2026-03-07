import { createClient } from "@supabase/supabase-js"
import { env } from "./environment"

function getSupabaseUrl(): string {
    const url = env.supabaseUrl
    if (!url) {
        if (typeof window !== 'undefined') {
            return 'https://placeholder.supabase.co'
        }
        throw new Error('SUPABASE_URL environment variable is not set')
    }
    return url
}

function getSupabaseKey(): string {
    const key = env.supabaseServiceKey || env.supabaseAnonKey
    if (!key) {
        if (typeof window !== 'undefined') {
            return 'placeholder-key'
        }
        throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is not set')
    }
    return key
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = getSupabaseKey()

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin(): ReturnType<typeof createClient> {
    if (typeof window !== 'undefined') {
        throw new Error('getSupabaseAdmin() must only be used on the server')
    }
    const serviceKey = env.supabaseServiceKey
    if (!serviceKey || !serviceKey.trim()) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations that bypass RLS (e.g. voting). ' +
            'Set it in your environment. Find it in Supabase Dashboard → Settings → API.'
        )
    }
    if (serviceKey.startsWith('sb_publishable_')) {
        throw new Error(
            'SUPABASE_SERVICE_ROLE_KEY must be the service_role secret (long JWT starting with eyJ...), not the publishable key. ' +
            'In Supabase Dashboard → Settings → API, use the "service_role" key (click Reveal), not the anon/publishable key.'
        )
    }
    if (!_supabaseAdmin) {
        _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })
    }
    return _supabaseAdmin
}
