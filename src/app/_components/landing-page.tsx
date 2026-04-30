"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Founder } from "./founder-index";
import { getCountryFlag } from "@/lib/country-flag";

const TOP_SECTOR_COUNT = 6;
const TOP_DESTINATIONS_COUNT = 8;

const MISSING_VALUE_TOKENS = new Set([
  "",
  "not found",
  "not Found",
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

function normalize(v: string): string {
  return v.trim().replace(/\s+/g, " ");
}

export default function LandingPage({ founders }: { founders: Founder[] }) {
  const grandTotal = founders.length;

  const topSectors = useMemo(() => {
    const freq = new Map<string, number>();
    for (const f of founders) {
      if (!isMissing(f.company_industry)) {
        const v = normalize(f.company_industry as string);
        freq.set(v, (freq.get(v) ?? 0) + 1);
      }
    }
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_SECTOR_COUNT)
      .map(([name]) => name);
  }, [founders]);

  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(
    new Set()
  );

  const filtered = useMemo(() => {
    if (selectedSectors.size === 0) return founders;
    return founders.filter(
      (f) =>
        !isMissing(f.company_industry) &&
        selectedSectors.has(normalize(f.company_industry as string))
    );
  }, [founders, selectedSectors]);

  const total = filtered.length;

  const countryFreq = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of filtered) {
      if (!isMissing(f.current_country)) {
        const v = normalize(f.current_country as string);
        m.set(v, (m.get(v) ?? 0) + 1);
      }
    }
    return m;
  }, [filtered]);

  const sortedDestinations = useMemo(() => {
    return Array.from(countryFreq.entries()).sort((a, b) => b[1] - a[1]);
  }, [countryFreq]);

  const topCountry = sortedDestinations[0]?.[0] ?? null;
  const topCount = sortedDestinations[0]?.[1] ?? 0;
  const topPercent = total > 0 ? Math.round((topCount / total) * 100) : 0;
  const totalCountries = countryFreq.size;

  const visibleDestinations = sortedDestinations.slice(
    0,
    TOP_DESTINATIONS_COUNT
  );
  const maxDestinationCount = visibleDestinations[0]?.[1] ?? 1;

  function toggleSector(sector: string) {
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  }

  function reset() {
    setSelectedSectors(new Set());
  }

  const anyActive = selectedSectors.size > 0;

  return (
    <div className="min-h-screen bg-bg text-bone flex flex-col">
      {/* Top bar */}
      <header className="border-b border-rule bg-bg">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-5 lg:px-10 py-4">
          <Wordmark />
          <Link
            href="/the-index"
            className="hidden sm:inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 hover:text-gold transition-colors"
          >
            <span>Browse the index</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-14 lg:pt-24 pb-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold inline-flex items-center gap-3">
          <span aria-hidden="true" className="inline-block w-8 h-px bg-gold" />
          The definitive record of Indian-origin CEOs, founders, and global
          business architects.
        </p>
        <h1
          className="mt-6 font-serif text-bone leading-[0.98] tracking-[-0.02em] max-w-5xl"
          style={{ fontSize: "clamp(48px, 6vw, 96px)" }}
        >
          The <em className="italic text-gold">diaspora</em> at the helm.
        </h1>
        <p className="mt-8 font-sans text-[17px] lg:text-[18px] leading-relaxed text-bone-2 max-w-[64ch]">
          A hand-verified archive of{" "}
          <strong className="text-bone font-medium">
            {total.toLocaleString("en-US")} Indian-born founders, chairmen,
            and chief executives
          </strong>{" "}
          leading consequential companies abroad. Filter by sector to see
          where the diaspora has built.
        </p>
      </section>

      {/* Sector filter */}
      {topSectors.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 border-y border-rule py-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 mr-2">
              Sector
            </span>
            {topSectors.map((s) => (
              <Chip
                key={s}
                label={s}
                active={selectedSectors.has(s)}
                onClick={() => toggleSector(s)}
              />
            ))}
            <button
              type="button"
              onClick={reset}
              disabled={!anyActive}
              className="ml-auto inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone hover:text-gold border border-rule px-3 py-1.5 hover:border-gold transition-colors disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-bone disabled:cursor-default"
            >
              Reset
            </button>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-10 lg:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rule border border-rule">
          <Stat
            label="Founders"
            value={total.toLocaleString("en-US")}
            sub={
              anyActive
                ? `of ${grandTotal.toLocaleString("en-US")} archive`
                : "All entries"
            }
          />
          <Stat
            label="Top destination"
            value={topCountry ?? "—"}
            sub={
              topCountry ? `${topPercent}% of cohort` : "No data in selection"
            }
          />
          <Stat
            label="Countries"
            value={totalCountries.toLocaleString("en-US")}
            sub="5 continents"
          />
        </div>
      </section>

      {/* Top destinations */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-12 lg:pt-16">
        <div className="border border-rule p-6 lg:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-4 mb-6">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone">
              Top destinations
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
              {anyActive
                ? `${selectedSectors.size} sector${
                    selectedSectors.size === 1 ? "" : "s"
                  } selected`
                : "All sectors"}
            </span>
          </div>
          {visibleDestinations.length === 0 ? (
            <p className="font-sans text-bone-3 italic">
              No destinations to show in the current selection.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {visibleDestinations.map(([country, count], i) => {
                const pct = Math.max(2, (count / maxDestinationCount) * 100);
                return (
                  <li key={country}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="inline-flex items-baseline gap-3 min-w-0">
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 tabular-nums shrink-0">
                          {(i + 1).toString().padStart(2, "0")}
                        </span>
                        {getCountryFlag(country) && (
                          <span
                            className="text-base shrink-0"
                            aria-hidden="true"
                          >
                            {getCountryFlag(country)}
                          </span>
                        )}
                        <span className="font-sans text-[15px] lg:text-[16px] text-bone truncate">
                          {country}
                        </span>
                      </span>
                      <span className="font-mono text-[12px] text-bone tabular-nums shrink-0">
                        {count.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="mt-2 h-px bg-rule relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 py-20 lg:py-28">
        <div className="border-t border-b border-rule py-16 lg:py-20 flex flex-col items-center text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3">
            The full record
          </p>
          <h2
            className="mt-5 font-serif text-bone leading-[1.05] tracking-[-0.02em] max-w-3xl"
            style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
          >
            Search, filter, and explore{" "}
            <em className="italic text-gold">
              {grandTotal.toLocaleString("en-US")}
            </em>{" "}
            entries.
          </h2>
          <p className="mt-5 font-sans text-[15px] lg:text-[16px] text-bone-2 max-w-[52ch]">
            The full database is searchable by name, country, sector, role
            type, education, and company size — and updated as new entries are
            verified.
          </p>
          <Link
            href="/the-index"
            className="mt-10 inline-flex items-center gap-3 border border-gold bg-gold/10 px-8 py-4 font-mono text-[12px] uppercase tracking-[0.22em] text-gold hover:bg-gold hover:text-bg transition-colors"
          >
            <span>Browse the index</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Talk to Sales */}
      <section className="border-t border-rule">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12 py-14 lg:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3">
              Sales & partnerships
            </p>
            <h3
              className="mt-3 font-serif text-bone leading-[1.1] tracking-[-0.01em]"
              style={{ fontSize: "clamp(24px, 2.4vw, 34px)" }}
            >
              Talk to our team about access, licensing, or custom queries.
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:hello@diasporaindex.com"
              className="inline-flex items-center gap-2 border border-gold bg-gold/10 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-gold hover:bg-gold hover:text-bg transition-colors"
            >
              <span>Talk to Sales</span>
              <span aria-hidden="true">→</span>
            </a>
            <a
              href="mailto:hello@diasporaindex.com"
              aria-label="Email"
              title="Email"
              className="inline-flex h-11 w-11 items-center justify-center border border-rule text-bone-3 hover:border-gold hover:text-gold transition-colors"
            >
              <EmailIcon />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="inline-flex h-11 w-11 items-center justify-center border border-rule text-bone-3 hover:border-gold hover:text-gold transition-colors"
            >
              <LinkedInIcon />
            </a>
            <a
              href="#"
              aria-label="Book a call"
              title="Book a call"
              className="inline-flex h-11 w-11 items-center justify-center border border-rule text-bone-3 hover:border-gold hover:text-gold transition-colors"
            >
              <CalendarIcon />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule mt-auto">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-3">
            © 2026 · Hand-verified
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-bone-3">
            Vol. 02 · Edition 2026 · {grandTotal.toLocaleString("en-US")}{" "}
            entries
          </p>
        </div>
      </footer>
    </div>
  );
}

/* -------- Building blocks -------- */

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

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "px-2.5 py-1.5 border font-mono text-[11px] leading-none transition-colors",
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-rule bg-bg text-bone hover:border-bone-3",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-bg p-6 lg:p-8">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3">
        {label}
      </p>
      <p
        className="mt-3 font-serif text-gold leading-none"
        style={{ fontSize: "clamp(36px, 4vw, 48px)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-2 font-sans text-sm text-bone-2">{sub}</p>
      )}
    </div>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="1" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8 17v-7H5.5v7H8zm-1.25-8.27a1.43 1.43 0 0 0 0-2.86 1.43 1.43 0 0 0 0 2.86zM18.5 17v-3.84c0-2.31-1.24-3.39-2.91-3.39a2.51 2.51 0 0 0-2.27 1.24V10h-2.49c.03.7 0 7 0 7h2.49v-3.91c0-.22.02-.45.08-.61.18-.45.59-.91 1.27-.91.9 0 1.26.69 1.26 1.7V17h2.57z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path
        d="M3 9h18M8 3v4M16 3v4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
