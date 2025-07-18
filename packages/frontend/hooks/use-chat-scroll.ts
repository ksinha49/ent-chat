"use client"
import { useRef, useCallback, useEffect } from "react"
import { logger } from "@/lib/logger"

export function useChatScroll(deps: any[]) {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return
    try {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    } catch (e) {
      logger.error("scrollToBottom failed", e)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [...deps, scrollToBottom])

  return containerRef
}
