"use client"

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import L from "leaflet"
import { useEffect, useState } from "react"

// Component to handle map clicks
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e: any) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component to fix default icon issue
function MapInitializer() {
  const map = useMap()
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })
  }, [map])
  return null
}

// Mapeamento de categorias com ícones e órgãos responsáveis
const categoryConfig = {
  tentativa_assalto: {
    emoji: "🚓",
    label: "Tentativa de Assalto",
    organization: "Polícia Militar",
    url: "https://www.policiamilitar.sp.gov.br",
  },
  furto_carro: {
    emoji: "🚨",
    label: "Furto/Roubo de Carro",
    organization: "Polícia Militar",
    url: "https://www.policiamilitar.sp.gov.br",
  },
  area_alagada: {
    emoji: "🌊",
    label: "Área Alagada",
    organization: "Defesa Civil",
    url: "https://capital.sp.gov.br/web/defesa_civil",
  },
  semaforo_danificado: {
    emoji: "🚦",
    label: "Semáforo Danificado",
    organization: "CET",
    url: "https://www.cetsp.com.br/",
  },
  fio_exposto: {
    emoji: "⚠️",
    label: "Fio de Energia Exposto",
    organization: "ENEL",
    url: "https://www.enel.com.br/pt.html",
  },
  queda_energia: {
    emoji: "🌆",
    label: "Queda de Energia",
    organization: "ENEL",
    url: "https://www.enel.com.br/pt.html",
  },
  regiao_mal_iluminada: {
    emoji: "⚡",
    label: "Região Mal Iluminada",
    organization: "ILUME",
    url: "https://capital.sp.gov.br/web/spregula/w/iluminacao_publica/noticias/156",
  },
  obras_via: {
    emoji: "🏗️",
    label: "Obras na Via",
    organization: "Secretaria de Obras",
    url: "https://capital.sp.gov.br/web/obras",
  },
  queda_arvore: {
    emoji: "🌲",
    label: "Queda de Árvore",
    organization: "Secretaria de Meio Ambiente",
    url: "https://capital.sp.gov.br/web/meio_ambiente",
  },
}

const categoryIcons = {
  tentativa_assalto: "🚓",
  furto_carro: "🚨",
  area_alagada: "🌊",
  semaforo_danificado: "🚦",
  fio_exposto: "⚠️",
  queda_energia: "🌆",
  regiao_mal_iluminada: "⚡",
  obras_via: "🏗️",
  queda_arvore: "🌲",
}

function getCategoryIcon(category: string): L.Icon {
  const emoji = (categoryIcons as any)[category] || "📍"
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="white" stroke="#3b82f6" stroke-width="2"/>
      <text x="20" y="28" font-size="20" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  } as any)
}

function getPreviewIcon(): L.Icon {
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="2"/>
      <text x="20" y="28" font-size="20" text-anchor="middle" fill="white" font-weight="bold">✓</text>
    </svg>
  `

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  } as any)
}

interface MapComponentProps {
  points: Array<{
    id: string
    latitude: number
    longitude: number
    category: string
    title: string
    description: string
    address?: string
  }>
  previewPoint: { lat: number; lng: number } | null
  onMapClick: (lat: number, lng: number) => void
}

export { categoryConfig }

export default function MapComponent({
  points,
  previewPoint,
  onMapClick,
}: MapComponentProps) {
  const [votes, setVotes] = useState<Record<string, { verdade: number; falso: number }>>({})

  const handleVote = (pointId: string, voteType: 'verdade' | 'falso') => {
    setVotes(prev => ({
      ...prev,
      [pointId]: {
        verdade: prev[pointId]?.verdade ?? 0,
        falso: prev[pointId]?.falso ?? 0,
        ...(voteType === 'verdade' ? { verdade: (prev[pointId]?.verdade ?? 0) + 1 } : { falso: (prev[pointId]?.falso ?? 0) + 1 })
      }
    }))
  }

  return (
    <MapContainer
      center={[-23.5505, -46.6333] as any}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <MapInitializer />
      <TileLayer
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' as any}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEvents onMapClick={onMapClick} />

      {/* Renderizar o ponto de prévia se existir */}
      {previewPoint && (
        <Marker position={[previewPoint.lat, previewPoint.lng]} icon={getPreviewIcon() as any}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">Novo Ponto</p>
              <p className="text-gray-600">{previewPoint.lat.toFixed(4)}, {previewPoint.lng.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Renderizar os pontos salvos */}
      {points && points.length > 0 && points.map((point) => {
        if (!point.latitude || !point.longitude) return null
        const config = (categoryConfig as any)[point.category]
        
        return (
          <Marker 
            key={point.id} 
            position={[point.latitude, point.longitude]} 
            icon={getCategoryIcon(point.category) as any}
          >
            <Popup maxWidth={300}>
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-lg p-3 space-y-3 w-72 border border-blue-500">
                {/* Header */}
                <div className="border-b border-blue-400 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{config?.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-blue-200 text-sm">{point.title}</p>
                      <p className="text-xs text-blue-300">{config?.label}</p>
                    </div>
                  </div>
                </div>

                {/* Endereço - Destaque */}
                {point.address && (
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded p-2 border border-blue-400">
                    <p className="text-xs text-blue-100 font-semibold mb-1">📍 Localização:</p>
                    <p className="text-xs text-blue-50 font-medium">{point.address}</p>
                  </div>
                )}

                {/* Descrição */}
                {point.description && (
                  <div>
                    <p className="text-xs text-blue-100 bg-slate-700 p-2 rounded border border-blue-400">{point.description}</p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-blue-400"></div>

                {/* Órgão Responsável */}
                {config && (
                  <div className="bg-gradient-to-r from-amber-900 to-amber-800 rounded p-2 border border-amber-600">
                    <p className="text-xs text-amber-200 font-semibold mb-1">🔔 Reporte para:</p>
                    <p className="text-xs text-amber-100 font-medium mb-2">{config.organization}</p>
                    <a
                      href={config.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                    >
                      Acessar Portal
                    </a>
                  </div>
                )}

                {/* Validação - Like/Dislike */}
                <div className="space-y-2">
                  <p className="text-xs text-blue-300 font-semibold text-center">Este alerta é confiável?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleVote(point.id, 'verdade')
                        alert("👍 Verdade! Obrigado por confirmar este alerta.")
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xs font-bold py-2 px-2 rounded transition-all border border-green-400 flex flex-col items-center justify-center"
                    >
                      <span>👍 Verdade</span>
                      <span className="text-xs mt-1 bg-green-800 px-2 py-0.5 rounded-full">
                        {votes[point.id]?.verdade ?? 0}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        handleVote(point.id, 'falso')
                        alert("👎 Falso! Obrigado por reportar este alerta como falso.")
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold py-2 px-2 rounded transition-all border border-red-400 flex flex-col items-center justify-center"
                    >
                      <span>👎 Falso</span>
                      <span className="text-xs mt-1 bg-red-800 px-2 py-0.5 rounded-full">
                        {votes[point.id]?.falso ?? 0}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
