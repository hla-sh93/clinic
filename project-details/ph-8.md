# Dental Clinic Management System — Phase 8

## Reporting, Analytics, Finance Dashboards & Export Layer (Production-Grade Spec)

**Phase goal:** deliver a complete, accurate, and auditable **reporting + analytics layer** that produces **trustworthy financial and operational insights** (including **deferred payments / installments** and **inventory purchase costs as clinic expenses**), with exports and strict RBAC.

**Non-negotiable constraints**

- Stack: Next.js (App Router) + TypeScript
- UI: Veuxy Dashboard + Tailwind CSS ONLY
- Architecture: Modular Monolith
- RBAC: strict server-side enforcement
- Currency: **SYP only**
- Languages: Arabic (RTL) + English (LTR)
- Audit logging for sensitive report access + export actions
- No “estimated” financial numbers unless clearly labeled as estimates

---

## 1) Scope

### In-scope

1. **Operational reporting**
   - Appointments, visits, procedures, doctors productivity
   - Patient KPIs
2. **Financial reporting (cash + accrual-aware for installments)**
   - Revenue (earned), cash collected, receivables (deferred)
   - Refunds, discounts, write-offs
   - Expenses (including **inventory purchase costs**)
   - Profit (earned revenue - expenses), plus Cash Profit (cash-in - cash-out)
3. **Installments / deferred payments accounting presentation**
   - Not changing the payments module logic; **reporting must reflect it correctly**
4. **Inventory cost integration**
   - Inventory IN movements create expenses → included in reports
5. **Dashboards**
   - Daily/weekly/monthly summaries
   - Trends with date filters
6. **Exports**
   - CSV + PDF (optional)
7. **Report correctness framework**
   - canonical definitions + shared query layer + reconciliation checks

### Out of scope

- Tax filing compliance (VAT, payroll taxes, etc.)
- Full accounting ledger (GL, journals, trial balance) unless already planned later
- BI warehouse / external OLAP pipelines (can be added later)

---

## 2) RBAC & Data Visibility Rules

### Manager

- Full access to all reports and financial figures
- Can export all reports

### Dentist

- Can view **own** operational performance (visits, procedures, schedule KPIs)
- **No** access to purchase costs, clinic expenses, or profit
- If clinic policy allows: can view limited revenue _without costs_ (config flag)

### Receptionist (if exists in your roles)

- Operational KPIs only (appointments, patient flow)
- No financial totals beyond “payment status” per visit (optional)

**Server-side enforcement is mandatory.** Do not rely on UI hiding.

---

## 3) Canonical Definitions (These prevent “report disagreement”)

> These definitions must be implemented as shared constants and referenced across all reports.

### 3.1 Revenue (Earned)

**Earned Revenue** = sum of billable services performed (visits/procedures) **minus** discounts **minus** refunds related to those services.

- Earned revenue is recognized at **service completion time** (visit finalized).

### 3.2 Cash Collected

**Cash Collected** = sum of actual payments received (cash or any supported payment method) within date range.

- This can differ from earned revenue due to installments or prepayments.

### 3.3 Deferred (Receivables / Installments)

**Deferred / Receivable** = Earned Revenue - Cash Collected (for a given visit/invoice scope), considering refunds/discounts.

- Report must show:
  - **Total receivable outstanding**
  - **Aging** (0–30, 31–60, 61–90, 90+ days)

### 3.4 Expenses

Expenses must include:

- **Inventory purchases** (from Inventory phase: IN movements auto-generate `InventoryExpense`)
- Other clinic operational expenses (if your finance module includes them)
- Optional: salary/contractor costs (if later phase)

### 3.5 Profit

Two profit views are required:

1. **Accrual Profit (Operational Profit)**  
   Profit = Earned Revenue - Expenses (in same period)

2. **Cash Profit (Cash-Based)**  
   Cash Profit = Cash In (payments received) - Cash Out (expenses paid, including inventory purchases if paid immediately)

> If your system doesn’t track “expense paid date” yet, treat inventory purchases as paid on occurrence date (movement date) and clearly document it.

---

## 4) Report Architecture (How to ensure accuracy)

### 4.1 Reporting Query Layer (Mandatory)

Create a single internal module: `reportingService`

- Exposes typed functions with stable contracts
- Handles all aggregation, filtering, and RBAC constraints
- No report page should implement its own SQL logic directly

**Example (conceptual functions)**

- `getKpiSummary(range, userContext)`
- `getRevenueBreakdown(range, groupBy, filters)`
- `getCashCollection(range, groupBy, filters)`
- `getReceivablesAging(asOfDate)`
- `getExpenseSummary(range, groupBy, category)`
- `getProfitSummary(range, viewType)`

### 4.2 Time Zone and Date Handling

- Use clinic timezone consistently (system config)
- Store timestamps in UTC in DB
- Reports must allow:
  - `date_from`, `date_to` (inclusive/exclusive defined)
  - `group_by` = day/week/month

