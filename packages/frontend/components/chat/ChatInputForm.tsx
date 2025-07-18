"use client"
import React from "react"
import { Box, Button, CircularProgress, Paper, TextField } from "@mui/material"
import { AutoAwesome } from "@mui/icons-material"

interface Props {
  input: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export default function ChatInputForm({ input, onChange, onSubmit, isLoading }: Props) {
  return (
    <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "transparent" }}>
      <Paper
        component="form"
        onSubmit={onSubmit}
        sx={{
          p: 0.5,
          display: "flex",
          alignItems: "center",
          borderRadius: "25px",
          bgcolor: "var(--background)",
          boxShadow: "inset 5px 5px 10px #d9dbde, inset -5px -5px 10px #ffffff",
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          placeholder="Ask about approved technologies, versions, and usage…"
          value={input}
          onChange={onChange}
          multiline
          maxRows={5}
          disabled={isLoading}
          InputProps={{ disableUnderline: true, sx: { p: "10px 20px" } }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !input.trim()}
          sx={{ borderRadius: "20px", mr: 1 }}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
        >
          {isLoading ? "..." : "Ask"}
        </Button>
      </Paper>
    </Box>
  )
}
