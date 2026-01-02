import { AppointmentStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { canTransitionAppointment } from '@/lib/state-machines'
import { createVisitInTransaction } from './visits.service'

export interface CreateAppointmentInput {
  patientId: string
  dentistId: string
  medicalCaseId: string
  startTime: Date
  endTime: Date
  basePriceSyp: number
  status?: AppointmentStatus
  notes?: string
}

export interface UpdateAppointmentInput {
  patientId?: string
  dentistId?: string
  medicalCaseId?: string
  startTime?: Date
  endTime?: Date
  basePriceSyp?: number
  status?: AppointmentStatus
  notes?: string
}

export async function checkAppointmentOverlap(
  dentistId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
  const overlappingAppointments = await prisma.appointment.findMany({
    where: {
      dentistId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      status: {
        not: AppointmentStatus.CANCELLED
      },
      OR: [
        {
          AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }]
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }]
        },
        {
          AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }]
        }
      ]
    }
  })

  return overlappingAppointments.length > 0
}

export async function createAppointment(input: CreateAppointmentInput, actorId: string) {
  if (input.endTime <= input.startTime) {
    throw new Error('End time must be after start time')
  }

  const hasOverlap = await checkAppointmentOverlap(input.dentistId, input.startTime, input.endTime)

  if (hasOverlap) {
    throw new Error('Appointment overlaps with existing appointment for this dentist')
  }

  return prisma.$transaction(async tx => {
    const appointment = await tx.appointment.create({
      data: {
        patientId: input.patientId,
        dentistId: input.dentistId,
        medicalCaseId: input.medicalCaseId,
        startTime: input.startTime,
        endTime: input.endTime,
        basePriceSyp: input.basePriceSyp,
        status: input.status ?? AppointmentStatus.SCHEDULED,
        notes: input.notes
      },
      include: {
        patient: true,
        dentist: true,
        medicalCase: true
      }
    })

    await logAudit(
      {
        actorId,
        action: 'CREATE',
        entityType: 'Appointment',
        entityId: appointment.id,
        after: {
          patientId: appointment.patientId,
          dentistId: appointment.dentistId,
          medicalCaseId: appointment.medicalCaseId,
          startTime: appointment.startTime.toISOString(),
          endTime: appointment.endTime.toISOString(),
          basePriceSyp: appointment.basePriceSyp.toString(),
          status: appointment.status
        }
      },
      tx
    )

    return appointment
  })
}

export async function updateAppointment(appointmentId: string, input: UpdateAppointmentInput, actorId: string) {
  const existingAppointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (!existingAppointment) {
    throw new Error('Appointment not found')
  }

  // Prevent editing terminal status appointments (price immutability after visit creation)
  const terminalStatuses: AppointmentStatus[] = [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED]

  if (terminalStatuses.includes(existingAppointment.status)) {
    throw new Error('Cannot edit a completed, cancelled, or no-show appointment')
  }

  if (input.startTime && input.endTime && input.endTime <= input.startTime) {
    throw new Error('End time must be after start time')
  }

  const startTime = input.startTime ?? existingAppointment.startTime
  const endTime = input.endTime ?? existingAppointment.endTime
  const dentistId = input.dentistId ?? existingAppointment.dentistId

  if (input.startTime || input.endTime || input.dentistId) {
    const hasOverlap = await checkAppointmentOverlap(dentistId, startTime, endTime, appointmentId)

    if (hasOverlap) {
      throw new Error('Appointment overlaps with existing appointment for this dentist')
    }
  }

  return prisma.$transaction(async tx => {
    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: input,
      include: {
        patient: true,
        dentist: true,
        medicalCase: true
      }
    })

    await logAudit(
      {
        actorId,
        action: 'UPDATE',
        entityType: 'Appointment',
        entityId: appointmentId,
        before: {
          patientId: existingAppointment.patientId,
          dentistId: existingAppointment.dentistId,
          startTime: existingAppointment.startTime.toISOString(),
          endTime: existingAppointment.endTime.toISOString(),
          basePriceSyp: existingAppointment.basePriceSyp.toString(),
          status: existingAppointment.status
        },
        after: {
          patientId: updatedAppointment.patientId,
          dentistId: updatedAppointment.dentistId,
          startTime: updatedAppointment.startTime.toISOString(),
          endTime: updatedAppointment.endTime.toISOString(),
          basePriceSyp: updatedAppointment.basePriceSyp.toString(),
          status: updatedAppointment.status
        }
      },
      tx
    )

    return updatedAppointment
  })
}

export interface CompleteAppointmentData {
  notes?: string
  paidAmountSyp?: number
  discountType?: 'NONE' | 'PERCENT' | 'FIXED'
  discountValue?: number
}

