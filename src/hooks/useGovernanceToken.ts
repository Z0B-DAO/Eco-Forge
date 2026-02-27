"use client"

import { useAccount, useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, ECOFORGE_TOKEN_ABI } from "@/services/web3/contracts"

export function useGovernanceToken() {
  const { address } = useAccount()

  const balance = useReadContract({
    address: CONTRACT_ADDRESSES.ecoForgeToken,
    abi: ECOFORGE_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  const totalSupply = useReadContract({
    address: CONTRACT_ADDRESSES.ecoForgeToken,
    abi: ECOFORGE_TOKEN_ABI,
    functionName: "totalSupply",
  })

  return {
    balance: balance.data as bigint | undefined,
    totalSupply: totalSupply.data as bigint | undefined,
    isLoading: balance.isLoading || totalSupply.isLoading,
    error: balance.error || totalSupply.error,
    refetch: () => {
      balance.refetch()
      totalSupply.refetch()
    },
  }
}
