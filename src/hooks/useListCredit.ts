"use client"

import { useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"

export function useListCredit() {
  const queryClient = useQueryClient()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (receipt.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] })
      queryClient.invalidateQueries({ queryKey: ["user-portfolio"] })
    }
  }, [receipt.isSuccess, queryClient])

  function list(creditId: bigint, amount: bigint, pricePerUnit: bigint) {
    writeContract({
      address: CONTRACT_ADDRESSES.marketplace,
      abi: MARKETPLACE_ABI,
      functionName: "listCredits",
      args: [creditId, amount, pricePerUnit],
    })
  }

  return {
    list,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
