# Dental Clinic Management System — Phase 6

## Financial Operations, Payments & Deferred Receivables

## Cash-Based Financial Execution (Locked)

---

## PHASE IDENTIFICATION

- **Phase:** 6
- **Name:** Financial Operations, Payments & Deferred Receivables
- **Depends On:**
  - Phase 1 — System Definition & Decision Lock
  - Phase 2 — UX / Interaction Architecture
  - Phase 3 — Architecture & API Contracts
  - Phase 4 — Data Model & Integrity Enforcement
  - Phase 5 — Authentication, Authorization & RBAC (Corrected)
- **Status:** Locked (after approval)

Phase 6 defines **how money moves inside the system**.
No interpretation, no assumptions, no shortcuts.

---

## 1. PHASE OBJECTIVE

The objective of Phase 6 is to:

- Enforce **cash-based accounting**
- Define how invoices, payments, and receivables behave
- Support **installment payments** safely
- Prevent overpayment, refund, or financial corruption
- Ensure all revenue figures are provable and auditable

At the end of this phase:

- Every SYP is traceable
- No revenue is counted prematurely
- No negative or phantom balances can exist

---

## 2. FINANCIAL PRINCIPLES (LOCKED)

### 2.1 Accounting Model

- **Cash Basis Accounting**
- Revenue is recognized **only when a payment is recorded**
- No accruals
- No estimates
- No refunds

---

### 2.2 Currency & Precision

- Currency: **SYP**
- All monetary values stored as **DECIMAL**
- Rounding rules applied consistently (system-wide)

---

### 2.3 Roles & Financial Authority

- **Dentist**:
  - Has ZERO authority over payments
  - Cannot view invoices or payments
- **Manager**:
  - Sole authority to record payments
  - Sole authority to void payments
  - Full visibility over financial data

---

## 3. FINANCIAL ENTITIES (REFERENCE)

This phase operates on already-defined entities:

- Visit
- Invoice
- Payment

No new financial entities are introduced in Phase 6.

---

## 4. INVOICE GENERATION (AUTOMATED)

### 4.1 Creation Rule

- An **Invoice is automatically created** when:
  - Dentist sets Appointment status → `COMPLETED`

### 4.2 Invoice Properties

- One invoice per visit
- Invoice total = `visit.final_price_syp`
- Invoice is immutable after creation

### 4.3 Invoice Initial State

- `status = UNPAID`
- `paid_amount_syp = 0`

---

## 5. PAYMENT OPERATIONS

### 5.1 Payment Creation Authority

- Only **Manager** can create payments
- Payments are always linked to an invoice

---

### 5.2 Supported Payment Model

- **Cash only**
- **Installments supported** via multiple payments per invoice
- No upper limit on number of installments (unless clinic policy later restricts)

---

### 5.3 Payment Validation Rules (STRICT)

When recording a payment:

- `amount_syp > 0`
- `amount_syp <= remaining_invoice_balance`
- Remaining balance is calculated as:
  invoice.total_amount_syp - sum(valid_payments)

- Overpayment is strictly forbidden
- Zero-amount payments are forbidden

---

### 5.4 Payment Date & Revenue Recognition

- Revenue is recognized on:
- `payment.payment_date`
- Reporting MUST use payment date, not visit date

---

## 6. PAYMENT CORRECTION (NO REFUNDS)

### 6.1 Correction Strategy

- Payments **cannot** be edited or deleted
- Incorrect payments are handled via:
- `VOID Payment`

---

### 6.2 VOID Payment Rules

- Only Manager can void a payment
- Void requires:
- Mandatory reason
- Audit log entry
- VOIDED payments:
- Remain stored
- Are excluded from revenue calculations
- Restore invoice remaining balance

---

## 7. INVOICE STATUS CALCULATION (DERIVED)

Invoice status is **derived automatically**:

| Condition               | Status         |
| ----------------------- | -------------- |
| paid_amount = 0         | UNPAID         |
| 0 < paid_amount < total | PARTIALLY_PAID |
| paid_amount = total     | PAID           |

Manual status editing is forbidden.

---

## 8. DEFERRED RECEIVABLES (CORE CONCEPT)

### 8.1 Definition

- Deferred receivable = unpaid portion of an invoice

### 8.2 System Behavior

- Deferred receivables:
- Are displayed separately
- Are NOT counted as revenue
- When paid:
- Amount moves from deferred to collected revenue

---

## 9. REPORTING RULES (FINANCIAL)

### 9.1 Collected Revenue

SUM(all VALID payments within period)

### 9.2 Deferred Receivables

SUM(invoice.total - invoice.paid_amount)

### 9.3 Dentist Earnings Input

- Dentist earnings are calculated **only from collected revenue**
- Visit completion alone does not generate earnings

---

## 10. EDGE CASE HANDLING (MANDATORY)

| Scenario                        | System Action                     |
| ------------------------------- | --------------------------------- |
| Appointment CANCELLED / NO_SHOW | No invoice, no payment            |
| Payment attempt on PAID invoice | Rejected                          |
| Overpayment attempt             | Rejected                          |
| Payment after VOID              | Allowed if balance exists         |
| Visit with final_price = 0      | Invoice created, auto-marked PAID |

---

## 11. TRANSACTIONAL SAFETY

The following operations MUST be transactional:

- Invoice creation
- Payment creation
- Payment voiding
- Invoice status recalculation

No partial commits allowed.

---

## 12. AUDIT LOGGING (FINANCIAL)

Mandatory audit events:

- INVOICE_CREATED
- PAYMENT_CREATED
- PAYMENT_VOIDED
- INVOICE_STATUS_CHANGED (system-derived)

Audit records must include:

- actor_user_id
- entity
- entity_id
- before_state
- after_state
- timestamp

---

## 13. SECURITY & CONSISTENCY GUARANTEES

Phase 6 guarantees:

- No revenue counted without cash
- No silent balance changes
- No hidden financial side effects
- Full traceability of all money movement
- Compatibility with local clinic accounting practices

---

## 14. ACCEPTANCE CRITERIA

Phase 6 is complete ONLY if:

1. Payments cannot exceed invoice balance
2. Revenue is counted strictly on payment date
3. VOID payments correctly restore balances
4. Dentist cannot access any financial operation
5. All financial actions are audited
6. Deferred receivables are clearly separated from revenue

---

## END OF PHASE 6 DOCUMENT
