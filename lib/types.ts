export type Point = {
  id: string
  name: string
  description: string
  position: [number, number]
  address: string
  category: string
  timestamp: string
  ratings?: {
    confirmations: number
    denials: number
  }
  userRating?: {
    confirmed: boolean
    denied: boolean
  }
}
