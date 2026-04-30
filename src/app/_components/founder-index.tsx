"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCountryFlag } from "@/lib/country-flag";

export type Founder = {
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
};

export type Stats = {
  total: number;
  topCountry: string | null;
  topPercent: number;
  totalCountries: number;
};

const PAGE_STEP = 50;

const EDUCATION_ORDER = ["PhD", "Master's", "Bachelor's", "Other", "Unknown"];

const COMPANY_SIZE_ORDER = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
];

type DimKey =
  | "country"
  | "industry"
  | "roleType"
  | "education"
  | "companySize";

const DIM_KEYS: DimKey[] = [
  "country",
  "industry",
  "roleType",
  "education",
  "companySize",
];

function pad4(n: number) {
  return n.toString().padStart(4, "0");
}

function getInitials(
  f: Pick<Founder, "first_name" | "last_name" | "full_name">
) {
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

function unique(arr: (string | null)[]): string[] {
  const set = new Set<string>();
  for (const v of arr) if (v) set.add(v);
  return Array.from(set);
}

function sortAlpha(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function sortByPriority(values: string[], order: string[]) {
  return [...values].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
    const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
    return aRank - bRank || a.localeCompare(b);
  });
}

export default function FounderIndex({
  founders,
  stats,
}: {
  founders: Founder[];
  stats: Stats;
}) {
  const allCountries = useMemo(
    () => sortAlpha(unique(founders.map((f) => f.current_country))),
    [founders]
  );
  const allIndustries = useMemo(
    () => sortAlpha(unique(founders.map((f) => f.company_industry))),
    [founders]
  );
  const allRoleTypes = useMemo(
    () => sortAlpha(unique(founders.map((f) => f.role_type))),
    [founders]
  );
  const allEducation = useMemo(
    () =>
      sortByPriority(
        unique(founders.map((f) => f.highest_education)),
        EDUCATION_ORDER
      ),
    [founders]
  );
  const allCompanySizes = useMemo(
    () =>
      sortByPriority(
        unique(founders.map((f) => f.company_size)),
        COMPANY_SIZE_ORDER
      ),
    [founders]
  );

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<Set<string>>(new Set());
  const [industry, setIndustry] = useState<Set<string>>(new Set());
  const [roleType, setRoleType] = useState<Set<string>>(new Set());
  const [education, setEducation] = useState<Set<string>>(new Set());
  const [companySize, setCompanySize] = useState<Set<string>>(new Set());

  const [railOpen, setRailOpen] = useState(false);
  const [desktopRailVisible, setDesktopRailVisible] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);

  const dims: Record<
    DimKey,
    {
      label: string;
      selected: Set<string>;
      setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
      options: string[];
      getValue: (f: Founder) => string | null;
      formatLabel?: (v: string) => string;
    }
  > = {
    country: {
      label: "Country",
      selected: country,
      setSelected: setCountry,
      options: allCountries,
      getValue: (f) => f.current_country,
      formatLabel: (v) => {
        const flag = getCountryFlag(v);
        return flag ? `${flag} ${v}` : v;
      },
    },
    industry: {
      label: "Sector",
      selected: industry,
      setSelected: setIndustry,
      options: allIndustries,
      getValue: (f) => f.company_industry,
    },
    roleType: {
      label: "Role Type",
      selected: roleType,
      setSelected: setRoleType,
      options: allRoleTypes,
      getValue: (f) => f.role_type,
      formatLabel: (v) =>
        v.trim().toLowerCase() === "unknown" ? "Undetermined" : v,
    },
    education: {
      label: "Education",
      selected: education,
      setSelected: setEducation,
      options: allEducation,
      getValue: (f) => f.highest_education,
    },
    companySize: {
      label: "Company Size",
      selected: companySize,
      setSelected: setCompanySize,
      options: allCompanySizes,
      getValue: (f) => f.company_size,
    },
  };

  function passesSearch(f: Founder) {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (f.full_name ?? "").toLowerCase().includes(q);
  }

  function passesDim(f: Founder, key: DimKey) {
    const d = dims[key];
    if (d.selected.size === 0) return true;
    const v = d.getValue(f);
    if (v == null) return false;
    return d.selected.has(v);
  }

  const filtered = useMemo(
    () =>
      founders.filter(
        (f) =>
          passesSearch(f) &&
          passesDim(f, "country") &&
          passesDim(f, "industry") &&
          passesDim(f, "roleType") &&
          passesDim(f, "education") &&
          passesDim(f, "companySize")
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [founders, search, country, industry, roleType, education, companySize]
  );

  const counts = useMemo(() => {
    const result: Record<DimKey, Map<string, number>> = {
      country: new Map(),
      industry: new Map(),
      roleType: new Map(),
      education: new Map(),
      companySize: new Map(),
    };
    for (const k of DIM_KEYS) {
      const m = new Map<string, number>();
      for (const f of founders) {
        if (!passesSearch(f)) continue;
        let ok = true;
        for (const other of DIM_KEYS) {
          if (other === k) continue;
          if (!passesDim(f, other)) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const v = dims[k].getValue(f);
        if (v) m.set(v, (m.get(v) ?? 0) + 1);
      }
      result[k] = m;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [founders, search, country, industry, roleType, education, companySize]);

  function toggleChip(key: DimKey, value: string) {
    dims[key].setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function clearSection(key: DimKey) {
    dims[key].setSelected(new Set());
  }

  function resetAll() {
    setSearch("");
    setCountry(new Set());
    setIndustry(new Set());
    setRoleType(new Set());
    setEducation(new Set());
    setCompanySize(new Set());
  }

  const anyActive =
    search.trim() !== "" ||
    country.size > 0 ||
    industry.size > 0 ||
    roleType.size > 0 ||
    education.size > 0 ||
    companySize.size > 0;

  return (
    <div className="min-h-screen bg-bg text-bone">
      {/* Top bar */}
      <header className="border-b border-rule bg-bg">
        <div className="flex items-center justify-between gap-4 px-5 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDesktopRailVisible((v) => !v)}
              className="hidden md:inline-flex items-center justify-center h-8 w-8 border border-rule text-bone-3 hover:border-gold hover:text-gold transition-colors"
              aria-label={
                desktopRailVisible ? "Collapse filters" : "Expand filters"
              }
              aria-expanded={desktopRailVisible}
              title={
                desktopRailVisible ? "Collapse filters" : "Expand filters"
              }
            >
              <ChevronIcon
                direction={desktopRailVisible ? "left" : "right"}
              />
            </button>
            <Wordmark size="sm" />
          </div>
          <button
            type="button"
            onClick={() => setRailOpen((o) => !o)}
            className="md:hidden p-2 -mr-2 text-bone hover:text-gold transition-colors"
            aria-label={railOpen ? "Close filters" : "Open filters"}
            aria-expanded={railOpen}
          >
            {railOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </header>

      <div className="md:flex md:items-stretch">
        {/* Filter rail */}
        <aside
          className={[
            "overflow-y-auto bg-bg",
            railOpen ? "fixed inset-0 z-40" : "hidden",
            desktopRailVisible
              ? "md:block md:sticky md:top-0 md:inset-auto md:z-auto md:h-screen md:w-[280px] md:shrink-0 md:border-r md:border-rule"
              : "md:hidden",
          ].join(" ")}
        >
          {/* Mobile-only close */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-rule md:hidden">
            <Wordmark size="sm" />
            <button
              type="button"
              onClick={() => setRailOpen(false)}
              className="p-2 -mr-2 text-bone hover:text-gold transition-colors"
              aria-label="Close filters"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <label className="block">
              <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 mb-2">
                Search
              </span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="By name…"
                className="w-full bg-bg-2 border border-rule px-3 py-2 text-sm text-bone placeholder:text-bone-3 focus:outline-none focus:border-gold transition-colors"
              />
            </label>

            {DIM_KEYS.map((key) => {
              const d = dims[key];
              return (
                <FilterSection
                  key={key}
                  label={d.label}
                  options={d.options}
                  counts={counts[key]}
                  selected={d.selected}
                  onToggle={(v) => toggleChip(key, v)}
                  onClear={() => clearSection(key)}
                  formatLabel={d.formatLabel}
                />
              );
            })}

            <button
              type="button"
              onClick={resetAll}
              disabled={!anyActive}
              className="block w-full border border-rule bg-bg-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-bone hover:border-gold hover:text-gold transition-colors disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-bone disabled:cursor-default"
            >
              Reset filters
            </button>
          </div>
        </aside>

        {/* Main column */}
        <main className="flex-1 min-w-0">
          {/* Hero */}
          <section className="px-6 lg:px-12 pt-12 lg:pt-16 pb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">
              <span aria-hidden="true">— </span>The definitive record of
              Indian-origin CEOs, founders, and global business architects.
            </p>
            <h1
              className="mt-6 font-serif text-bone leading-[0.98] tracking-[-0.02em] max-w-5xl"
              style={{ fontSize: "clamp(48px, 5vw, 80px)" }}
            >
              The <em className="italic text-gold">diaspora</em> at the helm.
            </h1>
            <p className="mt-6 font-sans text-[17px] leading-relaxed text-bone-2 max-w-[60ch]">
              A hand-verified archive of{" "}
              {stats.total.toLocaleString("en-US")} Indian-born founders,
              chairmen, and chief executives leading consequential companies
              abroad. Filter by sector, region, or alma mater to see where the
              diaspora has built.
            </p>

          </section>

          {/* Index */}
          <section className="pb-20">
            <div className="flex items-baseline justify-between gap-4 flex-wrap border-y border-rule px-6 lg:px-12 py-5">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone-3">
                The Index
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone-3">
                Showing{" "}
                {Math.min(visibleCount, filtered.length).toLocaleString(
                  "en-US"
                )}{" "}
                of {filtered.length.toLocaleString("en-US")}
              </span>
            </div>

            {filtered.length === 0 ? (
              <p className="px-6 lg:px-12 py-10 font-sans text-bone-3">
                No founders match the current filters.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] border-t border-l border-rule">
                  {filtered.slice(0, visibleCount).map((f, i) => (
                    <FounderCard key={f.id} founder={f} index={i + 1} />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="flex justify-center px-6 lg:px-12 py-10 border-t border-rule">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((c) =>
                          Math.min(c + PAGE_STEP, filtered.length)
                        )
                      }
                      className="inline-flex items-center gap-3 border border-rule bg-bg-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-bone hover:border-gold hover:text-gold transition-colors"
                    >
                      <span>+ Show {PAGE_STEP} more</span>
                      <span className="text-bone-3">
                        {(filtered.length - visibleCount).toLocaleString(
                          "en-US"
                        )}{" "}
                        remaining
                      </span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

/* -------- Building blocks -------- */

function Crest({ size = 28 }: { size?: number }) {
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

function Wordmark({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isLarge = size === "lg";
  return (
    <a href="/" className="inline-flex items-center gap-2.5 group">
      <Crest size={isLarge ? 32 : 26} />
      <span
        className={`font-serif text-bone tracking-tight leading-none ${
          isLarge ? "text-2xl" : "text-lg"
        }`}
      >
        The Indian Diaspora <span className="italic text-gold">Index</span>
      </span>
    </a>
  );
}

const CHIP_TRUNCATE_LIMIT = 8;

function FilterSection({
  label,
  options,
  counts,
  selected,
  onToggle,
  onClear,
  formatLabel,
}: {
  label: string;
  options: string[];
  counts: Map<string, number>;
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
  formatLabel?: (v: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const active = selected.size > 0;

  const visibleOptions = useMemo(
    () =>
      options.filter(
        (opt) => (counts.get(opt) ?? 0) > 0 || selected.has(opt)
      ),
    [options, counts, selected]
  );

  const collapsedDisplay = useMemo(() => {
    if (visibleOptions.length <= CHIP_TRUNCATE_LIMIT) return visibleOptions;
    const selectedCount = visibleOptions.filter((o) =>
      selected.has(o)
    ).length;
    const room = Math.max(0, CHIP_TRUNCATE_LIMIT - selectedCount);
    let unselectedTaken = 0;
    return visibleOptions.filter((o) => {
      if (selected.has(o)) return true;
      if (unselectedTaken < room) {
        unselectedTaken++;
        return true;
      }
      return false;
    });
  }, [visibleOptions, selected]);

  const queryFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleOptions;
    return visibleOptions.filter((o) => o.toLowerCase().includes(q));
  }, [visibleOptions, query]);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [expanded]);

  const moreCount = visibleOptions.length - collapsedDisplay.length;
  const canExpand = visibleOptions.length > CHIP_TRUNCATE_LIMIT;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3">
          {label}
        </h3>
        <button
          type="button"
          onClick={onClear}
          disabled={!active}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold hover:text-gold-2 transition-colors disabled:text-bone-3 disabled:cursor-default"
        >
          All
        </button>
      </div>

      {visibleOptions.length === 0 ? (
        <p className="font-sans text-xs italic text-bone-3">
          No options available within current filters.
        </p>
      ) : !expanded ? (
        <>
          <div className="flex flex-wrap gap-x-2.5 gap-y-2.5">
            {collapsedDisplay.map((opt) => (
              <Chip
                key={opt}
                label={formatLabel ? formatLabel(opt) : opt}
                count={counts.get(opt) ?? 0}
                active={selected.has(opt)}
                onClick={() => onToggle(opt)}
              />
            ))}
          </div>
          {canExpand && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="self-start font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 hover:text-gold transition-colors"
            >
              + {moreCount} more
            </button>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="self-start font-mono text-[10px] uppercase tracking-[0.18em] text-bone-3 hover:text-gold transition-colors"
          >
            − Show less
          </button>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="w-full bg-bg-2 border border-rule px-2.5 py-1.5 text-xs text-bone placeholder:text-bone-3 focus:outline-none focus:border-gold transition-colors"
          />
          {queryFiltered.length === 0 ? (
            <p className="font-sans text-xs italic text-bone-3">
              No matches.
            </p>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto pr-1 -mr-1">
                <div className="flex flex-wrap gap-x-2.5 gap-y-2.5">
                  {queryFiltered.map((opt) => (
                    <Chip
                      key={opt}
                      label={formatLabel ? formatLabel(opt) : opt}
                      count={counts.get(opt) ?? 0}
                      active={selected.has(opt)}
                      onClick={() => onToggle(opt)}
                    />
                  ))}
                </div>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone-3">
                {queryFiltered.length.toLocaleString("en-US")} of{" "}
                {visibleOptions.length.toLocaleString("en-US")}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[11px] leading-none transition-colors",
        active
          ? "border-gold bg-gold/15 text-gold"
          : "border-rule bg-bg text-bone hover:border-bone-3",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={`tabular-nums ${active ? "text-gold/70" : "text-bone-3"}`}
      >
        {count.toLocaleString("en-US")}
      </span>
    </button>
  );
}

function FounderCard({
  founder,
  index,
}: {
  founder: Founder;
  index: number;
}) {
  const id = pad4(index);
  const hasRoleLine = !!(founder.title || founder.company);
  return (
    <article className="flex flex-col gap-5 bg-bg p-6 lg:p-8 border-r border-b border-rule">
      <div className="flex items-start justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-gold">
          № {id}
        </span>
      </div>

      <Avatar founder={founder} />

      <h3 className="font-serif text-[28px] leading-[1.05] text-bone">
        {founder.full_name ?? "Unnamed founder"}
      </h3>

      {hasRoleLine && (
        <p className="font-sans text-[15px] leading-snug text-bone-2">
          {founder.title && <em className="italic">{founder.title}</em>}
          {founder.title && founder.company && <span> · </span>}
          {founder.company && <span>{founder.company}</span>}
        </p>
      )}

      <hr className="border-t border-rule m-0" />

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
        <Meta
          label="Country"
          value={
            founder.current_country
              ? `${getCountryFlag(founder.current_country)} ${founder.current_country}`.trim()
              : null
          }
        />
      </dl>

      <hr className="border-t border-rule m-0" />

      <div className="flex justify-end">
        <Link
          href={`/founders/${founder.id}`}
          className="group inline-flex items-center gap-2 border border-gold/60 bg-gold/5 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gold hover:border-gold hover:bg-gold/15 transition-colors"
        >
          View profile
          <span className="transition-transform duration-150 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="self-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-bone-3">
        {label}
      </dt>
      <dd
        className={`font-sans text-[14px] ${
          value ? "text-bone" : "text-bone-3"
        }`}
      >
        {value ?? "—"}
      </dd>
    </>
  );
}

function Avatar({ founder }: { founder: Founder }) {
  if (founder.profile_picture) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={founder.profile_picture}
        alt={founder.full_name ?? "Founder"}
        className="h-14 w-14 rounded-full object-cover border border-rule"
      />
    );
  }
  return (
    <div className="h-14 w-14 rounded-full bg-bg-2 border border-rule flex items-center justify-center">
      <span className="font-serif text-bone-3 text-lg leading-none">
        {getInitials(founder)}
      </span>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        d={direction === "left" ? "M10 4l-4 4 4 4" : "M6 4l4 4-4 4"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
