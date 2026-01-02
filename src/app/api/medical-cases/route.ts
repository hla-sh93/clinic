import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, requireAnyPermission } from '@/lib/rbac'
import { createMedicalCase, getMedicalCases } from '@/services/medical-cases.service'
import { createMedicalCaseSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    await requireAnyPermission(['medical_cases:read', 'medical_cases:write'])
    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'
    
    const medicalCases = await getMedicalCases(activeOnly)
    return NextResponse.json(medicalCases)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('medical_cases:write')
    const body = await request.json()
    const validatedData = createMedicalCaseSchema.parse(body)
    
    const medicalCase = await createMedicalCase(validatedData, user.id)
    return NextResponse.json(medicalCase, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
