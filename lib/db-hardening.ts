export const requiredDbHardeningIndexes = [
  "appointment_staff_active_slot_unique",
  "appointment_customer_active_slot_lookup_idx",
  "payment_tenant_method_paidat_idx",
  "customer_access_code_active_lookup_idx",
  "appointment_cancellation_request_single_pending_unique",
  "appointment_cancellation_request_pending_idx",
  "sale_tenant_payment_createdat_idx",
  "audit_log_tenant_target_createdat_idx",
  "tenant_active_slug_lookup_idx",
] as const

export type RequiredDbHardeningIndex = (typeof requiredDbHardeningIndexes)[number]

export function findMissingDbHardeningIndexes(sql: string) {
  return requiredDbHardeningIndexes.filter((indexName) => !sql.includes(`"${indexName}"`))
}

export function hasSafeCreateIndexGuards(sql: string) {
  return requiredDbHardeningIndexes.every((indexName) =>
    sql.includes(`CREATE INDEX IF NOT EXISTS "${indexName}"`) ||
    sql.includes(`CREATE UNIQUE INDEX IF NOT EXISTS "${indexName}"`)
  )
}
