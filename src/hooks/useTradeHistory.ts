"use client"

import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES } from "@/services/web3/contracts"
import type { ListedEvent, SoldEvent } from "@/types"

export function useTradeHistory(address: `0x${string}` | undefined) {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ["trade-history", address],
    enabled: !!publicClient && !!address,
    queryFn: async () => {
      if (!publicClient || !address) throw new Error("Missing client or address")

      const [listedLogs, soldLogs] = await Promise.all([
        publicClient.getLogs({
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
          args: { seller: address },
          fromBlock: 0n,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: CONTRACT_ADDRESSES.marketplace,
          event: {
            type: "event",
            name: "Sold",
            inputs: [
              { name: "listingId", type: "uint256", indexed: true },
              { name: "buyer", type: "address", indexed: true },
              { name: "creditId", type: "uint256", indexed: true },
              { name: "amount", type: "uint256", indexed: false },
              { name: "totalPrice", type: "uint256", indexed: false },
            ],
          },
          args: { buyer: address },
          fromBlock: 0n,
          toBlock: "latest",
        }),
      ])

      const listed: ListedEvent[] = listedLogs
        .filter((log) => log.args.listingId !== undefined)
        .map((log) => ({
          listingId: log.args.listingId!,
          creditId: log.args.creditId!,
          seller: log.args.seller!,
          amount: log.args.amount!,
          price: log.args.price!,
        }))

      const sold: SoldEvent[] = soldLogs
        .filter((log) => log.args.listingId !== undefined)
        .map((log) => ({
          listingId: log.args.listingId!,
          buyer: log.args.buyer!,
          creditId: log.args.creditId!,
          amount: log.args.amount!,
          totalPrice: log.args.totalPrice!,
        }))

      return { listed, sold }
    },
  })
}
