"use client"
import React from "react"
import { Box, Drawer } from "@mui/material"
import SidebarContent from "@/components/chat/SidebarContent"

interface Props {
  isMobile: boolean
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
  queryHistory: { id: string; content: string }[]
  setInput: (value: string) => void
  setMessages: React.Dispatch<any>
  setIsAboutDialogOpen: (open: boolean) => void
  setUserMenuAnchorEl: (el: HTMLElement | null) => void
}

export default function Sidebar({
  isMobile,
  isDrawerOpen,
  setIsDrawerOpen,
  queryHistory,
  setInput,
  setMessages,
  setIsAboutDialogOpen,
  setUserMenuAnchorEl,
}: Props) {
  return (
    <>
      {!isMobile ? (
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
          <SidebarContent
            queryHistory={queryHistory}
            setInput={setInput}
            setMessages={setMessages}
            isMobile={false}
            setIsDrawerOpen={setIsDrawerOpen}
            setIsAboutDialogOpen={setIsAboutDialogOpen}
            setUserMenuAnchorEl={setUserMenuAnchorEl}
          />
        </Box>
      ) : (
        <Drawer anchor="left" open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <Box sx={{ width: 280, bgcolor: "#2c3e50", height: "100%" }}>
            <SidebarContent
              queryHistory={queryHistory}
              setInput={setInput}
              setMessages={setMessages}
              isMobile
              setIsDrawerOpen={setIsDrawerOpen}
              setIsAboutDialogOpen={setIsAboutDialogOpen}
              setUserMenuAnchorEl={setUserMenuAnchorEl}
            />
          </Box>
        </Drawer>
      )}
    </>
  )
}
