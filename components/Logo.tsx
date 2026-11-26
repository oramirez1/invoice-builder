export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3h7l5 5v13H7z" strokeLinejoin="round" />
          <path d="M14 3v5h5M10 13h6M10 17h4" strokeLinecap="round" />
        </svg>
      </span>
      <span className={compact ? "hidden sm:inline" : ""}>Invoice Builder</span>
    </span>
  );
}
