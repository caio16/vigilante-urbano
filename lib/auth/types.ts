export type UserRole = "admin" | "user"

export type AppUser = {
  id: string
  name: string
  email: string
  role: UserRole
  banned: boolean
  createdAt: string
}

export type AuthResult =
  | { user: AppUser; error?: undefined }
  | { user?: undefined; error: string }
