import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requireManager } from '@/lib/rbac'
import { createUser, getUsers } from '@/services/users.service'
import { createUserSchema } from '@/lib/validators'

export async function GET() {
  try {
    await requireManager()
    const users = await getUsers()

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireManager()
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    const newUser = await createUser(validatedData, user.id)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
  }
}