### 4.3 Rounding and Money Precision

- Money in SYP only
- Use `DECIMAL(18,2)` or integer minor units (choose one; consistent with earlier phases)
- All aggregations must apply consistent rounding rules (round at line level, sum totals)

---

## 5) Data Model Additions for Reporting (If Missing)

> If these already exist in your project spec, keep them; if not, add them now.

### 5.1 report_exports (audit + re-download tracking)

- `id` (uuid)
- `report_key` (string) e.g. `profit_summary`, `receivables_aging`
- `requested_by_user_id` (uuid)
- `requested_at` (datetime)
- `filters_json` (json)
- `file_type` (enum `CSV|PDF`)
- `file_path` (string) or storage pointer
- `status` (enum `CREATED|FAILED`)
- `error_message` (text nullable)

### 5.2 report_audit_events (optional if you have global audit log)

If you have a global audit log already, reuse it with `action` fields such as:

- `REPORT_VIEW`
- `REPORT_EXPORT`
- `REPORT_EXPORT_DOWNLOAD`

---

## 6) Reports Specification (Complete List)

### 6.1 Dashboard — Manager (Financial + Ops)

**Filters:** date range, group_by (day/week/month), doctor (optional), service category (optional)

**Cards**

1. Earned Revenue (SYP)
2. Cash Collected (SYP)
3. Receivables Outstanding (SYP)
4. Total Expenses (SYP)
5. Accrual Profit (SYP)
6. Cash Profit (SYP)
7. Appointments Count
8. Completed Visits Count
9. Cancellation Rate
10. New Patients Count

**Trends**

- Revenue trend (earned vs cash collected)
- Expenses trend
- Receivables trend

**Rules**

- Clicking a card opens drill-down report with same filters
- Dentists must not see financial cards unless explicitly allowed by config

---

### 6.2 Revenue Report (Earned)

**Purpose:** what the clinic earned for services performed.

**Inputs**

- date range (based on visit completion date)
- group_by
- optional: doctor_id, patient_type, service_category

**Outputs**

- Total earned revenue
- Breakdown by:
  - doctor
  - service category
  - procedure code (if applicable)
- Drill-down list:
  - visit_id
  - patient
  - doctor
  - services lines
  - gross, discount, net earned

**Edge cases**

- A refunded service: show negative line or separate “refund” bucket (must be consistent)

---

### 6.3 Cash Collection Report

**Purpose:** track actual money received.

**Inputs**

- date range (payment date)
- group_by
- optional: cashier (if exists), doctor, payment method (if exists)

**Outputs**

- Total collected
- Breakdown by:
  - payment method
  - user who recorded payment
  - related visit/invoice
- Drill-down list includes:
  - payment_id
  - visit_id
  - amount
  - payment_date
  - recorded_by

---

### 6.4 Deferred Payments / Receivables Report

**Purpose:** track outstanding installments and overdue amounts.

**Two views**

1. **Outstanding Receivables (as-of date)**
   - Total outstanding
   - Grouping:
     - by patient
     - by visit/invoice
     - by doctor (optional)
2. **Aging Buckets (as-of date)**
   - 0–30, 31–60, 61–90, 90+ days

**Required fields in drill-down**

- patient
- visit/invoice reference
- total earned
- cash paid
- outstanding
- due date (if exists in installment plan)
- last payment date
- status: `Current | Overdue | Settled`

**Correctness rules**

- Must reconcile:
  - `Sum(outstanding) = Sum(earned) - Sum(cash_collected)` within the same scope
- If installment schedule exists: overdue is computed by due date and paid amounts

---

### 6.5 Expenses Report (Including Inventory Purchases)

**Purpose:** ensure every clinic expense is counted, especially inventory purchases.

**Inputs**

- date range (expense date)
- group_by
- category filter (InventoryPurchase, Utilities, Rent, etc.)

**Outputs**

- Total expenses
- Breakdown by category
- Drill-down list:
  - expense_id
  - category
  - amount
  - date
  - notes
  - reference to movement_id if InventoryPurchase

**Inventory integration requirement**

- For InventoryPurchase:
  - must source from `inventory_expenses` generated by stock IN movements
  - if movement voided, expense must be voided and excluded from totals

---

### 6.6 Profit & Loss Summary (Manager)

**Inputs**

- date range
- view type: `Accrual` or `Cash`

**Outputs**

- Earned Revenue
- Discounts
- Refunds
- Net Revenue
- Expenses (with category breakdown)
- Profit

**Must include**

- A toggle “Include Inventory Purchases” (default ON, cannot be turned off for official P&L; only for analysis)
- Export

**Warnings**

- If expense module does not track paid/unpaid:
  - Cash view should show a note: “Expenses treated as paid on expense date”.

---

