"use client"

import { DivIcon } from "leaflet"

export function getPreviewIcon(): DivIcon {
  // Criar um ícone visualmente diferente para o ponto de prévia
  return new DivIcon({
    html: `<div style="font-size: 24px; display: flex; justify-content: center; align-items: center; background-color: rgba(255, 255, 0, 0.7); width: 40px; height: 40px; border-radius: 50%; border: 2px solid #ff6600; box-shadow: 0 2px 5px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;">📌</div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>`,
    className: "", // Remover a classe padrão do Leaflet
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -15],
  })
}
