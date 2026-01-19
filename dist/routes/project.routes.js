"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controllers_1 = require("../controllers/project.controllers");
const router = express_1.default.Router();
const requireAuth_1 = require("../middlewares/requireAuth");
const rbac_1 = require("../middlewares/rbac");
const multer_1 = require("../middlewares/multer");
router.use(requireAuth_1.requireAuth);
router.get('/me', project_controllers_1.getMyProjects);
router.patch('/:id/status', (0, rbac_1.requireRole)('SUPER_ADMIN', 'ADMIN'), project_controllers_1.changeStatus);
router.route('/:id')
    .get(project_controllers_1.getProject)
    .delete(project_controllers_1.deleteProject)
    .patch(multer_1.upload.any(), project_controllers_1.updateProject);
router.route('/')
    .get(project_controllers_1.getProjects)
    .post(multer_1.upload.array('documents'), project_controllers_1.createProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map