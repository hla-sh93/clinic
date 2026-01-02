import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission } from '@/lib/rbac'
import { getOutstandingBalancesReport } from '@/services/reports.service'

export async function GET() {
  try {
    await requireAnyPermission(['reports:read', 'reports:read:scoped'])
    const report = await getOutstandingBalancesReport()
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
