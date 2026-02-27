import { http } from "wagmi"
import { avalancheFuji } from "wagmi/chains"
import { getDefaultConfig } from "@rainbow-me/rainbowkit"

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID || ""
if (!projectId) {
  console.warn("[EcoForge] NEXT_PUBLIC_WALLETCONNECT_ID not set — WalletConnect disabled. Get one at https://cloud.walletconnect.com")
}

export const config = getDefaultConfig({
  appName: "EcoForge",
  projectId,
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(
      process.env.NEXT_PUBLIC_AVALANCHE_RPC ||
        "https://api.avax-test.network/ext/bc/C/rpc"
    ),
  },
})
