/*
  Warnings:

  - You are about to drop the column `position_x` on the `nodes` table. All the data in the column will be lost.
  - You are about to drop the column `position_y` on the `nodes` table. All the data in the column will be lost.
  - Added the required column `position` to the `nodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nodes" DROP COLUMN "position_x",
DROP COLUMN "position_y",
ADD COLUMN     "position" JSONB NOT NULL;
