import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export interface CreateMedicalCaseInput {
  name: string
  nameAr?: string | null
  defaultPrice: number
  isActive?: boolean
}

export interface UpdateMedicalCaseInput {
  name?: string
  nameAr?: string | null
  defaultPrice?: number
  isActive?: boolean
}

export async function createMedicalCase(input: CreateMedicalCaseInput, actorId: string) {
  // Check for unique name (case-insensitive)
  const allCases = await prisma.medicalCase.findMany({
    select: { name: true }
  })

  const nameExists = allCases.some(c => c.name.toLowerCase() === input.name.toLowerCase())

  if (nameExists) {
    throw new Error('A medical case with this name already exists')
  }

  return prisma.$transaction(async tx => {
    const medicalCase = await tx.medicalCase.create({
      data: {
        name: input.name,
        nameAr: input.nameAr,
        defaultPrice: input.defaultPrice,
        isActive: input.isActive ?? true
      }
    })

    await logAudit(
      {
        actorId,
        action: 'CREATE',
        entityType: 'MedicalCase',
        entityId: medicalCase.id,
        after: {
          name: medicalCase.name,
          nameAr: medicalCase.nameAr,
          defaultPrice: medicalCase.defaultPrice.toString(),
          isActive: medicalCase.isActive
        }
      },
      tx
    )

    return medicalCase
  })
}

export async function updateMedicalCase(medicalCaseId: string, input: UpdateMedicalCaseInput, actorId: string) {
  const existingCase = await prisma.medicalCase.findUnique({
    where: { id: medicalCaseId }
  })

  if (!existingCase) {
    throw new Error('Medical case not found')
  }

  // Check for unique name if name is being updated (case-insensitive)
  if (input.name && input.name.toLowerCase() !== existingCase.name.toLowerCase()) {
    const allCases = await prisma.medicalCase.findMany({
      where: { id: { not: medicalCaseId } },
      select: { name: true }
    })

    const nameExists = allCases.some(c => c.name.toLowerCase() === input.name!.toLowerCase())

    if (nameExists) {
      throw new Error('A medical case with this name already exists')
    }
  }

  return prisma.$transaction(async tx => {
    const updatedCase = await tx.medicalCase.update({
      where: { id: medicalCaseId },
      data: input
    })

    await logAudit(
      {
        actorId,
        action: 'UPDATE',
        entityType: 'MedicalCase',
        entityId: medicalCaseId,
        before: {
          name: existingCase.name,
          defaultPrice: existingCase.defaultPrice.toString(),
          isActive: existingCase.isActive
        },
        after: {
          name: updatedCase.name,
          defaultPrice: updatedCase.defaultPrice.toString(),
          isActive: updatedCase.isActive
        }
      },
      tx
    )

    return updatedCase
  })
}

export async function getMedicalCases(activeOnly: boolean = false) {
  return prisma.medicalCase.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: 'asc' }
  })
}

export async function getMedicalCaseById(medicalCaseId: string) {
  return prisma.medicalCase.findUnique({
    where: { id: medicalCaseId }
  })
}

export async function deleteMedicalCase(medicalCaseId: string, actorId: string) {
  const existingCase = await prisma.medicalCase.findUnique({
    where: { id: medicalCaseId }
  })

  if (!existingCase) {
    throw new Error('الحالة الطبية غير موجودة')
  }

  // Check if medical case is used in any appointments
  const appointmentsCount = await prisma.appointment.count({
    where: { medicalCaseId }
  })

  if (appointmentsCount > 0) {
    throw new Error('لا يمكن حذف الحالة الطبية لأنها مرتبطة بمواعيد')
  }

  return prisma.$transaction(async tx => {
    await tx.medicalCase.delete({
      where: { id: medicalCaseId }
    })

    await logAudit(
      {
        actorId,
        action: 'DELETE',
        entityType: 'MedicalCase',
        entityId: medicalCaseId,
        before: {
          name: existingCase.name,
          nameAr: existingCase.nameAr,
          defaultPrice: existingCase.defaultPrice.toString(),
          isActive: existingCase.isActive
        }
      },
      tx
    )

    return existingCase
  })
}
