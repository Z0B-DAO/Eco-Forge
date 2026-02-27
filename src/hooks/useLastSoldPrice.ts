"use client"

import { useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, MARKETPLACE_ABI } from "@/services/web3/contracts"

export function useLastSoldPrice(creditId: bigint) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: "getLastSoldPrice",
    args: [creditId],
  })
}
