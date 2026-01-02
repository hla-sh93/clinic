import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission, requirePermission } from '@/lib/rbac'
import { createInventoryItem, getInventoryItems } from '@/services/inventory.service'
import { createInventoryItemSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['inventory:read', 'inventory:write'])
    const searchParams = request.nextUrl.searchParams
    const lowStockOnly = searchParams.get('lowStock') === 'true'
    
    const items = await getInventoryItems(lowStockOnly)
    return NextResponse.json(items)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('inventory:write')
    const body = await request.json()
    const validatedData = createInventoryItemSchema.parse(body)
    
    const item = await createInventoryItem(validatedData, user.id)
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
