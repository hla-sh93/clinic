import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createPayment, getPayments } from '@/services/payments.service'
import { createPaymentSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('payments:read')
    const searchParams = request.nextUrl.searchParams
    
    const filters: any = {}
    
    if (searchParams.get('invoiceId')) {
      filters.invoiceId = searchParams.get('invoiceId')!
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    const payments = await getPayments(filters)
    return NextResponse.json(payments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('payments:write')
    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)
    
    const payment = await createPayment({
      ...validatedData,
      paymentDate: new Date(validatedData.paymentDate)
    }, user.id)
    
    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
