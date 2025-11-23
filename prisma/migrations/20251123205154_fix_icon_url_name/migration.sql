/*
  Warnings:

  - You are about to drop the column `iconURL` on the `character_name` table. All the data in the column will be lost.
  - Added the required column `icon_url` to the `character_name` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "character_name" DROP COLUMN "iconURL",
ADD COLUMN     "icon_url" TEXT NOT NULL;
