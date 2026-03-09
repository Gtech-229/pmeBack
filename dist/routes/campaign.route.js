"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const campaign_controllers_1 = require("../controllers/campaign.controllers");
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const committee_controllers_1 = require("../controllers/committee.controllers");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth);
router.route('/:campaignId/committee/:committeeId')
    .get((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), committee_controllers_1.getCommitteeDetails);
router.route('/:campaignId/steps/:stepId')
    .delete((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.deleteCampaignStep);
router.route('/:campaignId/steps')
    .post((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.createCampaignSteps)
    .get((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.getCampaignSteps)
    .put((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.updateCampaignStep);
router.route('/:campaignId/committee')
    .post((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), committee_controllers_1.createCommittee)
    .get((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), committee_controllers_1.getCommittees);
// router.route('/:campaignId/committee/:committeeId/members')
// .get(requireRole('ADMIN','SUPER_ADMIN'),getCommitteeMembers)
router.route('/:id')
    .get(campaign_controllers_1.getCampaignById)
    .patch((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.updateCampaign)
    .delete((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), (0, rbac_1.requireRole)('SUPER_ADMIN'), campaign_controllers_1.deleteCampaign);
router.route('/')
    .get(campaign_controllers_1.getCampaigns)
    .post((0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), campaign_controllers_1.createCampaign);
exports.default = router;
//# sourceMappingURL=campaign.route.js.map