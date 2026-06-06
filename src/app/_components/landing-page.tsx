"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Founder } from "./founder-index";
import { getCountryFlag } from "@/lib/country-flag";

const TOP_SECTOR_COUNT = 6;
const TOP_DESTINATIONS_COUNT = 10;

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

// Migration-route layout (fixed positions per design spec). Counts pulled live
// from Supabase data at render — edit this array to change the atlas nodes.
const ATLAS_NODES: {
  label: string;
  key: string;
  path: string;
  ex: number;
  ey: number;
}[] = [
  { label: "United States", key: "United States", path: "M340,360 Q220,273 72,263", ex: 72, ey: 263 },
  { label: "Canada", key: "Canada", path: "M340,360 Q329,212 243,92", ex: 243, ey: 92 },
  { label: "United Kingdom", key: "United Kingdom", path: "M340,360 Q446,256 482,113", ex: 482, ey: 113 },
  { label: "UAE", key: "United Arab Emirates", path: "M340,360 Q487,374 620,310", ex: 620, ey: 310 },
  { label: "Singapore", key: "Singapore", path: "M340,360 Q443,466 587,502", ex: 587, ey: 502 },
  { label: "Australia", key: "Australia", path: "M340,360 Q326,507 390,641", ex: 390, ey: 641 },
];

// Deterministic rangoli points (no Math.random — keeps SSR/CSR in sync).
const RANGOLI_DOTS = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2;
  return { x: 340 + 300 * Math.cos(a), y: 360 + 300 * Math.sin(a) };
});
const FINE_DOTS = Array.from({ length: 60 }, (_, i) => {
  const a = (i / 60) * Math.PI * 2;
  return { x: 340 + 264 * Math.cos(a), y: 360 + 264 * Math.sin(a) };
});

