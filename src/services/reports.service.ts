import { InvoiceStatus, UserRole } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface ReportFilters {
  startDate?: Date
  endDate?: Date
  dentistId?: string
  patientId?: string
  medicalCaseId?: string
  search?: string
}

export async function getRevenueReport(filters: ReportFilters) {
  const where: any = {}

  if (filters.startDate || filters.endDate) {
    where.paymentDate = {}

    if (filters.startDate) {
      where.paymentDate.gte = filters.startDate
    }

    if (filters.endDate) {
      where.paymentDate.lte = filters.endDate
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
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
          patient: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      }
    },
    orderBy: { paymentDate: 'desc' }
  })

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amountSyp.toNumber(), 0)

  const revenueByDentist = payments.reduce(
    (acc, payment) => {
      const dentistId = payment.invoice.visit.dentist.id
      const dentistName = payment.invoice.visit.dentist.fullName

      if (!acc[dentistId]) {
        acc[dentistId] = {
          dentistId,
          dentistName,
          revenue: 0
        }
      }

      acc[dentistId].revenue += payment.amountSyp.toNumber()

      return acc
    },
    {} as Record<string, { dentistId: string; dentistName: string; revenue: number }>
  )

  return {
    totalRevenue,
    paymentCount: payments.length,
    payments,
    revenueByDentist: Object.values(revenueByDentist)
  }
}

export async function getInventoryExpenses(filters: ReportFilters) {
  const where: any = {
    type: 'IN'
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}

    if (filters.startDate) {
      where.createdAt.gte = filters.startDate
    }

    if (filters.endDate) {
      where.createdAt.lte = filters.endDate
    }
  }

  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: {
      item: {
        select: {
          id: true,
          name: true
        }
      },
      creator: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalExpenses = movements.reduce((sum, movement) => {
    const cost = movement.totalCostSyp ? Number(movement.totalCostSyp) : 0

    return sum + cost
  }, 0)

  return {
    totalExpenses,
    movementCount: movements.length,
    movements
  }
}

export async function getDoctorProfitReport(filters: ReportFilters, requestingUserId: string) {
  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId }
  })

  if (!requestingUser) {
    throw new Error('User not found')
  }

  const where: any = {}

  if (filters.startDate || filters.endDate) {
    where.paymentDate = {}

    if (filters.startDate) {
      where.paymentDate.gte = filters.startDate
    }

    if (filters.endDate) {
      where.paymentDate.lte = filters.endDate
    }
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          visit: {
            include: {
              dentist: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        }
      }
    }
  })

  // Get inventory expenses for the same period
  const inventoryExpensesData = await getInventoryExpenses(filters)
  const inventoryExpenses = inventoryExpensesData.totalExpenses

  const totalRevenueCalc = payments.reduce((sum, payment) => sum + payment.amountSyp.toNumber(), 0)

  // NetProfit = CollectedRevenue - InventoryExpenses (per specification)
  const netProfit = totalRevenueCalc - inventoryExpenses

  const profitShares = await prisma.dentistProfitShare.findMany({
    include: {
      dentist: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  })

  const dentistProfits = profitShares.map(share => {
    const dentistRevenue = payments
      .filter(p => p.invoice.visit.dentistId === share.dentistId)
      .reduce((sum, payment) => sum + payment.amountSyp.toNumber(), 0)

    const dentistNetProfit = dentistRevenue
    const doctorProfit = (dentistNetProfit * share.percentage.toNumber()) / 100

    return {
      dentistId: share.dentistId,
      dentistName: share.dentist.fullName,
      percentage: share.percentage.toNumber(),
      revenue: dentistRevenue,
      netProfit: dentistNetProfit,
      doctorProfit
    }
  })

  // Get deferred receivables
  const outstandingData = await getOutstandingBalancesReport()
  const deferredReceivables = outstandingData.totalOutstanding

  if (requestingUser.role === UserRole.DENTIST) {
    const dentistProfit = dentistProfits.find(p => p.dentistId === requestingUserId)

    // Dentist only sees own data, not clinic-wide totals
    return {
      dentistProfits: dentistProfit ? [dentistProfit] : [],

      // Own deferred from own visits
      ownDeferredReceivables: dentistProfit ? calculateDentistDeferred(requestingUserId, outstandingData.invoices) : 0
    }
  }

  return {
    totalRevenue: totalRevenueCalc,
    inventoryExpenses,
    netProfit,
    deferredReceivables,
    dentistProfits
  }
}

