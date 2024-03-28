-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "sizePerUnit" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 100;
