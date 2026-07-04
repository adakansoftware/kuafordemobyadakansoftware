export type AdminSessionRevocationState = {
  sessionCreatedAt: Date
  sessionRevokedAt?: Date | null
}

export function isAdminSessionRevoked(state: AdminSessionRevocationState) {
  return Boolean(state.sessionRevokedAt && state.sessionCreatedAt.getTime() <= state.sessionRevokedAt.getTime())
}
