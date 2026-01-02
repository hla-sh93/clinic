import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireManager } from '@/lib/rbac'
import { getUserById, updateUser, deleteUser } from '@/services/users.service'
import { updateUserSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireManager()
    const { id } = await params
    const user = await getUserById(id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager()
    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updatedUser = await updateUser(id, validatedData, user.id)

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager()
    const { id } = await params

    await deleteUser(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
