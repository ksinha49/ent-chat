"use client"
import React from "react"
import { Avatar, Box, Paper, Typography, useTheme } from "@mui/material"
import { ErrorOutline } from "@mui/icons-material"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { fadeIn } from "./animations"

interface Props {
  message: { id: string; content: string }
}

export default function ErrorMessage({ message }: Props) {
  const theme = useTheme()
  return (
    <Box
      key={message.id}
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        animation: `${fadeIn} 0.5s ease both`,
        justifyContent: "flex-start",
        maxWidth: "800px",
        mx: "auto",
        width: "100%"
      }}
    >
      <Avatar
        sx={{
          bgcolor: theme.palette.error.main,
          color: "white",
          width: 40,
          height: 40,
          boxShadow: "3px 3px 7px #c8cacd, -3px -3px 7px #ffffff"
        }}
      >
        <ErrorOutline />
      </Avatar>
      <Paper
        sx={{
          p: 2,
          maxWidth: "80%",
          bgcolor: "var(--background)",
          color: "text.primary",
          borderRadius: "20px 20px 20px 5px",
          boxShadow: "5px 5px 10px #d9dbde, -5px -5px 10px #ffffff",
          border: `1px solid ${theme.palette.error.light}`
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </Paper>
    </Box>
  )
}
