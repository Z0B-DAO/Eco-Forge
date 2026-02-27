"use client"

import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"
import type { Proposal } from "@/types"

export function useProposals() {
  const publicClient = usePublicClient()

  return useQuery({
    queryKey: ["proposals"],
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("No public client")

      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.governance,
        event: {
          type: "event",
          name: "ProposalCreated",
          inputs: [
            { name: "id", type: "uint256", indexed: true },
            { name: "proposer", type: "address", indexed: true },
            { name: "pType", type: "uint8", indexed: false },
          ],
        },
        fromBlock: 0n,
        toBlock: "latest",
      })

      const proposalIds = logs.map((log) => log.args.id).filter((id): id is bigint => id !== undefined)
      const uniqueIds = [...new Set(proposalIds)]

      const proposals = await Promise.all(
        uniqueIds.map((id) =>
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.governance,
            abi: GOVERNANCE_ABI,
            functionName: "proposals",
            args: [id],
          })
        )
      )

      return proposals as Proposal[]
    },
  })
}
