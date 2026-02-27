"use client"

import { useAccount, useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, ECOFORGE_TOKEN_ABI } from "@/services/web3/contracts"
import type { UserProgress, Milestone } from "@/types"

export function useMilestoneProgress() {
  const { address } = useAccount()

  const progress = useReadContract({
    address: CONTRACT_ADDRESSES.ecoForgeToken,
    abi: ECOFORGE_TOKEN_ABI,
    functionName: "getUserProgress",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const milestones = useReadContract({
    address: CONTRACT_ADDRESSES.ecoForgeToken,
    abi: ECOFORGE_TOKEN_ABI,
    functionName: "getMilestones",
  })

  return {
    progress: progress.data as UserProgress | undefined,
    milestones: milestones.data as Milestone[] | undefined,
    isLoading: progress.isLoading || milestones.isLoading,
    error: progress.error || milestones.error,
    refetch: () => {
      progress.refetch()
      milestones.refetch()
    },
  }
}
