"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("../generated/prisma/client");
const adapter_neon_1 = require("@prisma/adapter-neon");
const dotenv_1 = __importDefault(require("dotenv"));
const serverless_1 = require("@neondatabase/serverless");
const ws_1 = __importDefault(require("ws"));
dotenv_1.default.config();
// Neon serverless setup
serverless_1.neonConfig.webSocketConstructor = ws_1.default;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in .env");
}
const adapter = new adapter_neon_1.PrismaNeon({ connectionString });
// Utilise la même instance en dev pour éviter le hot reload multiple
const prisma = global.prisma || new client_1.PrismaClient({ adapter });
exports.prisma = prisma;
if (process.env.NODE_ENV === 'development')
    global.prisma = prisma;
//# sourceMappingURL=prisma.js.map