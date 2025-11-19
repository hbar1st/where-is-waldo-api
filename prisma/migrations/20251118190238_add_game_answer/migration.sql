/*
  Warnings:

  - You are about to drop the column `locationX` on the `answer` table. All the data in the column will be lost.
  - You are about to drop the column `locationY` on the `answer` table. All the data in the column will be lost.
  - You are about to drop the column `sceneId` on the `answer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[scene_id,character]` on the table `answer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `location_x` to the `answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location_y` to the `answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scene_id` to the `answer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_sceneId_fkey";

-- DropIndex
DROP INDEX "answer_sceneId_character_key";

-- AlterTable
ALTER TABLE "answer" DROP COLUMN "locationX",
DROP COLUMN "locationY",
DROP COLUMN "sceneId",
ADD COLUMN     "location_x" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "location_y" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "scene_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "game" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL DEFAULT 'anonymous',
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "scene_id" INTEGER NOT NULL,

    CONSTRAINT "game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_answer" (
    "game_id" INTEGER NOT NULL,
    "character" "character" NOT NULL,
    "location_x" DOUBLE PRECISION NOT NULL,
    "location_y" DOUBLE PRECISION NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "game_answer_game_id_character_key" ON "game_answer"("game_id", "character");

-- CreateIndex
CREATE UNIQUE INDEX "answer_scene_id_character_key" ON "answer"("scene_id", "character");

-- AddForeignKey
ALTER TABLE "game" ADD CONSTRAINT "game_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
