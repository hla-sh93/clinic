# Dental Clinic Management System

A complete, production-ready dental clinic management system built with Next.js, TypeScript, and Prisma.

## Features

### Core Modules
- **User Management**: Manager and Dentist roles with strict RBAC
- **Patient Management**: Complete patient records with contact information
- **Medical Cases**: Service catalog with pricing
- **Appointments**: Scheduling with overlap prevention and state machine
- **Visits**: Auto-created when appointments are completed
- **Invoices**: Automated billing with state transitions
- **Payments**: Manager-only payment processing with validation
- **Doctor Profit Shares**: Configurable profit distribution
- **Inventory Management**: Stock tracking with movements
- **Reports**: Revenue, profit, appointments, and outstanding balances
- **Audit Logs**: Complete system activity tracking

### Security & Business Rules
- ✅ Server-side RBAC enforcement on all API routes
- ✅ No overlapping appointments per dentist
- ✅ Appointment state machine (SCHEDULED → CONFIRMED → COMPLETED)
- ✅ Invoice state machine (DRAFT → ISSUED → PARTIALLY_PAID → PAID)
- ✅ Automatic visit and invoice creation on appointment completion
- ✅ Payment validation (cannot exceed invoice total)
- ✅ No hard deletes for financial records
- ✅ Complete audit trail for all operations
- ✅ Dentists can only view their own financial data

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Veuxy Dashboard (Material-UI)
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js 18+ or npm/yarn
- PostgreSQL database

## Installation

### 1. Clone and Install Dependencies

```bash
cd d:\workflow
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dental_clinic?schema=public"

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Credentials

After seeding, you can log in with:

**Manager Account:**
- Email: `manager@dental.com`
- Password: `password123`

**Dentist Accounts:**
- Email: `dentist1@dental.com` / Password: `password123`
- Email: `dentist2@dental.com` / Password: `password123`

## Database Schema

The system uses 11 core entities:

1. **users** - Managers and Dentists
2. **dentist_profit_shares** - Profit percentage per dentist
3. **patients** - Patient master data
4. **medical_cases** - Services and pricing
5. **appointments** - Scheduling with state machine
6. **visits** - Completed appointments
7. **invoices** - Patient billing
8. **payments** - Payment transactions
9. **inventory_items** - Stock items
10. **inventory_movements** - Stock in/out tracking
11. **audit_logs** - System activity log

## API Routes

All API routes are protected with RBAC:

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create user (Manager only)
- `GET /api/users/[id]` - Get user details
- `PATCH /api/users/[id]` - Update user

### Patients
- `GET /api/patients` - List patients (with search)
- `POST /api/patients` - Create patient
- `GET /api/patients/[id]` - Get patient details
- `PATCH /api/patients/[id]` - Update patient

### Medical Cases
- `GET /api/medical-cases` - List medical cases
- `POST /api/medical-cases` - Create case (Manager only)
- `GET /api/medical-cases/[id]` - Get case details
- `PATCH /api/medical-cases/[id]` - Update case (Manager only)

### Appointments
- `GET /api/appointments` - List appointments (filtered by role)
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/[id]` - Get appointment details
- `PATCH /api/appointments/[id]` - Update appointment
- `PATCH /api/appointments/[id]/status` - Change appointment status

### Payments
- `GET /api/payments` - List payments (Manager only)
- `POST /api/payments` - Create payment (Manager only)

### Invoices
- `GET /api/invoices` - List invoices (Manager only)
- `GET /api/invoices/[id]` - Get invoice details
- `PATCH /api/invoices/[id]/status` - Update invoice status

### Profit Shares
- `GET /api/profit-shares` - List profit shares (scoped by role)
- `POST /api/profit-shares` - Update profit share (Manager only)

### Inventory
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Create item (Manager only)
- `GET /api/inventory/[id]` - Get item details
- `PATCH /api/inventory/[id]` - Update item (Manager only)
- `GET /api/inventory/movements` - List movements
- `POST /api/inventory/movements` - Create movement (Manager only)

### Reports
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/doctor-profit` - Doctor profit report (scoped by role)
- `GET /api/reports/appointments` - Appointments report
- `GET /api/reports/outstanding` - Outstanding balances report

### Audit Logs
- `GET /api/audit-logs` - List audit logs (scoped by role)

## Permission Matrix

| Module | Manager | Dentist |
|--------|---------|---------|
| Patients | Full Access | Full Access |
| Appointments | Full Access | Own Only |
| Visits | Full Access | View Own |
| Medical Cases | Full Access | View Only |
| Payments | Full Access | ❌ No Access |
| Doctor Percentages | Full Access | View Own |
| Inventory | Full Access | View Only |
| Reports | Full Access | Scoped View |
| Audit Log | Full Access | Own Actions |
| Financial Settings | Full Access | ❌ No Access |

## Business Logic

### Appointment Workflow
1. Create appointment (SCHEDULED)
2. Confirm appointment (CONFIRMED)
3. Complete appointment (COMPLETED)
   - Automatically creates Visit
   - Automatically creates Invoice (ISSUED)
4. Add payments to invoice
   - Invoice status updates automatically (PARTIALLY_PAID → PAID)

### Financial Calculations
- **Revenue** = Sum of all payments
- **Net Profit** = Revenue (configurable for future deductions)
- **Doctor Profit** = Net Profit × (Doctor Percentage / 100)

### Data Integrity
- No overlapping appointments per dentist
- Payments cannot exceed invoice total
- No hard deletes for financial records
- All state transitions are validated
- Complete audit trail

## Development

### Database Management

```bash
# Create new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Code Structure

```
src/
├── app/
│   └── api/              # API routes with RBAC
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # NextAuth configuration
│   ├── rbac.ts           # RBAC utilities
│   ├── audit.ts          # Audit logging
│   ├── validators.ts     # Zod schemas
│   └── state-machines.ts # State transition logic
├── services/             # Business logic layer
│   ├── users.service.ts
│   ├── patients.service.ts
│   ├── appointments.service.ts
│   ├── visits.service.ts
│   ├── invoices.service.ts
│   ├── payments.service.ts
│   ├── profit-shares.service.ts
│   ├── inventory.service.ts
│   ├── medical-cases.service.ts
│   └── reports.service.ts
└── types/
    └── next-auth.d.ts    # Type definitions
```

## Production Deployment

1. Set strong `NEXTAUTH_SECRET`
2. Use production PostgreSQL database
3. Enable SSL for database connection
4. Set up proper backup strategy
5. Configure monitoring and logging
6. Review and adjust rate limiting
7. Enable HTTPS

## Support

For issues or questions, refer to the specification document: `dental-system.md`

## License

Commercial - Proprietary
