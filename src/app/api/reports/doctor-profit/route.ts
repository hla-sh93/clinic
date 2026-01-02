import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireAnyPermission } from '@/lib/rbac'
import { getDoctorProfitReport } from '@/services/reports.service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAnyPermission(['reports:read', 'reports:read:scoped'])
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
    const status = error.message === 'Unauthorized' ? 401 : error.message?.includes('Forbidden') ? 403 : 500

    return NextResponse.json({ error: error.message }, { status })
  }
}
