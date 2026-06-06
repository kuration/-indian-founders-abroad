import { supabase, ALLOWED_ROLE_TYPES } from "@/lib/supabase";
import LandingPage from "./_components/landing-page";
import type { Founder } from "./_components/founder-index";

export const dynamic = "force-dynamic";

const FOUNDER_FIELDS =
  "id, full_name, first_name, last_name, title, company, profile_picture, company_logo, current_country, company_industry, company_size, role_type, highest_education, created_at";

const PAGE_SIZE = 1000;

async function fetchAllFounders(): Promise<{
  data: Founder[];
  error: { message: string } | null;
}> {
  const all: Founder[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("founders")
      .select(FOUNDER_FIELDS)
      .ilike("verified", "%verified%")
      .in("role_type", ALLOWED_ROLE_TYPES)
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) return { data: [], error };
    if (!data || data.length === 0) break;

    all.push(...(data as Founder[]));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return { data: all, error: null };
}

export default async function Home() {
  const { data: founders, error } = await fetchAllFounders();

  if (error) {
    return (
      <main className="min-h-screen bg-bg text-bone flex items-center justify-center px-6">
        <p className="font-mono text-sm uppercase tracking-[0.18em] text-gold">
          Error loading founders: {error.message}
        </p>
      </main>
    );
  }

  return <LandingPage founders={founders} />;
}
