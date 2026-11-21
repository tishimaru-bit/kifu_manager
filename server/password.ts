import { hash, verify, type Options } from '@node-rs/argon2'

const argon2id = 2

/** OWASP の推奨（19 MiB、2回、並列1）。 */
const options: Options = {
  algorithm: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
}

export function hashPassword(password: string): Promise<string> {
  return hash(password, options)
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password)
  } catch {
    return false
  }
}
