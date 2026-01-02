# Dental Clinic Management System - Setup & Testing Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- SQLite (included with Prisma)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will:
- Install all required packages
- Generate Prisma client
- Build iconify icons

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important**: Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database Setup

Run migrations to create the database schema:

```bash
npm run prisma:migrate
```

Seed the database with initial data:

```bash
npm run prisma:seed
```

This creates:
- **Users**:
  - Manager: `manager@dental.com` / `password123`
  - Dentist 1: `dentist1@dental.com` / `password123` (Dr. Ahmed Hassan - 40% profit share)
  - Dentist 2: `dentist2@dental.com` / `password123` (Dr. Fatima Ali - 35% profit share)
  
- **Medical Cases**: 8 treatment types (Cleaning, Extraction, Root Canal, etc.)
- **Patients**: 5 sample patients
- **Inventory Items**: 8 items with varying stock levels

### 4. Start Development Server

```bash
npm run dev
```

Access the application at: `http://localhost:3000`

## Testing Scenarios

### Scenario 1: Manager Login & Dashboard

1. Navigate to `http://localhost:3000`
2. Login as manager: `manager@dental.com` / `password123`
3. Verify dashboard shows:
   - Quick stats (Patients, Appointments, Revenue, Outstanding)
   - Low stock warning (if any items below reorder level)
   - Quick action cards

### Scenario 2: Patient Management

**As Manager:**

1. Go to **Patients** → **All Patients**
2. Verify 5 seeded patients are listed
3. Click **Add Patient**
4. Create new patient:
   - Full Name: "Test Patient"
   - Phone: "+966501111111"
   - Email: "test@example.com"
5. Verify patient appears in list
6. Click on patient name → View details
7. Click **Edit** → Update phone number
8. Verify audit log created

### Scenario 3: Medical Cases

**As Manager:**

1. Go to **Medical Cases** → **All Cases**
2. Verify 8 seeded cases listed
3. Click **Add Case**
4. Create new case:
   - Name: "Dental Bridge"
   - Default Price: 2500
5. Verify case appears in list
6. Click **Edit** on any case → Update price
7. Verify audit log created

### Scenario 4: Appointment Booking

**As Manager or Dentist:**

1. Go to **Appointments** → **New Appointment**
2. Fill form:
   - Patient: Select from dropdown
   - Dentist: Select dentist
   - Medical Case: Select treatment
   - Date & Time: Choose future date/time
   - Price: Auto-filled from medical case
3. Click **Create Appointment**
4. Verify appointment in **All Appointments**
5. Click appointment → View details
6. Change status: SCHEDULED → CONFIRMED
7. Verify audit log created

### Scenario 5: Complete Appointment & Financial Flow

**As Manager:**

1. Go to **Appointments** → Select CONFIRMED appointment
2. Change status to **COMPLETED**
3. Verify:
   - Visit auto-created
   - Invoice auto-created (ISSUED status)
   - Audit logs for all 3 operations
4. Go to **Financial** → **Invoices**
5. Click on the new invoice
6. Verify invoice details:
   - Patient info
   - Visit info
   - Total amount = appointment price
   - Balance due = total amount
7. Click **Add Payment**
8. Enter partial payment (e.g., half the amount)
9. **Confirmation dialog appears** - Verify details
10. Click **Confirm Payment**
11. Verify:
    - Payment recorded
    - Invoice status → PARTIALLY_PAID
    - Balance updated
    - Audit log created
12. Add another payment for remaining balance
13. Verify invoice status → PAID

### Scenario 6: Profit Share Management

**As Manager:**

1. Go to **Profit Shares**
2. Verify existing shares for both dentists
3. Click **Edit** on Dr. Ahmed Hassan
4. Change percentage from 40% to 45%
5. Confirm change
6. Verify:
   - Updated percentage shown
   - Audit log created

**As Dentist:**

1. Logout and login as `dentist1@dental.com`
2. Go to **My Earnings**
3. Verify own profit share percentage visible
4. Cannot edit (read-only)

### Scenario 7: Inventory Management

**As Manager:**

1. Go to **Inventory** → **All Items**
2. Verify 8 seeded items
3. Items with low stock show warning badge
4. Click **Add Item**
5. Create new item:
   - Name: "Dental Floss (Pack)"
   - Quantity: 100
   - Reorder Level: 20
   - Unit Price: 5
6. Click on item → View details
7. Click **Stock In**:
   - Quantity: 50
   - Reason: "Monthly restock"
8. Verify quantity updated
9. Click **Stock Out**:
   - Quantity: 30
   - Reason: "Used in treatments"
10. Verify:
    - Quantity decreased
    - Movement history shows both transactions
    - Audit logs created

**As Dentist:**

1. Login as dentist
2. Go to **Inventory**
3. Verify can view items (read-only)
4. Cannot add/edit items or record movements

### Scenario 8: Reports

**As Manager:**

1. Go to **Reports** → **All Reports**
2. Test each report:

   **Appointments Report:**
   - Select date range
   - Verify appointment list
   - Check status counts

   **Revenue Report:**
   - Select date range
   - Verify total revenue
   - Check revenue by dentist breakdown
   - Review payment details

   **Outstanding Balances:**
   - Verify unpaid/partially paid invoices
   - Check outstanding by patient
   - Review invoice details

   **Doctor Earnings:**
   - Select date range or use preset (This Month, Last Month, etc.)
   - Verify profit calculations
   - Check dentist earnings breakdown

   **Inventory Low Stock:**
   - Verify items at/below reorder level
   - Check stock level indicators
   - Review total value at risk

