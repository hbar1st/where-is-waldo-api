/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `scene` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `iconURL` to the `character_name` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "character_name" ADD COLUMN     "iconURL" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "scene_url_key" ON "scene"("url");

-- AddForeignKey
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_character_fkey" FOREIGN KEY ("character") REFERENCES "character_name"("character") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_character_fkey" FOREIGN KEY ("character") REFERENCES "character_name"("character") ON DELETE CASCADE ON UPDATE CASCADE;
