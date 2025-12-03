"use client"

import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { GitBranch, Home, Trash2 } from "lucide-react"
import {
  getAllBranches,
  switchToBranch,
  returnToMainConversation,
  deleteBranch,
} from "@/lib/branch-manager"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BranchNavigator() {
  const { chats, currentChatId, updateChat } = useApp()
  const { toast } = useToast()

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  if (!currentChat) {
    return null
  }

  const branches = getAllBranches(currentChat)
  const currentBranchPath = currentChat.currentBranchPath || []
  const isOnBranch = currentBranchPath.length > 0

  // If no branches exist, don't show the navigator
  if (branches.length === 0) {
    return null
  }

  const handleSwitchToBranch = (branchId: string) => {
    try {
      const updatedChat = switchToBranch(currentChat, branchId)
      updateChat(currentChat.id, updatedChat)

      toast({
        title: "Switched to branch",
        description: "Viewing alternate conversation path",
      })
    } catch (error) {
      console.error("[BranchNavigator] Switch error:", error)
      toast({
        title: "Error",
        description: "Failed to switch branch",
        variant: "destructive",
      })
    }
  }

  const handleReturnToMain = () => {
    try {
      const updatedChat = returnToMainConversation(currentChat)
      updateChat(currentChat.id, updatedChat)

      toast({
        title: "Returned to main conversation",
        description: "Back to the original conversation thread",
      })
    } catch (error) {
      console.error("[BranchNavigator] Return error:", error)
      toast({
        title: "Error",
        description: "Failed to return to main",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    try {
      const updatedChat = deleteBranch(currentChat, branchId)
      updateChat(currentChat.id, updatedChat)

      toast({
        title: "Branch deleted",
        description: `"${branchName}" has been removed`,
      })
    } catch (error) {
      console.error("[BranchNavigator] Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
      <GitBranch className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {isOnBranch ? `Branch: ${currentBranchPath.length} level(s) deep` : "Main conversation"}
      </span>

      {/* Branch Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <GitBranch className="h-3 w-3 mr-1" />
            {branches.length} {branches.length === 1 ? "Branch" : "Branches"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Available Branches</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {branches.map(({ branch, depth }) => {
            const isCurrentBranch = currentBranchPath.includes(branch.id)
            const indent = depth * 12

            return (
              <div
                key={branch.id}
                className="flex items-center justify-between group"
                style={{ paddingLeft: `${indent}px` }}
              >
                <DropdownMenuItem
                  className={cn("flex-1 cursor-pointer", isCurrentBranch && "bg-accent")}
                  onClick={() => handleSwitchToBranch(branch.id)}
                >
                  <GitBranch className="h-3 w-3 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">{branch.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(branch.createdAt).toLocaleString()}
                    </span>
                  </div>
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteBranch(branch.id, branch.name)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Return to Main Button */}
      {isOnBranch && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleReturnToMain}
        >
          <Home className="h-3 w-3 mr-1" />
          Return to Main
        </Button>
      )}
    </div>
  )
}
