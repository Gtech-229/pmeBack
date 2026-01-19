"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const committee_controllers_1 = require("../controllers/committee.controllers");
const committeemember_controllers_1 = require("../controllers/committeemember.controllers");
const committeeMeetings_controllers_1 = require("../controllers/committeeMeetings.controllers");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.get('/users', committee_controllers_1.getCommitteUsers);
router.route('/members')
    .post(committeemember_controllers_1.addNewMember);
// .get(getCommitteeMembers)
router.post('/meetings/:meetingId/report', multer_1.upload.array('documents'), committeeMeetings_controllers_1.addMeetingReport);
router.post('/meetings/:meetingId/sign', committeeMeetings_controllers_1.signReport);
router.route('/meetings/:meetingId')
    .get(committeeMeetings_controllers_1.getMeetingDetails)
    .patch(committeeMeetings_controllers_1.updateMeeting);
router.route('/meetings')
    .post(committeeMeetings_controllers_1.createMeeting);
router.get('/:committeeId/members', committeemember_controllers_1.getCommitteeMembers);
router.get('/:committeeId/meetings', committeeMeetings_controllers_1.getMeetings);
router.get('/:id', committee_controllers_1.getCommitteeDetails);
router.route('/')
    .post(requireAuth_1.requireAuth, committee_controllers_1.createCommittee)
    .get(committee_controllers_1.getCommittees);
exports.default = router;
//# sourceMappingURL=committee.route.js.map