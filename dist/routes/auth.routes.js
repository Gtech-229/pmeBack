"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controllers_1 = require("../controllers/auth.controllers");
const requireAuth_1 = require("../middlewares/requireAuth");
const auth_1 = require("../utils/auth");
const router = (0, express_1.Router)();
router.post("/login", auth_controllers_1.login);
router.post("/refresh", auth_controllers_1.refreshToken);
router.post("/logout", requireAuth_1.requireAuth, auth_controllers_1.logout);
router.get('/me', requireAuth_1.requireAuth, auth_controllers_1.getMe);
router.put('/change-password', auth_1.verifyAccessToken, auth_controllers_1.changePassword);
router.post('/send-code', requireAuth_1.requireAuth, auth_controllers_1.sendCode);
router.post('/verify-code', requireAuth_1.requireAuth, auth_controllers_1.verifyCode);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map