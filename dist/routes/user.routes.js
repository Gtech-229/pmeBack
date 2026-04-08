"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controllers_1 = require("../controllers/user.controllers");
const enums_1 = require("../generated/prisma/enums");
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const ownership_1 = require("../middlewares/ownership");
const ratelimit_1 = require("../middlewares/ratelimit");
const router = express_1.default.Router({ mergeParams: true });
// Every route require the authentification
router
    .route("/:id")
    .delete(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('SUPER_ADMIN', 'ADMIN'), user_controllers_1.deleteUser)
    .get((0, ownership_1.requireOwnershipOrRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.getUserById)
    .put(requireAuth_1.requireAuth, (0, ownership_1.requireOwnershipOrRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.updateUser);
router.route('/admin')
    .post(requireAuth_1.requireAuth, (0, rbac_1.requireRole)('SUPER_ADMIN'), user_controllers_1.createAdmin);
router
    .route("/")
    .post((0, ratelimit_1.createRateLimiter)(3, 1), user_controllers_1.createUser)
    .get(requireAuth_1.requireAuth, (0, rbac_1.requireRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.getUsers);
exports.default = router;
//# sourceMappingURL=user.routes.js.map