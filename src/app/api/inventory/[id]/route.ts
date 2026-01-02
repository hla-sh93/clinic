import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission, requirePermission } from '@/lib/rbac'
import { getInventoryItemById, updateInventoryItem } from '@/services/inventory.service'
import { updateInventoryItemSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyPermission(['inventory:read', 'inventory:write'])
    const { id } = await params
    const item = await getInventoryItemById(id)

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('inventory:write')
    const { id } = await params
    const body = await request.json()
    const validatedData = updateInventoryItemSchema.parse(body)

    const item = await updateInventoryItem(id, validatedData, user.id)
    return NextResponse.json(item)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
