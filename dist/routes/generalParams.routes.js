"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const requireAuth_1 = require("../middlewares/requireAuth");
const generalParams_controllers_1 = require("../controllers/generalParams.controllers");
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const multer_1 = require("../middlewares/multer");
const ratelimit_1 = require("../middlewares/ratelimit");
const router = express_1.default.Router();
router.patch('/', requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), (0, ratelimit_1.createRateLimiter)(20, 15), multer_1.upload.single('logo'), generalParams_controllers_1.updateParams);
router.get('/', (0, ratelimit_1.createRateLimiter)(60, 1), generalParams_controllers_1.getParams);
exports.default = router;
//# sourceMappingURL=generalParams.routes.js.map