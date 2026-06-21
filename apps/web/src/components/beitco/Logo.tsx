export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="currentColor" className="text-primary" />
      <path
        d="M9 21V13.2L16 8l7 5.2V21h-4.4v-5.2h-5.2V21H9z"
        fill="currentColor"
        className="text-primary-foreground"
      />
      <circle cx="23" cy="9" r="3" fill="currentColor" className="text-accent" />
    </svg>
  );
}
