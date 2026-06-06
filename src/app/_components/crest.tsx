// Shared wordmark crest. The circular badge's ring carries the Indian
// tricolor — saffron (top), white (middle), green (bottom) — so every page
// reads as "Indian diaspora" at a glance, while the gold italic "i" monogram
// keeps the editorial identity intact. The inner disc is filled with the page
// background so only the tricolor ring shows. Used by the header/footer
// wordmarks across the landing page, the index, and founder profiles.

const SAFFRON = "#ff9933";
const GREEN = "#138808";

export default function Crest({ size = 26 }: { size?: number }) {
  // Ring thickness scales gently with the badge size.
  const ring = Math.max(1.5, size * 0.075);
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        height: size,
        width: size,
        padding: ring,
        background: `linear-gradient(180deg, ${SAFFRON} 0 33.34%, #ffffff 33.34% 66.67%, ${GREEN} 66.67% 100%)`,
      }}
    >
      <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-bg text-gold">
        <span
          className="font-serif italic leading-none"
          style={{ fontSize: size * 0.55, transform: "translateY(-1px)" }}
        >
          i
        </span>
      </span>
    </span>
  );
}
