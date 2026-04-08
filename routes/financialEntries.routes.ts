import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { addFinancialEntry } from "../controllers/financialEntries.controllers";
import { upload } from "../middlewares/multer";

const route = express.Router({mergeParams : true})
route.use(requireAuth)

route.route('/')
.post(upload.single("file"), addFinancialEntry)



export default route