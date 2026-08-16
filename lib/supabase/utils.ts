"use client"

// Função para gerar um ID de usuário anônimo
export const getUserId = (): string => {
  // Check if we're running on the server
  if (typeof window === "undefined") {
    return `temp_user_${Math.random().toString(36).substring(2, 15)}`
  }

  // Verificar se já existe um ID de usuário no localStorage
  let userId = localStorage.getItem("mapUserId")

  // Se não existir, criar um novo ID e salvar no localStorage
  if (!userId) {
    userId = `anon_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`
    localStorage.setItem("mapUserId", userId)
  }

  return userId
}
