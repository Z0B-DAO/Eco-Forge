"use client"

import { useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"

export function useVote() {
  const queryClient = useQueryClient()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (receipt.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
      queryClient.invalidateQueries({ queryKey: ["proposal"] })
      queryClient.invalidateQueries({ queryKey: ["hasVoted"] })
    }
  }, [receipt.isSuccess, queryClient])

  function vote(proposalId: bigint, support: boolean) {
    writeContract({
      address: CONTRACT_ADDRESSES.governance,
      abi: GOVERNANCE_ABI,
      functionName: "vote",
      args: [proposalId, support],
    })
  }

  return {
    vote,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
