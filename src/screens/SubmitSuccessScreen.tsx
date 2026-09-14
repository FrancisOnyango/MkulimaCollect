interface SubmitSuccessScreenProps {
  onDone: () => void
}

export default function SubmitSuccessScreen({ onDone }: SubmitSuccessScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center energea-glow px-6">
      <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" className="text-brand-ink" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-charcoal">Saved on this device</h1>
      <p className="text-sm text-charcoal-500 text-center mt-2 max-w-[280px]">
        The farmer profile is in your local queue. Open Sync when you have a connection.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full max-w-[280px] py-3.5 bg-brand text-brand-ink rounded-full font-semibold text-sm"
      >
        Back to farmers
      </button>
    </div>
  )
}
