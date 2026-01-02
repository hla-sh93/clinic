import { prisma } from '@/lib/prisma'
import { logCreate, logUpdate } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export interface CreateUserInput {
  role: UserRole
  fullName: string
  email: string
  password: string
  isActive?: boolean
}

export interface UpdateUserInput {
  fullName?: string
  email?: string
  password?: string
  isActive?: boolean
}

export async function createUser(input: CreateUserInput, actorId: string) {
  const hashedPassword = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      role: input.role,
      fullName: input.fullName,
      email: input.email,
      password: hashedPassword,
      isActive: input.isActive ?? true
    }
  })

  await logCreate(actorId, 'User', user.id, {
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    isActive: user.isActive
  })

  return user
}

export async function updateUser(userId: string, input: UpdateUserInput, actorId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!existingUser) {
    throw new Error('User not found')
  }

  const updateData: any = {
    fullName: input.fullName,
    email: input.email,
    isActive: input.isActive
  }

  if (input.password) {
    updateData.password = await bcrypt.hash(input.password, 10)
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  })

  await logUpdate(
    actorId,
    'User',
    userId,
    {
      fullName: existingUser.fullName,
      email: existingUser.email,
      isActive: existingUser.isActive
    },
    {
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      isActive: updatedUser.isActive
    }
  )

  return updatedUser
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      role: true,
      fullName: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      fullName: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

export async function getDentists() {
  return prisma.user.findMany({
    where: {
      role: UserRole.DENTIST,
      isActive: true
    },
    select: {
      id: true,
      fullName: true,
      email: true
    },
    orderBy: { fullName: 'asc' }
  })
}

export async function deleteUser(userId: string, actorId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!existingUser) {
    throw new Error('User not found')
  }

  // Check if user has related records
  const hasAppointments = await prisma.appointment.count({
    where: { dentistId: userId }
  })

  const hasVisits = await prisma.visit.count({
    where: { dentistId: userId }
  })

  if (hasAppointments > 0 || hasVisits > 0) {
    throw new Error('Cannot delete user with existing appointments or visits. Deactivate instead.')
  }

  await prisma.user.delete({
    where: { id: userId }
  })

  const { logDelete } = await import('@/lib/audit')

  await logDelete(actorId, 'User', userId, {
    fullName: existingUser.fullName,
    email: existingUser.email,
    role: existingUser.role
  })

  return { success: true }
}
