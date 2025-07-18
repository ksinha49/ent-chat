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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  keyframes,
  Slide,
  Grid,
} from "@mui/material"
import {
  Menu as MenuIcon,
  Add,
  PersonOutline,
  History,
  InfoOutlined,
  AutoAwesome,
  HelpOutline,
  ErrorOutline,
} from "@mui/icons-material"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { TransitionProps } from "@mui/material/transitions"

/* ----------------------------- animations ----------------------------- */

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const textFadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
`

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

  /* ------------------- sidebar ------------------- */

  const SidebarContent = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        bgcolor: "#2c3e50", // Darker, more modern sidebar
        color: "white",
      }}
    >
      {/* logo */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            minWidth: 40,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#D73027",
            borderRadius: 2,
            px: 1,
            py: 0.5,
          }}
        >
          <img
            src="/images/ameritas-logo.png"
            alt="ABACUS Logo"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            onError={(e) => {
              e.currentTarget.style.display = "none"
              e.currentTarget.parentElement!.innerHTML =
                '<span style="color:white;font-weight:bold;font-size:14px;">A</span>'
            }}
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          ABACUS
        </Typography>
      </Box>

      {/* new chat */}
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => {
          setMessages([])
          setInput("")
        }}
        sx={{
          mb: 2,
          bgcolor: "rgba(255 255 255 / .1)",
          "&:hover": { bgcolor: "rgba(255 255 255 / .2)" },
          justifyContent: "flex-start",
        }}
      >
        New Chat
      </Button>

      <Divider sx={{ my: 1, borderColor: "rgba(255 255 255 / .15)" }} />

      {/* history header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
        <History sx={{ color: "rgba(255,255,255,0.7)" }} />
        <Typography variant="overline" color="rgba(255,255,255,0.7)">
          History
        </Typography>
      </Box>

      {/* history list */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {queryHistory.length ? (
          <List dense>
            {[...queryHistory].reverse().map((q, i) => (
              <Box key={i} sx={{ animation: `${fadeIn} 0.5s ease ${i * 0.05}s both` }}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setInput(q)
                      if (isMobile) setIsDrawerOpen(false)
                    }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={q}
                      primaryTypographyProps={{
                        noWrap: true,
                        sx: { color: "#E0E0E0" },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        ) : (
          <Typography sx={{ p: 2, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>No history yet.</Typography>
        )}
      </Box>

      {/* about & user */}
      <Divider sx={{ my: 1, borderColor: "rgba(255 255 255 / .15)" }} />
      <List dense>
        <ListItemButton onClick={() => setIsAboutDialogOpen(true)} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <InfoOutlined sx={{ color: "rgba(255 255 255 / .7)" }} />
          </ListItemIcon>
          <ListItemText primary="About" />
        </ListItemButton>
      </List>

      {/* mock user section */}
      <Box
        onClick={(e) => setUserMenuAnchorEl(e.currentTarget)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1,
          mt: 1,
          borderRadius: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "rgba(255 255 255 / .08)" },
        }}
      >
        <Avatar sx={{ bgcolor: "#00529B" }}>
          <PersonOutline />
        </Avatar>
        <Typography variant="body1">Koushik Sinha</Typography>
      </Box>
    </Box>
  )

  /* ------------------- processing indicator ------------------- */

  const ProcessingIndicator = () => {
    const statuses = ["Connecting to AI...", "Accessing Knowledge Base...", "Compiling response..."]
    const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
    const delay = 1800 // Configurable delay in ms

    useEffect(() => {
      setCurrentStatusIndex(0) // Reset on mount

      const interval = setInterval(() => {
        setCurrentStatusIndex((prevIndex) => {
          const nextIndex = prevIndex + 1
          if (nextIndex === statuses.length) {
            clearInterval(interval)
            return prevIndex // Stay on the last status
          }
          return nextIndex
        })
      }, delay)

      return () => clearInterval(interval) // Cleanup on unmount
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
          width: "100%",
        }}
      >
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
        <Paper
          sx={{
            p: 2,
            maxWidth: "80%",
            bgcolor: "var(--background)",
            color: "text.primary",
            borderRadius: "20px 20px 20px 5px",
            boxShadow: "5px 5px 10px #d9dbde, -5px -5px 10px #ffffff",
            display: "flex",
            alignItems: "center",
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

  /* ------------------- error message component ------------------- */
  const ErrorMessage = ({ message }: { message: { id: string; content: string } }) => (
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
        width: "100%",
      }}
    >
      <Avatar
        sx={{
          bgcolor: theme.palette.error.main,
          color: "white",
          width: 40,
          height: 40,
          boxShadow: "3px 3px 7px #c8cacd, -3px -3px 7px #ffffff",
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
          border: `1px solid ${theme.palette.error.light}`,
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </Paper>
    </Box>
  )

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
