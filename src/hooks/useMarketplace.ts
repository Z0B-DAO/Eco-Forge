"use client"

import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"
import type { Listing } from "@/types"

export function useMarketplace() {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ["marketplace-listings"],
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("No public client")

      const listedLogs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.marketplace,
        event: {
          type: "event",
          name: "Listed",
          inputs: [
            { name: "listingId", type: "uint256", indexed: true },
            { name: "creditId", type: "uint256", indexed: true },
            { name: "seller", type: "address", indexed: true },
            { name: "amount", type: "uint256", indexed: false },
            { name: "price", type: "uint256", indexed: false },
          ],
        },
        fromBlock: 0n,
        toBlock: "latest",
      })

      const listingIds = listedLogs.map((log) => log.args.listingId).filter((id): id is bigint => id !== undefined)
      const uniqueIds = [...new Set(listingIds)]

      const listings = await Promise.all(
        uniqueIds.map((id) =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.marketplace,
            abi: MARKETPLACE_ABI,
            functionName: "getListing",
            args: [id],
          })
        )
      )

      return (listings as Listing[]).filter((l) => l.active)
    },
  })
}
