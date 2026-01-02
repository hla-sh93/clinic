import { AppointmentStatus, InvoiceStatus } from '@prisma/client'

// حسب المواصفات Phase 1:
// SCHEDULED → COMPLETED (Manager only)
// SCHEDULED → CANCELLED (Manager only, requires reason)
// NO_SHOW هو سبب إلغاء وليس حالة منفصلة
export const appointmentTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.SCHEDULED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: []
}

// حسب المواصفات Phase 1:
// Invoice status is derived from payments
// UNPAID → PARTIALLY_PAID (payment added)
// UNPAID → PAID (full payment)
// PARTIALLY_PAID → PAID (remaining payment)
// PAID → PARTIALLY_PAID (payment voided)
// PARTIALLY_PAID → UNPAID (all payments voided)
export const invoiceTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.UNPAID]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.UNPAID],
  [InvoiceStatus.PAID]: [InvoiceStatus.PARTIALLY_PAID]
}

export function canTransitionAppointment(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
  return appointmentTransitions[currentStatus]?.includes(newStatus) ?? false
}

export function canTransitionInvoice(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): boolean {
  return invoiceTransitions[currentStatus]?.includes(newStatus) ?? false
}

export function calculateInvoiceStatus(totalAmount: number, paidAmount: number): InvoiceStatus {
  if (paidAmount === 0) {
    return InvoiceStatus.UNPAID
  }
  if (paidAmount >= totalAmount) {
    return InvoiceStatus.PAID
  }
  return InvoiceStatus.PARTIALLY_PAID
}

export function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
  return status === AppointmentStatus.COMPLETED || status === AppointmentStatus.CANCELLED
}

export function isTerminalInvoiceStatus(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAID
}
