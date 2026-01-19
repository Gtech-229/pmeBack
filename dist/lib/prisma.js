"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
const adapter_neon_1 = require("@prisma/adapter-neon");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in .env");
}
const adapter = new adapter_neon_1.PrismaNeon({ connectionString });
exports.prisma = new client_1.PrismaClient({ adapter });
//# sourceMappingURL=prisma.js.map