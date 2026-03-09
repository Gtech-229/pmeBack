import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { createSector, deleteSector, getSectors } from "../controllers/sectors.controller";
import express from "express";


const router = express.Router()

router.delete('/:sectorId', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), deleteSector)


router.route('/')
.get(requireAuth,getSectors)
.post(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'),createSector)


export default router