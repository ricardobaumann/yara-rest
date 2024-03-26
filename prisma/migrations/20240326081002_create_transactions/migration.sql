-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "hazardous" BOOLEAN NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_warehouse_id_idx" ON "Transaction"("warehouse_id");

-- CreateIndex
CREATE INDEX "Transaction_hazardous_idx" ON "Transaction"("hazardous");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
