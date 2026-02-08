import { createCampaign, createCampaignSteps, deleteCampaignStep, getCampaignById, getCampaigns, updateCampaign } from "../controllers/campaign.controllers";
import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { createCommittee, getCommitteeDetails } from "../controllers/committee.controllers";

const router = express.Router()
router.use(requireAuth)   

router.route('/:campaignId/committee/:committeeId')
.get(getCommitteeDetails)

router.route('/:campaignId/steps/:id')
.delete(deleteCampaignStep)


router.route('/:campaignId/steps')
.post(createCampaignSteps)

router.route('/:campaignId/committee')
.post(createCommittee)

router.route('/:id')
.get(getCampaignById)
.put(updateCampaign)


 router.route('/')
 .get(getCampaigns)
 .post(createCampaign)





export default router