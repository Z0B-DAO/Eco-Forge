"use client"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"

export function useDispute() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  function dispute(creditId: bigint, reason: string) {
    writeContract({
      address: CONTRACT_ADDRESSES.governance,
      abi: GOVERNANCE_ABI,
      functionName: "disputeCredit",
      args: [creditId, reason],
    })
  }

  return {
    dispute,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
