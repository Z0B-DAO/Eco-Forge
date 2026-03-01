"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

const Blob = dynamic(() => import("@/components/landing/Blob"), { ssr: false })

const TOPBAR_H = 80

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [phase, setPhase] = useState<"idle" | "exit" | "enter" | "settle">("idle")
  const contentRef = useRef<HTMLDivElement>(null)
  const newPageRef = useRef<HTMLDivElement>(null)
  const cloneRef = useRef<HTMLElement | null>(null)
  const rafRef = useRef<number>(0)
  const hasNavigated = useRef(false)

  const handleNavClick = useCallback(() => {
    const el = contentRef.current
    if (!el) return

    const clone = el.cloneNode(true) as HTMLElement
    clone.style.position = "fixed"
    clone.style.top = el.getBoundingClientRect().top + "px"
    clone.style.left = "0"
    clone.style.right = "0"
    clone.style.zIndex = "10"
    clone.style.pointerEvents = "none"
    clone.style.transformOrigin = "center center"
    clone.style.transition = "transform 1.5s ease"
    clone.style.border = "1px solid white"
    clone.style.borderRadius = "16px"
    document.body.appendChild(clone)

    requestAnimationFrame(() => {
      clone.style.transform = "scale(0.85)"
    })

    cloneRef.current = clone
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]")
      if (!anchor) return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("http") || href.startsWith("#")) return
      handleNavClick()
    }
    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [handleNavClick])

  useEffect(() => {
    if (phase !== "enter") return
    const clone = cloneRef.current
    if (!clone) return

    const tick = () => {
      const newPage = newPageRef.current
      if (!newPage || !clone.parentElement) return

      const pageTop = newPage.getBoundingClientRect().top
      const cloneRect = clone.getBoundingClientRect()

      const screenClip = cloneRect.bottom - pageTop
      if (screenClip > 0) {
        const scale = cloneRect.height / clone.offsetHeight
        const elementClip = screenClip / scale
        clone.style.clipPath = `inset(0 0 ${elementClip}px 0)`
      }

      if (pageTop <= cloneRect.top) {
        clone.remove()
        cloneRef.current = null
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase])

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      hasNavigated.current = true
      setSidebarOpen(false)

      // EXIT: topbar up + clone scales back
      setPhase("exit")

      // ENTER: new page slides up
      const t1 = setTimeout(() => setPhase("enter"), 600)

      // SETTLE: topbar returns + pushes page down, clone removed
      const t2 = setTimeout(() => {
        if (cloneRef.current) {
          cloneRef.current.remove()
          cloneRef.current = null
        }
        setPhase("settle")
      }, 2600)

      // IDLE
      const t3 = setTimeout(() => setPhase("idle"), 3400)

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [pathname])

  const isAnimating = hasNavigated.current && phase !== "idle"

  return (
    <div className={`min-h-screen bg-background text-foreground ${isAnimating ? "overflow-hidden" : "overflow-x-hidden"}`}>
      <Blob cameraZ={0.1} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <motion.div
        className="relative z-30 border border-white rounded-2xl"
        animate={{
          y: phase === "exit" || phase === "enter" ? "-100%" : "0%"
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
      </motion.div>

      {isAnimating ? (
        <motion.div
          key={pathname}
          ref={(el) => { contentRef.current = el; newPageRef.current = el }}
          className="relative z-20 border border-white rounded-t-2xl border-b-0 -mt-px min-h-screen"
          initial={{ y: "100vh" }}
          animate={{
            y: phase === "exit" ? "100vh" : phase === "settle" ? 0 : -TOPBAR_H
          }}
          transition={{
            duration: phase === "settle" ? 0.6 : 2,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-3">
            {children}
          </main>
          <Footer />
        </motion.div>
      ) : (
        <div ref={contentRef} className="relative z-20 border border-white rounded-t-2xl border-b-0 -mt-px min-h-screen">
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-3">
            {children}
          </main>
          <Footer />
        </div>
      )}
    </div>
  )
}
