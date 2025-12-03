"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PersonasManager } from "@/components/personas-manager"

interface PersonasDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonasDialog({ open, onOpenChange }: PersonasDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personas Manager</DialogTitle>
        </DialogHeader>
        <PersonasManager />
      </DialogContent>
    </Dialog>
  )
}
