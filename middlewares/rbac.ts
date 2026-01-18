import { Response, NextFunction } from "express"
import { AuthRequest} from "../types"
import { Role } from "../generated/prisma/enums"


export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    
    if (!req.user?.id) {
      
      return res.status(401).json({ message: "Unauthorized" })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: insufficient permissions"
      })
    }

    next()
  }
}
