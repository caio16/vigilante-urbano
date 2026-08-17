"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus } from "lucide-react"

export default function CadastroPage() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.")
      return
    }

    setIsSubmitting(true)
    const { error, needsEmailConfirmation } = await signUp({ name, email, password })
    setIsSubmitting(false)

    if (error) {
      toast.error(error)
      return
    }

    if (needsEmailConfirmation) {
      toast.success("Cadastro criado! Confirme seu e-mail para poder entrar.")
      router.push("/login")
      return
    }

    toast.success("Cadastro realizado com sucesso!")
    router.push("/map")
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Criar conta
          </CardTitle>
          <CardDescription>
            Cadastre-se para colaborar com o Vigilante Urbano. O primeiro usuário cadastrado
            no sistema se torna administrador automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Cadastrar
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
