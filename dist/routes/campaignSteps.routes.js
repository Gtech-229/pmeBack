"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const campaignSteps_controllers_1 = require("../controllers/campaignSteps.controllers");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.route('/:campaignId/steps/:stepId')
    .delete(campaignSteps_controllers_1.deleteCampaignStep);
router.route('/:campaignId/steps')
    .post(campaignSteps_controllers_1.createCampaignSteps)
    .get(campaignSteps_controllers_1.getCampaignSteps)
    .put(campaignSteps_controllers_1.updateCampaignStep);
exports.default = router;
//# sourceMappingURL=campaignSteps.routes.js.map