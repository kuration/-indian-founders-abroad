import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazily instantiate the client so importing this module never throws at
// build time (e.g. during `next build` page-data collection, when env vars
// may be absent). The client is only created on first actual use at request
// time, which is correct for the force-dynamic pages that consume it.
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    )
  }

  client = createClient(supabaseUrl, supabaseKey)
  return client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const c = getClient()
    const value = Reflect.get(c, prop, receiver)
    return typeof value === 'function' ? value.bind(c) : value
  },
})

// Only these (known founder/CEO) role types belong in the index.
// Unknown, NULL, and Hired CEO are intentionally excluded.
export const ALLOWED_ROLE_TYPES = [
  "Founder",
  "Co-Founder",
  "Co-Founder & CEO",
  "Chairman & CEO",
  "Chief Executive Officer",
]
