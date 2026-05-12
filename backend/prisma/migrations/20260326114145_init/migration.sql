-- CreateTable
CREATE TABLE "map_nodes" (
    "id" TEXT NOT NULL,

    CONSTRAINT "map_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "map_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
