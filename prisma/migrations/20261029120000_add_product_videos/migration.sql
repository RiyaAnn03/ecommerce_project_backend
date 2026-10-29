-- AlterTable
ALTER TABLE "Product" ADD COLUMN "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
