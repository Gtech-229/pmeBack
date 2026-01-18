import { validateAccount, getPme, updateProfile, deleteProfileImg } from "../controllers/pme.controllers";
import express from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { upload } from "../middlewares/multer";

const router = express.Router()

router.use(requireAuth)
router.put('/:id', upload.single('profileImg'), updateProfile )
.delete('/:id/profil', deleteProfileImg)
router.get('/me',getPme )
router.post('/',validateAccount)



export default router