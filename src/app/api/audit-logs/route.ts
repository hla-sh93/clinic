import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission, getCurrentUser } from '@/lib/rbac'
import { getAuditLogs } from '@/services/reports.service'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAnyPermission(['audit_logs:read', 'audit_logs:read:scoped'])
    const searchParams = request.nextUrl.searchParams
    
    const filters: any = {}
    
    if (searchParams.get('entityType')) {
      filters.entityType = searchParams.get('entityType')!
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!)
    }
    
    if (user.role === UserRole.DENTIST) {
      filters.actorId = user.id
    }
    
    const logs = await getAuditLogs(filters)
    return NextResponse.json(logs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
