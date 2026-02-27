"use client"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"

export function useListCredit() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

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
