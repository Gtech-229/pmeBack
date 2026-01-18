"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_SECRET;
/**
 * Function to generate a JWT token
 * @param userId - user's Id
 * @param role - user's role
 * @returns token JWT
 */
const generateToken = ({ id, role }) => {
    const accessToken = jsonwebtoken_1.default.sign({ id, role }, JWT_SECRET, { expiresIn: "10m" });
    return accessToken;
};
exports.generateToken = generateToken;
const generateRefreshToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, REFRESH_SECRET, { expiresIn: "7d" });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Function to verify the request tokens
 * @param req - extended req type
 * @param res - Respone type
 * @next - NextFunction
 */
const verifyAccessToken = (req, res, next) => {
    const token = req.cookies?.jwt;
    if (!token) {
        res.status(401);
        throw new Error("No token ");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired access token" });
    }
};
exports.verifyAccessToken = verifyAccessToken;
// Used to refresh token on /auth/refresh
const verifyRefreshToken = (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken
        || req.body.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        req.userId = decoded.id;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=auth.js.map