### 6.7 Doctor Performance (Dentist + Manager)

**Inputs**

- date range
- doctor_id (auto = self for dentist)

**Outputs**

- visits completed
- procedures performed
- average revenue per visit (allowed only for manager unless config allows)
- cancellations (if attributed)
- patient satisfaction metric (if exists later)

---

### 6.8 Patient Analytics

**Inputs**

- date range

**Outputs**

- new vs returning patients
- retention: patients with 2+ visits
- top procedures for cohort
- outstanding receivables by patient (manager only)

---

### 6.9 Appointment Funnel Report

- booked
- confirmed
- arrived
- completed
- canceled / no-show  
  With conversion rates.

---

## 7) Export Requirements (CSV/PDF)

### 7.1 Export Policy

- Only Manager can export financial reports
- Export must capture:
  - report name
  - filters
  - generated timestamp
  - generated by (user)

### 7.2 CSV Export

- UTF-8
- AR/EN headers depending on selected language
- Numeric formatting consistent and unambiguous (decimal separator standard)

### 7.3 PDF Export (Optional but recommended)

- A4
- RTL support for Arabic
- Include summary at top + table + totals row
- Include “Generated by / Generated at”

### 7.4 Export Audit

Every export must generate an audit record with:

- report_key
- filters_json
- file_type
- actor_user_id
- timestamp
- result status

---

## 8) API Contracts (Route Handlers / Server Actions)

> Prefer server actions for UI forms and route handlers for data fetching; either is fine as long as RBAC is enforced.

### 8.1 Endpoints (conceptual)

- `GET /api/reports/kpis`
- `GET /api/reports/revenue`
- `GET /api/reports/cash-collection`
- `GET /api/reports/receivables/outstanding`
- `GET /api/reports/receivables/aging`
- `GET /api/reports/expenses`
- `GET /api/reports/profit-loss`
- `POST /api/reports/export` (body: report_key + filters + file_type)

### 8.2 Response Standard

All responses:

```json
{
  "success": true,
  "data": { },
  "error": null
}
Errors:

Use error codes for localization:

ERR_REPORT_FORBIDDEN

ERR_REPORT_INVALID_FILTER

ERR_REPORT_EXPORT_FAILED

9) UI Requirements (Veuxy + Tailwind)
9.1 Navigation (Manager)

Dashboard

Reports

Revenue

Cash Collection

Receivables

Expenses

Profit & Loss

Appointment Funnel

Patient Analytics

Exports (history)

9.2 Filters UX

unified filter bar component:

date range

group_by

doctor select (if allowed)

category select (for expenses)

apply/reset buttons

URL query params reflect filters (shareable links)

9.3 Drill-down UX

Charts are optional

Tables must support:

sorting

pagination

server-side filtering for performance

9.4 Localization

All labels and column headers translated

RTL table alignment

Number formatting consistent:

still SYP

do not convert currency symbol

10) Performance & Pagination Rules

All list reports must be paginated server-side

Use indexed columns:

occurred_at, expense_date, payment_date, doctor_id, visit_id

Aggregate queries must be optimized:

group_by day/week/month uses proper date truncation

Heavy exports should be generated server-side and stored, then downloaded

11) Audit & Security
11.1 Sensitive Reads Must Be Audited

At minimum, audit:

viewing profit/loss

viewing receivables aging

exporting any financial report

11.2 Data Leak Prevention

Dentists:

no access to cost prices

no access to inventory purchase totals

no access to profit

11.3 Input Validation

Reject:

inverted date ranges

date range longer than allowed threshold (optional, e.g., 2 years) unless manager explicitly requests

invalid enum values

12) Testing & Quality Gates
12.1 Unit Tests

revenue calculation with discounts/refunds

cash collected totals

outstanding receivable correctness

aging bucket logic

inventory expense inclusion in expenses report

profit calculations (accrual vs cash)

12.2 Integration Tests

RBAC: dentist cannot access financial endpoints

export generation and audit record creation

reconciliation: outstanding = earned - collected (within same dataset)

12.3 Reconciliation Checks (Admin/Manager-only)

Add a hidden “Reconcile” tool:

recompute key totals from raw tables

compare to report outputs

show mismatch if any

13) Acceptance Criteria (Definition of Done)

Manager dashboard shows KPIs with correct filters and drill-down.

Revenue report matches visit line items and completion dates.

Cash collection report matches payments recorded by date.

Receivables report shows accurate outstanding totals and aging buckets.

Expenses report includes inventory purchase costs generated from inventory IN movements.

Profit & Loss summary provides Accrual and Cash views with correct formulas and clear labels.

Exports work (CSV mandatory), include filters metadata, and are audited.

Dentists are prevented from accessing financial/cost data by server-side RBAC.

Reports are localized (AR/EN) and RTL-safe.

Automated tests cover calculations and permissions.

END OF PHASE 8 DOCUMENT
```
