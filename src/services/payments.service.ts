import { InvoiceStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { calculateInvoiceStatus } from '@/lib/state-machines'

export interface CreatePaymentInput {
  invoiceId: string
  amountSyp: number
  paymentDate: Date
}

export async function createPayment(input: CreatePaymentInput, actorId: string) {
  if (input.amountSyp <= 0) {
    throw new Error('مبلغ الدفعة يجب أن يكون أكبر من صفر')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: {
      payments: true
    }
  })

  if (!invoice) {
    throw new Error('الفاتورة غير موجودة')
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error('لا يمكن إضافة دفعة لفاتورة مدفوعة بالكامل')
  }

  const totalPaid = invoice.paidAmountSyp.toNumber() + input.amountSyp
  const outstanding = invoice.totalAmountSyp.toNumber() - invoice.paidAmountSyp.toNumber()

  if (totalPaid > invoice.totalAmountSyp.toNumber()) {
    throw new Error(`مبلغ الدفعة يتجاوز المبلغ المتبقي. المتبقي: ${outstanding.toLocaleString('ar-SY')} ل.س`)
  }

  return prisma.$transaction(async tx => {
    const newPayment = await tx.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amountSyp: input.amountSyp,
        method: 'CASH',
        paymentDate: input.paymentDate,
        createdBy: actorId
      },
      include: {
        invoice: {
          include: {
            patient: true,
            visit: {
              include: {
                dentist: true,
                medicalCase: true
              }
            }
          }
        },
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    await logAudit(
      {
        actorId,
        action: 'PAYMENT_CREATE',
        entityType: 'Payment',
        entityId: newPayment.id,
        after: {
          invoiceId: newPayment.invoiceId,
          amountSyp: newPayment.amountSyp.toString(),
          paymentDate: newPayment.paymentDate.toISOString()
        }
      },
      tx
    )

    const updatedInvoice = await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmountSyp: {
          increment: input.amountSyp
        }
      }
    })

    const newStatus = calculateInvoiceStatus(
      updatedInvoice.totalAmountSyp.toNumber(),
      updatedInvoice.paidAmountSyp.toNumber()
    )

    if (newStatus !== invoice.status) {
      await tx.invoice.update({
        where: { id: input.invoiceId },
        data: { status: newStatus }
      })

      await logAudit(
        {
          actorId,
          action: 'STATUS_CHANGE',
          entityType: 'Invoice',
          entityId: input.invoiceId,
          before: {
            status: invoice.status,
            paidAmountSyp: invoice.paidAmountSyp.toString()
          },
          after: {
            status: newStatus,
            paidAmountSyp: updatedInvoice.paidAmountSyp.toString()
          }
        },
        tx
      )
    }

    return newPayment
  })
}

export async function getPayments(filters?: { invoiceId?: string; startDate?: Date; endDate?: Date }) {
  const where: any = {}

  if (filters?.invoiceId) {
    where.invoiceId = filters.invoiceId
  }

  if (filters?.startDate || filters?.endDate) {
    where.paymentDate = {}

    if (filters.startDate) {
      where.paymentDate.gte = filters.startDate
    }

    if (filters.endDate) {
      where.paymentDate.lte = filters.endDate
    }
  }

  return prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          patient: {
            select: {
              id: true,
              fullName: true,
              phone: true
            }
          },
          visit: {
            include: {
              dentist: {
                select: {
                  id: true,
                  fullName: true
                }
              },
              medicalCase: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: { paymentDate: 'desc' }
  })
}

export async function getPaymentById(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          patient: true,
          visit: {
            include: {
              dentist: {
                select: {
                  id: true,
                  fullName: true
                }
              },
              medicalCase: true
            }
          }
        }
      },
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  })
}

export async function voidPayment(paymentId: string, reason: string, actorId: string) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('سبب الإلغاء مطلوب')
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: true
    }
  })

  if (!payment) {
    throw new Error('الدفعة غير موجودة')
  }

  if ((payment as any).status === 'VOIDED') {
    throw new Error('الدفعة ملغاة مسبقاً')
  }

  return prisma.$transaction(async tx => {
    // Void the payment
    const voidedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'VOIDED',
        voidReason: reason.trim(),
        voidedAt: new Date()
      }
    })

    // Recalculate invoice paid amount (excluding voided payments)
    const activePayments = await tx.payment.findMany({
      where: {
        invoiceId: payment.invoiceId,
        status: 'ACTIVE'
      }
    })

    const newPaidAmount = activePayments.reduce((sum, p) => sum + (p as any).amountSyp.toNumber(), 0)

    // Update invoice
    const invoice = payment.invoice

    const newStatus = calculateInvoiceStatus((invoice as any).totalAmountSyp.toNumber(), newPaidAmount)

    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        paidAmountSyp: newPaidAmount,
        status: newStatus
      }
    })

    // Audit log
    await logAudit(
      {
        actorId,
        action: 'PAYMENT_VOIDED',
        entityType: 'Payment',
        entityId: paymentId,
        before: {
          status: 'ACTIVE',
          amountSyp: (payment as any).amountSyp.toString()
        },
        after: {
          status: 'VOIDED',
          voidReason: reason.trim(),
          amountSyp: (payment as any).amountSyp.toString()
        }
      },
      tx
    )

    return voidedPayment
  })
}
