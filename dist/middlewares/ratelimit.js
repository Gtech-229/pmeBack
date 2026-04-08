"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimiter = createRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Factory de rate limiter
 * @param maxRequests nombre max de requêtes
 * @param minutes fenêtre de temps en minutes
 */
function createRateLimiter(maxRequests, minutes) {
    return (0, express_rate_limit_1.default)({
        windowMs: minutes * 60 * 1000,
        max: maxRequests,
        standardHeaders: true, // RateLimit-*
        legacyHeaders: false, // X-RateLimit-*
        ipv6Subnet: 56,
        handler: (req, res) => {
            console.warn(`[RATE LIMIT] ${req.ip} ${req.method} ${req.originalUrl}`);
            res.status(429).json({
                error: "Trop de requetes",
                message: `Limite des ${maxRequests} requetes par ${minutes} minute(s) dépassée. Réessayez dans plus tard`,
            });
        },
    });
}
//# sourceMappingURL=ratelimit.js.map