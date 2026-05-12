/*
  Warnings:

  - Added the required column `agent_id` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "agent_id" TEXT NOT NULL;
