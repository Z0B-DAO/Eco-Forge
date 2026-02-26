"use client"

import { useWaitForTransactionReceipt } from "wagmi"
import { truncateAddress } from "@/lib/utils"

interface TxStatusProps {
  hash: `0x${string}` | undefined
  onSuccess?: () => void
}

export function TxStatus({ hash, onSuccess }: TxStatusProps) {
  const { isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash,
    },
  })

  if (isSuccess && onSuccess) {
    onSuccess()
  }

  if (!hash) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
          <span>Confirming {truncateAddress(hash)}...</span>
        </div>
      )}
      {isSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <span>Transaction confirmed</span>
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span>Transaction failed</span>
        </div>
      )}
    </div>
  )
}
