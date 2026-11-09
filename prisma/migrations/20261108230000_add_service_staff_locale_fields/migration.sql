-- AlterTable
ALTER TABLE "Service" ADD COLUMN "titleEn" TEXT,
ADD COLUMN "shortTitleEn" TEXT,
ADD COLUMN "teaserEn" TEXT,
ADD COLUMN "descriptionEn" TEXT,
ADD COLUMN "featuresEn" JSONB;

-- AlterTable
ALTER TABLE "Staff" ADD COLUMN "roleEn" TEXT,
ADD COLUMN "bioEn" TEXT;
