"use client"

import { useAccount, usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI, MARKETPLACE_ABI } from "@/services/web3/contracts"
import { useCredits } from "./useCredits"
import { useRetiredCredits } from "./useRetiredCredits"
import { useGovernanceToken } from "./useGovernanceToken"
import type { CreditType } from "@/types"

export interface PortfolioCredit {
  credit: CreditType
  balance: bigint
  estimatedValue: bigint
}

export function useUserPortfolio() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: credits } = useCredits()
  const retired = useRetiredCredits(address)
  const governance = useGovernanceToken()

  const holdings = useQuery({
    queryKey: ["portfolio-holdings", address, credits?.map((c: CreditType) => c.id.toString())],
    enabled: !!publicClient && !!address && !!credits && credits.length > 0,
    queryFn: async () => {
      if (!publicClient || !address || !credits) throw new Error("Missing data")

      const accounts = credits.map(() => address)
      const ids = credits.map((c: CreditType) => c.id)

      const balances = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.carbonCredit,
        abi: CARBON_CREDIT_ABI,
        functionName: "balanceOfBatch",
        args: [accounts, ids],
      })) as bigint[]

      const heldIndices = balances
        .map((b, i) => (b > 0n ? i : -1))
        .filter((i) => i !== -1)

      const lastPrices = await Promise.all(
        heldIndices.map((i) =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.marketplace,
            abi: MARKETPLACE_ABI,
            functionName: "getLastSoldPrice",
            args: [credits[i].id],
          })
        )
      )

      return heldIndices.map((i, idx) => ({
        credit: credits[i],
        balance: balances[i],
        estimatedValue: (lastPrices[idx] as bigint) * balances[i],
      }))
    },
  })

  return {
    holdings: holdings.data || [],
    retired: retired.data,
    governanceBalance: governance.balance,
    isLoading: holdings.isLoading || retired.isLoading || governance.isLoading,
    error: holdings.error || retired.error || governance.error,
    refetch: () => {
      holdings.refetch()
      retired.refetch()
      governance.refetch()
    },
  }
}
