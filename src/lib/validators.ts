import { z } from 'zod'
import { UserRole, AppointmentStatus, InventoryMovementType } from '@prisma/client'

export const PaymentMethodEnum = z.enum(['CASH', 'CARD', 'TRANSFER'])

export const createUserSchema = z.object({
  role: z.nativeEnum(UserRole),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  isActive: z.boolean().default(true)
})

export const updateUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  isActive: z.boolean().optional()
})

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'UNSPECIFIED'])
export const MaritalStatusEnum = z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'UNSPECIFIED'])

// Syrian phone number regex: +963 or 09 followed by valid mobile prefixes
const syrianPhoneRegex = /^(\+963|0)9[0-9]{8}$/

export const createPatientSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  phone: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(
      syrianPhoneRegex,
      'صيغة رقم الهاتف غير صحيحة. يجب أن يكون رقم هاتف سوري صالح (مثال: 0912345678 أو +963912345678)'
    ),
  gender: GenderEnum.default('UNSPECIFIED'),
  maritalStatus: MaritalStatusEnum.default('UNSPECIFIED'),
  dateOfBirth: z.string().datetime().optional().nullable(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
})

export const updatePatientSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب').optional(),
  phone: z
    .string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(
      syrianPhoneRegex,
      'صيغة رقم الهاتف غير صحيحة. يجب أن يكون رقم هاتف سوري صالح (مثال: 0912345678 أو +963912345678)'
    )
    .optional(),
  gender: GenderEnum.optional(),
  maritalStatus: MaritalStatusEnum.optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional()
})

export const createMedicalCaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional().nullable(),
  defaultPrice: z.number().min(0, 'Price must be non-negative'),
  isActive: z.boolean().default(true)
})

export const updateMedicalCaseSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  nameAr: z.string().optional().nullable(),
  defaultPrice: z.number().min(0, 'Price must be non-negative').optional(),
  isActive: z.boolean().optional()
})

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    dentistId: z.string().uuid(),
    medicalCaseId: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    basePriceSyp: z.number().min(0, 'Price must be non-negative'),
    status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.SCHEDULED),
    notes: z.string().optional()
  })
  .refine(data => new Date(data.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)), {
    message: 'لا يمكن إنشاء موعد في الماضي',
    path: ['startTime']
  })
  .refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: 'وقت الانتهاء يجب أن يكون بعد وقت البدء',
    path: ['endTime']
  })

export const updateAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
  dentistId: z.string().uuid().optional(),
  medicalCaseId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  basePriceSyp: z.number().min(0, 'Price must be non-negative').optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  notes: z.string().optional()
})

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amountSyp: z.number().positive('Amount must be positive'),
  method: PaymentMethodEnum.default('CASH'),
  paymentDate: z.string().datetime()
})

export const updateProfitShareSchema = z.object({
  dentistId: z.string().uuid(),
  percentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100')
})

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional().nullable(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  reorderLevel: z.number().int().min(0, 'Reorder level must be non-negative'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  isActive: z.boolean().default(true)
})

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  nameAr: z.string().optional().nullable(),
  reorderLevel: z.number().int().min(0, 'Reorder level must be non-negative').optional(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative').optional(),
  isActive: z.boolean().optional()
})

export const createInventoryMovementSchema = z
  .object({
    itemId: z.string().uuid(),
    type: z.nativeEnum(InventoryMovementType),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitCostSyp: z.number().min(0, 'Unit cost must be non-negative').optional().nullable(),
    reason: z.string().min(1, 'Reason is required')
  })
  .refine(
    data => {
      // IN movements require unit cost

      if (data.type === InventoryMovementType.IN) {
        return data.unitCostSyp !== undefined && data.unitCostSyp !== null && data.unitCostSyp > 0
      }

      return true
    },
    { message: 'Unit cost is required for IN movements', path: ['unitCost'] }
  )
