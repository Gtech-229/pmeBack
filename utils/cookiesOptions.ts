import { CookieOptions } from "express"

const isProd = process.env.NODE_ENV === "production"

const base: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",                                  // ← same path on set AND clear
  ...(isProd && { domain: ".suivi-mp.com" }),
}




export const clearSessionCookieOptions = (): CookieOptions => ({
  httpOnly: false,        
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  ...(isProd && { domain: ".suivi-mp.com" }),
})

export const getCookieOptions = (maxAge: number): CookieOptions => ({
  ...base,
  maxAge,
})

export const clearCookieOptions = (): CookieOptions => ({ ...base })