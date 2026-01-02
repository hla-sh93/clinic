import { UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from './auth'

export type Permission =
  | 'patients:read'
  | 'patients:write'
  | 'appointments:read'
  | 'appointments:write'
  | 'appointments:read:own'
  | 'appointments:write:own'
  | 'visits:read'
  | 'visits:write'
  | 'visits:read:own'
  | 'medical_cases:read'
  | 'medical_cases:write'
  | 'payments:read'
  | 'payments:write'
  | 'profit_shares:read'
  | 'profit_shares:write'
  | 'profit_shares:read:own'
  | 'inventory:read'
  | 'inventory:write'
  | 'reports:read'
  | 'reports:read:scoped'
  | 'audit_logs:read'
  | 'audit_logs:read:scoped'
  | 'financial_settings:read'
  | 'financial_settings:write'

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.MANAGER]: [
    'patients:read',
    'patients:write',
    'appointments:read',
    'appointments:write',
    'visits:read',
    'visits:write',
    'medical_cases:read',
    'medical_cases:write',
    'payments:read',
    'payments:write',
    'profit_shares:read',
    'profit_shares:write',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'audit_logs:read',
    'financial_settings:read',
    'financial_settings:write'
  ],
  [UserRole.DENTIST]: [
    'patients:read',
    'patients:write',
    'appointments:read:own',
    'appointments:write:own',
    'visits:read:own',
    'medical_cases:read',
    'profit_shares:read:own',
    'inventory:read',
    'reports:read:scoped',
    'audit_logs:read:scoped'
  ]
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  return session?.user ?? null
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth()

  if (!hasPermission(user.role, permission)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

export async function requireAnyPermission(permissions: Permission[]) {
  const user = await requireAuth()

  if (!hasAnyPermission(user.role, permissions)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

export async function requireAllPermissions(permissions: Permission[]) {
  const user = await requireAuth()

  if (!hasAllPermissions(user.role, permissions)) {
    throw new Error('Forbidden: Insufficient permissions')
  }

  return user
}

export function isManager(role: UserRole): boolean {
  return role === UserRole.MANAGER
}

export function isDentist(role: UserRole): boolean {
  return role === UserRole.DENTIST
}

export async function requireManager() {
  const user = await requireAuth()

  if (!isManager(user.role)) {
    throw new Error('Forbidden: Manager role required')
  }

  return user
}

export async function requireDentist() {
  const user = await requireAuth()

  if (!isDentist(user.role)) {
    throw new Error('Forbidden: Dentist role required')
  }

  return user
}

export async function requireSelfScope(userId: string) {
  const user = await requireAuth()

  if (user.id !== userId && !isManager(user.role)) {
    throw new Error('Forbidden: Can only access own resources')
  }

  return user
}
