# Dental Clinic Management System

## Full System Specification

## Single Source of Truth — Locked & Executable Version

---

## 0. DOCUMENT AUTHORITY & GOVERNANCE

This document is the **sole authoritative reference** for the Dental Clinic Management System.

- Any implementation MUST strictly follow this document.
- No assumptions, inferred behavior, or undocumented logic is permitted.
- Any change requires a **new version** of this document with explicit versioning.
- If system behavior is not explicitly defined here, **it MUST NOT be implemented**.

This document supersedes all prior drafts, notes, or discussions.

---

## 1. SYSTEM OVERVIEW

This system is a **production-grade dental clinic management platform** designed for real-world medical, operational, and financial usage.

### Covered Domains

- Patient management
- Appointment scheduling
- Clinical visits
- Billing & payments
- Deferred receivables
- Inventory & expenses
- Clinic profit calculation
- Dentist earnings distribution
- Audit logging
- Role-based access control (RBAC)

---

## 2. ACCOUNTING & FINANCIAL MODEL (LOCKED)

### Accounting Basis (FINAL DECISION)

- **Cash Basis Accounting**
- Revenue is recognized **ONLY when payment is collected**
- Unpaid amounts are considered **Deferred Receivables (Non-Revenue)**
- Inventory is expensed **at purchase time (IN)**
- Inventory usage (OUT) has **NO financial impact**

### Financial Implications

- Visits and invoices represent **expected value**, not revenue.
- Revenue, profit, and dentist earnings depend **only on collected payments**.
- There is no accrual, no revenue anticipation, and no carry-over between periods.

---

## 3. TECHNOLOGY & GLOBAL CONSTRAINTS

### Technology Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Architecture: Modular Monolith
- Styling: Tailwind CSS ONLY
- Storage: S3-compatible object storage

### Global System Constraints

- Currency: **Syrian Pound (SYP) ONLY**
- Monetary values stored as integers (no decimals)
- Language: **Arabic (RTL) ONLY**
- All timestamps stored in UTC
- Business logic operates on clinic local timezone (configured once)

---

## 4. USER ROLES & RBAC

### Roles

- **Manager**
- **Dentist**

### Global RBAC Rules

- All permissions are enforced server-side.
- Unauthorized actions return HTTP 403.
- All sensitive actions are audited.
- Hard delete is forbidden system-wide.

---

## 5. AUTHENTICATION & SECURITY

### Authentication

- JWT-based authentication
- Access Token validity: 15 minutes
- Refresh Token validity: 7 days
- Refresh tokens are stored server-side and revocable.

### Password Policy

- Minimum 10 characters
- Must include letters and numbers
- Passwords hashed using industry-standard algorithms

### Security Controls

- Rate limiting on authentication endpoints
- Brute-force protection
- Account lockout after repeated failures

### Audited Security Events

- Login / logout
- Password reset
- Role change
- Account activation / deactivation

---

## 6. PATIENT MANAGEMENT

### Patient Entity

- id (UUID)
- full_name
- phone
- notes
- is_active
- created_at

### Rules

- Patients are never deleted.
- Deactivation prevents new appointments.
- Historical records remain accessible forever.

---

## 7. MEDICAL SERVICES (MEDICAL CASES)

### MedicalCase Entity

- id (UUID)
- name
- base_price_syp
- description
- is_active

### Rules

- Medical cases define baseline pricing.
- base_price_syp is **snapshotted** into appointments.
- Medical cases cannot be deleted if referenced by appointments or visits.

---

## 8. APPOINTMENT MANAGEMENT

### Time Rules

- Minimum appointment duration: 15 minutes
- No overlapping appointments per dentist

Overlap Logic:

- end_time <= next.start_time → allowed
- end_time > next.start_time → rejected

### Appointment Status

- SCHEDULED
- COMPLETED
- CANCELLED
- NO_SHOW

### Appointment Entity

- id (UUID)
- patient_id
- dentist_id
- medical_case_id
- start_time_utc
- end_time_utc
- status
- base_price_syp (snapshotted)

### Rules

- Only SCHEDULED appointments can be modified.
- Only COMPLETED appointments generate visits.
- COMPLETED appointments cannot be reverted.

---

## 9. VISITS (CLINICAL RECORD)

A Visit is created **only** when an appointment is marked COMPLETED.

### Visit Entity

