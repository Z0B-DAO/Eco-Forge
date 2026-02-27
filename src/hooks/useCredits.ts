"use client"

import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import type { CreditType } from "@/types"

export function useCredits() {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ["credits"],
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("No public client")

      const [certifiedLogs, communityLogs] = await Promise.all([
        publicClient.getLogs({
          address: CONTRACT_ADDRESSES.carbonCredit,
          event: {
            type: "event",
            name: "CertifiedCreditCreated",
            inputs: [
              { name: "id", type: "uint256", indexed: true },
              { name: "projectName", type: "string", indexed: false },
              { name: "registrySource", type: "string", indexed: false },
              { name: "proofHash", type: "bytes32", indexed: false },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: CONTRACT_ADDRESSES.carbonCredit,
          event: {
            type: "event",
            name: "CommunityCreditSubmitted",
            inputs: [
              { name: "id", type: "uint256", indexed: true },
              { name: "projectName", type: "string", indexed: false },
              { name: "issuer", type: "address", indexed: true },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        }),
      ])

      const allIds = [
        ...certifiedLogs.map((log) => log.args.id).filter((id): id is bigint => id !== undefined),
        ...communityLogs.map((log) => log.args.id).filter((id): id is bigint => id !== undefined),
      ]

      const uniqueIds = [...new Set(allIds)]

      const credits = await Promise.all(
        uniqueIds.map((id) =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.carbonCredit,
            abi: CARBON_CREDIT_ABI,
            functionName: "getCreditType",
            args: [id],
          })
        )
      )

      return credits as CreditType[]
    },
  })
}
