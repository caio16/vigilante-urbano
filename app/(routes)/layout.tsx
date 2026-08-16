"use client"

import type React from "react"
import { ChevronLeft, Shield, LogOut, UserPlus, LogIn } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"

export default function InnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, isLoading, signOut } = useAuth()

  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="flex items-center gap-2 flex-wrap">
            {!isLoading && !user && (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-1" /> Entrar
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" /> Cadastrar
                  </Button>
                </Link>
              </>
            )}

            {!isLoading && user && (
              <>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="h-4 w-4 mr-1" /> Painel Admin
                    </Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Olá, {user.name}
                  {isAdmin ? " (admin)" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-1" /> Sair
                </Button>
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-6">Vigilante Urbano</h1>
      </div>
      {children}
    </>
  )
}
