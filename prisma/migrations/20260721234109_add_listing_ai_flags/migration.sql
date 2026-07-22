-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "aiFlagReason" TEXT,
ADD COLUMN     "aiFlagged" BOOLEAN NOT NULL DEFAULT false;
