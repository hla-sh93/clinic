import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export interface UpdateProfitShareInput {
  dentistId: string
  percentage: number
}

export async function updateProfitShare(input: UpdateProfitShareInput, actorId: string) {
  if (input.percentage < 0 || input.percentage > 100) {
    throw new Error('Percentage must be between 0 and 100')
  }

  const dentist = await prisma.user.findUnique({
    where: { id: input.dentistId }
  })

  if (!dentist || dentist.role !== 'DENTIST') {
    throw new Error('Invalid dentist')
  }

  const existingShare = await prisma.dentistProfitShare.findUnique({
    where: { dentistId: input.dentistId }
  })

  return prisma.$transaction(async tx => {
    if (existingShare) {
      const updatedShare = await tx.dentistProfitShare.update({
        where: { dentistId: input.dentistId },
        data: { percentage: input.percentage }
      })

      await logAudit(
        {
          actorId,
          action: 'UPDATE',
          entityType: 'DentistProfitShare',
          entityId: updatedShare.id,
          before: { percentage: existingShare.percentage.toString(), dentistId: input.dentistId },
          after: { percentage: updatedShare.percentage.toString(), dentistId: input.dentistId }
        },
        tx
      )

      return updatedShare
    } else {
      const newShare = await tx.dentistProfitShare.create({
        data: {
          dentistId: input.dentistId,
          percentage: input.percentage
        }
      })

      await logAudit(
        {
          actorId,
          action: 'CREATE',
          entityType: 'DentistProfitShare',
          entityId: newShare.id,
          after: {
            dentistId: newShare.dentistId,
            percentage: newShare.percentage.toString()
          }
        },
        tx
      )

      return newShare
    }
  })
}

export async function getProfitShares() {
  return prisma.dentistProfitShare.findMany({
    include: {
      dentist: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true
        }
      }
    },
    orderBy: {
      dentist: {
        fullName: 'asc'
      }
    }
  })
}

export async function getProfitShareByDentistId(dentistId: string) {
  return prisma.dentistProfitShare.findUnique({
    where: { dentistId },
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
}

export async function deleteProfitShare(dentistId: string, actorId: string) {
  const existingShare = await prisma.dentistProfitShare.findUnique({
    where: { dentistId },
    include: {
      dentist: {
        select: { fullName: true }
      }
    }
  })

  if (!existingShare) {
    throw new Error('Profit share not found')
  }

  return prisma.$transaction(async tx => {
    await tx.dentistProfitShare.delete({
      where: { dentistId }
    })

    await logAudit(
      {
        actorId,
        action: 'DELETE',
        entityType: 'DentistProfitShare',
        entityId: existingShare.id,
        before: {
          dentistId: existingShare.dentistId,
          percentage: existingShare.percentage.toString(),
          dentistName: existingShare.dentist.fullName
        }
      },
      tx
    )

    return { success: true }
  })
}

export async function getDentistsWithoutProfitShare() {
  const dentistsWithShares = await prisma.dentistProfitShare.findMany({
    select: { dentistId: true }
  })

  const dentistIdsWithShares = dentistsWithShares.map(s => s.dentistId)

  return prisma.user.findMany({
    where: {
      role: 'DENTIST',
      isActive: true,
      id: { notIn: dentistIdsWithShares }
    },
    select: {
      id: true,
      fullName: true,
      email: true
    },
    orderBy: { fullName: 'asc' }
  })
}
