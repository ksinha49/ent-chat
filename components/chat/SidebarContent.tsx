"use client"
import React from "react"
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography
} from "@mui/material"
import { Add, PersonOutline, History, InfoOutlined } from "@mui/icons-material"
import { fadeIn } from "./animations"

interface Props {
  queryHistory: string[]
  setInput: (value: string) => void
  setMessages: React.Dispatch<any>
  isMobile: boolean
  setIsDrawerOpen: (open: boolean) => void
  setIsAboutDialogOpen: (open: boolean) => void
  setUserMenuAnchorEl: (el: HTMLElement | null) => void
}

export default function SidebarContent({
  queryHistory,
  setInput,
  setMessages,
  isMobile,
  setIsDrawerOpen,
  setIsAboutDialogOpen,
  setUserMenuAnchorEl
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        bgcolor: "#2c3e50",
        color: "white"
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
            py: 0.5
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
          justifyContent: "flex-start"
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
                        sx: { color: "#E0E0E0" }
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        ) : (
          <Typography sx={{ p: 2, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            No history yet.
          </Typography>
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
          "&:hover": { bgcolor: "rgba(255 255 255 / .08)" }
        }}
      >
        <Avatar sx={{ bgcolor: "#00529B" }}>
          <PersonOutline />
        </Avatar>
        <Typography variant="body1">Koushik Sinha</Typography>
      </Box>
    </Box>
  )
}
