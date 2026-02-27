"use client"

import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import type { CreditsRetiredEvent, CreditType } from "@/types"

export function useRetiredCredits(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ["retired-credits", address],
    enabled: !!publicClient && !!address,
    queryFn: async () => {
      if (!publicClient || !address) throw new Error("Missing client or address")

      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.carbonCredit,
        event: {
          type: "event",
          name: "CreditsRetired",
          inputs: [
            { name: "owner", type: "address", indexed: true },
            { name: "creditId", type: "uint256", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
          ],
        },
        args: { owner: address },
        fromBlock: 0n,
        toBlock: "latest",
      })

      const retiredEvents: CreditsRetiredEvent[] = logs
        .filter((log) => log.args.owner !== undefined)
        .map((log) => ({
          owner: log.args.owner!,
          creditId: log.args.creditId!,
          amount: log.args.amount!,
        }))

      const uniqueCreditIds = [...new Set(retiredEvents.map((e) => e.creditId))]

      const creditTypes = await Promise.all(
        uniqueCreditIds.map((id) =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.carbonCredit,
            abi: CARBON_CREDIT_ABI,
            functionName: "getCreditType",
            args: [id],
          })
        )
      )

      const creditMap = new Map<bigint, CreditType>()
      uniqueCreditIds.forEach((id, i) => {
        creditMap.set(id, creditTypes[i] as CreditType)
      })

      let totalCO2 = 0n
      for (const event of retiredEvents) {
        const credit = creditMap.get(event.creditId)
        if (credit) {
          totalCO2 += credit.tonnesCO2e * event.amount
        }
      }

      return { events: retiredEvents, totalCO2, creditMap }
    },
  })
}
