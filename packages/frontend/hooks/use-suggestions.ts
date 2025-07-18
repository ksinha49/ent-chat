"use client"
import { useState, useEffect } from "react"
import { logger } from "@/lib/logger"

export interface Suggestion {
  title: string
  prompt: string
}

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    fetch("/prompts.json")
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions))
      .catch((err) => logger.error("Failed to load suggestions", err))
  }, [])

  return suggestions
}
