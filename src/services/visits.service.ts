import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import type { TransactionClient } from '@/lib/audit'
import { createInvoiceInTransaction } from './invoices.service'

export interface CreateVisitInput {
  appointmentId: string
  patientId: string
  dentistId: string
  medicalCaseId: string
  basePriceSyp: number
  finalPriceSyp: number
  discountType?: 'NONE' | 'PERCENT' | 'FIXED'
  discountValue?: number
  notes?: string
}

export async function createVisitInTransaction(input: CreateVisitInput, actorId: string, tx: TransactionClient) {
  const existingVisit = await tx.visit.findUnique({
    where: { appointmentId: input.appointmentId }
  })

  if (existingVisit) {
    throw new Error('Visit already exists for this appointment')
  }

  const visit = await tx.visit.create({
    data: {
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      dentistId: input.dentistId,
      medicalCaseId: input.medicalCaseId,
      basePriceSyp: input.basePriceSyp,
      discountType: input.discountType ?? 'NONE',
      discountValue: input.discountValue ?? 0,
      finalPriceSyp: input.finalPriceSyp,
      notes: input.notes
    },
    include: {
      appointment: true,
      patient: true,
      dentist: true,
      medicalCase: true
    }
  })

  await logAudit(
    {
      actorId,
      action: 'CREATE',
      entityType: 'Visit',
      entityId: visit.id,
      after: {
        appointmentId: visit.appointmentId,
        patientId: visit.patientId,
        dentistId: visit.dentistId,
        medicalCaseId: visit.medicalCaseId,
        basePriceSyp: visit.basePriceSyp.toString(),
        finalPriceSyp: visit.finalPriceSyp.toString(),
        discountType: visit.discountType,
        discountValue: visit.discountValue.toString()
      }
    },
    tx
  )

  const invoice = await createInvoiceInTransaction(
    {
      patientId: visit.patientId,
      visitId: visit.id,
      totalAmountSyp: Number(visit.finalPriceSyp)
    },
    actorId,
    tx
  )

  return { ...visit, invoice }
}

export async function createVisit(input: CreateVisitInput, actorId: string) {
  return prisma.$transaction(async tx => {
    return createVisitInTransaction(input, actorId, tx)
  })
}

export async function getVisits(filters?: {
  dentistId?: string
  patientId?: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.dentistId) {
    where.dentistId = filters.dentistId
  }

  if (filters?.patientId) {
    where.patientId = filters.patientId
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

  return prisma.visit.findMany({
    where,
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          phone: true
        }
      },
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
      },
      invoice: {
        select: {
          id: true,
          status: true,
          totalAmountSyp: true,
          paidAmountSyp: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getVisitById(visitId: string) {
  return prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      appointment: true,
      patient: true,
      dentist: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      medicalCase: true,
      invoice: {
        include: {
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
      }
    }
  })
}
