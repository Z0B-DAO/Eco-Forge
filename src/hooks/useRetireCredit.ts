"use client"

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"

export function useRetireCredit() {
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

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
