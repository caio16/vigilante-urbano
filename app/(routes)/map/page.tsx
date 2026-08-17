"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { MapPin, Loader2, Trash2, AlertCircle, X, Send, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/auth-context'
import { toast } from 'sonner'
import Link from 'next/link'

interface MapPoint {
  id: string
  latitude: number
  longitude: number
  category: string
  title: string
  description: string
  address?: string
  rating: number
  created_at: string
}

const MapComponentDynamic = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gradient-to-b from-slate-900 via-slate-800 to-blue-900 rounded-lg border-2 border-blue-500">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <p className="text-blue-300 font-medium">Carregando mapa...</p>
      </div>
    </div>
  ),
})

const categories: Record<string, { label: string; emoji: string; color: string }> = {
  tentativa_assalto: { label: "Tentativa de assalto", emoji: "🚓", color: "bg-red-600" },
  furto_carro: { label: "Furto/roubo de carro", emoji: "🚨", color: "bg-red-500" },
  area_alagada: { label: "Área alagada", emoji: "🌊", color: "bg-cyan-600" },
  semaforo_danificado: { label: "Semáforo danificado", emoji: "🚦", color: "bg-yellow-600" },
  fio_exposto: { label: "Fio de energia exposto", emoji: "⚠️", color: "bg-orange-600" },
  queda_energia: { label: "Queda de energia", emoji: "🌆", color: "bg-purple-600" },
  regiao_mal_iluminada: { label: "Região mal iluminada", emoji: "⚡", color: "bg-indigo-600" },
  obras_via: { label: "Obras na via", emoji: "🏗️", color: "bg-amber-600" },
  queda_arvore: { label: "Queda de árvore", emoji: "🌲", color: "bg-green-700" },
}

