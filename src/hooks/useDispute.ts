"use client"

import { useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"

export function useDispute() {
  const queryClient = useQueryClient()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (receipt.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["proposals"] })
      queryClient.invalidateQueries({ queryKey: ["credit-detail"] })
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
      queryClient.invalidateQueries({ queryKey: ["governance-token"] })
    }
  }, [receipt.isSuccess, queryClient])

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
