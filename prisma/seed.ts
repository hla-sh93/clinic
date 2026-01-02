import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('جاري تهيئة قاعدة البيانات...')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // إنشاء المدير
  const manager = await prisma.user.upsert({
    where: { email: 'manager@dental.com' },
    update: {
      fullName: 'أحمد محمد المدير',
      password: hashedPassword
    },
    create: {
      email: 'manager@dental.com',
      fullName: 'أحمد محمد المدير',
      password: hashedPassword,
      role: UserRole.MANAGER,
      isActive: true
    }
  })

  console.log('تم إنشاء المدير:', manager.email)

  // إنشاء طبيب الأسنان الأول
  const dentist1 = await prisma.user.upsert({
    where: { email: 'dentist1@dental.com' },
    update: {
      fullName: 'د. خالد العبدالله',
      password: hashedPassword
    },
    create: {
      email: 'dentist1@dental.com',
      fullName: 'د. خالد العبدالله',
      password: hashedPassword,
      role: UserRole.DENTIST,
      isActive: true
    }
  })

  console.log('تم إنشاء الطبيب الأول:', dentist1.email)

  // إنشاء طبيب الأسنان الثاني
  const dentist2 = await prisma.user.upsert({
    where: { email: 'dentist2@dental.com' },
    update: {
      fullName: 'د. فاطمة الحسن',
      password: hashedPassword
    },
    create: {
      email: 'dentist2@dental.com',
      fullName: 'د. فاطمة الحسن',
      password: hashedPassword,
      role: UserRole.DENTIST,
      isActive: true
    }
  })

  console.log('تم إنشاء الطبيب الثاني:', dentist2.email)

  // إنشاء نسب الأرباح
  await prisma.dentistProfitShare.upsert({
    where: { dentistId: dentist1.id },
    update: {},
    create: {
      dentistId: dentist1.id,
      percentage: 40
    }
  })

  await prisma.dentistProfitShare.upsert({
    where: { dentistId: dentist2.id },
    update: {},
    create: {
      dentistId: dentist2.id,
      percentage: 35
    }
  })
  console.log('تم إنشاء نسب الأرباح')

  // الحالات الطبية
  const medicalCases = [
    { name: 'تنظيف الأسنان', defaultPrice: 15000 },
    { name: 'خلع ضرس', defaultPrice: 30000 },
    { name: 'علاج عصب', defaultPrice: 80000 },
    { name: 'تاج أسنان', defaultPrice: 120000 },
    { name: 'تبييض الأسنان', defaultPrice: 50000 },
    { name: 'حشوة أسنان', defaultPrice: 20000 },
    { name: 'استشارة تقويم', defaultPrice: 10000 },
    { name: 'زراعة سن', defaultPrice: 300000 },
    { name: 'تركيب جسر', defaultPrice: 200000 },
    { name: 'علاج لثة', defaultPrice: 25000 },
    { name: 'أشعة بانوراما', defaultPrice: 15000 },
    { name: 'طقم أسنان كامل', defaultPrice: 500000 }
  ]

  for (const mc of medicalCases) {
    await prisma.medicalCase.upsert({
      where: { name: mc.name },
      update: {},
      create: {
        name: mc.name,
        defaultPrice: mc.defaultPrice,
        isActive: true
      }
    })
  }

  console.log('تم إنشاء الحالات الطبية')

  // المرضى
  const patients = [
    {
      fullName: 'محمد إبراهيم الخالد',
      phone: '+963911234567',
      gender: 'MALE' as const,
      maritalStatus: 'MARRIED' as const,
      dateOfBirth: new Date('1985-03-15'),
      notes: 'مريض منتظم، يحتاج متابعة دورية'
    },
    {
      fullName: 'سارة عبدالله النعيمي',
      phone: '+963912345678',
      gender: 'FEMALE' as const,
      maritalStatus: 'SINGLE' as const,
      dateOfBirth: new Date('1992-07-22'),
      notes: 'حساسية من البنج الموضعي'
    },
    {
      fullName: 'خالد منصور الأحمد',
      phone: '+963913456789',
      gender: 'MALE' as const,
      maritalStatus: 'MARRIED' as const,
      dateOfBirth: new Date('1978-11-08'),
      notes: null
    },
    {
      fullName: 'نورة سالم العلي',
      phone: '+963914567890',
      gender: 'FEMALE' as const,
      maritalStatus: 'SINGLE' as const,
      dateOfBirth: new Date('2000-01-30'),
      notes: 'تحتاج تقويم أسنان'
    },
    {
      fullName: 'عمر فهد الحسين',
      phone: '+963915678901',
      gender: 'MALE' as const,
      maritalStatus: 'DIVORCED' as const,
      dateOfBirth: new Date('1988-05-12'),
      notes: null
    },
    {
      fullName: 'ليلى أحمد الشامي',
      phone: '+963916789012',
      gender: 'FEMALE' as const,
      maritalStatus: 'MARRIED' as const,
      dateOfBirth: new Date('1975-09-25'),
      notes: 'مريضة سكري - يجب الحذر'
    },
    {
      fullName: 'يوسف علي الدمشقي',
      phone: '+963917890123',
      gender: 'MALE' as const,
      maritalStatus: 'SINGLE' as const,
      dateOfBirth: new Date('1995-12-03'),
      notes: 'يفضل المواعيد الصباحية'
    },
    {
      fullName: 'هند محمود السوري',
      phone: '+963918901234',
      gender: 'FEMALE' as const,
      maritalStatus: 'WIDOWED' as const,
      dateOfBirth: new Date('1960-04-18'),
      notes: null
    },
    {
      fullName: 'أحمد سعيد الحلبي',
      phone: '+963919012345',
      gender: 'MALE' as const,
      maritalStatus: 'MARRIED' as const,
      dateOfBirth: new Date('1982-08-07'),
      notes: 'خوف من الإبر'
    },
    {
      fullName: 'رنا خالد اللاذقاني',
      phone: '+963910123456',
      gender: 'FEMALE' as const,
      maritalStatus: 'MARRIED' as const,
      dateOfBirth: new Date('1990-06-14'),
      notes: 'حامل - الشهر السادس'
    }
  ]

  for (const p of patients) {
    const existingPatient = await prisma.patient.findFirst({
      where: { phone: p.phone }
    })

    if (!existingPatient) {
      await prisma.patient.create({
        data: {
          fullName: p.fullName,
          phone: p.phone,
          gender: p.gender,
          maritalStatus: p.maritalStatus,
          dateOfBirth: p.dateOfBirth,
          notes: p.notes,
          isActive: true
        }
      })
    }
  }

  console.log('تم إنشاء المرضى')

  // مواد المخزون
  const inventoryItems = [
    { name: 'قفازات طبية (علبة)', quantity: 50, reorderLevel: 10, unitPrice: 2500 },
    { name: 'كمامات طبية (علبة)', quantity: 40, reorderLevel: 15, unitPrice: 1500 },
    { name: 'أمبولات تخدير', quantity: 100, reorderLevel: 30, unitPrice: 500 },
    { name: 'حقن طبية', quantity: 200, reorderLevel: 50, unitPrice: 200 },
    { name: 'قطن طبي (عبوة)', quantity: 30, reorderLevel: 10, unitPrice: 800 },
    { name: 'رؤوس حفر أسنان', quantity: 15, reorderLevel: 5, unitPrice: 5000 },
    { name: 'مادة حشو كومبوزيت', quantity: 20, reorderLevel: 5, unitPrice: 12000 },
    { name: 'إسمنت أسنان', quantity: 25, reorderLevel: 8, unitPrice: 4500 },
    { name: 'مادة تبييض', quantity: 10, reorderLevel: 3, unitPrice: 8000 },
    { name: 'خيوط جراحية', quantity: 30, reorderLevel: 10, unitPrice: 3000 },
    { name: 'مطهر فموي (لتر)', quantity: 15, reorderLevel: 5, unitPrice: 2000 },
    { name: 'أفلام أشعة', quantity: 50, reorderLevel: 20, unitPrice: 1000 }
  ]

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: {
        name: item.name,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        unitPrice: item.unitPrice,
        isActive: true
      }
    })
  }

  console.log('تم إنشاء مواد المخزون')

  console.log('تمت تهيئة قاعدة البيانات بنجاح!')
}

main()
  .catch(e => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
