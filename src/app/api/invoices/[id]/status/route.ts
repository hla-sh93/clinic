import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { updateInvoiceStatus } from '@/services/invoices.service'
import { InvoiceStatus } from '@prisma/client'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('payments:write')
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(InvoiceStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const invoice = await updateInvoiceStatus(id, status, user.id)
    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
