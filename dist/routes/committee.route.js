"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const committee_controllers_1 = require("../controllers/committee.controllers");
const router = express_1.default.Router({ mergeParams: true });
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.get('/users', committee_controllers_1.getCommitteUsers);
router.route('/')
    .post(committee_controllers_1.createCommittee);
router.route('/:id')
    .get(committee_controllers_1.getCommitteeDetails)
    .delete(committee_controllers_1.deleteCommittee)
    .patch(committee_controllers_1.updateCommittee);
exports.default = router;
//# sourceMappingURL=committee.route.js.map