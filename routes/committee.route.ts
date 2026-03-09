import express from "express"
import { requireRole } from "../middlewares/rbac"
import { requireAuth } from "../middlewares/requireAuth"
import { createCommittee, getCommittees, getCommitteeDetails, getCommitteUsers, deleteCommittee, updateCommittee } from "../controllers/committee.controllers"

const router = express.Router({ mergeParams: true })

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))
router.get('/users', getCommitteUsers);

router.route('/')
.post(createCommittee)

router.route('/:id')
.get(getCommitteeDetails)
.delete(deleteCommittee)
.patch(updateCommittee)



export default router
