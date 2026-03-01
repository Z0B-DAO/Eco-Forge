"use client"

import { useEffect } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"

export function useBuyCredit() {
  const queryClient = useQueryClient()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (receipt.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] })
      queryClient.invalidateQueries({ queryKey: ["user-portfolio"] })
      queryClient.invalidateQueries({ queryKey: ["trade-history"] })
      queryClient.invalidateQueries({ queryKey: ["credit-detail"] })
    }
  }, [receipt.isSuccess, queryClient])

  function buy(listingId: bigint, amount: bigint, totalPrice: bigint) {
    writeContract({
      address: CONTRACT_ADDRESSES.marketplace,
      abi: MARKETPLACE_ABI,
      functionName: "buyCredits",
      args: [listingId, amount],
      value: totalPrice,
    })
  }

  return {
    buy,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
