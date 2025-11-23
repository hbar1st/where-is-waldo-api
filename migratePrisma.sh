#!/bin/bash

# use this file to migrate in sync the test and main databases during development

# Source the .env file
source ./.env

echo -e "Do not exit the program until the migration is completed."

echo -e "\033[4m Setup the main db at $DATABASE_URL for $DB_USER \033[0m"


echo "- DROP all the tables"

PSQL="psql --username=$DB_USER --dbname=$1 -t -q --no-align -c"
$PSQL "drop table if exists answer,character_name,scene,game,game_answer,session"

npx prisma migrate dev

npx prisma migrate reset -f

npx prisma generate

echo  -e "\033[4m Setup the test db at $TEST_DATABASE_URL for $DB_USER \033[0m"


NODE_ENV=test npx prisma migrate dev
NODE_ENV=test npx prisma migrate reset -f
NODE_ENV=test npx prisma generate

echo -e "Migration completed. Run seed_db next."
exit