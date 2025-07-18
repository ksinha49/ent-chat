"use client"
import React, { useState, useRef, useEffect, useCallback, type ReactElement } from "react"
import Link from "next/link"
import { useChat } from "@ai-sdk/react"

import {
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Paper,
  TextField,
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
  Grid,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Add,
  AutoAwesome,
  HelpOutline,
} from "@mui/icons-material"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { TransitionProps } from "@mui/material/transitions"
import SidebarContent from "@/components/chat/SidebarContent"
import ProcessingIndicator from "@/components/chat/ProcessingIndicator"
import ErrorMessage from "@/components/chat/ErrorMessage"
import { fadeIn } from "@/components/chat/animations"

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

export default function Chat() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  /* -------- authentication / user menu ---------- */
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  /* -------- about dialog ---------- */
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)

  /* -------- chat state (ai-sdk) ---------- */
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    api: "/api/chat",
    body: {
      responseStyle: "techInquiry",
    },
    onFinish: () => {
      setIsProcessing(false)
    },
    onError: (error) => {
      logger.error("Chat submission failed", error)
      setIsProcessing(false)
      // Append a custom error message to the chat
      const errorId = `error-${Date.now()}`
      const errorMessage = {
        id: errorId,
        role: "system" as const, // Use 'system' role for error messages
        content: `I'm sorry, but I've encountered an issue. Please check your connection or try again later. \n\n**Error:** ${error.message}`,
      }
      // Use a function to safely update messages based on the previous state
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    },
  })

  /* -------- misc ---------- */
  const queryHistory = messages.filter((m) => m.role === "user").map((m) => m.content)
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

  useEffect(() => {
    setIsProcessing(isLoading)
  }, [isLoading])

  /* ------------------- handlers ------------------- */

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
  }

  /* ==================================================================== */

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", bgcolor: "var(--background)" }}>
      {/* SIDE BAR / DRAWER */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: 280,
            flexShrink: 0,
            bgcolor: "#2c3e50",
            boxShadow: "5px 0px 15px rgba(0,0,0,0.1)",
            zIndex: 1,
          }}
        >
          <SidebarContent />
        </Box>
      )}
      {isMobile && (
        <Drawer anchor="left" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Box sx={{ width: 280, bgcolor: "#2c3e50", height: "100%" }}>
            <SidebarContent />
          </Box>
        </Drawer>
      )}

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
          {/* empty state */}
          {messages.length === 0 && !isLoading ? (
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

              {/* Suggested Prompts */}
              {suggestions.length > 0 && (
                <Grid container spacing={2} sx={{ mt: 2, justifyContent: "center" }}>
                  {suggestions.map((suggestion, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper
                        variant="outlined"
                        onClick={() => handleSuggestionClick(suggestion.prompt)}
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
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: "800px", mx: "auto", width: "100%" }}
            >
              {messages.map((m, i) => {
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
                          style={{
                            width: "70%",
                            height: "70%",
                            objectFit: "contain",
                          }}
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
          )}
        </Box>

        {/* INPUT BOX */}
        <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "transparent" }}>
          <Paper
            component="form"
            onSubmit={(e) => {
              setIsProcessing(true)
              handleSubmit(e)
            }}
            sx={{
              p: 0.5,
              display: "flex",
              alignItems: "center",
              borderRadius: "25px", // Pill shape
              bgcolor: "var(--background)",
              boxShadow: "inset 5px 5px 10px #d9dbde, inset -5px -5px 10px #ffffff",
            }}
          >
            <TextField
              fullWidth
              variant="standard"
              placeholder="Ask about approved technologies, versions, and usage…"
              value={input}
              onChange={handleInputChange}
              multiline
              maxRows={5}
              disabled={isProcessing}
              InputProps={{ disableUnderline: true, sx: { p: "10px 20px" } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !input.trim()}
              sx={{ borderRadius: "20px", mr: 1 }}
              startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
            >
              {isProcessing ? "..." : "Ask"}
            </Button>
          </Paper>
        </Box>

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
