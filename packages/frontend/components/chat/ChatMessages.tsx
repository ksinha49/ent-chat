"use client"
import React from "react"
import { Avatar, Box, Paper } from "@mui/material"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ProcessingIndicator from "@/components/chat/ProcessingIndicator"
import ErrorMessage from "@/components/chat/ErrorMessage"
import { fadeIn } from "@/components/chat/animations"

interface Message {
  id: string
  role: string
  content: string
}

interface Props {
  messages: Message[]
  isLoading: boolean
}

export default function ChatMessages({ messages, isLoading }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: "800px", mx: "auto", width: "100%" }}>
      {messages.map((m) => {
        if (m.role === "system") {
          return <ErrorMessage key={m.id} message={m} />
        }
        return (
          <Box
            key={m.id}
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              animation: `${fadeIn} 0.5s ease both`,
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {m.role !== "user" && (
              <Avatar
                sx={{
                  bgcolor: "#D73027",
                  color: "white",
                  width: 40,
                  height: 40,
                  boxShadow: "3px 3px 7px #c8cacd, -3px -3px 7px #ffffff",
                }}
              >
                <img
                  src="/images/ameritas-logo.png"
                  alt="ABACUS"
                  style={{ width: "70%", height: "70%", objectFit: "contain" }}
                />
              </Avatar>
            )}
            <Paper
              sx={{
                p: 2,
                maxWidth: "80%",
                bgcolor: m.role === "user" ? "#00529B" : "var(--background)",
                color: m.role === "user" ? "white" : "text.primary",
                borderRadius: m.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                boxShadow: "5px 5px 10px #d9dbde, -5px -5px 10px #ffffff",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </Paper>
          </Box>
        )
      })}
      {isLoading && <ProcessingIndicator />}
    </Box>
  )
}
