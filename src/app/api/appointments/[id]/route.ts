import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission } from '@/lib/rbac'
import { getAppointmentById, updateAppointment } from '@/services/appointments.service'
import { updateAppointmentSchema } from '@/lib/validators'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission(['appointments:read', 'appointments:read:own'])
    const { id } = await params
    const appointment = await getAppointmentById(id)

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (user.role === UserRole.DENTIST && appointment.dentistId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(appointment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAnyPermission(['appointments:write', 'appointments:write:own'])
    const { id } = await params
    const appointment = await getAppointmentById(id)

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (user.role === UserRole.DENTIST && appointment.dentistId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = updateAppointmentSchema.parse(body)

    if (user.role === UserRole.DENTIST && validatedData.dentistId && validatedData.dentistId !== user.id) {
      return NextResponse.json({ error: 'Dentists can only assign appointments to themselves' }, { status: 403 })
    }

    const updateData: any = { ...validatedData }
    if (validatedData.startTime) {
      updateData.startTime = new Date(validatedData.startTime)
    }
    if (validatedData.endTime) {
      updateData.endTime = new Date(validatedData.endTime)
    }

    const updatedAppointment = await updateAppointment(id, updateData, user.id)
    return NextResponse.json(updatedAppointment)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
