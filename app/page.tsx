"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { MapPin, ArrowRight } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleEnterSite = () => {
    setIsLoading(true)
    router.push("/map")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-black p-4">
      <div className="max-w-4xl w-full mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <Image src="/images/logo.png" alt="Vigilante Urbano Logo" fill className="object-contain" priority />
          </div>
        </div>

        <h1 className="text-5xl md:text-8xl font-bold text-white mb-4">Vigilante Urbano</h1>
        <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
          Colabore com sua comunidade compartilhando informações sobre segurança e infraestrutura em tempo real.
        </p>

        <Button
          onClick={handleEnterSite}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-xl rounded-full transition-all transform hover:scale-105"
        >
          {isLoading ? "Carregando..." : "Entrar no Site"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center p-6 mt-16 bg-blue-800 bg-opacity-50 rounded-lg text-white">
          <div className="bg-blue-700 p-4 rounded-full mb-4">
            <MapPin className="h-12 w-12 text-blue-200" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Mapa Interativo</h3>
          <p className="text-blue-100 text-center max-w-lg">Visualize e adicione pontos de interesse em tempo real no mapa da sua cidade. Compartilhe informações sobre segurança, infraestrutura e eventos com a comunidade.</p>
        </div>
      </div>

      <footer className="mt-16 text-blue-300 text-sm">© 2023 Vigilante Urbano. Todos os direitos reservados.</footer>
    </div>
  )
}
