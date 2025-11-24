#!/bin/bash

# use this file to migrate in sync the test and main databases during development

# Source the .env file
source ./.env

echo -e "Do not exit the program until the cleanup is completed."

echo -e "\033[4m Setup the main db at $DB_NAME for $DB_USER \033[0m"


echo "- DROP all the tables"

PSQL="psql --username=$DB_USER --dbname=$DB_NAME -t -q --no-align -c"
$PSQL "drop table if exists answer,character_name,scene,game,game_answer,session"

echo -e "Cleanup completed. Run seed_db next."
exit