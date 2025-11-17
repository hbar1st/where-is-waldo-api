/*
  Warnings:

  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CharacterName` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "character" AS ENUM ('ODLAW', 'WALDO', 'WIZARD_WHITEBEARD');

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_sceneId_fkey";

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "CharacterName";

-- DropEnum
DROP TYPE "Character";

-- CreateTable
CREATE TABLE "answer" (
    "sceneId" INTEGER NOT NULL,
    "character" "character" NOT NULL,
    "locationX" INTEGER NOT NULL,
    "locationY" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "character_name" (
    "character" "character" NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "answer_sceneId_character_key" ON "answer"("sceneId", "character");

-- CreateIndex
CREATE UNIQUE INDEX "character_name_character_key" ON "character_name"("character");

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
