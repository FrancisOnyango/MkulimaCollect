type BadgeVariant = "verified" | "incomplete" | "draft" | "correction" | "synced" | "unsynced" | "inprogress" | "pending"

const variants: Record<BadgeVariant, string> = {
  verified: "bg-brand-light text-brand font-medium",
  synced: "bg-brand-light text-brand font-medium",
  incomplete: "bg-amber-bg text-amber-field font-medium",
  inprogress: "bg-brand-light text-brand font-medium",
  pending: "bg-charcoal-50 text-charcoal-500 font-medium",
  draft: "bg-charcoal-50 text-charcoal-500 font-medium",
  correction: "bg-red-bg text-red-field font-medium",
  unsynced: "bg-amber-bg text-amber-field font-medium",
}

const labels: Record<BadgeVariant, string> = {
  verified: "Verified",
  synced: "Synced",
  incomplete: "Incomplete",
  inprogress: "In progress",
  pending: "Pending sync",
  draft: "Draft",
  correction: "Needs correction",
  unsynced: "Unsynced",
}

export default function Badge({ variant }: { variant: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${variants[variant]}`}>
      {labels[variant]}
    </span>
  )
}
