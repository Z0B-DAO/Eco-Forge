"use client"

import { useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import type { CreditType } from "@/types"

export function useCreditDetail(creditId: bigint) {
  const result = useReadContract({
    address: CONTRACT_ADDRESSES.carbonCredit,
    abi: CARBON_CREDIT_ABI,
    functionName: "getCreditType",
    args: [creditId],
  })

  return {
    ...result,
    data: result.data as CreditType | undefined,
  }
}
