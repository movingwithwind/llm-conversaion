/*
  Warnings:

  - The primary key for the `map_nodes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `map_nodes` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `node_id` on the `messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_node_id_fkey";

-- AlterTable
ALTER TABLE "map_nodes" DROP CONSTRAINT "map_nodes_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "map_nodes_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "node_id",
ADD COLUMN     "node_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
