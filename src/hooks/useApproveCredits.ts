"use client"

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"

export function useApproveCredits() {
  const { address } = useAccount()
  const { data: hash, writeContract, isPending, error } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({ hash })

  const { data: isApproved } = useReadContract({
    address: CONTRACT_ADDRESSES.carbonCredit,
    abi: CARBON_CREDIT_ABI,
    functionName: "isApprovedForAll",
    args: address ? [address, CONTRACT_ADDRESSES.marketplace] : undefined,
    query: { enabled: !!address },
  })

  function approve() {
    writeContract({
      address: CONTRACT_ADDRESSES.carbonCredit,
      abi: CARBON_CREDIT_ABI,
      functionName: "setApprovalForAll",
      args: [CONTRACT_ADDRESSES.marketplace, true],
    })
  }

  return {
    approve,
    isApproved: !!isApproved,
    isPending,
    isConfirming: receipt.isPending,
    isConfirmed: receipt.isSuccess,
    hash,
    error: error || receipt.error,
  }
}
