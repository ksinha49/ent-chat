"use client"
import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Slide,
} from "@mui/material"
import type { TransitionProps } from "@mui/material/transitions"
import type { ReactElement } from "react"

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement<any, any> },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface Props {
  open: boolean
  onClose: () => void
}

export default function AboutDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} TransitionComponent={Transition} keepMounted>
      <DialogTitle>About ABACUS</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ABACUS is an intelligent assistant designed to help you navigate the Ameritas technology landscape. Query
          our repository for information on approved technologies, standards, and best practices.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
