import type { SupabaseClient } from "@supabase/supabase-js"
import type { AppUser } from "./types"

/**
 * Camada de acesso à tabela `profiles` no Supabase.
 * Requer que `supabase/schema.sql` já tenha sido executado no projeto
 * (tabela profiles + trigger handle_new_user + policies de RLS).
 */

type ProfileRow = {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  banned: boolean
  created_at: string
}

function toAppUser(row: ProfileRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    banned: row.banned,
    createdAt: row.created_at,
  }
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, banned, created_at")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) return null
  return toAppUser(data as ProfileRow)
}

export async function listProfiles(supabase: SupabaseClient): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, banned, created_at")
    .order("created_at", { ascending: true })

  if (error || !data) return []
  return (data as ProfileRow[]).map(toAppUser)
}

export async function setUserRole(
  supabase: SupabaseClient,
  userId: string,
  role: "admin" | "user",
) {
  return supabase.from("profiles").update({ role }).eq("id", userId)
}

export async function setUserBanned(
  supabase: SupabaseClient,
  userId: string,
  banned: boolean,
) {
  return supabase.from("profiles").update({ banned }).eq("id", userId)
}
