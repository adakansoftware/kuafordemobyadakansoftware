/*
  Warnings:

  - Made the column `tenantId` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `BusinessSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Package` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Staff` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Appointment_customerId_scheduledDate_scheduledTime_idx";

-- DropIndex
DROP INDEX "public"."Appointment_scheduledDate_scheduledTime_idx";

-- DropIndex
DROP INDEX "public"."Appointment_staffId_scheduledDate_scheduledTime_idx";

-- DropIndex
DROP INDEX "public"."Customer_email_key";

-- DropIndex
DROP INDEX "public"."Customer_phone_key";

-- DropIndex
DROP INDEX "public"."Package_slug_key";

-- DropIndex
DROP INDEX "public"."Service_slug_key";

-- DropIndex
DROP INDEX "public"."Staff_name_key";

-- AlterTable
ALTER TABLE "public"."Appointment" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."BusinessSettings" ALTER COLUMN "whatsappPhone" DROP DEFAULT,
ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Customer" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Package" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Payment" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Service" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Staff" ALTER COLUMN "tenantId" SET NOT NULL;
