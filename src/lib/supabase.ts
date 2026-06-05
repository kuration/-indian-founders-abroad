import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Only these (known founder/CEO) role types belong in the index.
// Unknown, NULL, and Hired CEO are intentionally excluded.
export const ALLOWED_ROLE_TYPES = [
  "Founder",
  "Co-Founder",
  "Co-Founder & CEO",
  "Chairman & CEO",
  "Chief Executive Officer",
]
