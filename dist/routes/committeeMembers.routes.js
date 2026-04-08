"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const committeemember_controllers_1 = require("../controllers/committeemember.controllers");
const router = express_1.default.Router({ mergeParams: true });
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.route('/')
    .get(committeemember_controllers_1.getCommitteeMembers)
    .post(committeemember_controllers_1.addNewMember);
router.route('/:memberId')
    .delete(committeemember_controllers_1.deleteCommitteeMember)
    .patch(committeemember_controllers_1.updateCommitteeMember);
exports.default = router;
//# sourceMappingURL=committeeMembers.routes.js.map