import express from "express"
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser, 
  createAdmin,
  savePushToken
} from "../controllers/user.controllers"
import { Role } from "../generated/prisma/enums"
import { requireAuth } from "../middlewares/requireAuth"
import { requireRole } from "../middlewares/rbac"
import { requireOwnershipOrRole } from "../middlewares/ownership"
import { createRateLimiter } from "../middlewares/ratelimit"

const router = express.Router({ mergeParams: true })
// Every route require the authentification
router
  .route("/:id")
  .delete(requireAuth,requireRole('SUPER_ADMIN','ADMIN'),deleteUser)
  .get(requireOwnershipOrRole(Role.ADMIN, Role.SUPER_ADMIN),getUserById)
  .put(requireAuth,requireOwnershipOrRole(Role.ADMIN, Role.SUPER_ADMIN),updateUser)
  

router.route('/admin')
.post(requireAuth, requireRole('SUPER_ADMIN'), createAdmin)

router.route('/push-token')
.post(savePushToken)



router
  .route("/")
  .post(createRateLimiter(3,1), createUser)
  .get(requireAuth,requireRole(Role.ADMIN, Role.SUPER_ADMIN),getUsers)



export default router
