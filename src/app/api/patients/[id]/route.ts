import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/rbac'
import { getPatientById, updatePatient, deletePatient } from '@/services/patients.service'
import { updatePatientSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('patients:read')
    const { id } = await params
    const patient = await getPatientById(id)

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('patients:write')
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePatientSchema.parse(body)

    const patientData = {
      ...validatedData,
      dateOfBirth: validatedData.dateOfBirth
        ? new Date(validatedData.dateOfBirth)
        : validatedData.dateOfBirth === null
          ? null
          : undefined
    }

    const patient = await updatePatient(id, patientData, user.id)

    return NextResponse.json(patient)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('patients:write')

    const { id } = await params

    await deletePatient(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message.includes('cannot be deleted')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
