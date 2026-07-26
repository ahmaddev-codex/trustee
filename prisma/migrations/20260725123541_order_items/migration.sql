-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "priceKobo" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_orderId_listingId_key" ON "order_items"("orderId", "listingId");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: one OrderItem per existing Order, reusing Order.id as the item's
-- id (safe/unique - every existing order had exactly one listing).
INSERT INTO "order_items" ("id", "orderId", "listingId", "priceKobo", "createdAt")
SELECT "id", "id", "listingId", "amountKobo", now() FROM "orders";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_listingId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "listingId";
