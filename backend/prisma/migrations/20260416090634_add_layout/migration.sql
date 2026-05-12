/*
  Warnings:

  - Added the required column `layout` to the `maps` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "maps" ADD COLUMN     "layout" TEXT NOT NULL;
