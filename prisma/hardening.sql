CREATE UNIQUE INDEX IF NOT EXISTS "appointment_staff_active_slot_unique"
ON "public"."Appointment" ("tenantId", "staffId", "scheduledDate", "scheduledTime")
WHERE "staffId" IS NOT NULL AND "status" IN ('NEW', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS "appointment_customer_active_slot_lookup_idx"
ON "public"."Appointment" ("tenantId", "customerId", "scheduledDate", "status")
WHERE "status" IN ('NEW', 'CONFIRMED', 'COMPLETED');

CREATE INDEX IF NOT EXISTS "payment_tenant_method_paidat_idx"
ON "public"."Payment" ("tenantId", "method", "paidAt" DESC);

CREATE INDEX IF NOT EXISTS "customer_access_code_active_lookup_idx"
ON "public"."CustomerAccessCode" ("tenantId", "identifier", "expiresAt" DESC)
WHERE "consumedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "appointment_cancellation_request_pending_idx"
ON "public"."AppointmentCancellationRequest" ("tenantId", "appointmentId", "status", "createdAt" DESC)
WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "sale_tenant_payment_createdat_idx"
ON "public"."Sale" ("tenantId", "paymentMethod", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "audit_log_tenant_target_createdat_idx"
ON "public"."AuditLog" ("tenantId", "targetType", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "tenant_active_slug_lookup_idx"
ON "public"."Tenant" ("isActive", "slug");
