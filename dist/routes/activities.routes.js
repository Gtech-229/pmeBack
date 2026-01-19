"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const activities_controllers_1 = require("../controllers/activities.controllers");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth);
router.route('/')
    .get(activities_controllers_1.getActivities);
exports.default = router;
//# sourceMappingURL=activities.routes.js.map