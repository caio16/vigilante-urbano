"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { AppUser } from "./types"
import * as db from "./local-db"

type AuthContextValue = {
  user: AppUser | null
  isLoading: boolean
  isAdmin: boolean
  signUp: (input: { name: string; email: string; password: string }) => Promise<{ error?: string }>
  signIn: (input: { email: string; password: string }) => Promise<{ error?: string }>
  signOut: () => void
  refresh: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(() => {
    setUser(db.getCurrentUser())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const unsubscribe = db.subscribeToAuthChanges(refresh)
    return unsubscribe
  }, [refresh])

  const signUp: AuthContextValue["signUp"] = async (input) => {
    const result = await db.signUp(input)
    if (result.error) return { error: result.error }
    refresh()
    return {}
  }

  const signIn: AuthContextValue["signIn"] = async (input) => {
    const result = await db.signIn(input)
    if (result.error) return { error: result.error }
    refresh()
    return {}
  }

  const signOut = () => {
    db.signOut()
    refresh()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === "admin",
        signUp,
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
