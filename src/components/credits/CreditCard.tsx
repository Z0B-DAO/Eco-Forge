import Link from "next/link"
import { CreditOriginBadge } from "./CreditOriginBadge"

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
      className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-100">
          {credit.projectName}
        </h3>
        <CreditOriginBadge origin={credit.origin} />
      </div>

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
