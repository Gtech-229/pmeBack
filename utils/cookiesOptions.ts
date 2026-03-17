import { CookieOptions } from "express"

// utils/cookieOptions.ts
const isProd = process.env.NODE_ENV === "production"

export const getCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  secure: isProd,                          // required for sameSite: "none"
  sameSite: isProd ? "none" : "lax",       // "none" for cross-subdomain in prod
  ...(isProd && { domain: ".suivi-mp.com" }), // leading dot = all subdomains
  maxAge,
})

export const clearCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  ...(isProd && { domain: ".suivi-mp.com" }),
})