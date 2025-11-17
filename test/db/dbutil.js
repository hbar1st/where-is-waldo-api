import { prisma } from "../../src/middleware/prisma.mjs";

export async function clearAllTables() {
  /**
  const tablenames = await prisma.$queryRaw(
    `SELECT tablename FROM p WHERE schemaname='public'`
  );

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"public"."${name}"`)
    .join(", ");

    **/
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE Session CASCADE;`);
  } catch (error) {
    console.log({ error });
  }

  return true;
}
