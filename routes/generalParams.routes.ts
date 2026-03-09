import { requireAuth } from "../middlewares/requireAuth";
import { getParams, updateParams } from "../controllers/generalParams.controllers";
import express from "express";
import { requireRole } from "../middlewares/rbac";
import { upload } from "../middlewares/multer";
import { createRateLimiter } from "../middlewares/ratelimit";


const router = express.Router()

router.patch('/',requireAuth,requireRole('ADMIN', 'SUPER_ADMIN'),createRateLimiter(20, 15), upload.single('logo') ,updateParams)
router.get('/',createRateLimiter(60, 1), getParams)

export default router