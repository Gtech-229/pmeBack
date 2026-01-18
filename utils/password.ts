import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12
// 10 = ok, 12 = bon compromis sécurité / perf

/**
 * Hash a plain password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare plain password with hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

