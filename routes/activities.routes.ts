import express from "express";
import { getActivities } from "../controllers/activities.controllers";
import { requireAuth } from "../middlewares/requireAuth";
const router = express.Router()

router.use(requireAuth)
router.route('/')
.get(getActivities)


export default router