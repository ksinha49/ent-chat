"use client"
import React, { useState } from "react"
import Link from "next/link"

import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { Menu as MenuIcon, HelpOutline } from "@mui/icons-material"
import Sidebar from "@/components/chat/Sidebar"
import ChatMessages from "@/components/chat/ChatMessages"
import WelcomeScreen from "@/components/chat/WelcomeScreen"
import ChatInputForm from "@/components/chat/ChatInputForm"
import ErrorBoundary from "@/components/ErrorBoundary"
import AboutDialog from "@/components/chat/AboutDialog"
import { APP_NAME, APP_LOGO } from "@/lib/config"
import { useChat } from "@/hooks/use-chat"
import { useSuggestions } from "@/hooks/use-suggestions"
import { useChatScroll } from "@/hooks/use-chat-scroll"


/* ============================= PAGE =================================== */

export function Chat() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false)

  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    queryHistory,
  } = useChat()

  const suggestions = useSuggestions()
  const chatContainerRef = useChatScroll([messages])

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
                    src={APP_LOGO}
                    alt={`${APP_NAME} Logo`}
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
                  {APP_NAME}
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
      <AboutDialog open={isAboutDialogOpen} onClose={() => setIsAboutDialogOpen(false)} />
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
