import { createCampaign, deleteCampaign, getCampaignById, getCampaigns, updateCampaign} from "../controllers/campaign.controllers";
import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { createCommittee, getCommitteeDetails, getCommittees } from "../controllers/committee.controllers";
import { getCampaignStatistics } from "../controllers/campaignStatistics.controllers";


const router = express.Router()
router.use(requireAuth)   

router.route('/:campaignId/committee/:committeeId')
.get(requireRole('ADMIN', 'SUPER_ADMIN'),getCommitteeDetails)


router.route('/:campaignId/committee')
.post(requireRole('ADMIN', 'SUPER_ADMIN'),createCommittee)
.get(requireRole('ADMIN', 'SUPER_ADMIN'),getCommittees)


router.route('/:campaignId/statistics')
.get(requireRole('ADMIN', 'SUPER_ADMIN'), getCampaignStatistics)
// .get(requireRole('ADMIN','SUPER_ADMIN'),getCommitteeMembers)

router.route('/:id')
.get(getCampaignById)
.patch(requireRole('ADMIN', 'SUPER_ADMIN'),updateCampaign)
.delete(requireRole('ADMIN', 'SUPER_ADMIN'),requireRole('SUPER_ADMIN'),deleteCampaign)

 router.route('/')
 .get(getCampaigns)
 .post(requireRole('ADMIN', 'SUPER_ADMIN'),createCampaign)





export default router