**As Dentist:**

1. Login as dentist
2. Go to **Reports**
3. Verify:
   - Can access: Appointments (own only), Doctor Earnings (own only), Low Stock
   - Cannot access: Revenue, Outstanding (manager-only reports hidden)

### Scenario 9: Audit Logs

**As Manager:**

1. Go to **Audit Logs**
2. Filter by:
   - Entity Type: "Payment"
   - Date range: Last 7 days
3. Verify payment creation logs appear
4. Click **View Details** on any log
5. Verify before/after data shown in JSON format
6. Test different filters (Appointment, Invoice, etc.)

**As Dentist:**

1. Login as dentist
2. Go to **Audit Logs**
3. Verify only sees own actions (scoped by actor)

### Scenario 10: RBAC Enforcement

**Test Access Control:**

1. As Dentist, try to access:
   - `/invoices` → Should redirect or show access denied
   - `/profit-shares` → Can view own, cannot edit
   - `/inventory` → Can view, cannot edit
   - `/reports/revenue` → Should not appear in menu

2. As Dentist, verify can only:
   - Edit own appointments
   - View own earnings
   - View own audit logs

3. As Manager, verify full access to all modules

### Scenario 11: State Machine Validation

**Appointment Status:**

1. Create appointment (SCHEDULED)
2. Try invalid transitions:
   - SCHEDULED → COMPLETED (should fail, must go through CONFIRMED)
3. Valid transitions:
   - SCHEDULED → CONFIRMED ✓
   - CONFIRMED → COMPLETED ✓
4. Try editing completed appointment price (should be disabled)

**Invoice Status:**

1. Create invoice via completed appointment
2. Verify cannot manually change to PAID
3. Add payment → Auto-updates to PARTIALLY_PAID or PAID
4. Verify VOID is terminal (no further changes allowed)

## Database Management

### View Database

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555` to browse/edit data directly.

### Reset Database

```bash
# Delete database
rm prisma/dev.db

# Recreate and seed
npm run prisma:migrate
npm run prisma:seed
```

### Create New Migration

```bash
npm run prisma:migrate
```

## Production Build

### Build Application

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Prisma client not generated

**Solution:**
```bash
npm run prisma:generate
```

### Issue: Database locked

**Solution:**
```bash
# Close Prisma Studio if open
# Restart dev server
```

### Issue: NextAuth session errors

**Solution:**
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Verify `NEXTAUTH_URL` matches your dev URL
- Clear browser cookies and try again

## Testing Checklist

### Authentication & Authorization ✓
- [ ] Manager can login
- [ ] Dentist can login
- [ ] Invalid credentials rejected
- [ ] Session persists across page refreshes
- [ ] Logout works correctly

### RBAC ✓
- [ ] Manager has full access
- [ ] Dentist has limited access
- [ ] Financial module blocked for dentists
- [ ] Reports scoped correctly
- [ ] Audit logs scoped correctly

### Data Integrity ✓
- [ ] Appointments create visits/invoices on completion
- [ ] Payments update invoice status correctly
- [ ] Inventory movements update quantities
- [ ] No negative stock allowed
- [ ] No overpayments allowed
- [ ] Price immutable after visit creation

### Audit Logging ✓
- [ ] All creates logged
- [ ] All updates logged
- [ ] All status changes logged
- [ ] Before/after data captured
- [ ] Actor tracked correctly

### State Machines ✓
- [ ] Appointment transitions enforced
- [ ] Invoice status auto-updated
- [ ] Terminal states prevent edits
- [ ] Invalid transitions blocked

### User Experience ✓
- [ ] Loading states show during async ops
- [ ] Error messages display clearly
- [ ] Success feedback after operations
- [ ] Confirmation dialogs for financial actions
- [ ] Forms validate input
- [ ] Navigation works smoothly

## Performance Testing

### Load Test Scenarios

1. **Create 100 patients** - Verify list pagination/performance
2. **Create 50 appointments** - Check calendar/list rendering
3. **Generate 100 invoices** - Test financial reports
4. **Record 200 payments** - Verify audit log performance

### Expected Response Times

- Page load: < 2 seconds
- API calls: < 500ms
- Database queries: < 100ms
- Report generation: < 3 seconds

## Security Checklist

- [ ] Passwords hashed with bcrypt
- [ ] Session tokens secure
- [ ] RBAC enforced on all endpoints
- [ ] SQL injection prevented (Prisma ORM)
- [ ] XSS prevented (React escaping)
- [ ] CSRF protection (NextAuth)
- [ ] No sensitive data in client-side code
- [ ] Environment variables not committed

## Known Limitations

1. **Dashboard Stats**: Show "-" placeholders (implement real-time calculations if needed)
2. **Email Notifications**: Not implemented
3. **File Uploads**: Not implemented (patient documents, X-rays)
4. **Bulk Operations**: Not implemented
5. **Advanced Charts**: Basic reports only (add charts/graphs if needed)

## Support

For issues or questions:
1. Check this guide
2. Review phase completion documents (PHASE-1-COMPLETE.md through PHASE-12-COMPLETE.md)
3. Check audit logs for debugging
4. Review Prisma Studio for data issues

---

**System Status**: ✅ Production Ready
**Last Updated**: December 28, 2024
