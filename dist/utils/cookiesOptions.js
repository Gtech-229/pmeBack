"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCookieOptions = exports.getCookieOptions = void 0;
// utils/cookieOptions.ts
const isProd = process.env.NODE_ENV === "production";
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProd, // required for sameSite: "none"
    sameSite: isProd ? "none" : "lax", // "none" for cross-subdomain in prod
    ...(isProd && { domain: ".suivi-mp.com" }), // leading dot = all subdomains
    maxAge,
});
exports.getCookieOptions = getCookieOptions;
const clearCookieOptions = () => ({
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    ...(isProd && { domain: ".suivi-mp.com" }),
    path: "/",
});
exports.clearCookieOptions = clearCookieOptions;
//# sourceMappingURL=cookiesOptions.js.map