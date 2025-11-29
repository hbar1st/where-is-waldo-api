import "dotenv/config";
import { env } from "node:process";

import { Pool } from "pg";

const connectionString =
  env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

async function seed() {
  // set up the available scene
  const res = await pool.query(
    `insert into scene (url)
    values ('https://res.cloudinary.com/hbrwdfccc/image/upload/v1763249346/Where%27s%20Waldo/Wheres-Waldo-Space-Station-Super-High-Resolution-scaled.jpg') returning (id);`
  );

  const sceneId = res.rows[0].id;

  // setup the characters for that scene
  const res1 =
    res &&
    (await pool.query(`insert into character_name (character, name, icon_url) 
      values ('ODLAW', 'Odlaw', 'https://res.cloudinary.com/hbrwdfccc/image/upload/v1763875339/Where%27s%20Waldo/odlaw.png'),
      ('WALDO', 'Waldo','https://res.cloudinary.com/hbrwdfccc/image/upload/v1764419380/Where%27s%20Waldo/wally.jpg'),
      ('WIZARD_WHITEBEARD', 'Wizard Whitebeard','https://res.cloudinary.com/hbrwdfccc/image/upload/v1764420240/Where%27s%20Waldo/wizard.png') returning name`));
                                                 
  const res2 =
    res1 &&
    (await pool.query(
      `insert into answer (scene_id, character, location_x, location_y) 
      values (${sceneId}, 'ODLAW', 0.07, 24.82),
      (${sceneId}, 'WALDO', 10.47, 25.12),
      (${sceneId}, 'WIZARD_WHITEBEARD', 48.09, 20.6) returning scene_id`
    ));

  return res2;
}

console.log("\nBegin table seeding operation.\n");
const res = await seed(); 

if (res) {
  console.log("All tables seeded successfully.");
  await pool.end()
}
