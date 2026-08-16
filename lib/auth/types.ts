export type UserRole = "admin" | "user"

export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  banned: boolean
  createdAt: string
}

// Registro interno (inclui o hash da senha). Nunca é exposto fora de lib/auth.
export type StoredUser = AppUser & {
  passwordHash: string
}

export type AuthResult =
  | { user: AppUser; error?: undefined }
  | { user?: undefined; error: string }
