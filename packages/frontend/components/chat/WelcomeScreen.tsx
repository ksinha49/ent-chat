"use client"
import React from "react"
import { Box, Grid, Paper, Typography } from "@mui/material"
import { Add } from "@mui/icons-material"
import { fadeIn } from "@/components/chat/animations"

interface Suggestion {
  title: string
  prompt: string
}

interface Props {
  suggestions: Suggestion[]
  onSuggestionClick: (prompt: string) => void
}

export default function WelcomeScreen({ suggestions, onSuggestionClick }: Props) {
  return (
    <Box
      sx={{
        animation: `${fadeIn} 0.6s ease both`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        textAlign: "center",
        maxWidth: 700,
        mx: "auto",
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: "bold" }}>
        Welcome to ABACUS
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Your intelligent assistant for navigating the Ameritas technology landscape.
      </Typography>
      {suggestions.length > 0 && (
        <Grid container spacing={2} sx={{ mt: 2, justifyContent: "center" }}>
          {suggestions.map((suggestion, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper
                variant="outlined"
                onClick={() => onSuggestionClick(suggestion.prompt)}
                sx={{
                  p: 2,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  borderRadius: 4,
                  bgcolor: "var(--background)",
                  boxShadow: "5px 5px 10px #d9dbde, -5px -5px 10px #ffffff",
                  "&:hover": {
                    boxShadow: "inset 5px 5px 10px #d9dbde, inset -5px -5px 10px #ffffff",
                  },
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body1">{suggestion.title}</Typography>
                <Add color="action" />
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
