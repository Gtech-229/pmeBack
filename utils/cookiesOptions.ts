// utils/cookieOptions.ts
export const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  ...(process.env.NODE_ENV === "production" && { domain: ".suivi-mp.com" }),
  maxAge,
})