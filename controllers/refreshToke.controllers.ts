import asyncHandler from "express-async-handler"
import { prisma } from "../lib/prisma"
import { RefreshRequest } from "../types"
import { Response } from "express"
import { generateToken, generateRefreshToken } from "../utils/auth"
import { comparePassword, hashPassword } from "../utils/password"


/**
 * @description Update the client session token
 * @route POST/auth/refresh
 * @access Private 
 * **/ 
export const refreshToken = asyncHandler(async (req: RefreshRequest, res: Response) => {

  const userId = req.userId
  const refreshTokenPlain = req.cookies.refreshToken

  if (!userId) {
    res.status(401)
    throw new Error("Missing user id")
  }

  
  //  Récupérer tous les refresh tokens ACTIFS du user
  const storedTokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    }
  })

  if (storedTokens.length === 0) {
    res.status(403)
    throw new Error("No valid refresh token found")
  }

  //  Trouver le token correspondant (bcrypt compare)
  let matchedToken: typeof storedTokens[number] | null = null

  for (const token of storedTokens) {
    const isMatch = await comparePassword(refreshTokenPlain, token.token)
    if (isMatch) {
      matchedToken = token
      break
    }
  }

  //  Reuse attack detection
  if (!matchedToken) {
    //  quelqu’un tente d’utiliser un token déjà révoqué
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() }
    })

    res.status(403)
    throw new Error("Refresh token reuse detected")
  }

   //  Révoquer l'ancien refresh token
  await prisma.refreshToken.update({
    where: { id: matchedToken.id },
    data: { revokedAt: new Date() }
  })

  

  //  Récupérer l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    res.status(401)
    throw new Error("User not found")
  }

  //  Générer nouveaux tokens
  const newAccessToken = generateToken({
    id: user.id,
    role: user.role
  })
  

  const newRefreshToken = generateRefreshToken(user.id)
   const hashedNewRefreshToken = await hashPassword(newRefreshToken)
   
  //  Sauvegarder le NOUVEAU refresh token
  await prisma.refreshToken.create({
    data: {
      token: hashedNewRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })

  //  Mettre le refresh token en cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  })

  res.json({ accessToken: newAccessToken })
})


