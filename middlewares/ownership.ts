import { Response, NextFunction } from "express"
import { Role } from "../generated/prisma/enums"
import { AuthRequest } from "../types"

export const requireOwnershipOrRole = (
  ...allowedRoles: Role[]
) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const isOwner = req.user.id === req.params.id
    const hasRole = allowedRoles.includes(req.user.role)

    
    if (!isOwner && !hasRole) {
      return res.status(403).json({
        message: "Forbidden: not owner or insufficient role"
      })
    }

    next()
  }
}
