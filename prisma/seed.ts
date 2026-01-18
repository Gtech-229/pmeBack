import { hashPassword } from "../utils/password"
import { prisma } from "../lib/prisma"
import { Role } from "../generated/prisma/enums"


async function main() {

  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL !
  const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD !

  // 1Check if there is already a superadmin
  const existingAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL }
  })

  if (existingAdmin) {
    console.log("✅ Super admin already exists")
    return
  }

  //  passwordHash
  const passwordHash = await hashPassword(SUPER_ADMIN_PASSWORD)

  // 3️Create super admin
  await prisma.user.create({
    data: {
      firstName : "Super",
      lastName : "Admin",
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true
    }
  })

  console.log("🚀 Super admin created successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
