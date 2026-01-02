import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission, requirePermission } from '@/lib/rbac'
import { createInventoryMovement, getInventoryMovements } from '@/services/inventory.service'
import { createInventoryMovementSchema } from '@/lib/validators'
import { InventoryMovementType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['inventory:read', 'inventory:write'])
    const searchParams = request.nextUrl.searchParams
    
    const filters: any = {}
    
    if (searchParams.get('itemId')) {
      filters.itemId = searchParams.get('itemId')!
    }
    
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as InventoryMovementType
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    const movements = await getInventoryMovements(filters)
    return NextResponse.json(movements)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const validatedData = createInventoryMovementSchema.parse(body)
    
    const movement = await createInventoryMovement(validatedData, user.id)
    return NextResponse.json(movement, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
