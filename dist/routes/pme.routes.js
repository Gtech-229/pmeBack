"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pme_controllers_1 = require("../controllers/pme.controllers");
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const multer_1 = require("../middlewares/multer");
const router = express_1.default.Router();
router.use(requireAuth_1.requireAuth);
router.put('/:id', multer_1.upload.single('profileImg'), pme_controllers_1.updateProfile)
    .delete('/:id/profil', pme_controllers_1.deleteProfileImg);
router.get('/me', pme_controllers_1.getPme);
router.post('/', pme_controllers_1.validateAccount);
exports.default = router;
//# sourceMappingURL=pme.routes.js.map