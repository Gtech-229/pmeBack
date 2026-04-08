"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const financialEntries_controllers_1 = require("../controllers/financialEntries.controllers");
const multer_1 = require("../middlewares/multer");
const route = express_1.default.Router({ mergeParams: true });
route.use(requireAuth_1.requireAuth);
route.route('/')
    .post(multer_1.upload.single("file"), financialEntries_controllers_1.addFinancialEntry);
exports.default = route;
//# sourceMappingURL=financialEntries.routes.js.map