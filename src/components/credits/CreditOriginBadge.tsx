import { CreditOrigin } from "@/types"

const ORIGIN_CONFIG = {
  [CreditOrigin.Certified]: {
    label: "Certified",
    className: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  },
  [CreditOrigin.CommunityVerified]: {
    label: "Community",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
}

export function CreditOriginBadge({ origin }: { origin: CreditOrigin }) {
  const config = ORIGIN_CONFIG[origin]

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
