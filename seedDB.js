import "dotenv/config";
import { env } from "node:process";

import { Pool } from "pg";

const connectionString =
  env.NODE_ENV === "test" ? env.TEST_DATABASE_URL : env.DATABASE_URL;

const pool = new Pool({
  connectionString,
});

async function seedFirst() {
  // set up the available scene
  const res = await pool.query(
    `insert into scene (level, url)
    values (2, 'https://res.cloudinary.com/hbrwdfccc/image/upload/v1763249346/Where%27s%20Waldo/Wheres-Waldo-Space-Station-Super-High-Resolution-scaled.jpg') returning (id);`
  );

  const sceneId = res.rows[0].id;

  // setup the characters for that scene
  const res1 =
    res &&
    (await pool.query(`insert into character_name (character, name, icon_url) 
      values ('ODLAW', 'Odlaw', 'https://res.cloudinary.com/hbrwdfccc/image/upload/v1763875339/Where%27s%20Waldo/odlaw.png'),
      ('WALDO', 'Waldo','https://res.cloudinary.com/hbrwdfccc/image/upload/v1764635698/Where%27s%20Waldo/wally_e_background_removal_f_png.png'),
      ('WIZARD_WHITEBEARD', 'Wizard Whitebeard','https://res.cloudinary.com/hbrwdfccc/image/upload/v1764420240/Where%27s%20Waldo/wizard.png') returning name`));
                                                 
  const res2 =
    res1 &&
    (await pool.query(
      `insert into answer (scene_id, character, location_x, location_y) 
      values (${sceneId}, 'ODLAW', 6.87, 68.55),
      (${sceneId}, 'WALDO', 40.45, 62.17),
      (${sceneId}, 'WIZARD_WHITEBEARD', 77.86, 57.39) returning scene_id`
    ));

  return res2;
}

async function seedSecond() {
  // set up the available scene
  const res = await pool.query(
    `insert into scene (level, url)
    values (1, 'https://res.cloudinary.com/hbrwdfccc/image/upload/v1765246758/Where%27s%20Waldo/candy-scene-wally-odlaw.jpg') returning (id);`
  );

  const sceneId = res.rows[0].id;

  // characters already setup in seedFirst
  
  const res2 =
    res1 &&
    (await pool.query(
      `insert into answer (scene_id, character, location_x, location_y) 
      values (${sceneId}, 'ODLAW', 6.87, 68.55),
      (${sceneId}, 'WALDO', 40.45, 62.17) returning scene_id`
    ));

  return res2;
}
console.log("\nBegin table seeding operation.\n");
const res1 = await seedFirst(); 

const res2 = await seedSecond(); 

if (res1 && res2) {
  console.log("All tables seeded successfully.");
  await pool.end()
}
