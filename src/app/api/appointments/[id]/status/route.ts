import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { AppointmentStatus, UserRole } from '@prisma/client'

import { requireAnyPermission } from '@/lib/rbac'
import { changeAppointmentStatus, getAppointmentById } from '@/services/appointments.service'

// أسباب الإلغاء المعتمدة
const VALID_CANCELLATION_REASONS = ['NO_SHOW', 'PATIENT_CANCELLED', 'CLINIC_CANCELLED'] as const
const VALID_DISCOUNT_TYPES = ['NONE', 'PERCENT', 'FIXED'] as const

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
    const { status, cancellationReason, notes, paidAmountSyp, discountType, discountValue } = body

    if (!status || !Object.values(AppointmentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // التحقق من سبب الإلغاء إذا كانت الحالة CANCELLED
    if (status === AppointmentStatus.CANCELLED) {
      if (!cancellationReason || !VALID_CANCELLATION_REASONS.includes(cancellationReason)) {
        return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
      }
    }

    // بناء الخيارات
    const options: {
      cancellationReason?: 'NO_SHOW' | 'PATIENT_CANCELLED' | 'CLINIC_CANCELLED'
      completeData?: {
        notes?: string
        paidAmountSyp?: number
        discountType?: 'NONE' | 'PERCENT' | 'FIXED'
        discountValue?: number
      }
    } = {}

    if (status === AppointmentStatus.CANCELLED) {
      options.cancellationReason = cancellationReason
    }

    if (status === AppointmentStatus.COMPLETED) {
      // التحقق من أن المبلغ المدفوع لا يتجاوز قيمة الجلسة
      const appointmentPrice = Number(appointment.basePriceSyp)

      if (paidAmountSyp && Number(paidAmountSyp) > appointmentPrice) {
        return NextResponse.json({ error: 'المبلغ المدفوع لا يمكن أن يتجاوز قيمة الجلسة' }, { status: 400 })
      }

      options.completeData = {
        notes: notes || undefined,
        paidAmountSyp: paidAmountSyp ? Number(paidAmountSyp) : undefined,
        discountType: discountType && VALID_DISCOUNT_TYPES.includes(discountType) ? discountType : 'NONE',
        discountValue: discountValue ? Number(discountValue) : 0
      }
    }

    const updatedAppointment = await changeAppointmentStatus(id, status, user.id, options)

    return NextResponse.json(updatedAppointment)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
