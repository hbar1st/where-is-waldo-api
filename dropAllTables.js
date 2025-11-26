import "dotenv/config";
import { env } from "node:process";

import { Pool } from "pg";

const connectionString = env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});


async function dropAllTables() {
  const res = await pool.query(
    "drop table if exists answer,character_name,scene,game,game_answer,session"
  );
  return res;
}

console.log("\nBegin table drop operation.\n");
if (await dropAllTables()) {
  console.log("All tables dropped.");
  
  await pool.end();
}
