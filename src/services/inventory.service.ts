import { InventoryMovementType } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'

export interface CreateInventoryItemInput {
  name: string
  nameAr?: string | null
  quantity: number
  reorderLevel: number
  unitPrice: number
  isActive?: boolean
}

export interface UpdateInventoryItemInput {
  name?: string
  nameAr?: string | null
  reorderLevel?: number
  unitPrice?: number
  isActive?: boolean
}

export interface CreateInventoryMovementInput {
  itemId: string
  type: InventoryMovementType
  quantity: number
  unitCostSyp?: number | null
  reason: string
}

export async function createInventoryItem(input: CreateInventoryItemInput, actorId: string) {
  return prisma.$transaction(async tx => {
    const item = await tx.inventoryItem.create({
      data: {
        name: input.name,
        nameAr: input.nameAr,
        quantity: input.quantity,
        reorderLevel: input.reorderLevel,
        unitPrice: input.unitPrice,
        isActive: input.isActive ?? true
      }
    })

    await logAudit(
      {
        actorId,
        action: 'CREATE',
        entityType: 'InventoryItem',
        entityId: item.id,
        after: {
          name: item.name,
          quantity: item.quantity,
          reorderLevel: item.reorderLevel,
          unitPrice: item.unitPrice.toString()
        }
      },
      tx
    )

    return item
  })
}

export async function updateInventoryItem(itemId: string, input: UpdateInventoryItemInput, actorId: string) {
  const existingItem = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  })

  if (!existingItem) {
    throw new Error('Inventory item not found')
  }

  return prisma.$transaction(async tx => {
    const updatedItem = await tx.inventoryItem.update({
      where: { id: itemId },
      data: input
    })

    await logAudit(
      {
        actorId,
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: itemId,
        before: {
          name: existingItem.name,
          reorderLevel: existingItem.reorderLevel,
          unitPrice: existingItem.unitPrice.toString()
        },
        after: {
          name: updatedItem.name,
          reorderLevel: updatedItem.reorderLevel,
          unitPrice: updatedItem.unitPrice.toString()
        }
      },
      tx
    )

    return updatedItem
  })
}

export async function createInventoryMovement(input: CreateInventoryMovementInput, actorId: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id: input.itemId }
  })

  if (!item) {
    throw new Error('Inventory item not found')
  }

  if (input.type === InventoryMovementType.OUT && item.quantity < input.quantity) {
    throw new Error('Insufficient stock')
  }

  if (input.type === InventoryMovementType.IN && (!input.unitCostSyp || input.unitCostSyp <= 0)) {
    throw new Error('Unit cost is required for IN movements')
  }

  const totalCostSyp =
    input.type === InventoryMovementType.IN && input.unitCostSyp ? input.quantity * input.unitCostSyp : null

  return prisma.$transaction(async tx => {
    const newMovement = await tx.inventoryMovement.create({
      data: {
        itemId: input.itemId,
        type: input.type,
        quantity: input.quantity,
        unitCostSyp: input.unitCostSyp,
        totalCostSyp: totalCostSyp,
        reason: input.reason,
        createdBy: actorId
      },
      include: {
        item: true,
        creator: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    let quantityChange = 0

    if (input.type === InventoryMovementType.IN) {
      quantityChange = input.quantity
    } else if (input.type === InventoryMovementType.OUT) {
      quantityChange = -input.quantity
    }

    // ADJUST type: quantity change is 0 (just a correction record)
    if (quantityChange !== 0) {
      await tx.inventoryItem.update({
        where: { id: input.itemId },
        data: {
          quantity: {
            increment: quantityChange
          }
        }
      })
    }

    await logAudit(
      {
        actorId,
        action: 'CREATE',
        entityType: 'InventoryMovement',
        entityId: newMovement.id,
        after: {
          itemId: newMovement.itemId,
          type: newMovement.type,
          quantity: newMovement.quantity,
          reason: newMovement.reason
        }
      },
      tx
    )

    return newMovement
  })
}

export async function getInventoryItems(lowStockOnly: boolean = false) {
  const where = lowStockOnly
    ? {
        quantity: {
          lte: prisma.inventoryItem.fields.reorderLevel
        }
      }
    : undefined

  return prisma.inventoryItem.findMany({
    where,
    include: {
      _count: {
        select: {
          movements: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export async function getInventoryItemById(itemId: string) {
  return prisma.inventoryItem.findUnique({
    where: { id: itemId },
    include: {
      movements: {
        include: {
          creator: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  })
}

export async function getInventoryMovements(filters?: {
  itemId?: string
  type?: InventoryMovementType
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {}

  if (filters?.itemId) {
    where.itemId = filters.itemId
  }

  if (filters?.type) {
    where.type = filters.type
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

  return prisma.inventoryMovement.findMany({
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
}

export async function getLowStockItems() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: 'asc' }
  })

  return items.filter(item => item.quantity <= item.reorderLevel)
}
