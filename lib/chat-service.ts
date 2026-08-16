'use client'

import { createClient } from './supabase/client'
import { getUserId } from './supabase/utils'
import type { ChatMessage } from './chat-types'

// Tempo em milissegundos entre mensagens permitidas (10 segundos)
const MESSAGE_COOLDOWN = 10000

// Tempo em milissegundos até a expiração da mensagem (10 minutos)
const MESSAGE_EXPIRATION = 10 * 60 * 1000

// Cache para controlar o tempo entre mensagens
const lastMessageTimestamps: Record<string, number> = {}

// Função para buscar mensagens de um bairro
export async function fetchMessages(neighborhoodId: string): Promise<ChatMessage[]> {
  try {
    const supabase = createClient()

    // Primeiro buscar mensagens fixadas
    const { data: pinnedMessages, error: pinnedError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('neighborhood_id', neighborhoodId)
      .eq('pinned', true)
      .order('created_at', { ascending: false })

    if (pinnedError) {
      console.error('Erro ao buscar mensagens fixadas:', pinnedError)
    }

    // Depois buscar mensagens normais não expiradas
    const { data: regularMessages, error: regularError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('neighborhood_id', neighborhoodId)
      .eq('pinned', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (regularError) {
      console.error('Erro ao buscar mensagens regulares:', regularError)
      return pinnedMessages || []
    }

    // Combinar mensagens fixadas e regulares
    const allMessages = [...(pinnedMessages || []), ...(regularMessages || [])]

    return allMessages
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return []
  }
}

// Função para enviar uma mensagem
export async function sendMessage(
  neighborhoodId: string,
  message: string,
): Promise<{ success: boolean; error?: string; message?: ChatMessage }> {
  try {
    const userId = getUserId()
    const now = Date.now()

    // Verificar se o usuário pode enviar uma mensagem (cooldown)
    const lastMessageTime = lastMessageTimestamps[userId] || 0
    const timeElapsed = now - lastMessageTime

    if (timeElapsed < MESSAGE_COOLDOWN) {
      const secondsLeft = Math.ceil((MESSAGE_COOLDOWN - timeElapsed) / 1000)
      return {
        success: false,
        error: `Aguarde ${secondsLeft} segundos antes de enviar outra mensagem.`,
      }
    }

    // Verificar o tamanho da mensagem
    if (message.length > 250) {
      return {
        success: false,
        error: `A mensagem deve ter no máximo 250 caracteres. Sua mensagem tem ${message.length} caracteres.`,
      }
    }

    const supabase = createClient()

    // Calcular o tempo de expiração (10 minutos a partir de agora)
    const expiresAt = new Date(now + MESSAGE_EXPIRATION).toISOString()

    // Criar objeto de mensagem
    const newMessage = {
      neighborhood_id: neighborhoodId,
      user_id: userId,
      message,
      expires_at: expiresAt,
      pinned: false,
    }

    const { data, error } = await supabase.from('chat_messages').insert(newMessage).select()

    if (error) {
      console.error('Erro ao enviar mensagem:', error)
      return { success: false, error: 'Erro ao enviar mensagem. Tente novamente.' }
    }

    // Atualizar o timestamp da última mensagem
    lastMessageTimestamps[userId] = now

    return {
      success: true,
      message: data?.[0] as ChatMessage,
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return { success: false, error: 'Erro ao enviar mensagem. Tente novamente.' }
  }
}

// Função para fixar uma mensagem
export async function pinMessage(messageId: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('pin_message', {
      message_id: messageId,
      pin_password: password,
    })

    if (error) {
      console.error('Erro ao fixar mensagem:', error)
      return { success: false, error: 'Erro ao fixar mensagem.' }
    }

    if (!data) {
      return { success: false, error: 'Senha incorreta.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao fixar mensagem:', error)
    return { success: false, error: 'Erro ao fixar mensagem.' }
  }
}

// Função para desfixar uma mensagem
export async function unpinMessage(messageId: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('unpin_message', {
      message_id: messageId,
      pin_password: password,
    })

    if (error) {
      console.error('Erro ao desfixar mensagem:', error)
      return { success: false, error: 'Erro ao desfixar mensagem.' }
    }

    if (!data) {
      return { success: false, error: 'Senha incorreta.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao desfixar mensagem:', error)
    return { success: false, error: 'Erro ao desfixar mensagem.' }
  }
}

// Função para excluir uma mensagem
export async function deleteMessage(
  messageId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('delete_message', {
      message_id: messageId,
      mod_password: password,
    })

    if (error) {
      console.error('Erro ao excluir mensagem:', error)
      return { success: false, error: 'Erro ao excluir mensagem.' }
    }

    if (!data) {
      return { success: false, error: 'Senha incorreta.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error)
    return { success: false, error: 'Erro ao excluir mensagem.' }
  }
}

// Função para configurar uma assinatura em tempo real para novas mensagens
// Implementação usando apenas polling para evitar problemas com o Realtime
export function subscribeToMessages(
  neighborhoodId: string,
  callback: (message: ChatMessage, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
) {
  // Armazenar o último timestamp para polling
  let lastPollTime = new Date().toISOString()
  let pollingInterval: NodeJS.Timeout | null = null
  let isPollingActive = false

  // Função para fazer polling de novas mensagens
  const pollForNewMessages = async () => {
    if (!isPollingActive) return

    try {
      const supabase = createClient()

      // Buscar mensagens mais recentes que o último poll
      const { data: newMessages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .gt('created_at', lastPollTime)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao fazer polling de mensagens:', error)
        return
      }

      if (newMessages && newMessages.length > 0) {
        // Atualizar o timestamp do último poll
        lastPollTime = newMessages[newMessages.length - 1].created_at

        // Notificar sobre as novas mensagens
        newMessages.forEach((message) => {
          callback(message as ChatMessage, 'INSERT')
        })
      }

      // Verificar atualizações em mensagens existentes (como fixar/desfixar)
      const { data: updatedMessages, error: updateError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('neighborhood_id', neighborhoodId)
        .lt('created_at', lastPollTime)
        .gt('updated_at', lastPollTime)
        .order('updated_at', { ascending: true })

      if (updateError) {
        console.error('Erro ao verificar atualizações de mensagens:', updateError)
        return
      }

      if (updatedMessages && updatedMessages.length > 0) {
        // Notificar sobre as mensagens atualizadas
        updatedMessages.forEach((message) => {
          callback(message as ChatMessage, 'UPDATE')
        })
      }
    } catch (err) {
      console.error('Erro durante polling:', err)
    }
  }

  // Iniciar polling
  const startPolling = () => {
    if (pollingInterval) return

    isPollingActive = true
    pollingInterval = setInterval(pollForNewMessages, 3000) // Poll a cada 3 segundos
    console.log('Iniciando polling para atualizações de mensagens')
  }

  // Parar polling
  const stopPolling = () => {
    isPollingActive = false
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Iniciar polling imediatamente
  startPolling()

  // Retornar função de limpeza
  return () => {
    stopPolling()
  }
}

// Função para executar a limpeza de mensagens expiradas
export async function cleanupExpiredMessages(): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.rpc('cleanup_expired_messages')
  } catch (error) {
    console.error('Erro ao limpar mensagens expiradas:', error)
  }
}
