"use client"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"

export function useVote() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

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