// Migration atlas: glowing India core with Bézier routes to destinations.
// Layout fixed (ATLAS_NODES); counts pulled live from `stats`.
function Atlas({
  stats,
  sectorLabel,
}: {
  stats: Map<string, { count: number; share: number; topSector: string | null }>;
  sectorLabel: string;
}) {
  const CX = 340;
  const CY = 360;
  const mono = "var(--font-jetbrains-mono), monospace";
  const nodes = ATLAS_NODES.map((n) => ({
    ...n,
    count: stats.get(n.key)?.count ?? 0,
  }));
  const maxCount = Math.max(1, ...nodes.map((n) => n.count));
  const [hovered, setHovered] = useState<string | null>(null);
  const activeNode = hovered ? nodes.find((n) => n.key === hovered) : undefined;
  const activeStats = activeNode ? stats.get(activeNode.key) : undefined;
  let popLeft = 50;
  let popTop = 50;
  let popTransform = "translate(16px, 16px)";
  if (activeNode) {
    popLeft = ((activeNode.ex + 60) / 820) * 100;
    popTop = (activeNode.ey / 760) * 100;
    popTransform = `translate(${
      activeNode.ex >= CX ? "calc(-100% - 16px)" : "16px"
    }, ${activeNode.ey >= CY ? "calc(-100% - 16px)" : "16px"})`;
  }
  return (
    <div className="relative">
      <svg
        viewBox="-60 0 820 760"
        className="w-full h-auto"
        role="img"
        aria-label="Atlas of diaspora migration routes"
      >
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f7be53" />
            <stop offset="100%" stopColor="#e07717" />
          </radialGradient>
          <radialGradient id="arcg" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r="300">
            <stop offset="0%" stopColor="#f7be53" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#f4a52a" stopOpacity="0.22" />
          </radialGradient>
          <radialGradient id="atlasHaze" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4a52a" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#f4a52a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={CX} cy={CY} r="330" fill="url(#atlasHaze)" />

        {[
          { r: 90, dash: true },
          { r: 160, dash: false },
          { r: 230, dash: true },
          { r: 300, dash: false },
        ].map((ring) => (
          <circle
            key={ring.r}
            cx={CX}
            cy={CY}
            r={ring.r}
            fill="none"
            stroke={ring.dash ? "#f4a52a" : "#ffffff"}
            strokeOpacity={ring.dash ? 0.22 : 0.06}
            strokeDasharray={ring.dash ? "2 8" : undefined}
            strokeWidth="1"
          />
        ))}

        <g>
          <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="140s" repeatCount="indefinite" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={CX + 90 * Math.cos(a)}
                y1={CY + 90 * Math.sin(a)}
                x2={CX + 300 * Math.cos(a)}
                y2={CY + 300 * Math.sin(a)}
                stroke="#ffffff"
                strokeOpacity="0.04"
                strokeWidth="0.5"
              />
            );
          })}
          {RANGOLI_DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="1.6" fill="#f4a52a" opacity="0.5" />
          ))}
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from={`360 ${CX} ${CY}`} to={`0 ${CX} ${CY}`} dur="200s" repeatCount="indefinite" />
          {FINE_DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="1" fill="#9aa0bd" opacity="0.35" />
          ))}
        </g>

        {nodes.map((n, i) => {
          const isActive = hovered === n.key;
          const dim = hovered !== null && !isActive;
          const ghost = n.count === 0;
          const weight = isActive ? 4 : 1.5 + Math.sqrt(n.count / maxCount) * 3;
          return (
            <path
              key={n.key}
              d={n.path}
              fill="none"
              stroke="url(#arcg)"
              strokeWidth={weight}
              strokeLinecap="round"
              opacity={dim ? 0.12 : ghost ? 0.3 : 1}
              style={{
                strokeDasharray: 380,
                animation: `atlas-arc-draw 1.3s cubic-bezier(.7,0,.3,1) ${i * 0.09}s both`,
              }}
            />
          );
        })}

        {nodes.map((n, i) => {
          const ghost = n.count === 0;
          if (ghost || (hovered !== null && hovered !== n.key)) return null;
          return (
            <circle key={n.key} r="3.2" fill="#ffd98a">
              <animateMotion dur="2.8s" repeatCount="indefinite" path={n.path} begin={`${i * 0.4}s`} />
            </circle>
          );
        })}

        {nodes.map((n) => {
          const isActive = hovered === n.key;
          const dim = hovered !== null && !isActive;
          const ux = n.ex - CX;
          const uy = n.ey - CY;
          const len = Math.hypot(ux, uy) || 1;
          const lx = n.ex + (ux / len) * 16;
          const ly = n.ey + (uy / len) * 16;
          const anchor: "start" | "middle" | "end" =
            ux / len < -0.3 ? "end" : ux / len > 0.3 ? "start" : "middle";
          return (
            <g
              key={n.key}
              onMouseEnter={() => setHovered(n.key)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setHovered(n.key)}
              style={{ cursor: "pointer" }}
              opacity={dim ? 0.4 : 1}
            >
              <circle cx={n.ex} cy={n.ey} r="24" fill="transparent" />
              <circle cx={n.ex} cy={n.ey} r={isActive ? 13 : 11} fill="none" stroke="#f4a52a" opacity="0.75" />
              <circle cx={n.ex} cy={n.ey} r="4.5" fill="#f7be53" />
              <text
                x={lx}
                y={ly - 5}
                textAnchor={anchor}
                fill="#f3eede"
                style={{ fontFamily: mono, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em" }}
              >
                {n.label.toUpperCase()}
              </text>
              <text
                x={lx}
                y={ly + 9}
                textAnchor={anchor}
                fill="#f4a52a"
                style={{ fontFamily: mono, fontSize: "11px", fontWeight: 500 }}
              >
                {n.count.toLocaleString("en-US")}
              </text>
            </g>
          );
        })}

        <circle cx={CX} cy={CY} r="30" fill="url(#atlasHaze)" />
        <circle cx={CX} cy={CY} r="13" fill="url(#coreGlow)" />
        <circle cx={CX} cy={CY} r="5" fill="#fff6e0" />
        <text
          x={CX}
          y={CY + 46}
          textAnchor="middle"
          fill="#f3eede"
          style={{ fontFamily: mono, fontSize: "13px", fontWeight: 700, letterSpacing: "0.14em" }}
        >
          INDIA
        </text>
        <text
          x={CX}
          y={CY + 62}
          textAnchor="middle"
          fill="#9aa0bd"
          style={{ fontFamily: mono, fontSize: "9px", fontWeight: 500, letterSpacing: "0.2em" }}
        >
          ORIGIN
        </text>
      </svg>
      {activeStats && activeNode && (
        <div
          className="pointer-events-none absolute z-10 w-[190px] border p-4 backdrop-blur-sm"
          style={{
            left: `${popLeft}%`,
            top: `${popTop}%`,
            transform: popTransform,
            backgroundColor: "rgba(8,12,28,0.95)",
            borderColor: "rgba(255,255,255,0.09)",
          }}
        >
          <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: "#565d7e" }}>
            Destination
          </p>
          <p className="mt-1.5 font-sans text-[22px] font-medium leading-[1.05]" style={{ color: "#f3eede" }}>
            {activeNode.label}
          </p>
          <p className="mt-1 font-mono text-[8.5px] uppercase tracking-[0.18em]" style={{ color: "#565d7e" }}>
            {sectorLabel}
          </p>
          <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.09)" }} />
          <Row label="Founders" value={activeStats.count.toLocaleString("en-US")} />
          <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.09)" }} />
          <Row label="Share of view" value={`${activeStats.share}%`} />
          <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.09)" }} />
          <div className="flex items-baseline justify-between gap-3">
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: "#565d7e" }}>
              Top sector
            </span>
            <span className="text-right font-sans text-[12px]" style={{ color: "#f3eede" }}>
              {activeStats.topSector ?? "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ color: "#565d7e" }}>
        {label}
      </span>
      <span className="font-mono text-[13px] tabular-nums" style={{ color: "#f4a52a" }}>{value}</span>
    </div>
  );
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
        if (v.toLowerCase() === "india") continue; // origin, not a destination
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

  const mappedCount = useMemo(
    () => filtered.filter((f) => !isMissing(f.current_country)).length,
    [filtered]
  );
  const destinationsShown = visibleDestinations.length;

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

  const sectorLabel = anyActive
    ? Array.from(selectedSectors).join(", ")
    : "All sectors";

  const destinationStats = useMemo(() => {
    const m = new Map<
      string,
      { count: number; share: number; topSector: string | null }
    >();
    for (const [country, count] of visibleDestinations) {
      const secFreq = new Map<string, number>();
      for (const f of filtered) {
        if (
          !isMissing(f.current_country) &&
          normalize(f.current_country as string) === country &&
          !isMissing(f.company_industry)
        ) {
          const s = normalize(f.company_industry as string);
          secFreq.set(s, (secFreq.get(s) ?? 0) + 1);
        }
      }
      let topSector: string | null = null;
      let topN = 0;
      for (const [s, n] of secFreq) {
        if (n > topN) {
          topN = n;
          topSector = s;
        }
      }
      m.set(country, {
        count,
        share: total > 0 ? Math.round((count / total) * 100) : 0,
        topSector,
      });
    }
    return m;
  }, [visibleDestinations, filtered, total]);

  return (
    <div
      className="min-h-screen text-bone flex flex-col"
      style={{
        background:
          "radial-gradient(1150px 760px at 76% 44%, rgba(244,165,42,.085), transparent 60%), radial-gradient(900px 600px at 12% 18%, rgba(31,138,76,.05), transparent 60%), linear-gradient(180deg, #0b1126, #080c1c)",
      }}
    >
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

      {/* Hero — Atlas */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-10 lg:pt-16 pb-8">
        <div className="grid items-center gap-10 lg:gap-6 lg:grid-cols-[1fr_minmax(0,560px)]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold inline-flex items-center gap-3">
              <span aria-hidden="true" className="inline-block w-8 h-px bg-gold" />
              Born in India · Building everywhere
            </p>
            <h1
              className="mt-6 uppercase text-bone leading-[0.9] tracking-[-0.01em]"
              style={{
                fontFamily:
                  'var(--font-archivo), "Helvetica Neue", Arial, sans-serif',
                fontWeight: 900,
                fontSize: "clamp(44px, 5.4vw, 92px)",
              }}
            >
              Where India <span className="text-gold">builds the</span> world.
            </h1>
            <p className="mt-7 font-sans text-[16px] lg:text-[18px] leading-relaxed text-bone-2 max-w-[46ch]">
              A hand-verified index of{" "}
              <strong className="text-bone font-medium">
                founders, chairs &amp; chief executives
              </strong>{" "}
              who left India and now run consequential companies across the
              globe.
            </p>
            <Link
              href="/the-index"
              className="mt-9 inline-flex items-center gap-3 bg-gold px-6 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bg hover:bg-gold-2 transition-colors"
            >
              Browse {total.toLocaleString("en-US")} entries
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="relative">
            <Atlas stats={destinationStats} sectorLabel={sectorLabel} />
          </div>
        </div>
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

      {/* Atlas stats bar */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-12 pt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-rule border border-rule">
          <Stat
            label="Founders mapped"
            value={mappedCount.toLocaleString("en-US")}
            sub={anyActive ? "in selection" : "with a known country"}
          />
          <Stat
            label="Destinations shown"
            value={destinationsShown.toLocaleString("en-US")}
            sub={`${totalCountries.toLocaleString("en-US")} total`}
          />
          <Stat
            label="Top destination"
            value={topCountry ?? "—"}
            sub={topCountry ? `${topPercent}% of cohort` : "No data"}
          />
          <Stat
            label="View"
            value={
              anyActive
                ? `${selectedSectors.size} sector${
                    selectedSectors.size === 1 ? "" : "s"
                  }`
                : "All sectors"
            }
            sub={anyActive ? "filtered" : "unfiltered"}
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
