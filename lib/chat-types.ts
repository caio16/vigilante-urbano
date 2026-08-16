export type ChatMessage = {
  id: string
  neighborhood_id: string
  user_id: string
  message: string
  created_at: string
  expires_at: string
  pinned?: boolean
}
