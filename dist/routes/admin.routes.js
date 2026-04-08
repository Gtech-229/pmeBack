"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_controller_1 = require("../controllers/admin.controller");
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'));
router.post('/projects/:userId', multer_1.upload.array('documents'), admin_controller_1.adminCreateProject);
exports.default = router;
//# sourceMappingURL=admin.routes.js.map