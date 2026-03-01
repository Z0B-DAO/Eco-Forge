"use client"

import { useState, useEffect } from "react"
import { RainbowKitProvider, type Theme } from "@rainbow-me/rainbowkit"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { config } from "@/services/web3/config"
import "@rainbow-me/rainbowkit/styles.css"

const queryClient = new QueryClient()

const ecoForgeTheme: Theme = {
  blurs: {
    modalOverlay: "blur(8px)",
  },
  colors: {
    accentColor: "#FFFFFF",
    accentColorForeground: "#0B0B0B",
    actionButtonBorder: "rgba(255, 255, 255, 0.08)",
    actionButtonBorderMobile: "rgba(255, 255, 255, 0.06)",
    actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.06)",
    closeButton: "rgba(255, 255, 255, 0.6)",
    closeButtonBackground: "transparent",
    connectButtonBackground: "#FFFFFF",
    connectButtonBackgroundError: "#F87171",
    connectButtonInnerBackground: "rgba(255, 255, 255, 0.06)",
    connectButtonText: "#0B0B0B",
    connectButtonTextError: "#FFFFFF",
    connectionIndicator: "#34D399",
    downloadBottomCardBackground: "#0B0B0B",
    downloadTopCardBackground: "#131313",
    error: "#F87171",
    generalBorder: "rgba(255, 255, 255, 0.08)",
    generalBorderDim: "rgba(255, 255, 255, 0.04)",
    menuItemBackground: "rgba(255, 255, 255, 0.06)",
    modalBackdrop: "rgba(0, 0, 0, 0.7)",
    modalBackground: "#0B0B0B",
    modalBorder: "rgba(255, 255, 255, 0.05)",
    modalText: "#E8E8E8",
    modalTextDim: "rgba(255, 255, 255, 0.4)",
    modalTextSecondary: "rgba(255, 255, 255, 0.5)",
    profileAction: "#0B0B0B",
    profileActionHover: "rgba(255, 255, 255, 0.08)",
    profileForeground: "#0B0B0B",
    selectedOptionBorder: "rgba(255, 255, 255, 0.2)",
    standby: "#FFD700",
  },
  fonts: {
    body: "var(--font-satoshi), sans-serif",
  },
  radii: {
    actionButton: "4px",
    connectButton: "4px",
    menuButton: "4px",
    modal: "8px",
    modalMobile: "8px",
  },
  shadows: {
    connectButton: "none",
    dialog: "0 8px 32px rgba(0, 0, 0, 0.6)",
    profileDetailsAction: "0 0 0 1px rgba(255, 255, 255, 0.08)",
    selectedOption: "0 0 0 1px rgba(255, 255, 255, 0.15)",
    selectedWallet: "0 0 0 1px rgba(255, 255, 255, 0.15)",
    walletLogo: "none",
  },
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={ecoForgeTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
