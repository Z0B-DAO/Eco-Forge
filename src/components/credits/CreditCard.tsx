import Link from "next/link"
import { CreditOriginBadge } from "./CreditOriginBadge"
import { ImpactScoreBadge } from "./ImpactScoreBadge"
import { formatAvax } from "@/lib/utils"
import type { CreditType, Listing } from "@/types"

interface CreditCardProps {
  credit: CreditType
  listing?: Listing
}

export function CreditCard({ credit, listing }: CreditCardProps) {
  return (
    <Link
      href={`/marketplace/${credit.id}`}
      className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all hover:border-zinc-700 hover:bg-zinc-800/80"
    >
      <div className="flex items-start justify-between">
        <CreditOriginBadge origin={credit.origin} />
        <ImpactScoreBadge score={Number(credit.impactScore)} />
      </div>

      <h3 className="mt-3 text-base font-semibold text-zinc-100 group-hover:text-white">
        {credit.projectName}
      </h3>

      <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-400">
        <span>{credit.projectType}</span>
        <span className="text-zinc-600">·</span>
        <span>{credit.region}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="text-sm text-zinc-400">
          <span className="text-zinc-100 font-medium">{Number(credit.tonnesCO2e)}</span> tCO2e
        </div>
        {listing && (
          <div className="text-sm font-medium text-emerald-400">
            {formatAvax(listing.pricePerUnit)} AVAX
          </div>
        )}
      </div>
    </Link>
  )
}
