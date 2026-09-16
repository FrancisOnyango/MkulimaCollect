interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  trailing?: React.ReactNode
}

export default function ScreenHeader({ title, subtitle, onBack, trailing }: ScreenHeaderProps) {
  return (
    <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="w-9 h-9 -ml-2 mt-0.5 flex items-center justify-center rounded-full bg-card border border-charcoal-100"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold text-charcoal leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-charcoal-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {trailing}
      </div>
    </header>
  )
}
