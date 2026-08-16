"use client"

type CategoryIconProps = {
  category: string
  className?: string
}

export function CategoryIcon({ category, className = "" }: CategoryIconProps) {
  // Retorna o emoji correspondente à categoria
  switch (category) {
    case "Tentativa de assalto":
      return <span className={className}>🚨</span>
    case "Furto/roubo de carro":
      return <span className={className}>🚔</span>
    case "Área alagada":
      return <span className={className}>🌨</span>
    case "Semáforo danificado":
      return <span className={className}>🚦</span>
    case "Fio de energia exposto":
      return <span className={className}>❗</span>
    case "Queda de energia":
      return <span className={className}>⚡</span>
    case "Região mal iluminada":
      return <span className={className}>🕶</span>
    case "Obras na via":
      return <span className={className}>🚧</span>
    case "Queda de árvore":
      return <span className={className}>🌲</span>
    default:
      return <span className={className}>📍</span>
  }
}

// Função auxiliar para obter apenas o emoji como string
export function getCategoryEmoji(category: string): string {
  switch (category) {
    case "Tentativa de assalto":
      return "🚨"
    case "Furto/roubo de carro":
      return "🚔"
    case "Área alagada":
      return "🌨"
    case "Semáforo danificado":
      return "🚦"
    case "Fio de energia exposto":
      return "❗"
    case "Queda de energia":
      return "⚡"
    case "Região mal iluminada":
      return "🕶"
    case "Obras na via":
      return "🚧"
    case "Queda de árvore":
      return "🌲"
    default:
      return "📍"
  }
}
