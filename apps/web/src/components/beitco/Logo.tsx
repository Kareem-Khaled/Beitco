// Beitoon brand mark: a house whose interior negative space forms a bed, with an
// amber "sleeper" dot — the bed-level-renting wedge, in the trust-green. The bed
// is a real cut-out (mask), so it shows whatever's behind (theme-safe on light or
// dark headers). The house inherits `currentColor` via the caller's text color.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <mask id="beitoon-bed">
          <rect width="48" height="48" fill="white" />
          {/* bed, cut out of the house */}
          <g fill="black">
            <rect x="15.2" y="20.4" width="3.7" height="12.8" rx="1.6" />
            <rect x="15.2" y="25.2" width="18.8" height="3.9" rx="1.95" />
            <rect x="30.7" y="25.2" width="3.4" height="8" rx="1.5" />
          </g>
        </mask>
      </defs>

      {/* chimney */}
      <rect
        x="30.3"
        y="7.4"
        width="3.5"
        height="8.6"
        rx="1.3"
        fill="currentColor"
        className="text-primary"
      />

      {/* house silhouette */}
      <path
        d="M22.4 7.6a2.4 2.4 0 0 1 3.2 0L40.3 20.6a3 3 0 0 1 .9 2.15V37a3 3 0 0 1-3 3H9.8a3 3 0 0 1-3-3V22.75a3 3 0 0 1 .9-2.15Z"
        fill="currentColor"
        className="text-primary"
        mask="url(#beitoon-bed)"
      />

      {/* amber sleeper / pillow */}
      <circle cx="22.7" cy="22.1" r="2.7" fill="#e5a83a" />
    </svg>
  );
}
