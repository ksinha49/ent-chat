"use client"
import React, { useState, useEffect } from "react"
import { Avatar, Box, CircularProgress, Paper, Typography } from "@mui/material"
import { fadeIn, textFadeIn } from "./animations"
import { APP_NAME, APP_LOGO } from "@/lib/config"

export default function ProcessingIndicator() {
  const statuses = [
    "Connecting to AI...",
    "Accessing Knowledge Base...",
    "Compiling response..."
  ]
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const delay = 1800

  useEffect(() => {
    setCurrentStatusIndex(0)
    const interval = setInterval(() => {
      setCurrentStatusIndex((prev) => {
        const next = prev + 1
        if (next === statuses.length) {
          clearInterval(interval)
          return prev
        }
        return next
      })
    }, delay)
    return () => clearInterval(interval)
  }, [])

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        animation: `${fadeIn} 0.5s ease both`,
        maxWidth: "800px",
        mx: "auto",
        width: "100%"
      }}
    >
      <Avatar
        sx={{
          bgcolor: "#D73027",
          color: "white",
          width: 40,
          height: 40,
          boxShadow: "3px 3px 7px #c8cacd, -3px -3px 7px #ffffff"
        }}
      >
        <img
          src={APP_LOGO}
          alt={APP_NAME}
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
        />
      </Avatar>
      <Paper
        sx={{
          p: 2,
          maxWidth: "80%",
          bgcolor: "var(--background)",
          color: "text.primary",
          borderRadius: "20px 20px 20px 5px",
          boxShadow: "5px 5px 10px #d9dbde, -5px -5px 10px #ffffff",
          display: "flex",
          alignItems: "center"
        }}
      >
        <CircularProgress size={16} sx={{ mr: 1.5, color: "text.secondary" }} />
        <Typography variant="body1" key={currentStatusIndex} sx={{ animation: `${textFadeIn} 0.5s ease-in-out` }}>
          {statuses[currentStatusIndex]}
        </Typography>
      </Paper>
    </Box>
  )
}
