"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../utils/password");
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
async function main() {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
    // 1Check if there is already a superadmin
    const existingAdmin = await prisma_1.prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL }
    });
    if (existingAdmin) {
        console.log("✅ Super admin already exists");
        return;
    }
    //  passwordHash
    const passwordHash = await (0, password_1.hashPassword)(SUPER_ADMIN_PASSWORD);
    // 3️Create super admin
    await prisma_1.prisma.user.create({
        data: {
            firstName: "Super",
            lastName: "Admin",
            email: SUPER_ADMIN_EMAIL,
            passwordHash,
            role: enums_1.Role.SUPER_ADMIN,
            isActive: true
        }
    });
    console.log("🚀 Super admin created successfully");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma_1.prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map