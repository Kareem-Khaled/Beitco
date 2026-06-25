-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "removed_at" TIMESTAMP(3),
ADD COLUMN     "removed_by_id" TEXT,
ADD COLUMN     "removed_reason" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "removed_at" TIMESTAMP(3),
ADD COLUMN     "removed_by_id" TEXT,
ADD COLUMN     "removed_reason" TEXT;
