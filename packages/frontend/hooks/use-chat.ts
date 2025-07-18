"use client"
import { useState, useCallback } from "react"
import { logger } from "@/lib/logger"

export interface Message {
  id: string
  role: string
  content: string
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const question = input.trim()
    if (!question) return

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: question }
    setMessages(prev => [...prev, userMessage])
    setInput("")

    setIsLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    try {
      const res = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      logger.error("Chat submission failed", error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: `I'm sorry, but I've encountered an issue. Please check your connection or try again later. \n\n**Error:** ${error.message}`,
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input])

  const queryHistory = messages
    .filter((m) => m.role === "user")
    .map((m) => ({ id: m.id, content: m.content }))

  return {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    queryHistory,
  }
}
