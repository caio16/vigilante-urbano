"use client"

import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()
  const router = useRouter()
  const { signUp } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 1. Substitua a chamada antiga por esta:
    const { data, error } = await supabase.auth.signUp({
      email: email, // sua variável de estado do email
      password: password, // sua variável de estado da senha
      options: {
        data: {
          nome: nome, // sua variável de estado do nome
          role: 'user' // Define todo novo usuário como 'user' comum, resolvendo o bug do admin!
        }
      }
    })

    // 2. Tratamento de erro ou sucesso
    if (error) {
      console.error("Erro ao cadastrar:", error.message)
      // Aqui você pode disparar um toast de erro para o usuário
      return
    }

    if (data) {
      console.log("Cadastro realizado com sucesso na nuvem!")
      // Aqui você redireciona o usuário para o mapa ou para o login
    }
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
