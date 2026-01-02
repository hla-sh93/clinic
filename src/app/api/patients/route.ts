import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/rbac'
import { createPatient, getPatients } from '@/services/patients.service'
import { createPatientSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    await requirePermission('patients:read')
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined

    const patients = await getPatients(search)
    return NextResponse.json(patients)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('patients:write')
    const body = await request.json()
    const validatedData = createPatientSchema.parse(body)

    const patientData = {
      ...validatedData,
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null
    }
    const patient = await createPatient(patientData, user.id)
    return NextResponse.json(patient, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
