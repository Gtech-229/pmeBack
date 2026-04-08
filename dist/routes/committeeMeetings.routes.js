"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const committeeMeetings_controllers_1 = require("../controllers/committeeMeetings.controllers");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router({ mergeParams: true });
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.route('/')
    .get(committeeMeetings_controllers_1.getMeetings)
    .post(committeeMeetings_controllers_1.createMeeting);
router.route('/:meetingId')
    .get(committeeMeetings_controllers_1.getMeetingDetails)
    .patch(committeeMeetings_controllers_1.updateMeeting);
router.post('/:meetingId/report', multer_1.upload.array('documents'), committeeMeetings_controllers_1.addMeetingReport);
router.post('/:meetingId/sign', committeeMeetings_controllers_1.signReport);
router.post('/:meetingId/generatePresenceList', committeeMeetings_controllers_1.generatePresenceList);
exports.default = router;
//# sourceMappingURL=committeeMeetings.routes.js.map