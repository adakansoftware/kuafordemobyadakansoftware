ALTER TABLE "AuditLog"
ADD COLUMN "prevHash" TEXT,
ADD COLUMN "entryHash" TEXT;

CREATE UNIQUE INDEX "AuditLog_entryHash_key" ON "AuditLog"("entryHash");
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
