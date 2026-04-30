import { supabase } from "@/lib/supabase";
import LandingPage from "./_components/landing-page";
import type { Founder } from "./_components/founder-index";

export const dynamic = "force-dynamic";

const FOUNDER_FIELDS =
  "id, full_name, first_name, last_name, title, company, profile_picture, current_country, company_industry, company_size, role_type, highest_education";

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
      .order("full_name", { ascending: true })
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
