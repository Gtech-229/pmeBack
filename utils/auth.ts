import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import { AuthRequest, JWTPayLoads , RefreshRequest} from "../types";


const JWT_SECRET = process.env.JWT_SECRET !
const REFRESH_SECRET = process.env.JWT_SECRET !

/**
 * Function to generate a JWT token
 * @param userId - user's Id
 * @param role - user's role
 * @returns token JWT
 */
export const generateToken = ({id, role} : JWTPayLoads) => {
const accessToken =  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "10m" });

return accessToken
};

export const generateRefreshToken = (id : string) =>{
 return jwt.sign({ id}, REFRESH_SECRET, { expiresIn: "7d" });
}



/**
 * Function to verify the request tokens
 * @param req - extended req type
 * @param res - Respone type
 * @next - NextFunction
 */



export const verifyAccessToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.jwt
  
 

  if(!token){
    res.status(401)
    throw new Error("No token ")
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayLoads

    req.user = {
      id: decoded.id,
      role: decoded.role
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" })
  }
}







// Used to refresh token on /auth/refresh
export const verifyRefreshToken = (
  req: RefreshRequest,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies?.refreshToken
    || req.body.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" })
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string }

    req.userId = decoded.id
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" })
  }
}
