import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { UserRole } from '@prisma/client'

import { requirePermission, requireAnyPermission } from '@/lib/rbac'
import { getProfitShares, updateProfitShare, deleteProfitShare } from '@/services/profit-shares.service'
import { updateProfitShareSchema } from '@/lib/validators'

export async function GET() {
  try {
    const user = await requireAnyPermission(['profit_shares:read', 'profit_shares:read:own'])
    const profitShares = await getProfitShares()

    if (user.role === UserRole.DENTIST) {
      const ownShare = profitShares.filter(share => share.dentistId === user.id)

      return NextResponse.json(ownShare)
    }

    return NextResponse.json(profitShares)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('profit_shares:write')
    const body = await request.json()
    const validatedData = updateProfitShareSchema.parse(body)

    const profitShare = await updateProfitShare(validatedData, user.id)

    return NextResponse.json(profitShare)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requirePermission('profit_shares:write')
    const { searchParams } = new URL(request.url)
    const dentistId = searchParams.get('dentistId')

    if (!dentistId) {
      return NextResponse.json({ error: 'Dentist ID is required' }, { status: 400 })
    }

    await deleteProfitShare(dentistId, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
