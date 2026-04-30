import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCountryFlag } from "@/lib/country-flag";

export const dynamic = "force-dynamic";

type FounderRecord = {
  id: string | number;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  company: string | null;
  profile_picture: string | null;
  current_country: string | null;
  company_industry: string | null;
  company_size: string | null;
  role_type: string | null;
  highest_education: string | null;
  [key: string]: unknown;
};

const MISSING_VALUE_TOKENS = new Set([
  "",
  "not found",
  "n/a",
  "na",
  "none",
  "unknown",
  "—",
  "-",
]);

function isMissing(v: string | null | undefined): boolean {
  if (v == null) return true;
  return MISSING_VALUE_TOKENS.has(v.trim().toLowerCase());
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

function getInitials(f: {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
}) {
  const first = f.first_name?.trim();
  const last = f.last_name?.trim();
  if (first || last) {
    return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
  }
  const parts = (f.full_name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default async function FounderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("founders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const f = data as FounderRecord;

  const linkedinUrl = pickFirstString(f, [
    "linkedin_profile_url",
    "linkedin_url",
    "linkedin",
    "linkedIn",
    "linkedin_link",
  ]);
  const companyDescription = pickFirstString(f, [
    "company_description",
    "description",
    "company_about",
    "about_company",
  ]);
  const companyLogo = pickFirstString(f, [
    "company_logo",
    "company_logo_url",
    "logo",
    "logo_url",
    "company_image",
  ]);

  return (
    <div className="min-h-screen bg-bg text-bone flex flex-col">
      {/* Top bar */}
      <header className="border-b border-rule bg-bg">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between gap-4 px-5 lg:px-10 py-4">
          <Wordmark />
          <Link
            href="/the-index"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 hover:text-gold transition-colors inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to index</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 lg:px-12 pt-12 lg:pt-16 pb-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
          Profile
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-start gap-8 lg:gap-12">
          <Avatar founder={f} />
          <div className="flex-1 min-w-0">
            <h1
              className="font-serif text-bone leading-[1.02] tracking-[-0.01em]"
              style={{ fontSize: "clamp(40px, 5vw, 72px)" }}
            >
              {f.full_name ?? "Unnamed founder"}
            </h1>
            {(f.title || f.company) && (
              <p className="mt-4 font-sans text-[17px] lg:text-[18px] text-bone-2 leading-snug">
                {f.title && <em className="italic">{f.title}</em>}
                {f.title && f.company && <span> · </span>}
                {f.company && <span>{f.company}</span>}
              </p>
            )}
            {!isMissing(f.current_country) && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-bone-3 inline-flex items-center gap-2">
                {getCountryFlag(f.current_country) && (
                  <span className="text-base normal-case tracking-normal not-italic">
                    {getCountryFlag(f.current_country)}
                  </span>
                )}
                <span>{f.current_country}</span>
              </p>
            )}
            {linkedinUrl && !isMissing(linkedinUrl) && (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-10 border border-gold px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-bg transition-colors"
              >
                <span>LinkedIn</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="mx-auto w-full max-w-5xl px-6 lg:px-12 py-10 border-t border-rule">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 mb-8">
          Details
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          <Meta label="Industry" value={f.company_industry} />
          <Meta label="Highest education" value={f.highest_education} />
          <Meta label="Company size" value={f.company_size} />
          <Meta
            label="Role type"
            value={
              f.role_type && f.role_type.trim().toLowerCase() === "unknown"
                ? "Undetermined"
                : f.role_type
            }
          />
        </dl>
      </section>

      {/* Company */}
      {(f.company || companyDescription || companyLogo) && (
        <section className="mx-auto w-full max-w-5xl px-6 lg:px-12 py-10 border-t border-rule">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 mb-8">
            Company
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-6 lg:gap-8">
            {companyLogo && !isMissing(companyLogo) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt={f.company ? `${f.company} logo` : "Company logo"}
                className="h-20 w-20 lg:h-24 lg:w-24 rounded-md object-contain bg-bg-2 border border-rule p-2 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {f.company && (
                <h3 className="font-serif text-bone text-[24px] lg:text-[28px] leading-tight">
                  {f.company}
                </h3>
              )}
              {companyDescription && !isMissing(companyDescription) ? (
                <p className="mt-3 font-sans text-[15px] lg:text-[16px] text-bone-2 leading-relaxed max-w-[65ch]">
                  {companyDescription}
                </p>
              ) : (
                <p className="mt-3 font-sans text-[14px] italic text-bone-3">
                  No company description provided.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-rule mt-auto">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-12 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-3">
            © 2026 · The Indian Diaspora Index
          </p>
          <Link
            href="/the-index"
            className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-3 hover:text-gold transition-colors"
          >
            Browse all entries →
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Avatar({ founder }: { founder: FounderRecord }) {
  if (founder.profile_picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={founder.profile_picture}
        alt={founder.full_name ?? "Founder"}
        className="h-32 w-32 lg:h-40 lg:w-40 rounded-full object-cover border border-rule shrink-0"
      />
    );
  }
  return (
    <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full bg-bg-2 border border-rule flex items-center justify-center shrink-0">
      <span className="font-serif text-bone-3 text-4xl leading-none">
        {getInitials(founder)}
      </span>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const missing = isMissing(value);
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3">
        {label}
      </dt>
      <dd
        className={`mt-1.5 font-sans text-[15px] lg:text-[16px] ${
          missing ? "text-bone-3 italic" : "text-bone"
        }`}
      >
        {missing ? "Not provided" : value}
      </dd>
    </div>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <Crest />
      <span className="font-serif text-bone text-lg tracking-tight leading-none">
        The Indian Diaspora{" "}
        <span className="italic text-gold">Index</span>
      </span>
    </Link>
  );
}

function Crest({ size = 26 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-gold text-gold"
      style={{ height: size, width: size }}
    >
      <span
        className="font-serif italic leading-none"
        style={{ fontSize: size * 0.55, transform: "translateY(-1px)" }}
      >
        i
      </span>
    </span>
  );
}
