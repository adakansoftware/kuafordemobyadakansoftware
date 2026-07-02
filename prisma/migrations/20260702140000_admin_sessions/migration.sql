CREATE TABLE "public"."AdminSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgentHash" TEXT NOT NULL,
    "acceptLanguageHash" TEXT NOT NULL,
    "ipContextHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "public"."AdminSession"("tokenHash");
CREATE INDEX "AdminSession_tenantId_expiresAt_idx" ON "public"."AdminSession"("tenantId", "expiresAt");
CREATE INDEX "AdminSession_adminUserId_expiresAt_idx" ON "public"."AdminSession"("adminUserId", "expiresAt");
CREATE INDEX "AdminSession_revokedAt_expiresAt_idx" ON "public"."AdminSession"("revokedAt", "expiresAt");

ALTER TABLE "public"."AdminSession" ADD CONSTRAINT "AdminSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."AdminSession" ADD CONSTRAINT "AdminSession_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
