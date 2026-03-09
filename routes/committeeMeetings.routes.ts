import express from "express"
import { requireRole } from "../middlewares/rbac"
import { requireAuth } from "../middlewares/requireAuth"
import { createMeeting, getMeetings, getMeetingDetails, updateMeeting, addMeetingReport, signReport } from "../controllers/committeeMeetings.controllers"
import { upload } from "../middlewares/multer"

const router = express.Router({ mergeParams: true })

router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))

router.route('/')
.get(getMeetings)
.post(createMeeting)


router.route('/:meetingId')
.get(getMeetingDetails)
.patch(updateMeeting);



router.post('/:meetingId/report', upload.array('documents'), addMeetingReport)
router.post('/:meetingId/sign', signReport)

export default router
