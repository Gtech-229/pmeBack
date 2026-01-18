"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controllers_1 = require("../controllers/project.controllers");
const router = express_1.default.Router();
router.route('/:id')
    .get(project_controllers_1.getProject);
router.route('/')
    .get(project_controllers_1.getProjects)
    .post(project_controllers_1.createProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map