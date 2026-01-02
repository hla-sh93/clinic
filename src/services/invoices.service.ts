import { InvoiceStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import type { TransactionClient } from '@/lib/audit'
import { calculateInvoiceStatus, canTransitionInvoice } from '@/lib/state-machines'

export interface CreateInvoiceInput {
  patientId: string
  visitId: string
  totalAmountSyp: number
}

export async function createInvoiceInTransaction(input: CreateInvoiceInput, actorId: string, tx: TransactionClient) {
  const existingInvoice = await tx.invoice.findUnique({
    where: { visitId: input.visitId }
  })

  if (existingInvoice) {
    throw new Error('Invoice already exists for this visit')
  }

  const invoice = await tx.invoice.create({
    data: {
      patientId: input.patientId,
      visitId: input.visitId,
      totalAmountSyp: input.totalAmountSyp,
      paidAmountSyp: 0,
      status: InvoiceStatus.UNPAID
    },
    include: {
      patient: true,
      visit: {
        include: {
          medicalCase: true,
          dentist: true
        }
      }
    }
  })

  await logAudit(
    {
      actorId,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      after: {
        patientId: invoice.patientId,
        visitId: invoice.visitId,
        totalAmountSyp: invoice.totalAmountSyp.toString(),
        paidAmountSyp: invoice.paidAmountSyp.toString(),
        status: invoice.status
      }
    },
    tx
  )

  return invoice
}

export async function createInvoice(input: CreateInvoiceInput, actorId: string) {
  return prisma.$transaction(async tx => {
    return createInvoiceInTransaction(input, actorId, tx)
  })
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: InvoiceStatus, actorId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (!canTransitionInvoice(invoice.status, newStatus)) {
    throw new Error(`Invalid status transition from ${invoice.status} to ${newStatus}`)
  }

  // VOID status removed from specs - invoices can only be UNPAID, PARTIALLY_PAID, or PAID

  return prisma.$transaction(async tx => {
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus }
    })

    await logAudit(
      {
        actorId,
        action: 'STATUS_CHANGE',
        entityType: 'Invoice',
        entityId: invoiceId,
        before: {
          status: invoice.status,
          totalAmountSyp: invoice.totalAmountSyp.toString(),
          paidAmountSyp: invoice.paidAmountSyp.toString()
        },
        after: {
          status: newStatus,
          totalAmountSyp: invoice.totalAmountSyp.toString(),
          paidAmountSyp: invoice.paidAmountSyp.toString()
        }
      },
      tx
    )

    return updatedInvoice
  })
}

export async function recalculateInvoiceStatus(invoiceId: string, actorId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId }
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const newStatus = calculateInvoiceStatus(invoice.totalAmountSyp.toNumber(), invoice.paidAmountSyp.toNumber())

  if (newStatus !== invoice.status) {
    return prisma.$transaction(async tx => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus }
      })

      await logAudit(
        {
          actorId,
          action: 'STATUS_CHANGE',
          entityType: 'Invoice',
          entityId: invoiceId,
          before: {
            status: invoice.status,
            totalAmountSyp: invoice.totalAmountSyp.toString(),
            paidAmountSyp: invoice.paidAmountSyp.toString()
          },
          after: {
            status: newStatus,
            totalAmountSyp: invoice.totalAmountSyp.toString(),
            paidAmountSyp: invoice.paidAmountSyp.toString()
          }
        },
        tx
      )

      return updatedInvoice
    })
  }

  return invoice
}

export async function getInvoices(filters?: {
  patientId?: string
  status?: InvoiceStatus
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.patientId) {
    where.patientId = filters.patientId
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {}

    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }

    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  return prisma.invoice.findMany({
    where,
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
      },
      _count: {
        select: {
          payments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getInvoiceById(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      patient: true,
      visit: {
        include: {
          appointment: true,
          dentist: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          medicalCase: true
        }
      },
      payments: {
        include: {
          creator: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      }
    }
  })
}

export async function getOutstandingInvoices() {
  return prisma.invoice.findMany({
    where: {
      status: {
        in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID]
      }
    },
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
    },
    orderBy: { createdAt: 'asc' }
  })
}
