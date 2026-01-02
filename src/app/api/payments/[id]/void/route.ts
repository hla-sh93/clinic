import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/rbac'
import { voidPayment } from '@/services/payments.service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('payments:write')
    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'سبب الإلغاء مطلوب' }, { status: 400 })
    }

    const voidedPayment = await voidPayment(id, reason, user.id)

    return NextResponse.json(voidedPayment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
