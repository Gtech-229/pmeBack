"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const campaign_controllers_1 = require("../controllers/campaign.controllers");
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const committee_controllers_1 = require("../controllers/committee.controllers");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth);
router.route('/:campaignId/committee/:committeeId')
    .get(committee_controllers_1.getCommitteeDetails);
router.route('/:campaignId/steps/:id')
    .delete(campaign_controllers_1.deleteCampaignStep);
router.route('/:campaignId/steps')
    .post(campaign_controllers_1.createCampaignSteps);
router.route('/:campaignId/committee')
    .post(committee_controllers_1.createCommittee);
router.route('/:id')
    .get(campaign_controllers_1.getCampaignById)
    .put(campaign_controllers_1.updateCampaign);
router.route('/')
    .get(campaign_controllers_1.getCampaigns)
    .post(campaign_controllers_1.createCampaign);
exports.default = router;
//# sourceMappingURL=campaign.route.js.map