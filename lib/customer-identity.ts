export class CustomerIdentityConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CustomerIdentityConflictError"
  }
}

export function assertMatchingCustomerIdentity(options: {
  emailCustomerId?: string | null
  phoneCustomerId?: string | null
}) {
  const emailCustomerId = options.emailCustomerId?.trim() ?? ""
  const phoneCustomerId = options.phoneCustomerId?.trim() ?? ""

  if (emailCustomerId && phoneCustomerId && emailCustomerId !== phoneCustomerId) {
    throw new CustomerIdentityConflictError(
      "Bu e-posta adresi ve telefon numarası farklı müşteri kayıtlarıyla eşleşiyor. Lütfen salon ile iletişime geçin."
    )
  }
}
