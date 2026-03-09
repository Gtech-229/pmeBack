
import { adminCreateProject } from "../controllers/admin.controller";
import express from "express";
import { requireRole } from "../middlewares/rbac";
import { requireAuth } from "../middlewares/requireAuth";
import { upload } from "../middlewares/multer";


const router = express.Router();

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))

router.post('/projects/:userId', upload.array('documents'), adminCreateProject)
 
export default router
