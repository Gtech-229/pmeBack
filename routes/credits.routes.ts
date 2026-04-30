import { addRepayment, deleteRepayment } from "../controllers/repayment.controllers";
import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/rbac";
import { upload } from "../middlewares/multer";


const router = express.Router({mergeParams : true});

router.use(requireAuth);
router.delete('/repayments/:id', requireRole('ADMIN','SUPER_ADMIN'), deleteRepayment)

router.route('/repayments')
.post(upload.single('document'),addRepayment)




export default router;