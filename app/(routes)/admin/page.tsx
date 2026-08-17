"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { listProfiles, setUserBanned, setUserRole } from "@/lib/auth/profiles"
import type { AppUser } from "@/lib/auth/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ShieldCheck, ShieldOff, Ban, CheckCircle2, Loader2 } from "lucide-react"

export default function AdminPage() {
  const supabase = useRef(createClient()).current
  const { user, isAdmin, isLoading } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const loadUsers = async () => {
    setIsLoadingUsers(true)
    const data = await listProfiles(supabase)
    setUsers(data)
    setIsLoadingUsers(false)
  }

  useEffect(() => {
    if (isAdmin) loadUsers()
  }, [isAdmin])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>Você precisa entrar para ver esta página.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button>Entrar</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Acesso negado</CardTitle>
          <CardDescription>Apenas administradores podem acessar este painel.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const handleToggleAdmin = async (target: AppUser) => {
    if (target.id === user.id) {
      toast.error("Você não pode alterar seu próprio papel de admin por aqui.")
      return
    }
    const newRole = target.role === "admin" ? "user" : "admin"
    setPendingId(target.id)
    const { error } = await setUserRole(supabase, target.id, newRole)
    setPendingId(null)

    if (error) {
      toast.error("Não foi possível alterar o papel deste usuário.")
      return
    }
    toast.success(
      newRole === "admin"
        ? `${target.name} agora é administrador.`
        : `${target.name} não é mais administrador.`,
    )
    loadUsers()
  }

  const handleToggleBan = async (target: AppUser) => {
    if (target.id === user.id) {
      toast.error("Você não pode banir a si mesmo.")
      return
    }
    setPendingId(target.id)
    const { error } = await setUserBanned(supabase, target.id, !target.banned)
    setPendingId(null)

    if (error) {
      toast.error("Não foi possível alterar o status deste usuário.")
      return
    }
    toast.success(target.banned ? `${target.name} foi desbanido.` : `${target.name} foi banido.`)
    loadUsers()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Painel de administração
        </CardTitle>
        <CardDescription>
          Gerencie os usuários cadastrados: promova administradores ou banido usuários.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingUsers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === user.id && (
                      <span className="text-xs text-muted-foreground ml-1">(você)</span>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="space-x-1">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                    {u.banned && <Badge variant="destructive">Banido</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleAdmin(u)}
                      disabled={u.id === user.id || pendingId === u.id}
                    >
                      {u.role === "admin" ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-1" /> Remover admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Tornar admin
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={u.banned ? "outline" : "destructive"}
                      onClick={() => handleToggleBan(u)}
                      disabled={u.id === user.id || pendingId === u.id}
                    >
                      {u.banned ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Desbanir
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" /> Banir
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum usuário cadastrado ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
