import express from "express"
import { requireRole } from "../middlewares/rbac"
import { requireAuth } from "../middlewares/requireAuth"
import { addNewMember, getCommitteeMembers, deleteCommitteeMember, updateCommitteeMember } from "../controllers/committeemember.controllers"

const router = express.Router({ mergeParams: true }) 

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))

router.route('/')
.get(getCommitteeMembers)
.post(addNewMember)

router.route('/:memberId')
.delete(deleteCommitteeMember)
.patch(updateCommitteeMember)

export default router
