#!/bin/bash

# use this file to migrate in sync the test and main databases during development

# Source the .env file
source ./.env

echo "** setup the main db at $DATABASE_URL"

npx prisma db push

npx prisma generate

NODE_ENV=test

echo "** setup the test db at $TEST_DATABASE_URL"


npx prisma db push

npm run test:reset
