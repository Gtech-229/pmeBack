"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const repayment_controllers_1 = require("../controllers/repayment.controllers");
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const router = express_1.default.Router({ mergeParams: true });
router.use(requireAuth_1.requireAuth);
router.delete('/repayments/:id', (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), repayment_controllers_1.deleteRepayment);
router.route('/repayments')
    .post(repayment_controllers_1.addRepayment);
exports.default = router;
//# sourceMappingURL=credits.routes.js.map