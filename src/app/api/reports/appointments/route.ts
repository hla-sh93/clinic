import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission } from '@/lib/rbac'
import { getAppointmentsReport } from '@/services/reports.service'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAnyPermission(['reports:read', 'reports:read:scoped'])
    const searchParams = request.nextUrl.searchParams

    const filters: any = {}

    if (searchParams.get('dentistId')) {
      filters.dentistId = searchParams.get('dentistId')!
    }

    if (searchParams.get('patientId')) {
      filters.patientId = searchParams.get('patientId')!
    }

    if (searchParams.get('medicalCaseId')) {
      filters.medicalCaseId = searchParams.get('medicalCaseId')!
    }

    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }

    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }

    const report = await getAppointmentsReport(filters, user.id)
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
