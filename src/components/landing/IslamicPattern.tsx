export default function IslamicPattern({ className = "", opacity = 0.08 }: { className?: string; opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="100%"
      height="100%"
      style={{ opacity }}
    >
      <defs>
        <pattern id="islamic-girih" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            <polygon points="40,4 49,22 68,25 54,39 58,58 40,49 22,58 26,39 12,25 31,22" />
            <circle cx="40" cy="40" r="18" />
            <circle cx="40" cy="40" r="6" />
            <path d="M0 40 L80 40 M40 0 L40 80" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-girih)" />
    </svg>
  );
}
