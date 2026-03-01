import { CreditStatus } from "@/types"

const STATUS_CONFIG = {
  [CreditStatus.Pending]: {
    label: "Pending",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  [CreditStatus.Verified]: {
    label: "Verified",
    className: "bg-white/10 text-white/80 border-white/20",
  },
  [CreditStatus.Suspended]: {
    label: "Suspended",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  [CreditStatus.Retired]: {
    label: "Retired",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
}

export function CreditStatusBadge({ status }: { status: CreditStatus }) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