export async function changeAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  actorId: string,
  options?: {
    cancellationReason?: 'NO_SHOW' | 'PATIENT_CANCELLED' | 'CLINIC_CANCELLED'
    completeData?: CompleteAppointmentData
  }
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      dentist: true,
      medicalCase: true
    }
  })

  if (!appointment) {
    throw new Error('Appointment not found')
  }

  if (!canTransitionAppointment(appointment.status, newStatus)) {
    throw new Error(`Invalid status transition from ${appointment.status} to ${newStatus}`)
  }

  // إذا كانت الحالة الجديدة CANCELLED، يجب توفير سبب الإلغاء
  if (newStatus === AppointmentStatus.CANCELLED && !options?.cancellationReason) {
    throw new Error('Cancellation reason is required when cancelling an appointment')
  }

  return prisma.$transaction(async tx => {
    // تحديث ملاحظات الموعد إذا تم توفيرها
    const appointmentNotes = newStatus === AppointmentStatus.COMPLETED ? options?.completeData?.notes : undefined

    const updatedAppointment = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: newStatus,
        cancellationReason: newStatus === AppointmentStatus.CANCELLED ? options?.cancellationReason : null,
        notes: appointmentNotes !== undefined ? appointmentNotes : appointment.notes
      }
    })

    await logAudit(
      {
        actorId,
        action: 'STATUS_CHANGE',
        entityType: 'Appointment',
        entityId: appointmentId,
        before: {
          status: appointment.status,
          patientId: appointment.patientId,
          dentistId: appointment.dentistId
        },
        after: {
          status: newStatus,
          patientId: appointment.patientId,
          dentistId: appointment.dentistId
        }
      },
      tx
    )

    if (newStatus === AppointmentStatus.COMPLETED) {
      const basePriceSyp = Number(appointment.basePriceSyp)
      const discountType = options?.completeData?.discountType || 'NONE'
      const discountValue = options?.completeData?.discountValue || 0

      // حساب السعر النهائي بعد الخصم
      let finalPriceSyp = basePriceSyp

      if (discountType === 'PERCENT' && discountValue > 0) {
        finalPriceSyp = basePriceSyp - (basePriceSyp * discountValue) / 100
      } else if (discountType === 'FIXED' && discountValue > 0) {
        finalPriceSyp = basePriceSyp - discountValue
      }

      finalPriceSyp = Math.max(0, finalPriceSyp) // لا يمكن أن يكون سالباً

      const visit = await createVisitInTransaction(
        {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          dentistId: appointment.dentistId,
          medicalCaseId: appointment.medicalCaseId,
          basePriceSyp,
          finalPriceSyp,
          discountType,
          discountValue,
          notes: options?.completeData?.notes
        },
        actorId,
        tx
      )

      // إذا تم دفع مبلغ، نسجله كدفعة
      const paidAmount = options?.completeData?.paidAmountSyp || 0

      if (paidAmount > 0 && visit.invoice) {
        await tx.payment.create({
          data: {
            invoiceId: visit.invoice.id,
            amountSyp: paidAmount,
            method: 'CASH',
            paymentDate: new Date(),
            createdBy: actorId
          }
        })

        // تحديث المبلغ المدفوع في الفاتورة
        const newPaidAmount = paidAmount
        const newStatus = newPaidAmount >= finalPriceSyp ? 'PAID' : 'PARTIALLY_PAID'

        await tx.invoice.update({
          where: { id: visit.invoice.id },
          data: {
            paidAmountSyp: newPaidAmount,
            status: newStatus
          }
        })

        await logAudit(
          {
            actorId,
            action: 'PAYMENT_CREATE',
            entityType: 'Payment',
            entityId: visit.invoice.id,
            after: {
              invoiceId: visit.invoice.id,
              amountSyp: paidAmount.toString(),
              method: 'CASH'
            }
          },
          tx
        )
      }
    }

    return updatedAppointment
  })
}

export async function getAppointments(filters?: {
  dentistId?: string
  patientId?: string
  startDate?: Date
  endDate?: Date
  status?: AppointmentStatus
}) {
  const where: any = {}

  if (filters?.dentistId) {
    where.dentistId = filters.dentistId
  }

  if (filters?.patientId) {
    where.patientId = filters.patientId
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {}

    if (filters.startDate) {
      where.startTime.gte = filters.startDate
    }

    if (filters.endDate) {
      where.startTime.lte = filters.endDate
    }
  }

  return prisma.appointment.findMany({
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
}

export async function getAppointmentById(appointmentId: string) {
  return prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: true,
      dentist: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      medicalCase: true,
      visit: {
        include: {
          invoice: true
        }
      }
    }
  })
}
