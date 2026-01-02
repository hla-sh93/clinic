import { Gender, MaritalStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export interface CreatePatientInput {
  fullName: string
  phone: string
  gender?: Gender
  maritalStatus?: MaritalStatus
  dateOfBirth?: Date | null
  notes?: string
  isActive?: boolean
}

export interface UpdatePatientInput {
  fullName?: string
  phone?: string
  gender?: Gender
  maritalStatus?: MaritalStatus
  dateOfBirth?: Date | null
  notes?: string | null
  isActive?: boolean
}

export async function createPatient(input: CreatePatientInput, actorId: string) {
  return prisma.$transaction(async tx => {
    const patient = await tx.patient.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        gender: input.gender ?? Gender.UNSPECIFIED,
        maritalStatus: input.maritalStatus ?? MaritalStatus.UNSPECIFIED,
        dateOfBirth: input.dateOfBirth,
        notes: input.notes,
        isActive: input.isActive ?? true
      }
    })

    await logAudit(
      {
        actorId,
        action: 'CREATE',
        entityType: 'Patient',
        entityId: patient.id,
        after: {
          fullName: patient.fullName,
          phone: patient.phone,
          gender: patient.gender,
          maritalStatus: patient.maritalStatus,
          isActive: patient.isActive
        }
      },
      tx
    )

    return patient
  })
}

export async function updatePatient(patientId: string, input: UpdatePatientInput, actorId: string) {
  const existingPatient = await prisma.patient.findUnique({
    where: { id: patientId }
  })

  if (!existingPatient) {
    throw new Error('Patient not found')
  }

  return prisma.$transaction(async tx => {
    const updatedPatient = await tx.patient.update({
      where: { id: patientId },
      data: input
    })

    await logAudit(
      {
        actorId,
        action: 'UPDATE',
        entityType: 'Patient',
        entityId: patientId,
        before: {
          fullName: existingPatient.fullName,
          phone: existingPatient.phone,
          gender: existingPatient.gender,
          maritalStatus: existingPatient.maritalStatus,
          isActive: existingPatient.isActive
        },
        after: {
          fullName: updatedPatient.fullName,
          phone: updatedPatient.phone,
          gender: updatedPatient.gender,
          maritalStatus: updatedPatient.maritalStatus,
          isActive: updatedPatient.isActive
        }
      },
      tx
    )

    return updatedPatient
  })
}

export async function getPatients(search?: string) {
  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } }
        ]
      }
    : {}

  return prisma.patient.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPatientById(patientId: string) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
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
        },
        orderBy: { startTime: 'desc' },
        take: 10
      },
      invoices: {
        include: {
          visit: {
            include: {
              medicalCase: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })
}

export async function canDeletePatient(patientId: string): Promise<{ canDelete: boolean; reason?: string }> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      _count: {
        select: {
          visits: true,
          invoices: true,
          appointments: true
        }
      }
    }
  })

  if (!patient) {
    return { canDelete: false, reason: 'Patient not found' }
  }

  if (patient._count.visits > 0) {
    return { canDelete: false, reason: `Patient has ${patient._count.visits} visit(s) and cannot be deleted` }
  }

  if (patient._count.invoices > 0) {
    return { canDelete: false, reason: `Patient has ${patient._count.invoices} invoice(s) and cannot be deleted` }
  }

  return { canDelete: true }
}

export async function deletePatient(patientId: string, actorId: string) {
  const { canDelete, reason } = await canDeletePatient(patientId)

  if (!canDelete) {
    throw new Error(reason || 'Cannot delete patient')
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  })

  if (!patient) {
    throw new Error('Patient not found')
  }

  return prisma.$transaction(async tx => {
    // Delete any appointments first (only if no visits/invoices exist)
    await tx.appointment.deleteMany({
      where: { patientId }
    })

    // Delete the patient
    await tx.patient.delete({
      where: { id: patientId }
    })

    await logAudit(
      {
        actorId,
        action: 'DELETE',
        entityType: 'Patient',
        entityId: patientId,
        before: {
          fullName: patient.fullName,
          phone: patient.phone,
          gender: patient.gender,
          maritalStatus: patient.maritalStatus,
          isActive: patient.isActive
        }
      },
      tx
    )

    return patient
  })
}
