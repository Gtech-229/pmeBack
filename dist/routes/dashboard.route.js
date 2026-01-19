"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dashboard_controllers_1 = require("../controllers/dashboard.controllers");
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('SUPER_ADMIN', 'ADMIN'));
router.get('/', dashboard_controllers_1.getSummury);
exports.default = router;
//# sourceMappingURL=dashboard.route.js.map