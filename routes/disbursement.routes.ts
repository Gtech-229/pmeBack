import express from "express";
import { requireRole } from "../middlewares/rbac";
import { requireAuth } from "../middlewares/requireAuth";
import { confirmDisbursement } from "../controllers/disbursement.controllers";


const router = express.Router({mergeParams : true});

router.patch('/confirm',requireAuth, requireRole('SUPER_ADMIN','ADMIN'), confirmDisbursement);



export default router