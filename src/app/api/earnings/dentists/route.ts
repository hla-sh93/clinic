import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireManager } from '@/lib/rbac'
import { getDoctorProfitReport } from '@/services/reports.service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireManager()
    const searchParams = request.nextUrl.searchParams

    const filters: any = {}

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    const report = await getDoctorProfitReport(filters, user.id)

    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
