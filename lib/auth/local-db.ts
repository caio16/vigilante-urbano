"use client"

import type { AppUser, AuthResult, StoredUser, UserRole } from "./types"

/**
 * Banco de dados local (offline) de usuários.
 *
 * Para não depender de uma configuração externa para a demonstração,
 * os usuários, senhas (com hash) e papéis (admin/usuário) ficam salvos
 * no localStorage do navegador, simulando uma tabela `users` real.
 *
 * A estrutura foi pensada para espelhar a tabela `profiles` descrita em
 * `supabase/schema.sql`, então é simples "plugar" no Supabase de verdade
 * no futuro sem mudar o resto da aplicação (veja README/ENV_SETUP).
 */

const USERS_KEY = "vu_users"
const SESSION_KEY = "vu_session"
const EVENT_NAME = "vu_auth_changed"

function isBrowser() {
  return typeof window !== "undefined"
}

function notifyChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event(EVENT_NAME))
  }
}

export function subscribeToAuthChanges(callback: () => void) {
  if (!isBrowser()) return () => {}
  const handler = () => callback()
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener("storage", handler)
  }
}

// Hash simples de senha via Web Crypto (SHA-256). Suficiente para a
// demonstração offline — nunca guardamos a senha em texto puro.
async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function readUsers(): StoredUser[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

function writeUsers(users: StoredUser[]) {
  if (!isBrowser()) return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  notifyChange()
}

function toPublicUser(user: StoredUser): AppUser {
  const { passwordHash, ...publicUser } = user
  return publicUser
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function listUsers(): AppUser[] {
  return readUsers()
    .map(toPublicUser)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function signUp(input: {
  name: string
  email: string
  password: string
}): Promise<AuthResult> {
  const name = input.name.trim()
  const email = normalizeEmail(input.email)
  const password = input.password

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." }
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." }
  }

  const users = readUsers()
  if (users.some((u) => u.email === email)) {
    return { error: "Já existe uma conta cadastrada com este e-mail." }
  }

  // O primeiro usuário cadastrado no sistema vira administrador
  // automaticamente, para permitir configurar o app na primeira execução.
  const isFirstUser = users.length === 0

  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hashPassword(password),
    role: isFirstUser ? "admin" : "user",
    banned: false,
    createdAt: new Date().toISOString(),
  }

  writeUsers([...users, newUser])
  setSession(newUser.id)

  return { user: toPublicUser(newUser) }
}

export async function signIn(input: {
  email: string
  password: string
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const users = readUsers()
  const found = users.find((u) => u.email === email)

  if (!found) {
    return { error: "E-mail ou senha inválidos." }
  }
  if (found.banned) {
    return { error: "Esta conta foi banida e não pode acessar o sistema." }
  }

  const passwordHash = await hashPassword(input.password)
  if (passwordHash !== found.passwordHash) {
    return { error: "E-mail ou senha inválidos." }
  }

  setSession(found.id)
  return { user: toPublicUser(found) }
}

export function signOut() {
  if (!isBrowser()) return
  localStorage.removeItem(SESSION_KEY)
  notifyChange()
}

function setSession(userId: string) {
  if (!isBrowser()) return
  localStorage.setItem(SESSION_KEY, userId)
  notifyChange()
}

export function getCurrentUser(): AppUser | null {
  if (!isBrowser()) return null
  const userId = localStorage.getItem(SESSION_KEY)
  if (!userId) return null

  const users = readUsers()
  const found = users.find((u) => u.id === userId)
  if (!found) return null

  // Se o usuário foi banido enquanto a sessão estava ativa, derruba a sessão.
  if (found.banned) {
    signOut()
    return null
  }

  return toPublicUser(found)
}

// --- Ações de administração ---

export function setUserRole(userId: string, role: UserRole) {
  const users = readUsers()
  const updated = users.map((u) => (u.id === userId ? { ...u, role } : u))
  writeUsers(updated)
}

export function setUserBanned(userId: string, banned: boolean) {
  const users = readUsers()
  const updated = users.map((u) => (u.id === userId ? { ...u, banned } : u))
  writeUsers(updated)
}

export function deleteUser(userId: string) {
  const users = readUsers().filter((u) => u.id !== userId)
  writeUsers(users)
}
