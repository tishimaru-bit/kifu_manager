import { neon } from '@neondatabase/serverless'
import { databaseUrl } from './env.ts'

export function sql() {
  return neon(databaseUrl())
}

export function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

export function isoOrNull(value: unknown): string | null {
  if (value == null) return null
  return iso(value)
}
