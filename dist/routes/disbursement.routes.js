"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rbac_1 = require("../middlewares/rbac");
const requireAuth_1 = require("../middlewares/requireAuth");
const disbursement_controllers_1 = require("../controllers/disbursement.controllers");
const router = express_1.default.Router({ mergeParams: true });
router.patch('/confirm', requireAuth_1.requireAuth, (0, rbac_1.requireRole)('SUPER_ADMIN', 'ADMIN'), disbursement_controllers_1.confirmDisbursement);
exports.default = router;
//# sourceMappingURL=disbursement.routes.js.map