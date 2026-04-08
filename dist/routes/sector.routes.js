"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const sectors_controller_1 = require("../controllers/sectors.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.delete('/:sectorId', requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), sectors_controller_1.deleteSector);
router.route('/')
    .get(requireAuth_1.requireAuth, sectors_controller_1.getSectors)
    .post(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('ADMIN', 'SUPER_ADMIN'), sectors_controller_1.createSector);
exports.default = router;
//# sourceMappingURL=sector.routes.js.map