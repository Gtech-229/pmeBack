import express from "express";
import { getSummury } from "../controllers/dashboard.controllers";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";

const router = express.Router()
router.use(requireAuth,requireRole('SUPER_ADMIN','ADMIN'))
router.get('/',getSummury)

export default router