export default function MapPage() {
  const { user } = useAuth()
  const [points, setPoints] = useState<MapPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [previewPoint, setPreviewPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    category: "tentativa_assalto",
  })
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    loadPoints()
  }, [])

  const loadPoints = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('points')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Erro ao carregar pontos')
        return
      }

      setPoints(data || [])
      setError(null)
    } catch (error) {
      setError('Erro ao conectar com banco de dados')
    } finally {
      setIsLoading(false)
    }
  }

  const searchAddress = (query: string) => {
    // Cancela a busca anterior ainda pendente — só a última digitação conta.
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 3) {
      setAddressSuggestions([])
      setIsSearchingAddress(false)
      return
    }

    setIsSearchingAddress(true)

    // Espera meio segundo depois da última tecla digitada antes de buscar,
    // evitando disparar uma requisição a cada letra (o que fazia o serviço
    // de geocodificação bloquear as buscas por excesso de chamadas).
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br&addressdetails=1&accept-language=pt-BR`,
        )

        if (!response.ok) {
          throw new Error(`Busca de endereço falhou (status ${response.status})`)
        }

        const data = await response.json()
        setAddressSuggestions(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Erro ao buscar endereço:", err)
        setAddressSuggestions([])
      } finally {
        setIsSearchingAddress(false)
      }
    }, 500)
  }

  const selectAddress = (suggestion: any) => {
    if (!user) {
      toast.error("Você precisa entrar para reportar uma ocorrência.")
      return
    }

    setPreviewPoint({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    })
    setFormData({
      ...formData,
      address: suggestion.display_name,
    })
    setAddressSuggestions([])
  }

  const handleMapClick = async (lat: number, lng: number) => {
    if (!user) {
      toast.error("Você precisa entrar para reportar uma ocorrência.")
      return
    }

    setPreviewPoint({ lat, lng })
    
    // Buscar endereço via geocodificação reversa
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      const address = data.address?.road || data.display_name || ""
      setFormData({ ...formData, address })
    } catch (error) {
      console.error("Erro ao buscar endereço:", error)
      setFormData({ ...formData, address: "" })
    }
  }

  const handleSavePoint = async () => {
    if (!user) {
      setError("Você precisa entrar para reportar uma ocorrência.")
      return
    }

    if (!previewPoint || !formData.title) {
      setError("Preencha o título e selecione um local")
      return
    }

    try {
      setIsSaving(true)
      const supabase = createClient()

      const { error } = await supabase.from('points').insert({
        latitude: previewPoint.lat,
        longitude: previewPoint.lng,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        rating: 0,
      })

      if (error) {
        setError(`Erro: ${error.message}`)
        return
      }

      setPreviewPoint(null)
      setFormData({ title: "", description: "", address: "", category: "tentativa_assalto" })
      setError(null)
      loadPoints()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePoint = async (id: string) => {
    if (!user) {
      toast.error("Você precisa entrar para excluir uma ocorrência.")
      return
    }

    try {
      setIsDeleting(id)
      const supabase = createClient()
      const { error } = await supabase.from('points').delete().eq('id', id)

      if (error) {
        setError('Erro ao deletar ponto')
        return
      }

      setPoints(points.filter((p) => p.id !== id))
      if (selectedPointId === id) {
        setSelectedPointId(null)
      }
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredPoints = filterCategory ? points.filter((p) => p.category === filterCategory) : points

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="container mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 border-b-2 border-blue-500 py-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
            Alertas Urbanos
          </h1>
          <p className="text-blue-300 text-sm mt-1">Plataforma de alertas comunitários para São Paulo</p>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden p-4">
          {/* Mapa */}
          <div className="h-[45vh] shrink-0 md:h-auto md:shrink md:flex-1 flex flex-col rounded-lg overflow-hidden shadow-2xl border-2 border-blue-500">
            <MapComponentDynamic 
              points={filteredPoints} 
              previewPoint={previewPoint} 
              onMapClick={handleMapClick}
            />
          </div>

          {/* Painel Lateral */}
          <div className="flex-1 min-h-0 md:flex-none md:w-96 flex flex-col gap-4 overflow-auto">
            {error && (
              <Card className="bg-red-950 border-red-500">
                <CardContent className="pt-6 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Formulário de Novo Ponto */}
            {previewPoint ? (
              <Card className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-500 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-900 border-b border-blue-500">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-blue-100 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-300" />
                      Novo Alerta
                    </CardTitle>
                    <button
                      onClick={() => setPreviewPoint(null)}
                      className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-blue-300" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Localização */}
                  <div className="bg-blue-800 rounded-lg p-3 border border-blue-600">
                    <p className="text-xs text-blue-300 font-semibold mb-1">LOCALIZAÇÃO</p>
                    <p className="text-blue-100 text-sm font-mono">{previewPoint.lat.toFixed(4)}, {previewPoint.lng.toFixed(4)}</p>
                    {formData.address && (
                      <p className="text-blue-200 text-sm mt-2">{formData.address}</p>
                    )}
                  </div>

                  {/* Buscar Endereço */}
                  <div className="space-y-2">
                    <Label className="text-blue-300 text-sm font-semibold">Buscar Endereço</Label>
                    <Input
                      placeholder="Digite para buscar..."
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value })
                        searchAddress(e.target.value)
                      }}
                      className="bg-slate-800 border-blue-500 text-blue-100 placeholder-blue-400"
                    />
                    {isSearchingAddress && (
                      <div className="flex items-center gap-2 text-blue-400 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Buscando...
                      </div>
                    )}
                    {addressSuggestions.length > 0 && (
                      <div className="bg-slate-800 border border-blue-500 rounded-lg max-h-32 overflow-y-auto">
                        {addressSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => selectAddress(s)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-700 border-b border-blue-600 last:border-b-0 text-sm text-blue-200 transition-colors"
                          >
                            {s.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                    {!isSearchingAddress &&
                      formData.address.length >= 3 &&
                      addressSuggestions.length === 0 && (
                        <p className="text-xs text-blue-400">
                          Nenhum endereço encontrado. Você também pode clicar direto no mapa.
                        </p>
                      )}
                  </div>

                  {/* Categoria */}
                  <div className="space-y-2">
                    <Label className="text-blue-300 text-sm font-semibold">Categoria</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-800 border-blue-500 text-blue-100 rounded-lg px-3 py-2 border text-sm"
                    >
                      {Object.entries(categories).map(([key, { label, emoji }]) => (
                        <option key={key} value={key}>
                          {emoji} {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Título */}
                  <div className="space-y-2">
                    <Label className="text-blue-300 text-sm font-semibold">Título *</Label>
                    <Input
                      placeholder="Descreva o alerta brevemente"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-800 border-blue-500 text-blue-100 placeholder-blue-400"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label className="text-blue-300 text-sm font-semibold">Descrição</Label>
                    <textarea
                      placeholder="Detalhes adicionais..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-slate-800 border border-blue-500 text-blue-100 placeholder-blue-400 rounded-lg px-3 py-2 text-sm resize-none h-20"
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSavePoint}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isSaving ? "Salvando..." : "Enviar Alerta"}
                    </Button>
                    <Button
                      onClick={() => setPreviewPoint(null)}
                      variant="outline"
                      className="border-blue-500 text-blue-300 hover:bg-blue-900"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-b from-blue-900 to-blue-950 border-2 border-blue-500 text-center py-6">
                <CardContent>
                  <MapPin className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  {user ? (
                    <p className="text-blue-300 text-sm">Clique no mapa ou busque um endereço</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-blue-300 text-sm">
                        Entre com sua conta para reportar uma ocorrência.
                      </p>
                      <Link href="/login">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <LogIn className="h-4 w-4 mr-1" /> Entrar
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filtros */}
            <div className="space-y-2">
              <Label className="text-blue-300 text-sm font-semibold">Filtrar por Categoria</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setFilterCategory(null)}
                  variant={filterCategory === null ? "default" : "outline"}
                  className={filterCategory === null ? "bg-blue-600 text-white" : "border-blue-500 text-blue-300"}
                  size="sm"
                >
                  Todos ({points.length})
                </Button>
                {Object.entries(categories).map(([key, { emoji, label }]) => (
                    <Button
                      key={key}
                      onClick={() => setFilterCategory(key)}
                      variant={filterCategory === key ? "default" : "outline"}
                      className={filterCategory === key ? "bg-blue-600 text-white" : "border-blue-500 text-blue-300"}
                      size="sm"
                      title={label}
                    >
                      {emoji}
                    </Button>
                  ))}
              </div>
            </div>

            {/* Lista de Pontos */}
            <div className="space-y-2 flex-1 min-h-0">
              <Label className="text-blue-300 text-sm font-semibold">Alertas Recentes</Label>
              <div className="space-y-2 overflow-y-auto max-h-64">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : filteredPoints.length === 0 ? (
                  <Card className="bg-blue-950 border-blue-600">
                    <CardContent className="pt-6 text-center">
                      <p className="text-blue-300 text-sm">Nenhum alerta nesta categoria</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredPoints.map((point) => {
                    const categoryData = categories[point.category] || categories.tentativa_assalto
                    const isSelected = selectedPointId === point.id
                    return (
                      <button
                        key={point.id}
                        onClick={() => setSelectedPointId(isSelected ? null : point.id)}
                        className={`w-full text-left transition-all duration-300 ${
                          isSelected 
                            ? 'ring-2 ring-offset-2 ring-offset-slate-900 scale-105' 
                            : 'hover:scale-102'
                        }`}
                      >
                        <Card className={`border-2 transition-all duration-300 ${
                          isSelected
                            ? `bg-gradient-to-r ${categoryData.color} bg-opacity-30 border-white shadow-2xl`
                            : 'bg-slate-800 border-blue-600 hover:border-blue-400'
                        }`}>
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xl transition-transform duration-300 ${isSelected ? 'scale-125 animate-bounce' : ''}`}>
                                    {categoryData.emoji}
                                  </span>
                                  <h4 className={`font-semibold text-sm truncate transition-colors ${
                                    isSelected ? 'text-white' : 'text-blue-200'
                                  }`}>
                                    {point.title}
                                  </h4>
                                </div>
                                {point.description && (
                                  <p className={`text-xs mt-1 line-clamp-2 transition-colors ${
                                    isSelected ? 'text-white' : 'text-blue-300'
                                  }`}>
                                    {point.description}
                                  </p>
                                )}
                                {point.address && (
                                  <p className={`text-xs mt-1 transition-colors ${
                                    isSelected ? 'text-gray-100' : 'text-blue-400'
                                  }`}>
                                    {point.address}
                                  </p>
                                )}
                              </div>
                              {user && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeletePoint(point.id)
                                  }}
                                  disabled={isDeleting === point.id}
                                  className={`p-1 rounded-lg transition-all flex-shrink-0 ${
                                    isSelected
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'hover:bg-red-600 text-red-400'
                                  }`}
                                >
                                  {isDeleting === point.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
