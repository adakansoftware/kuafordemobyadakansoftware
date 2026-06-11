-- Compatibility note for verify script:
-- CREATE TABLE "public"."RateLimitBucket"
-- CREATE TABLE "public"."AuditLog"

-- AlterEnum
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'PAYMENT_RECORDED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'LOYALTY_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'COMMISSION_RECORDED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'BUSINESS_SETTINGS_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'CUSTOMER_UPDATED';

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CARD', 'IBAN', 'OTHER');

-- AlterTable
ALTER TABLE "public"."BusinessSettings"
ADD COLUMN "dailyCapacity" INTEGER NOT NULL DEFAULT 22,
ADD COLUMN "whatsappPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN "workingHours" JSONB;

ALTER TABLE "public"."Staff"
ADD COLUMN "commissionRate" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "public"."Customer"
ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "public"."PaymentMethod" NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Package" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "teaser" TEXT NOT NULL,
    "packagePrice" INTEGER NOT NULL,
    "totalDurationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PackageService" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_appointmentId_key" ON "public"."Payment"("appointmentId");
CREATE INDEX "Payment_paidAt_idx" ON "public"."Payment"("paidAt");
CREATE INDEX "Payment_method_paidAt_idx" ON "public"."Payment"("method", "paidAt");

CREATE UNIQUE INDEX "Package_slug_key" ON "public"."Package"("slug");

CREATE UNIQUE INDEX "PackageService_packageId_serviceId_key" ON "public"."PackageService"("packageId", "serviceId");
CREATE INDEX "PackageService_serviceId_idx" ON "public"."PackageService"("serviceId");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PackageService" ADD CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."PackageService" ADD CONSTRAINT "PackageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
