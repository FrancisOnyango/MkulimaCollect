import { useState } from "react"

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [agentId, setAgentId] = useState("francis.o@mkulima")
  const [password, setPassword] = useState("••••••••")
  const [org, setOrg] = useState("Kiambu SACCO Network")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 1400)
  }

  return (
    <div className="min-h-full flex flex-col bg-surface">
      {/* Header band */}
      <div className="bg-brand pt-16 pb-10 px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-mono tracking-widest uppercase">MkulimaScore</p>
            <h1 className="text-white text-xl font-semibold leading-tight">MkulimaCollect</h1>
          </div>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">
          Field intelligence for agriculture.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8 flex flex-col gap-5">

        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-1.5 block tracking-wide uppercase">Agent ID / Email</label>
          <input
            className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            value={agentId}
            onChange={e => setAgentId(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-1.5 block tracking-wide uppercase">Password / PIN</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all pr-12"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {showPassword
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-charcoal-500 mb-1.5 block tracking-wide uppercase">Organisation</label>
          <div className="relative">
            <select
              className="w-full border border-charcoal-100 rounded-xl px-4 py-3.5 text-sm text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand appearance-none transition-all pr-10"
              value={org}
              onChange={e => setOrg(e.target.value)}
            >
              <option>Kiambu SACCO Network</option>
              <option>Githunguri Dairy Co-op</option>
              <option>Kenya Tea Development Agency</option>
              <option>Equity Agri Finance</option>
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-brand text-white rounded-xl py-4 font-semibold text-sm mt-2 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Signing in…
            </>
          ) : "Sign in"}
        </button>

        <button className="text-sm text-charcoal-500 text-center underline-offset-2 hover:text-brand transition-colors">
          Device setup
        </button>
      </div>

      {/* Device status */}
      <div className="px-6 pb-10">
        <div className="bg-white border border-charcoal-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-brand" />
            <span className="text-xs font-mono text-charcoal-500">Device registered</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5">
            <span className="text-xs text-charcoal-500">Status</span>
            <span className="text-xs font-medium text-charcoal">Secure</span>
            <span className="text-xs text-charcoal-500">Last sync</span>
            <span className="text-xs font-mono text-charcoal">Today 10:42 AM</span>
            <span className="text-xs text-charcoal-500">App version</span>
            <span className="text-xs font-mono text-charcoal">2.4.1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
