import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { getInvoices, getOutstandingInvoices } from '@/services/invoices.service'
import { InvoiceStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('payments:read')
    const searchParams = request.nextUrl.searchParams
    
    const outstanding = searchParams.get('outstanding') === 'true'
    
    if (outstanding) {
      const invoices = await getOutstandingInvoices()
      return NextResponse.json(invoices)
    }
    
    const filters: any = {}
    
    if (searchParams.get('patientId')) {
      filters.patientId = searchParams.get('patientId')!
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as InvoiceStatus
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    const invoices = await getInvoices(filters)
    return NextResponse.json(invoices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
