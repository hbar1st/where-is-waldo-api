#!/bin/bash

# use this file to migrate in sync the test and main databases during development

# Source the .env file
source ./.env

echo "** setup the main db at $DATABASE_URL"

npx prisma db push

npx prisma migrate dev

npx prisma generate

echo "** setup the test db at $TEST_DATABASE_URL"


NOED_ENV=test npx prisma db push && npm run "db:reset"

seed_db() { 
  echo -e "\nWorking on clearing/migrating/seeding table: $1\n"

  PSQL="psql --username=hbar1st --dbname=$1 -t -q --no-align -c"

  echo "Clear all the rows"
  $PSQL "truncate table answer,character_name,scene,game,game_answer"

  echo "Insert the scene"
  SCENE_ID=$($PSQL "insert into scene (url) values ('https://res.cloudinary.com/hbrwdfccc/image/upload/v1763249346/Where%27s%20Waldo/Wheres-Waldo-Space-Station-Super-High-Resolution-scaled.jpg')returning (id)")
  if [[ -z $SCENE_ID ]]
  then
    echo "Failed to seed scene table"
    exit
  fi

  echo "Seed the character_name table"
  INSERT_RES=$($PSQL "insert into character_name (character, name) values ('ODLAW', 'Odlaw'), ('WALDO', 'Waldo'), ('WIZARD_WHITEBEARD', 'Wizard Whitebeard') returning name")
  if [[ -z $INSERT_RES ]]
  then
    echo "Failed to seed character_name table"
    exit
  fi

  echo "Seed the answer table"
  INSERT_RES=$($PSQL "insert into answer (scene_id, character, location_x, location_y) values ($SCENE_ID, 'ODLAW', 0.07, 24.82), ($SCENE_ID, 'WALDO', 10.47, 25.12), ($SCENE_ID, 'WIZARD_WHITEBEARD', 48.09, 20.6) returning scene_id")
  if [[ -z $INSERT_RES ]]
  then
    echo "Failed to seed the answer table"
    exit
  fi
}

seed_db "test_waldo"
seed_db "waldo"

echo -e "\nDB migration and seeding completed.\n"
exit