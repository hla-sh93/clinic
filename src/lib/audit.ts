import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from './prisma'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'STATUS_CHANGE'
  | 'PAYMENT_CREATE'
  | 'PAYMENT_UPDATE'
  | 'APPOINTMENT_COMPLETE'
  | 'INVOICE_VOID'

export interface AuditLogData {
  actorId: string
  action: AuditAction
  entityType: string
  entityId: string
  beforeData?: Record<string, any> | null
  afterData?: Record<string, any> | null
}

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function logAudit(
  data: {
    actorId: string
    action: AuditAction
    entityType: string
    entityId: string
    before?: Record<string, any> | null
    after?: Record<string, any> | null
  },
  tx?: TransactionClient
) {
  const client = tx ?? prisma

  return client.auditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      beforeData: data.before ?? Prisma.JsonNull,
      afterData: data.after ?? Prisma.JsonNull
    }
  })
}

export async function createAuditLog(data: AuditLogData, tx?: TransactionClient) {
  const client = tx ?? prisma

  try {
    await client.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        beforeData: data.beforeData ?? Prisma.JsonNull,
        afterData: data.afterData ?? Prisma.JsonNull
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    throw error
  }
}

export async function logCreate(actorId: string, entityType: string, entityId: string, afterData: Record<string, any>) {
  await createAuditLog({
    actorId,
    action: 'CREATE',
    entityType,
    entityId,
    afterData
  })
}

export async function logUpdate(
  actorId: string,
  entityType: string,
  entityId: string,
  beforeData: Record<string, any>,
  afterData: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action: 'UPDATE',
    entityType,
    entityId,
    beforeData,
    afterData
  })
}

export async function logStatusChange(
  actorId: string,
  entityType: string,
  entityId: string,
  beforeStatus: string,
  afterStatus: string,
  additionalData?: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action: 'STATUS_CHANGE',
    entityType,
    entityId,
    beforeData: { status: beforeStatus, ...additionalData },
    afterData: { status: afterStatus, ...additionalData }
  })
}

export async function logDelete(
  actorId: string,
  entityType: string,
  entityId: string,
  beforeData: Record<string, any>
) {
  await createAuditLog({
    actorId,
    action: 'DELETE',
    entityType,
    entityId,
    beforeData
  })
}
