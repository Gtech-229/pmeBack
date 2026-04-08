import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { deleteCampaignStep, createCampaignSteps, getCampaignSteps, updateCampaignStep } from "../controllers/campaignSteps.controllers";

const router = express.Router()
router.use(requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'))   

router.route('/:campaignId/steps/:stepId')
.delete(deleteCampaignStep)



router.route('/:campaignId/steps')
.post(createCampaignSteps)
.get(getCampaignSteps)
.put(updateCampaignStep)


export default router
