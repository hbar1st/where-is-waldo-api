/*
  Warnings:

  - A unique constraint covering the columns `[id,scene_id]` on the table `game` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "game_id_scene_id_key" ON "game"("id", "scene_id");
