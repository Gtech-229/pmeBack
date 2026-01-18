import { prisma } from "./lib/prisma.js"

async function main() {
  const tables = await prisma.$queryRaw<
    { table_name: string }[]
  >`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `

  console.log("Tables in database:")
  tables.forEach(t => console.log(`- ${t.table_name}`))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
