import { useState } from "react"
import { agent } from "../data"

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [agentId, setAgentId] = useState("francis.o@mkulima")
  const [password, setPassword] = useState("••••••••")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 400)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto energea-glow px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-8">
      <div className="mb-10">
        <div className="w-11 h-11 rounded-2xl bg-brand flex items-center justify-center mb-6">
          <span className="text-brand-ink font-bold text-lg">M</span>
        </div>
        <p className="text-brand text-[11px] font-medium uppercase tracking-[0.22em]">MkulimaScore</p>
        <h1 className="text-charcoal text-[34px] font-semibold tracking-tight mt-2 leading-none">MkulimaCollect</h1>
        <p className="text-charcoal-500 text-sm mt-4 leading-relaxed max-w-[280px]">
          Capture farmer evidence in the field. Work stays on this device until you sync.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div>
          <label htmlFor="agent-id" className="text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal-500 mb-2 block">Agent ID</label>
          <input
            id="agent-id"
            autoComplete="username"
            className="w-full border border-charcoal-100 rounded-2xl px-4 py-3.5 text-sm text-charcoal bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="agent-password" className="text-[11px] font-medium uppercase tracking-[0.14em] text-charcoal-500 mb-2 block">Password</label>
          <div className="relative">
            <input
              id="agent-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full border border-charcoal-100 rounded-2xl px-4 py-3.5 pr-12 text-sm text-charcoal bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(value => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {showPassword
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
            </button>
          </div>
        </div>

        <p className="text-xs text-charcoal-500">{agent.org}</p>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-brand text-brand-ink rounded-full py-4 font-semibold text-sm mt-2 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  )
}
