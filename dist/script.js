"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("./lib/prisma.js");
async function main() {
    const tables = await prisma_js_1.prisma.$queryRaw `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
  `;
    console.log("Tables in database:");
    tables.forEach(t => console.log(`- ${t.table_name}`));
}
main()
    .then(async () => {
    await prisma_js_1.prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma_js_1.prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=script.js.map