function calculateDentistDeferred(dentistId: string, invoices: any[]): number {
  return invoices
    .filter(inv => inv.visit?.dentistId === dentistId)
    .reduce((sum, inv) => sum + (Number(inv.totalAmountSyp) - Number(inv.paidAmountSyp)), 0)
}

export async function getAppointmentsReport(filters: ReportFilters, requestingUserId?: string) {
  const where: any = {}

  // If requesting user is provided and is a dentist, scope to their appointments
  if (requestingUserId) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId }
    })

    if (requestingUser?.role === UserRole.DENTIST) {
      where.dentistId = requestingUserId
    }
  }

  if (filters.dentistId && !where.dentistId) {
    where.dentistId = filters.dentistId
  }

  if (filters.patientId) {
    where.patientId = filters.patientId
  }

  if (filters.medicalCaseId) {
    where.medicalCaseId = filters.medicalCaseId
  }

  if (filters.startDate || filters.endDate) {
    where.startTime = {}

    if (filters.startDate) {
      where.startTime.gte = filters.startDate
    }

    if (filters.endDate) {
      where.startTime.lte = filters.endDate
    }
  }

  const appointments = await prisma.appointment.findMany({
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
      }
    },
    orderBy: { startTime: 'desc' }
  })

  const statusCounts = appointments.reduce(
    (acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1

      return acc
    },
    {} as Record<string, number>
  )

  return {
    totalAppointments: appointments.length,
    appointments,
    statusCounts
  }
}

export async function getOutstandingBalancesReport() {
  const invoices = await prisma.invoice.findMany({
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

  const totalOutstanding = invoices.reduce(
    (sum, invoice) => sum + (invoice.totalAmountSyp.toNumber() - invoice.paidAmountSyp.toNumber()),
    0
  )

  const outstandingByPatient = invoices.reduce(
    (acc, invoice) => {
      const patientId = invoice.patient.id
      const patientName = invoice.patient.fullName
      const outstanding = invoice.totalAmountSyp.toNumber() - invoice.paidAmountSyp.toNumber()

      if (!acc[patientId]) {
        acc[patientId] = {
          patientId,
          patientName,
          patientPhone: invoice.patient.phone,
          totalOutstanding: 0,
          invoiceCount: 0
        }
      }

      acc[patientId].totalOutstanding += outstanding
      acc[patientId].invoiceCount += 1

      return acc
    },
    {} as Record<
      string,
      {
        patientId: string
        patientName: string
        patientPhone: string | null
        totalOutstanding: number
        invoiceCount: number
      }
    >
  )

  return {
    totalOutstanding,
    invoiceCount: invoices.length,
    invoices,
    outstandingByPatient: Object.values(outstandingByPatient)
  }
}

export async function getInventoryLowStockReport() {
  const items = await prisma.inventoryItem.findMany({
    include: {
      _count: {
        select: {
          movements: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  const lowStockItems = items.filter(item => item.quantity <= item.reorderLevel)

  const totalValue = lowStockItems.reduce((sum, item) => sum + item.quantity * item.unitPrice.toNumber(), 0)

  return {
    totalItems: lowStockItems.length,
    totalValue,
    items: lowStockItems
  }
}

export async function getAuditLogs(filters?: {
  actorId?: string
  entityType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: any = {}

  if (filters?.actorId) {
    where.actorId = filters.actorId
  }

  if (filters?.entityType) {
    where.entityType = filters.entityType
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

  return prisma.auditLog.findMany({
    where,
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters?.limit ?? 100
  })
}
