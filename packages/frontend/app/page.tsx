"use client"
import React, { useState, useRef, useEffect, useCallback, type ReactElement } from "react"
import Link from "next/link"

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Slide,
} from "@mui/material"
import { Menu as MenuIcon, HelpOutline } from "@mui/icons-material"
import type { TransitionProps } from "@mui/material/transitions"
import Sidebar from "@/components/chat/Sidebar"
import ChatMessages from "@/components/chat/ChatMessages"
import WelcomeScreen from "@/components/chat/WelcomeScreen"
import ChatInputForm from "@/components/chat/ChatInputForm"
import ErrorBoundary from "@/components/ErrorBoundary"

/* ------------- Slide transition that always keeps node mounted -------- */

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

/* ----------------------------- helpers -------------------------------- */

interface Suggestion {
  title: string
  prompt: string
}

const logger = {
  info: (message: string, data?: any) =>
    console.log(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), message, data })),
  error: (message: string, error?: any) =>
    console.error(
      JSON.stringify({
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        error: error ? { message: error.message, stack: error.stack } : "No error object",
      }),
    ),
}

/* ============================= PAGE =================================== */

export function Chat() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  /* -------- authentication / user menu ---------- */
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  /* -------- about dialog ---------- */
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)

  /* -------- chat state ---------- */
  const [messages, setMessages] = useState<{ id: string; role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const question = input.trim()
    if (!question) return

    const userMessage = { id: `user-${Date.now()}`, role: "user", content: question }
    setMessages((prev) => [...prev, userMessage])
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
      const assistantMessage = { id: `assistant-${Date.now()}`, role: "assistant", content: data.answer }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      logger.error("Chat submission failed", error)
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "system" as const,
        content: `I'm sorry, but I've encountered an issue. Please check your connection or try again later. \n\n**Error:** ${error.message}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  /* -------- misc ---------- */
  const queryHistory = messages
    .filter((m) => m.role === "user")
    .map((m) => ({ id: m.id, content: m.content }))
  const chatContainerRef = useRef<HTMLDivElement>(null)

  /* -------------------- effects -------------------- */

  // Fetch suggestions on mount
  useEffect(() => {
    fetch("/prompts.json")
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions))
      .catch((err) => logger.error("Failed to load suggestions", err))
  }, [])

  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current) return
    try {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    } catch (e) {
      logger.error("scrollToBottom failed", e)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  /* ------------------- handlers ------------------- */

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
  }

  /* ==================================================================== */

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", bgcolor: "var(--background)" }}>
      {/* SIDE BAR / DRAWER */}
      <Sidebar
        isMobile={isMobile}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        queryHistory={queryHistory}
        setInput={setInput}
        setMessages={setMessages}
        setIsAboutDialogOpen={setIsAboutDialogOpen}
        setUserMenuAnchorEl={setUserMenuAnchorEl}
      />

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* mobile top bar */}
        {isMobile && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor: "var(--background)",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Toolbar>
              <IconButton color="inherit" onClick={() => setIsDrawerOpen(true)} edge="start">
                <MenuIcon />
              </IconButton>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mx: "auto",
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    minWidth: 32,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#D73027",
                    borderRadius: 1.5,
                  }}
                >
                  <img
                    src="/images/ameritas-logo.png"
                    alt="ABACUS Logo"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: "text.primary",
                    fontWeight: "bold",
                  }}
                >
                  ABACUS
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* chat body */}
        <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}>
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
        </Box>

        <ChatInputForm
          input={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        {/* FOOTER */}
        <Box sx={{ p: 1, textAlign: "center", bgcolor: "transparent", position: "relative" }}>
          <Typography variant="caption" color="text.secondary">
            Powered by AmeritasAI. Some responses may not be accurate.
          </Typography>
          <Link href="/faq" passHref>
            <IconButton
              size="small"
              aria-label="help"
              sx={{
                position: "absolute",
                bottom: 4,
                right: 8,
                color: "text.secondary",
              }}
            >
              <HelpOutline fontSize="small" />
            </IconButton>
          </Link>
        </Box>
      </Box>

      {/* ABOUT DIALOG */}
      <Dialog
        open={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
        TransitionComponent={Transition}
        keepMounted
      >
        <DialogTitle>About ABACUS</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ABACUS is an intelligent assistant designed to help you navigate the Ameritas technology landscape. Query
            our repository for information on approved technologies, standards, and best practices.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAboutDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default function Page() {
  return (
    <ErrorBoundary>
      <Chat />
    </ErrorBoundary>
  )
}