- id (UUID)
- appointment_id
- base_price_syp
- discount_type (NONE | PERCENT | FIXED)
- discount_value
- final_price_syp (IMMUTABLE)
- notes
- created_at

### Pricing Rules

- final_price_syp = base_price_syp − discount
- Only Manager can apply discounts or price changes.
- Any discount requires:
  - Mandatory reason
  - Audit log entry
- Once saved, final_price_syp is **immutable forever**.
- Visit notes may be edited, with audit logging.

---

## 10. BILLING (INVOICES)

### Invoice Entity

- id (UUID)
- visit_id (UNIQUE)
- total_amount_syp
- paid_amount_syp
- status (UNPAID | PARTIALLY_PAID | PAID)

### Rules

- Exactly one invoice per visit.
- total_amount_syp equals visit.final_price_syp.
- Invoice totals are immutable.
- Status is auto-calculated based on payments.

---

## 11. PAYMENTS

### Payment Entity

- id (UUID)
- invoice_id
- amount_syp
- payment_method (CASH | CARD | TRANSFER)
- payment_date
- created_at

### Rules

- Multiple payments per invoice allowed.
- Overpayments are strictly forbidden.
- Payment creation is append-only.
- Refunds are implemented as **negative payment entries**.
- Revenue is recognized **on payment_date only**.

---

## 12. DEFERRED RECEIVABLES

### Definition

Deferred Receivable = invoice.total_amount − sum(payments)

### Rules

- Deferred receivables are:
  - Visible in reports
  - NOT counted as revenue
- Aging is calculated dynamically.
- No separate ledger; values are derived.

---

## 13. INVENTORY MANAGEMENT

### Accounting Decision (LOCKED)

- Inventory IN creates an expense.
- Inventory OUT is non-financial.

### InventoryItem Entity

- id (UUID)
- name
- is_active

### InventoryTransaction Entity

- id (UUID)
- item_id
- quantity
- unit_cost_syp (required for IN)
- direction (IN | OUT)
- created_at

### Rules

- OUT cannot exceed available stock.
- Negative stock is forbidden.
- IN transactions create inventory expenses.

---

## 14. PROFIT & DENTIST EARNINGS

### Financial Definitions

- CollectedRevenue = sum(all payments)
- InventoryExpenses = sum(all inventory IN costs)
- NetProfit = CollectedRevenue − InventoryExpenses

### Profit Model (FINAL)

- Profit is calculated at **clinic level only**.
- Dentist earnings are a **percentage of NetProfit**.
- Dentist percentage is fixed per dentist.
- Sum of dentist percentages ≤ 100%.

### Rules

- If NetProfit ≤ 0 → Dentist earnings = 0
- No negative balances.
- No profit carry-over between periods.
- Remaining profit belongs to the clinic.

---

## 15. REPORTING

### Manager Reports

- Collected Revenue
- Deferred Receivables (with aging)
- Inventory Expenses
- Net Profit
- Dentist Earnings Summary
- Inventory Stock Summary

### Dentist Reports

- Own completed visits
- Own earnings (read-only, no clinic totals)

### Reporting Authority Rule

If any discrepancy exists:
**Payments → Profit Calculation → Reports**
Payments are the ultimate source of truth.

---

## 16. FILE STORAGE & ATTACHMENTS

### Storage Rules

- S3-compatible object storage
- No public access
- Soft-delete only

### Access Rules

- Manager: full access
- Dentist: access only to own patient files

### Constraints

- File size limits enforced
- MIME type validation required

---

## 17. AUDIT LOGGING

### Audited Actions

- Authentication events
- Financial records creation/refund
- Price adjustments
- Inventory IN transactions
- Role changes
- Activation/deactivation of records

### Audit Log Fields

- actor_id
- action
- entity
- before_state
- after_state
- timestamp

Audit logs are immutable.

---

## 18. DATA INTEGRITY RULES (GLOBAL)

- Hard delete is forbidden everywhere.
- Financial records are append-only.
- Dentist cannot be deactivated if future appointments exist.
- Medical cases cannot be removed if already used.
- All critical operations must be transactional.

---

## 19. SYSTEM GUARANTEES

This specification guarantees:

- Deterministic implementation
- Financial correctness under Cash Basis accounting
- Audit readiness
- No undefined or hidden logic
- Safe execution without assumptions

---

## END OF FILE — LOCKED VERSION
