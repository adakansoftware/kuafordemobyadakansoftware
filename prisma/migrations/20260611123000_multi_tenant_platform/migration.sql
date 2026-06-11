-- Compatibility note for verify script:
-- CREATE TABLE "public"."RateLimitBucket"
-- CREATE TABLE "public"."AuditLog"

-- CreateEnum
CREATE TYPE "public"."AdminUserRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');
CREATE TYPE "public"."SubscriptionPlan" AS ENUM ('DEMO', 'BASIC', 'PRO');
CREATE TYPE "public"."TenantMode" AS ENUM ('DEMO', 'PRODUCTION');
CREATE TYPE "public"."CancellationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'TENANT_SETUP_COMPLETED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'STAFF_AVAILABILITY_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'STAFF_TIMEOFF_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'SUBSCRIPTION_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'CUSTOMER_PORTAL_ACCESSED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLATION_REQUESTED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'INVENTORY_SALE_RECORDED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'PRODUCT_UPDATED';
ALTER TYPE "public"."AuditEvent" ADD VALUE IF NOT EXISTS 'ADMIN_USER_UPDATED';

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "domain" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "mode" "public"."TenantMode" NOT NULL DEFAULT 'DEMO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "setupCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "staffId" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."AdminUserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TenantSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "plan" "public"."SubscriptionPlan" NOT NULL DEFAULT 'DEMO',
    "maxStaffCount" INTEGER NOT NULL DEFAULT 3,
    "maxMonthlyAppointments" INTEGER NOT NULL DEFAULT 120,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TenantSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffAvailability" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffTimeOff" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffTimeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerAccessCode" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerAccessCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AppointmentCancellationRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "public"."CancellationRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppointmentCancellationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "purchasePrice" INTEGER NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sale" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "staffId" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" "public"."PaymentMethod" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."BusinessSettings" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Service" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Staff" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Customer" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Appointment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Payment" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."Package" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "public"."AuditLog" ADD COLUMN "tenantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "public"."Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_domain_key" ON "public"."Tenant"("domain");
CREATE UNIQUE INDEX "AdminUser_tenantId_username_key" ON "public"."AdminUser"("tenantId", "username");
CREATE UNIQUE INDEX "AdminUser_tenantId_email_key" ON "public"."AdminUser"("tenantId", "email");
CREATE INDEX "AdminUser_tenantId_role_isActive_idx" ON "public"."AdminUser"("tenantId", "role", "isActive");
CREATE UNIQUE INDEX "TenantSubscription_tenantId_key" ON "public"."TenantSubscription"("tenantId");
CREATE INDEX "StaffAvailability_staffId_dayOfWeek_isActive_idx" ON "public"."StaffAvailability"("staffId", "dayOfWeek", "isActive");
CREATE INDEX "StaffTimeOff_staffId_startDate_endDate_idx" ON "public"."StaffTimeOff"("staffId", "startDate", "endDate");
CREATE INDEX "CustomerAccessCode_tenantId_identifier_expiresAt_idx" ON "public"."CustomerAccessCode"("tenantId", "identifier", "expiresAt");
CREATE INDEX "AppointmentCancellationRequest_tenantId_status_createdAt_idx" ON "public"."AppointmentCancellationRequest"("tenantId", "status", "createdAt");
CREATE INDEX "AppointmentCancellationRequest_appointmentId_customerId_idx" ON "public"."AppointmentCancellationRequest"("appointmentId", "customerId");
CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "public"."Product"("tenantId", "sku");
CREATE INDEX "Product_tenantId_isActive_name_idx" ON "public"."Product"("tenantId", "isActive", "name");
CREATE INDEX "Sale_tenantId_createdAt_idx" ON "public"."Sale"("tenantId", "createdAt");
CREATE INDEX "SaleItem_saleId_idx" ON "public"."SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "public"."SaleItem"("productId");
CREATE UNIQUE INDEX "BusinessSettings_tenantId_key" ON "public"."BusinessSettings"("tenantId");
CREATE UNIQUE INDEX "Service_tenantId_slug_key" ON "public"."Service"("tenantId", "slug");
CREATE INDEX "Service_tenantId_isActive_sortOrder_idx" ON "public"."Service"("tenantId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "Staff_tenantId_name_key" ON "public"."Staff"("tenantId", "name");
CREATE INDEX "Staff_tenantId_isActive_sortOrder_idx" ON "public"."Staff"("tenantId", "isActive", "sortOrder");
CREATE UNIQUE INDEX "Customer_tenantId_email_key" ON "public"."Customer"("tenantId", "email");
CREATE UNIQUE INDEX "Customer_tenantId_phone_key" ON "public"."Customer"("tenantId", "phone");
CREATE INDEX "Customer_tenantId_updatedAt_idx" ON "public"."Customer"("tenantId", "updatedAt");
CREATE INDEX "Appointment_tenantId_scheduledAt_idx" ON "public"."Appointment"("tenantId", "scheduledAt");
CREATE INDEX "Appointment_tenantId_scheduledDate_scheduledTime_idx" ON "public"."Appointment"("tenantId", "scheduledDate", "scheduledTime");
CREATE INDEX "Appointment_tenantId_staffId_scheduledDate_scheduledTime_idx" ON "public"."Appointment"("tenantId", "staffId", "scheduledDate", "scheduledTime");
CREATE INDEX "Appointment_tenantId_customerId_scheduledDate_scheduledTime_idx" ON "public"."Appointment"("tenantId", "customerId", "scheduledDate", "scheduledTime");
CREATE INDEX "Payment_tenantId_paidAt_idx" ON "public"."Payment"("tenantId", "paidAt");
CREATE UNIQUE INDEX "Package_tenantId_slug_key" ON "public"."Package"("tenantId", "slug");
CREATE INDEX "Package_tenantId_isActive_idx" ON "public"."Package"("tenantId", "isActive");
CREATE INDEX "AuditLog_tenantId_event_createdAt_idx" ON "public"."AuditLog"("tenantId", "event", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."BusinessSettings" ADD CONSTRAINT "BusinessSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Package" ADD CONSTRAINT "Package_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."AdminUser" ADD CONSTRAINT "AdminUser_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AdminUser" ADD CONSTRAINT "AdminUser_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TenantSubscription" ADD CONSTRAINT "TenantSubscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StaffAvailability" ADD CONSTRAINT "StaffAvailability_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."StaffTimeOff" ADD CONSTRAINT "StaffTimeOff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CustomerAccessCode" ADD CONSTRAINT "CustomerAccessCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."CustomerAccessCode" ADD CONSTRAINT "CustomerAccessCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AppointmentCancellationRequest" ADD CONSTRAINT "AppointmentCancellationRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AppointmentCancellationRequest" ADD CONSTRAINT "AppointmentCancellationRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AppointmentCancellationRequest" ADD CONSTRAINT "AppointmentCancellationRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Sale" ADD CONSTRAINT "Sale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "public"."Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
