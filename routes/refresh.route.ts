import express from "express";
import { verifyRefreshToken } from "..//utils/auth";
import { refreshToken } from "../controllers/refreshToke.controllers";
const router = express.Router();


router.post("/refresh",verifyRefreshToken, refreshToken)


export default router