import { Router } from "express"
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser
} from "../controllers/user.controllers"
import { Role } from "../generated/prisma/enums"
import { requireAuth } from "../middlewares/requireAuth"
import { requireRole } from "../middlewares/rbac"
import { requireOwnershipOrRole } from "../middlewares/ownership"
import { createRateLimiter } from "../middlewares/ratelimit"
const router = Router()
// Every route require the authentification
// router.use(requireAuth)

router
  .route("/:id")
  .get(requireOwnershipOrRole(Role.ADMIN, Role.SUPER_ADMIN),getUserById)
  .put(requireAuth,requireOwnershipOrRole(Role.ADMIN, Role.SUPER_ADMIN),updateUser)
  .delete(requireRole( Role.SUPER_ADMIN),deleteUser)

router
  .route("/")
  .post(createRateLimiter(3,1), createUser)
  .get(requireAuth,requireRole(Role.ADMIN, Role.SUPER_ADMIN),getUsers)



export default router
