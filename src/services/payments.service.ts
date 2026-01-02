import { InvoiceStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { calculateInvoiceStatus } from '@/lib/state-machines'

export interface CreatePaymentInput {
  invoiceId: string
  amountSyp: number
  method: 'CASH' | 'CARD' | 'TRANSFER'
  paymentDate: Date
}

export async function createPayment(input: CreatePaymentInput, actorId: string) {
  if (input.amountSyp <= 0) {
    throw new Error('Payment amount must be positive')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: {
      payments: true
    }
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new Error('Cannot add payment to fully paid invoice')
  }

  const totalPaid = invoice.paidAmountSyp.toNumber() + input.amountSyp

  if (totalPaid > invoice.totalAmountSyp.toNumber()) {
    throw new Error(
      `Payment amount exceeds invoice balance. Outstanding: ${
        invoice.totalAmountSyp.toNumber() - invoice.paidAmountSyp.toNumber()
      }`
    )
  }

  return prisma.$transaction(async tx => {
    const newPayment = await tx.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amountSyp: input.amountSyp,
        method: input.method,
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
