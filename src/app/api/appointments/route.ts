import { NextRequest, NextResponse } from 'next/server'
import { requireAnyPermission, getCurrentUser } from '@/lib/rbac'
import { createAppointment, getAppointments } from '@/services/appointments.service'
import { createAppointmentSchema } from '@/lib/validators'
import { AppointmentStatus, UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAnyPermission(['appointments:read', 'appointments:read:own'])
    const searchParams = request.nextUrl.searchParams
    
    const filters: any = {}
    
    if (searchParams.get('dentistId')) {
      filters.dentistId = searchParams.get('dentistId')!
    }
    
    if (searchParams.get('patientId')) {
      filters.patientId = searchParams.get('patientId')!
    }
    
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as AppointmentStatus
    }
    
    if (searchParams.get('startDate')) {
      filters.startDate = new Date(searchParams.get('startDate')!)
    }
    
    if (searchParams.get('endDate')) {
      filters.endDate = new Date(searchParams.get('endDate')!)
    }
    
    if (user.role === UserRole.DENTIST) {
      filters.dentistId = user.id
    }
    
    const appointments = await getAppointments(filters)
    return NextResponse.json(appointments)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAnyPermission(['appointments:write', 'appointments:write:own'])
    const body = await request.json()
    const validatedData = createAppointmentSchema.parse(body)
    
    if (user.role === UserRole.DENTIST && validatedData.dentistId !== user.id) {
      return NextResponse.json({ error: 'Dentists can only create appointments for themselves' }, { status: 403 })
    }
    
    const appointment = await createAppointment({
      ...validatedData,
      startTime: new Date(validatedData.startTime),
      endTime: new Date(validatedData.endTime)
    }, user.id)
    
    return NextResponse.json(appointment, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
