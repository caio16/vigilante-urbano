"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import * as db from "@/lib/auth/local-db"
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
  const { user, isAdmin, isLoading } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])

  const loadUsers = () => setUsers(db.listUsers())

  useEffect(() => {
    loadUsers()
    const unsubscribe = db.subscribeToAuthChanges(loadUsers)
    return unsubscribe
  }, [])

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

  const handleToggleAdmin = (target: AppUser) => {
    if (target.id === user.id) {
      toast.error("Você não pode alterar seu próprio papel de admin por aqui.")
      return
    }
    const newRole = target.role === "admin" ? "user" : "admin"
    db.setUserRole(target.id, newRole)
    toast.success(
      newRole === "admin"
        ? `${target.name} agora é administrador.`
        : `${target.name} não é mais administrador.`,
    )
  }

  const handleToggleBan = (target: AppUser) => {
    if (target.id === user.id) {
      toast.error("Você não pode banir a si mesmo.")
      return
    }
    db.setUserBanned(target.id, !target.banned)
    toast.success(target.banned ? `${target.name} foi desbanido.` : `${target.name} foi banido.`)
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
                    disabled={u.id === user.id}
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
                    disabled={u.id === user.id}
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
      </CardContent>
    </Card>
  )
}
