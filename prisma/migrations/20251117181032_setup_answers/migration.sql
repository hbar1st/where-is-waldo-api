/*
  Warnings:

  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Character" AS ENUM ('ODLAW', 'WALDO', 'WIZARD_WHITEBEARD');

-- DropTable
DROP TABLE "Session";

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scene" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "scene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "sceneId" INTEGER NOT NULL,
    "character" "Character" NOT NULL,
    "locationX" INTEGER NOT NULL,
    "locationY" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "CharacterName" (
    "character" "Character" NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "session_sid_key" ON "session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sceneId_character_key" ON "Answer"("sceneId", "character");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterName_character_key" ON "CharacterName"("character");

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
