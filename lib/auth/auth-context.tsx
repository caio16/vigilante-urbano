"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchProfile } from "./profiles"
import type { AppUser } from "./types"

type AuthContextValue = {
  user: AppUser | null
  isLoading: boolean
  isAdmin: boolean
  signUp: (input: { name: string; email: string; password: string }) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>
  signIn: (input: { email: string; password: string }) => Promise<{ error?: string }>
  signOut: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadFromSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setUser(null)
      setIsLoading(false)
      return
    }

    const profile = await fetchProfile(supabase, session.user.id)

    // Usuário banido: derruba a sessão local.
    if (profile?.banned) {
      await supabase.auth.signOut()
      setUser(null)
      setIsLoading(false)
      return
    }

    setUser(profile)
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    loadFromSession()

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadFromSession()
    })

    return () => subscription.subscription.unsubscribe()
  }, [loadFromSession, supabase])

  const signUp: AuthContextValue["signUp"] = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
      },
    })

    if (error) return { error: error.message }

    // Se a confirmação de e-mail estiver ativada no projeto Supabase,
    // não existe sessão ainda até o usuário clicar no link recebido.
    if (data.user && !data.session) {
      return { needsEmailConfirmation: true }
    }

    await loadFromSession()
    return {}
  }

  const signIn: AuthContextValue["signIn"] = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) return { error: "E-mail ou senha inválidos." }

    const profile = await fetchProfile(supabase, data.user.id)
    if (profile?.banned) {
      await supabase.auth.signOut()
      return { error: "Esta conta foi banida e não pode acessar o sistema." }
    }

    await loadFromSession()
    return {}
  }

  const signOut = () => {
    supabase.auth.signOut().then(() => setUser(null))
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
        refresh: loadFromSession,
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
