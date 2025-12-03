"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * Auth Context for Chameleon AI Chat - Local-First Edition
 * Simplified for single-user desktop app mode.
 * Always returns guest mode with no authentication.
 */

interface AuthContextType {
  user: null
  isAuthLoading: boolean
  isGuestMode: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  onUserChange?: (user: null) => void
}

export function AuthProvider({ children, onUserChange }: AuthProviderProps) {
  // Local-first: Always guest mode, no user
  const signOut = async () => {
    // Clear any local storage and reload
    if (typeof window !== "undefined") {
      localStorage.clear()
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: null,
        isAuthLoading: false,
        isGuestMode: true,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
