"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnershipOrRole = void 0;
const requireOwnershipOrRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const isOwner = req.user.id === req.params.id;
        const hasRole = allowedRoles.includes(req.user.role);
        //  console.log(req.params.id)
        if (!isOwner && !hasRole) {
            return res.status(403).json({
                message: "Forbidden: not owner or insufficient role"
            });
        }
        next();
    };
};
exports.requireOwnershipOrRole = requireOwnershipOrRole;
//# sourceMappingURL=ownership.js.map