"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCookieOptions = exports.getCookieOptions = exports.clearSessionCookieOptions = void 0;
const isProd = process.env.NODE_ENV === "production";
const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/", // ← same path on set AND clear
    ...(isProd && { domain: ".suivi-mp.com" }),
};
const clearSessionCookieOptions = () => ({
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    ...(isProd && { domain: ".suivi-mp.com" }),
});
exports.clearSessionCookieOptions = clearSessionCookieOptions;
const getCookieOptions = (maxAge) => ({
    ...base,
    maxAge,
});
exports.getCookieOptions = getCookieOptions;
const clearCookieOptions = () => ({ ...base });
exports.clearCookieOptions = clearCookieOptions;
//# sourceMappingURL=cookiesOptions.js.map