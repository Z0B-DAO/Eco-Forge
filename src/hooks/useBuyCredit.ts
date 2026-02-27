"use client"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"

export function useBuyCredit() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

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
