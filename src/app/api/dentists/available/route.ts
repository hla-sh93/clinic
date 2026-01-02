import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/rbac'
import { getDentistsWithoutProfitShare } from '@/services/profit-shares.service'

export async function GET() {
  try {
    await requirePermission('profit_shares:write')
    const dentists = await getDentistsWithoutProfitShare()

    return NextResponse.json(dentists)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
