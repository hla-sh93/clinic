# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default configuration works for local development with SQLite.

### Step 3: Setup Database

```bash
# Run migrations
npm run prisma:migrate

# Seed with test data
npm run prisma:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Login

**Manager Account:**

- Email: `manager@dental.com`
- Password: `password123`

**Dentist Account:**

- Email: `dentist1@dental.com`
- Password: `password123`

## 📋 What's Included After Seeding

- ✅ 3 Users (1 Manager, 2 Dentists)
- ✅ 8 Medical Cases (treatments with pricing)
- ✅ 5 Sample Patients
- ✅ 8 Inventory Items
- ✅ 2 Profit Share Configurations

## 🎯 Quick Test Flow

1. **Login as Manager** → View dashboard
2. **Create Appointment** → Patients → Select patient → New appointment
3. **Complete Appointment** → Change status to COMPLETED
4. **View Invoice** → Financial → Invoices → Click invoice
5. **Add Payment** → Record payment with confirmation
6. **Check Reports** → Reports → View various reports
7. **View Audit Logs** → Audit Logs → See all activity

## 📚 Full Documentation

- **Setup & Testing**: See `SETUP-AND-TESTING.md`
- **System Details**: See `README.dental-system.md`
- **Phase Completion**: See `PHASE-1-COMPLETE.md` through `PHASE-12-COMPLETE.md`

## 🔧 Useful Commands

```bash
# View database in browser
npm run prisma:studio

# Reset database (deletes all data)
rm prisma/dev.db
npm run prisma:migrate
npm run prisma:seed

# Build for production
npm run build
npm start
```

## ✅ System Status

All 12 phases complete:

1. ✅ Authentication & RBAC
2. ✅ Database Schema
3. ✅ Audit Logging
4. ✅ Patients Module
5. ✅ Medical Cases Module
6. ✅ Appointments Module
7. ✅ Visits & Invoices
8. ✅ Payments Module
9. ✅ Profit Shares
10. ✅ Inventory Management
11. ✅ Reports Module
12. ✅ Production Finalization

**Status**: 🎉 Production Ready

## 🆘 Troubleshooting

**Issue**: Module not found errors

```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Database locked

- Close Prisma Studio if open
- Restart dev server

**Issue**: Can't login

- Verify `.env` has `NEXTAUTH_SECRET` set
- Clear browser cookies
- Check database was seeded

## 📞 Support

Check documentation in order:

1. This Quick Start
2. `SETUP-AND-TESTING.md` for detailed scenarios
3. Phase completion docs for specific modules
4. `SYSTEM-VERIFICATION.md` for technical details
