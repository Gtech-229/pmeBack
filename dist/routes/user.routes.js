"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controllers_1 = require("../controllers/user.controllers");
const enums_1 = require("../generated/prisma/enums");
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const ownership_1 = require("../middlewares/ownership");
const router = (0, express_1.Router)();
// Every route require the authentification
router.use(requireAuth_1.requireAuth);
router
    .route("/:id")
    .get((0, ownership_1.requireOwnershipOrRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.getUserById)
    .put((0, ownership_1.requireOwnershipOrRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.updateUser)
    .delete((0, rbac_1.requireRole)(enums_1.Role.SUPER_ADMIN), user_controllers_1.deleteUser);
router
    .route("/")
    .post((0, rbac_1.requireRole)(enums_1.Role.SUPER_ADMIN, enums_1.Role.ADMIN), user_controllers_1.createUser)
    .get((0, rbac_1.requireRole)(enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN), user_controllers_1.getUsers);
exports.default = router;
//# sourceMappingURL=user.routes.js.map