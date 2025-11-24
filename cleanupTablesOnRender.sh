#!/bin/bash

# use this file to migrate in sync the test and main databases during development

# Source the .env file
source ./.env

echo -e "Do not exit the program until the cleanup is completed."

echo -e "\033[4m Setup the main db at $PROD_DATABASE_URL for $DB_USER \033[0m"


echo "- DROP all the tables"

PSQL="PGPASSWORD=Lf4d9DlWvoxtglkMjrVim7K1Wkzle0ER psql -h dpg-d4i6sfodl3ps73a5nvj0-a.virginia-postgres.render.com -U hbar1st waldo_oqwt -t -q --no-align -c"
$PSQL "drop table if exists answer,character_name,scene,game,game_answer,session"

echo -e "Cleanup completed. Run seed_db next."
exit