import express from "express";
import { 
    createProject,
     getMyProjects,
      getProject, 
      getProjects,
      deleteProject,
      updateProject, 
      changeStatus 
    } from "../controllers/project.controllers";
const router = express.Router();
import { requireOwnershipOrRole } from "../middlewares/ownership";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { Role } from "../generated/prisma/enums";
import { upload } from "../middlewares/multer";


router.use(requireAuth)
router.get('/me', getMyProjects)
router.patch('/:id/status',requireRole('SUPER_ADMIN','ADMIN'),changeStatus)

router.route('/:id')
.get(getProject)
.delete(deleteProject)
.patch(upload.any(),updateProject)


router.route('/')
.get(getProjects)
.post(upload.array('documents'),
    createProject)



export default router