/* eslint-disable no-undef */
import { createClient } from 'jsr:@supabase/supabase-js@2'

export function createAdminClient() {
    return createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
}
