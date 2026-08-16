"use client"

import { DivIcon } from "leaflet"
import { getCategoryEmoji } from "./category-icon"

export function getCategoryIcon(category: string): DivIcon {
  // Usar DivIcon em vez de Icon para renderizar HTML diretamente
  return new DivIcon({
    html: `<div style="font-size: 24px; display: flex; justify-content: center; align-items: center; background-color: white; width: 40px; height: 40px; border-radius: 50%; border: 2px solid #666; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${getCategoryEmoji(category)}</div>`,
    className: "", // Remover a classe padrão do Leaflet
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -15],
  })
}
