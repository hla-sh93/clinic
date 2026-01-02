import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requirePermission, requireAnyPermission } from '@/lib/rbac'
import { getMedicalCaseById, updateMedicalCase, deleteMedicalCase } from '@/services/medical-cases.service'
import { updateMedicalCaseSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAnyPermission(['medical_cases:read', 'medical_cases:write'])
    const { id } = await params
    const medicalCase = await getMedicalCaseById(id)

    if (!medicalCase) {
      return NextResponse.json({ error: 'Medical case not found' }, { status: 404 })
    }

    return NextResponse.json(medicalCase)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('medical_cases:write')
    const { id } = await params
    const body = await request.json()
    const validatedData = updateMedicalCaseSchema.parse(body)

    const medicalCase = await updateMedicalCase(id, validatedData, user.id)

    return NextResponse.json(medicalCase)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('medical_cases:write')
    const { id } = await params

    await deleteMedicalCase(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
