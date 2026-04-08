import { getGeneralStatistics } from "../controllers/generalStatistics.controllers";
import express from "express";
import { requireRole } from "../middlewares/rbac";
import { requireAuth } from "../middlewares/requireAuth";

const router = express.Router();

router.get('/',requireAuth, requireRole('ADMIN','SUPER_ADMIN'), getGeneralStatistics)



export default router;