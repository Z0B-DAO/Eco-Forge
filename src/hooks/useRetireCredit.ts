"use client"

import { useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"

export function useRetireCredit() {
  const queryClient = useQueryClient()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (receipt.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["credit-detail"] })
      queryClient.invalidateQueries({ queryKey: ["user-portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["retired-credits"] })
    }
  }, [receipt.isSuccess, queryClient])

  function retire(creditId: bigint, amount: bigint) {
    writeContract({
      address: CONTRACT_ADDRESSES.carbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "retireCredits",
      args: [creditId, amount],
    })
  }

  return {
    retire,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
