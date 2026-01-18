import express from "express";
import { requireRole } from "../middlewares/rbac";
import { requireAuth } from "../middlewares/requireAuth";
import { getCommitteUsers, getCommitteeProjects,createCommittee, getCommittees, getCommitteeDetails } from "../controllers/committee.controllers";
import { addNewMember, getCommitteeMembers } from "../controllers/committeemember.controllers";
import { createMeeting, getMeetings, getMeetingDetails, updateMeeting, addMeetingReport, signReport } from "../controllers/committeeMeetings.controllers";
import { upload } from "../middlewares/multer";

const router = express.Router()

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))
router.get('/users',getCommitteUsers)
router.route('/members')
.post(addNewMember)
// .get(getCommitteeMembers)
router.post('/meetings/:meetingId/report',upload.array('documents'), addMeetingReport)
router.post('/meetings/:meetingId/sign',signReport)
router.route('/meetings/:meetingId')
.get(getMeetingDetails)
.patch(updateMeeting)

router.route('/meetings')
.post(createMeeting)

router.get('/:committeeId/members', getCommitteeMembers);
router.get('/:committeeId/meetings', getMeetings);


router.get('/:id',getCommitteeDetails)



router.route('/')
.post(requireAuth,createCommittee )
.get(getCommittees)

export default router