# Dental Clinic Management System — Phase 7

## Profit Calculation, Dentist Earnings & Financial Attribution

## Post-Revenue Financial Logic (Locked)

---

## PHASE IDENTIFICATION

- **Phase:** 7
- **Name:** Profit Calculation, Dentist Earnings & Financial Attribution
- **Depends On:**
  - Phase 1 — System Definition & Decision Lock
  - Phase 2 — UX / Interaction Architecture
  - Phase 3 — Architecture & API Contracts
  - Phase 4 — Data Model & Integrity Enforcement
  - Phase 5 — Authentication & RBAC (Corrected)
  - Phase 6 — Financial Operations, Payments & Deferred Receivables
- **Status:** Locked (after approval)

Phase 7 defines **how money is interpreted**, not how it is collected.
It answers: _who earns what, when, and why_ — without ever breaking cash-basis rules.

---

## 1. PHASE OBJECTIVE

The objective of Phase 7 is to:

- Define **net profit calculation** for the clinic
- Define **dentist earnings logic**
- Ensure earnings are calculated ONLY from collected revenue
- Prevent negative balances or carry-over distortions
- Separate clinic profit from dentist compensation
- Guarantee transparency and auditability of earnings

At the end of this phase:

- No earnings are speculative
- No dentist is paid on unpaid invoices
- No profit is calculated without cash

---

## 2. CORE FINANCIAL PRINCIPLES (LOCKED)

1. **Cash Basis Supremacy**
   - Only collected payments count
2. **No Pre-Earnings**
   - Completed visits alone generate no earnings
3. **No Carry-Over**
   - Profit is calculated per period, not accumulated
4. **No Negative Earnings**
   - Loss periods generate zero dentist earnings
5. **Single Attribution Rule**
   - Earnings are attributed by visit ownership (dentist)

---

## 3. DEFINITIONS (AUTHORITATIVE)

### 3.1 Collected Revenue

Collected Revenue = SUM(all VALID payments)

### 3.2 Inventory Expenses

Inventory Expenses = SUM(all Inventory IN transactions)

### 3.3 Net Clinic Profit

Net Profit = Collected Revenue - Inventory Expenses

If Net Profit ≤ 0 → Net Profit = 0 (for earnings purposes)

---

## 4. DENTIST EARNINGS CONFIGURATION

### 4.1 Earnings Model

- Each dentist has a **fixed percentage share**
- Percentages are stored in `Dentist_Profit_Config`
- Sum of all dentist percentages MUST be ≤ 100%

Remaining profit (if any) belongs to the clinic.

---

### 4.2 Earnings Eligibility Rules

A dentist earns ONLY if:

- The visit is COMPLETED
- The invoice has at least one VALID payment
- Payment date falls within the reporting period

Unpaid or partially unpaid visits generate earnings **only proportional to paid amount**.

---

## 5. EARNINGS CALCULATION LOGIC (STRICT)

### 5.1 Visit-Level Attribution

For each payment:
Dentist Share = payment.amount_syp × dentist_percentage

### 5.2 Aggregation

Dentist Earnings (per period) =
SUM(all dentist shares from VALID payments within period)

### 5.3 Partial Payments (Installments)

- Each installment contributes proportionally
- No “reservation” of future earnings
- Earnings grow as payments are collected

---

## 6. LOSS & ZERO-PROFIT HANDLING

### 6.1 Loss Periods

If:
Collected Revenue ≤ Inventory Expenses

Then:

- Net Profit = 0
- Dentist Earnings = 0
- No negative balances
- No future compensation

Losses do NOT carry forward.

---

## 7. ROLE VISIBILITY & ACCESS CONTROL

### 7.1 Manager

Manager can:

- View full profit breakdown
- View all dentist percentages
- View clinic net profit
- Modify dentist percentage configuration
- Export earnings and profit reports

---

### 7.2 Dentist

Dentist can:

- View **own earnings summary only**
- View earnings by period
- View total collected attributed to own visits

Dentist CANNOT:

- View clinic profit
- View other dentists’ earnings
- View inventory expenses
- Modify percentages

---

## 8. AUDIT & TRACEABILITY (MANDATORY)

### Audited Actions

- Dentist percentage configuration change
- Earnings calculation execution (system)
- Earnings report generation (optional but recommended)

Audit records must include:

- actor_user_id
- action
- period
- affected_dentist_id (if applicable)
- timestamp

---

## 9. EDGE CASE HANDLING

| Scenario                   | System Behavior         |
| -------------------------- | ----------------------- |
| Visit completed but unpaid | No earnings             |
| Partial payment            | Partial earnings        |
| Invoice fully unpaid       | Zero earnings           |
| Dentist percentage = 0     | Zero earnings           |
| Percentage sum = 100       | Clinic keeps no surplus |
| Percentage sum < 100       | Clinic keeps remainder  |

---

## 10. DATA CONSISTENCY GUARANTEES

Phase 7 guarantees:

- No earnings without cash
- No negative earnings
- No hidden adjustments
- No retroactive manipulation
- Deterministic, explainable earnings

---

## 11. TESTING REQUIREMENTS

### Unit Tests

- Earnings per payment calculation
- Percentage enforcement
- Zero-profit scenarios

### Integration Tests

- Mixed paid/unpaid visits
- Multiple dentists with different percentages
- Period-based calculations

### Financial Integrity Tests

- Sum of dentist earnings ≤ net profit
- Earnings match payment attribution exactly

---

## 12. PHASE 7 DELIVERABLES

- Net profit calculation logic
- Dentist earnings calculation engine
- Earnings visibility rules
- Audit coverage for profit attribution

---

## 13. ACCEPTANCE CRITERIA

Phase 7 is complete ONLY if:

1. Earnings depend solely on collected payments
2. Dentists never earn on unpaid balances
3. Earnings never exceed net profit
4. Zero or loss periods generate zero earnings
5. Visibility rules are strictly enforced
6. Calculations are deterministic and auditable

---

## END OF PHASE 7 DOCUMENT
