"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const generalStatistics_controllers_1 = require("../controllers/generalStatistics.controllers");
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = express_1.default.Router();
router.get('/', requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), generalStatistics_controllers_1.getGeneralStatistics);
exports.default = router;
//# sourceMappingURL=statistics.routes.js.map