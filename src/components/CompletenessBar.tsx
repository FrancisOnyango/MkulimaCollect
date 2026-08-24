interface CompletenessBarProps {
  percent: number
  label?: string
  size?: "sm" | "md"
}

export default function CompletenessBar({ percent, label, size = "md" }: CompletenessBarProps) {
  const color = percent >= 80 ? "bg-brand" : percent >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className={`${size === "sm" ? "text-xs" : "text-sm"} text-charcoal-500`}>{label}</span>
          <span className={`${size === "sm" ? "text-xs" : "text-sm"} font-mono font-medium text-charcoal-700`}>{percent}%</span>
        </div>
      )}
      <div className={`w-full ${size === "sm" ? "h-1" : "h-1.5"} rounded-full bg-charcoal-100 overflow-hidden`}>
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
