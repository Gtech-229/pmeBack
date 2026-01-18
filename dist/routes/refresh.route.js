"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("..//utils/auth");
const refreshToke_controllers_1 = require("../controllers/refreshToke.controllers");
const router = express_1.default.Router();
router.post("/refresh", auth_1.verifyRefreshToken, refreshToke_controllers_1.refreshToken);
exports.default = router;
//# sourceMappingURL=refresh.route.js.map