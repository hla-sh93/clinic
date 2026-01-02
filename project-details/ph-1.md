# Dental Clinic Management System — Phase 1

## System Definition, Decision Lock & Deterministic Baseline

---

## PHASE IDENTIFICATION

- **Phase:** 1
- **Name:** System Definition & Decision Lock
- **Status:** Locked (after approval)
- **Purpose:** Establish a **fully deterministic, assumption-free foundation** for the entire system before any design or development work.

This phase exists to **eliminate ambiguity**, **lock all critical decisions**, and ensure that **any developer can implement the system without interpretation**.

---

## 1. PHASE OBJECTIVE

The objective of Phase 1 is to:

- Convert business intent into **explicit system rules**
- Lock all **critical operational, financial, and security decisions**
- Define **authoritative system behavior** for all core entities
- Prevent future contradictions, re-interpretation, or hidden assumptions
- Produce a baseline specification that is:
  - Deterministic
  - Auditable
  - Executable
  - Safe for medical and financial use

No UI design, no code, and no performance optimization are allowed in this phase.

---

## 2. PHASE SCOPE

### 2.1 In Scope

Phase 1 explicitly covers:

- System-wide decisions (language, currency, scope)
- Accounting and financial logic decisions
- Entity lifecycle definitions
- State machines and transition rules
- RBAC boundaries and permissions logic
- Data integrity and immutability rules
- Error handling philosophy
- Edge-case behavior definition
- Decision documentation and locking

### 2.2 Out of Scope

The following are explicitly excluded from Phase 1:

- UI/UX design
- API implementation
- Database migrations
- Performance optimization
- Integrations
- Reporting layouts

---

## 3. FIXED SYSTEM DECISIONS (LOCKED)

The following decisions are **final and immutable** unless this document is versioned again.

### 3.1 Language & Localization

- System language: **Arabic only**
- UI direction: **RTL**
- No English fields or UI elements are required or supported.

### 3.2 Clinic Scope

- The system supports **one clinic only**.
- Multi-branch or multi-clinic logic is **out of scope**.

### 3.3 Time & Timezone

- All timestamps are stored in **UTC**.
- Business logic and reporting use **Damascus, Syria timezone**.
- Business day boundaries are evaluated using local clinic time.

### 3.4 Currency & Precision

- Currency: **Syrian Pound (SYP) only**
- All monetary values use **DECIMAL**
- No currency conversion logic exists.

---

## 4. ACCOUNTING & FINANCIAL MODEL (BASELINE)

### 4.1 Accounting Basis

- **Cash Basis Accounting** is enforced system-wide.
- Revenue is recognized **only when cash is collected**.
- No accrual accounting is allowed.

### 4.2 Financial Definitions

- **Expected Value:** Visit and invoice amounts before payment.
- **Collected Revenue:** Sum of all non-voided payments.
- **Deferred Receivable:** Invoice total minus collected payments.
- **Expense:** Inventory purchase (IN) only.

### 4.3 Prohibited Concepts

- No refunds to patients.
- No revenue anticipation.
- No negative balances.
- No backdating without authorization (defined in later phases).

---

## 5. CORE ENTITY LIFECYCLE DEFINITIONS

This section defines **authoritative state machines**.  
Any transition not explicitly listed is **forbidden**.

---

### 5.1 Appointment Lifecycle

#### States

- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`

#### Cancellation Reasons

- `NO_SHOW`
- `PATIENT_CANCELLED`
- `CLINIC_CANCELLED`

#### Allowed Transitions

| From      | To        | Allowed By   |
| --------- | --------- | ------------ |
| SCHEDULED | COMPLETED | Manager only |
| SCHEDULED | CANCELLED | Manager only |

#### Forbidden Transitions

- COMPLETED → any
- CANCELLED → any

#### Additional Rules

- Appointment supports:
  - Notes
  - Image attachments
- Notes and attachments may be added **before completion or cancellation**.
- COMPLETED appointments **cannot be modified or reverted**.

---

### 5.2 Visit Lifecycle

#### Creation Rule

- A Visit is **automatically created** when an Appointment is marked COMPLETED.
- Manual Visit creation is forbidden.

#### Properties

- Visit pricing is **final and immutable** once saved.
- Visit notes may be edited with audit logging.

#### Forbidden States

- Visit without Appointment
- Visit without Invoice

---

### 5.3 Invoice Lifecycle

#### Creation Rule

- An Invoice is **automatically created** immediately after Visit creation.
- Exactly **one invoice per visit** is enforced.

#### States

- `UNPAID`
- `PARTIALLY_PAID`
- `PAID`

#### State Logic

- Status is derived from payments.
- Invoice totals are immutable.

---

### 5.4 Payment Lifecycle

#### Rules

- Payment records are **append-only**.
- Payments cannot be edited or deleted.
- Overpayment is strictly forbidden.

#### Correction Policy

- If a payment is entered incorrectly:
  - It is **voided** (status = VOIDED)
  - Reason is mandatory
  - Audit log is mandatory
- This is an **administrative correction**, not a refund.

---

### 5.5 Inventory Lifecycle

#### Rules

- Inventory IN:
  - Creates an expense
- Inventory OUT:
  - Tracking only
  - No financial impact
- Negative stock is forbidden.
- OUT is rejected if stock is insufficient.

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC)

### 6.1 Roles

- Manager
- Dentist

### 6.2 Manager Permissions

- Change appointment status
- Apply discounts
- View all financial data
- Enter and void payments
- Manage inventory
- View all reports

### 6.3 Dentist Permissions

- View all patients
- View all appointments and visits
- Add notes and attachments to appointments and visits
- View **own earnings summary only**
- Cannot:
  - Change appointment status
  - View payments or invoices
  - View clinic profit or expenses

---

## 7. DATA INTEGRITY RULES (GLOBAL)

- Hard delete is forbidden.
- All financial records are immutable.
- All corrections are additive (void/reversal).
- Referential integrity must be enforced at database level.
- Transactional integrity is mandatory for:
  - Appointment completion
  - Visit + invoice creation
  - Payment creation
  - Inventory IN/OUT

---

## 8. ERROR HANDLING PHILOSOPHY

### Error Classes

- `400` — Schema / validation error
- `401` — Authentication required
- `403` — Authorization denied
- `409` — Conflict (overlap, duplicate state)
- `422` — Business rule violation
- `500` — System error

### Error Requirements

- Stable error codes
- No silent failures
- Business rule violations must be explicit

---

## 9. EDGE CASE POLICY (MANDATORY)

The system must explicitly handle:

- Appointment completion without visit → forbidden
- Visit without invoice → forbidden
- Payment exceeding invoice balance → forbidden
- Discount after payment → forbidden
- Inventory OUT exceeding stock → forbidden

All edge cases must:

- Be blocked
- Return a clear error
- Be auditable

---

## 10. DECISION LOCKING & TRACEABILITY

### Decision Log Requirement

Every locked decision must be recorded with:

- Decision ID
- Date
- Section impacted
- Final decision
- Rationale

No decision may be overridden without a new version of this document.

---

## 11. PHASE 1 DELIVERABLES

Phase 1 is considered complete only when the following exist:

1. Locked system decisions (this document)
2. State transition tables for all core entities
3. RBAC permission matrix
4. Edge-case enforcement list
5. Decision log

---

## DELIVERABLE 1: STATE TRANSITION TABLES

### D1.1 Appointment State Machine

#### States

| State     | Description                                      |
| --------- | ------------------------------------------------ |
| SCHEDULED | Appointment is booked and awaiting execution     |
| COMPLETED | Appointment was executed, visit created          |
| CANCELLED | Appointment was cancelled (with reason required) |

#### Cancellation Reasons (Required when status = CANCELLED)

| Reason            | Description                        |
| ----------------- | ---------------------------------- |
| NO_SHOW           | Patient did not arrive             |
| PATIENT_CANCELLED | Patient requested cancellation     |
| CLINIC_CANCELLED  | Clinic cancelled (dentist absence) |

#### Transition Table

| From      | To        | Trigger                    | Allowed Role | Side Effects                          | Reversible |
| --------- | --------- | -------------------------- | ------------ | ------------------------------------- | ---------- |
| SCHEDULED | COMPLETED | Manager marks as completed | Manager      | Visit + Invoice created automatically | No         |
| SCHEDULED | CANCELLED | Manager cancels            | Manager      | Reason required, audit logged         | No         |

#### Forbidden Transitions

| From      | To        | Reason                            |
| --------- | --------- | --------------------------------- |
| COMPLETED | SCHEDULED | Completed appointments are final  |
| COMPLETED | CANCELLED | Cannot cancel after completion    |
| CANCELLED | SCHEDULED | Cancelled appointments are final  |
| CANCELLED | COMPLETED | Cannot complete cancelled booking |

#### Modification Rules

| State     | Field Editable | Notes Editable | Attachments Editable |
| --------- | -------------- | -------------- | -------------------- |
| SCHEDULED | Yes            | Yes            | Yes                  |
| COMPLETED | No             | No             | No                   |
| CANCELLED | No             | No             | No                   |

---

### D1.2 Visit State Machine

#### States

| State  | Description                           |
| ------ | ------------------------------------- |
| ACTIVE | Visit exists and is linked to invoice |

> Visit has no lifecycle transitions. It is created once and remains immutable.

#### Creation Rules

| Trigger                 | Action                                   | Validation                        |
| ----------------------- | ---------------------------------------- | --------------------------------- |
| Appointment → COMPLETED | Visit auto-created with pricing snapshot | Must have valid appointment       |
| Visit created           | Invoice auto-created immediately         | Transactional with visit creation |

#### Immutability Rules

| Field           | Editable | Condition                    |
| --------------- | -------- | ---------------------------- |
| base_price_syp  | No       | Immutable after creation     |
| discount_type   | No       | Immutable after creation     |
| discount_value  | No       | Immutable after creation     |
| final_price_syp | No       | Immutable after creation     |
| notes           | Yes      | Audit log required on change |

---

### D1.3 Invoice State Machine

#### States

| State          | Description                            | Condition                      |
| -------------- | -------------------------------------- | ------------------------------ |
| UNPAID         | No payments received                   | paid_amount = 0                |
| PARTIALLY_PAID | Some payment received, balance remains | 0 < paid_amount < total_amount |
| PAID           | Fully paid                             | paid_amount = total_amount     |

#### State Derivation Logic

```
IF sum(non-voided payments) = 0 THEN status = UNPAID
ELSE IF sum(non-voided payments) < total_amount THEN status = PARTIALLY_PAID
ELSE IF sum(non-voided payments) = total_amount THEN status = PAID
```

#### Transition Table

| From           | To             | Trigger                   | Automatic |
| -------------- | -------------- | ------------------------- | --------- |
| UNPAID         | PARTIALLY_PAID | Payment added (partial)   | Yes       |
| UNPAID         | PAID           | Payment added (full)      | Yes       |
| PARTIALLY_PAID | PAID           | Payment added (remaining) | Yes       |
| PAID           | PARTIALLY_PAID | Payment voided            | Yes       |
| PARTIALLY_PAID | UNPAID         | All payments voided       | Yes       |

#### Forbidden Operations

| Operation            | Reason                                 |
| -------------------- | -------------------------------------- |
| Edit total_amount    | Invoice totals are immutable           |
| Delete invoice       | Hard delete forbidden                  |
| Create without visit | Invoice requires parent visit          |
| Multiple per visit   | Exactly one invoice per visit enforced |

---

### D1.4 Payment State Machine

#### States

| State  | Description                              |
| ------ | ---------------------------------------- |
| ACTIVE | Payment is valid and counted in totals   |
| VOIDED | Payment is invalidated (correction only) |

#### Transition Table

| From   | To     | Trigger               | Allowed Role | Requirements                   |
| ------ | ------ | --------------------- | ------------ | ------------------------------ |
| ACTIVE | VOIDED | Manager voids payment | Manager      | Reason mandatory, audit logged |

#### Forbidden Transitions

| From   | To     | Reason                             |
| ------ | ------ | ---------------------------------- |
| VOIDED | ACTIVE | Voided payments cannot be restored |

#### Payment Rules

| Rule                 | Enforcement                                      |
| -------------------- | ------------------------------------------------ |
| Append-only          | Payments cannot be edited after creation         |
| No overpayment       | sum(payments) cannot exceed invoice.total_amount |
| No deletion          | Hard delete forbidden                            |
| Void requires reason | void_reason field mandatory when status = VOIDED |

#### Payment Methods

| Method   | Description       |
| -------- | ----------------- |
| CASH     | Physical cash     |
| CARD     | Credit/debit card |
| TRANSFER | Bank transfer     |

---

### D1.5 Inventory Transaction State Machine

#### Transaction Types

| Direction | Financial Impact | Description                 |
| --------- | ---------------- | --------------------------- |
| IN        | Creates expense  | Stock purchase              |
| OUT       | None             | Stock usage (tracking only) |

#### States

| State  | Description                      |
| ------ | -------------------------------- |
| ACTIVE | Transaction is valid and counted |
| VOIDED | Transaction is invalidated       |

#### Transition Table

| From   | To     | Trigger             | Allowed Role | Requirements                   |
| ------ | ------ | ------------------- | ------------ | ------------------------------ |
| ACTIVE | VOIDED | Manager voids entry | Manager      | Reason mandatory, audit logged |

#### Validation Rules

| Rule               | Direction | Enforcement                                  |
| ------------------ | --------- | -------------------------------------------- |
| Positive quantity  | IN/OUT    | quantity > 0                                 |
| Unit cost required | IN        | unit_cost_syp > 0                            |
| Stock sufficiency  | OUT       | current_stock >= requested_quantity          |
| No negative stock  | OUT       | Rejected if would result in negative balance |

#### Stock Calculation

```
current_stock(item) = sum(IN.quantity) - sum(OUT.quantity)
                      [where status = ACTIVE]
```

---

### D1.6 User (Dentist/Manager) State Machine

#### States

| State    | Description                              |
| -------- | ---------------------------------------- |
| ACTIVE   | User can log in and perform actions      |
| INACTIVE | User cannot log in, historical data kept |

#### Transition Table

| From     | To       | Trigger                  | Allowed Role | Requirements                        |
| -------- | -------- | ------------------------ | ------------ | ----------------------------------- |
| ACTIVE   | INACTIVE | Manager deactivates user | Manager      | No future appointments (if dentist) |
| INACTIVE | ACTIVE   | Manager reactivates user | Manager      | None                                |

#### Deactivation Rules

| User Type | Condition for Deactivation                       |
| --------- | ------------------------------------------------ |
| Dentist   | No SCHEDULED appointments with future start_time |
| Manager   | At least one other active Manager must exist     |

---

### D1.7 Patient State Machine

#### States

| State    | Description                                    |
| -------- | ---------------------------------------------- |
| ACTIVE   | Patient can have new appointments              |
| INACTIVE | No new appointments, historical data preserved |

#### Transition Table

| From     | To       | Trigger                     | Allowed Role | Requirements |
| -------- | -------- | --------------------------- | ------------ | ------------ |
| ACTIVE   | INACTIVE | Manager deactivates patient | Manager      | None         |
| INACTIVE | ACTIVE   | Manager reactivates patient | Manager      | None         |

#### Rules

| Rule                    | Enforcement                                    |
| ----------------------- | ---------------------------------------------- |
| No deletion             | Patients are never deleted                     |
| Historical preservation | All visits, invoices, payments remain visible  |
| New appointments        | Only ACTIVE patients can have new appointments |

---

### D1.8 Medical Case State Machine

#### States

| State    | Description                              |
| -------- | ---------------------------------------- |
| ACTIVE   | Can be assigned to new appointments      |
| INACTIVE | Cannot be assigned, historical data kept |

#### Transition Table

| From     | To       | Trigger                  | Allowed Role | Requirements |
| -------- | -------- | ------------------------ | ------------ | ------------ |
| ACTIVE   | INACTIVE | Manager deactivates case | Manager      | None         |
| INACTIVE | ACTIVE   | Manager reactivates case | Manager      | None         |

#### Rules

| Rule           | Enforcement                                         |
| -------------- | --------------------------------------------------- |
| No deletion    | Cannot delete if referenced by any appointment      |
| Price snapshot | base_price is copied to appointment at booking time |
| Price changes  | Only affect future appointments, not existing ones  |

---

## DELIVERABLE 2: RBAC PERMISSION MATRIX

### D2.1 Entity-Level Permissions

| Entity             | Action           | Manager | Dentist | Notes                             |
| ------------------ | ---------------- | ------- | ------- | --------------------------------- |
| **Patient**        | Create           | ✓       | ✗       |                                   |
|                    | View             | ✓       | ✓       |                                   |
|                    | Edit             | ✓       | ✗       |                                   |
|                    | Deactivate       | ✓       | ✗       |                                   |
| **Appointment**    | Create           | ✓       | ✗       |                                   |
|                    | View All         | ✓       | ✓       |                                   |
|                    | Edit (SCHEDULED) | ✓       | ✗       | Only while SCHEDULED              |
|                    | Complete         | ✓       | ✗       | Creates Visit + Invoice           |
|                    | Cancel           | ✓       | ✗       | Requires reason                   |
|                    | Add Notes        | ✓       | ✓       | Only while SCHEDULED              |
|                    | Add Attachments  | ✓       | ✓       | Only while SCHEDULED              |
| **Visit**          | View All         | ✓       | ✓       |                                   |
|                    | Edit Notes       | ✓       | ✓       | Audit logged                      |
|                    | Apply Discount   | ✓       | ✗       | Only at creation, requires reason |
| **Invoice**        | View All         | ✓       | ✗       |                                   |
|                    | View Own         | ✗       | ✗       | Dentists cannot view invoices     |
| **Payment**        | Create           | ✓       | ✗       |                                   |
|                    | View All         | ✓       | ✗       |                                   |
|                    | Void             | ✓       | ✗       | Requires reason                   |
| **Inventory Item** | Create           | ✓       | ✗       |                                   |
|                    | View             | ✓       | ✗       |                                   |
|                    | Edit             | ✓       | ✗       |                                   |
|                    | Deactivate       | ✓       | ✗       |                                   |
| **Inventory Txn**  | Create IN        | ✓       | ✗       |                                   |
|                    | Create OUT       | ✓       | ✗       |                                   |
|                    | View             | ✓       | ✗       |                                   |
|                    | Void             | ✓       | ✗       | Requires reason                   |
| **Medical Case**   | Create           | ✓       | ✗       |                                   |
|                    | View             | ✓       | ✓       |                                   |
|                    | Edit             | ✓       | ✗       |                                   |
|                    | Deactivate       | ✓       | ✗       |                                   |
| **User**           | Create           | ✓       | ✗       |                                   |
|                    | View All         | ✓       | ✓       | Dentist sees limited fields       |
|                    | Edit             | ✓       | ✗       | Own profile only for dentist      |
|                    | Deactivate       | ✓       | ✗       |                                   |
|                    | Change Role      | ✓       | ✗       | Audit logged                      |

### D2.2 Report Access Permissions

| Report                   | Manager | Dentist | Notes                          |
| ------------------------ | ------- | ------- | ------------------------------ |
| Collected Revenue        | ✓       | ✗       |                                |
| Deferred Receivables     | ✓       | ✗       | With aging breakdown           |
| Inventory Expenses       | ✓       | ✗       |                                |
| Net Profit               | ✓       | ✗       |                                |
| Dentist Earnings Summary | ✓       | ✗       | All dentists                   |
| Own Earnings             | ✓       | ✓       | Dentist sees only own earnings |
| Inventory Stock Summary  | ✓       | ✗       |                                |
| Patient Visit History    | ✓       | ✓       |                                |
| Appointment Schedule     | ✓       | ✓       |                                |

### D2.3 File/Attachment Access Permissions

| Resource           | Manager | Dentist | Notes                             |
| ------------------ | ------- | ------- | --------------------------------- |
| All Patient Files  | ✓       | ✗       |                                   |
| Own Patient Files  | ✓       | ✓       | Dentist sees files for own visits |
| Upload Attachments | ✓       | ✓       | To appointments/visits            |
| Delete Attachments | ✓       | ✗       | Soft-delete only                  |

### D2.4 System Administration Permissions

| Action                 | Manager | Dentist | Notes        |
| ---------------------- | ------- | ------- | ------------ |
| View Audit Logs        | ✓       | ✗       |              |
| Manage System Settings | ✓       | ✗       |              |
| Reset User Password    | ✓       | ✗       | Audit logged |
| View Login History     | ✓       | ✗       |              |

---

## DELIVERABLE 3: EDGE-CASE ENFORCEMENT LIST

### D3.1 Appointment Edge Cases

| ID    | Edge Case                                   | Expected Behavior                  | Error Code | Audited |
| ----- | ------------------------------------------- | ---------------------------------- | ---------- | ------- |
| A-001 | Complete appointment without creating visit | Forbidden - transactional creation | 500        | Yes     |
| A-002 | Overlapping appointments for same dentist   | Rejected at creation               | 409        | No      |
| A-003 | Appointment duration < 15 minutes           | Rejected at creation               | 422        | No      |
| A-004 | Appointment for inactive patient            | Rejected at creation               | 422        | No      |
| A-005 | Appointment for inactive dentist            | Rejected at creation               | 422        | No      |
| A-006 | Appointment with inactive medical case      | Rejected at creation               | 422        | No      |
| A-007 | Cancel without reason                       | Rejected                           | 422        | No      |
| A-008 | Modify COMPLETED appointment                | Rejected                           | 422        | No      |
| A-009 | Modify CANCELLED appointment                | Rejected                           | 422        | No      |
| A-010 | Revert COMPLETED to SCHEDULED               | Forbidden                          | 422        | No      |
| A-011 | Complete appointment in the future          | Allowed (manager discretion)       | -          | Yes     |
| A-012 | Appointment with past start_time (new)      | Rejected at creation               | 422        | No      |

### D3.2 Visit Edge Cases

| ID    | Edge Case                                 | Expected Behavior                  | Error Code | Audited |
| ----- | ----------------------------------------- | ---------------------------------- | ---------- | ------- |
| V-001 | Visit without appointment                 | Forbidden - system constraint      | 500        | Yes     |
| V-002 | Visit without invoice                     | Forbidden - transactional creation | 500        | Yes     |
| V-003 | Multiple visits for same appointment      | Forbidden - unique constraint      | 409        | No      |
| V-004 | Edit final_price after creation           | Rejected                           | 422        | No      |
| V-005 | Apply discount after invoice has payments | Forbidden                          | 422        | Yes     |
| V-006 | Discount without reason                   | Rejected                           | 422        | No      |
| V-007 | Discount by non-manager                   | Rejected                           | 403        | Yes     |
| V-008 | Negative final_price after discount       | Rejected (final_price >= 0)        | 422        | No      |

### D3.3 Invoice Edge Cases

| ID    | Edge Case                        | Expected Behavior             | Error Code | Audited |
| ----- | -------------------------------- | ----------------------------- | ---------- | ------- |
| I-001 | Invoice without visit            | Forbidden - system constraint | 500        | Yes     |
| I-002 | Multiple invoices for same visit | Forbidden - unique constraint | 409        | No      |
| I-003 | Edit invoice total_amount        | Rejected                      | 422        | No      |
| I-004 | Delete invoice                   | Forbidden                     | 422        | No      |
| I-005 | Invoice with zero total          | Allowed (free service)        | -          | Yes     |

### D3.4 Payment Edge Cases

| ID    | Edge Case                         | Expected Behavior                | Error Code | Audited |
| ----- | --------------------------------- | -------------------------------- | ---------- | ------- |
| P-001 | Payment exceeding invoice balance | Rejected (overpayment forbidden) | 422        | No      |
| P-002 | Payment on fully paid invoice     | Rejected                         | 422        | No      |
| P-003 | Negative payment amount           | Rejected                         | 422        | No      |
| P-004 | Zero payment amount               | Rejected                         | 422        | No      |
| P-005 | Edit existing payment             | Forbidden                        | 422        | No      |
| P-006 | Delete payment                    | Forbidden (use void instead)     | 422        | No      |
| P-007 | Void without reason               | Rejected                         | 422        | No      |
| P-008 | Void already voided payment       | Rejected                         | 422        | No      |
| P-009 | Reactivate voided payment         | Forbidden                        | 422        | No      |
| P-010 | Payment by dentist                | Rejected                         | 403        | Yes     |

### D3.5 Inventory Edge Cases

| ID    | Edge Case                               | Expected Behavior              | Error Code | Audited |
| ----- | --------------------------------------- | ------------------------------ | ---------- | ------- |
| N-001 | OUT exceeding available stock           | Rejected                       | 422        | No      |
| N-002 | OUT resulting in negative stock         | Rejected                       | 422        | No      |
| N-003 | IN with zero or negative quantity       | Rejected                       | 422        | No      |
| N-004 | IN with zero or negative unit_cost      | Rejected                       | 422        | No      |
| N-005 | OUT with unit_cost specified            | Ignored (OUT has no cost)      | -          | No      |
| N-006 | Void IN that would cause negative stock | Rejected                       | 422        | No      |
| N-007 | Transaction for inactive item           | Rejected                       | 422        | No      |
| N-008 | Delete inventory item with transactions | Forbidden (deactivate instead) | 422        | No      |

### D3.6 User/Authentication Edge Cases

| ID    | Edge Case                                   | Expected Behavior              | Error Code | Audited |
| ----- | ------------------------------------------- | ------------------------------ | ---------- | ------- |
| U-001 | Deactivate dentist with future appointments | Rejected                       | 422        | No      |
| U-002 | Deactivate last active manager              | Rejected                       | 422        | No      |
| U-003 | Login with inactive account                 | Rejected                       | 401        | Yes     |
| U-004 | Password less than 10 characters            | Rejected                       | 422        | No      |
| U-005 | Password without letters                    | Rejected                       | 422        | No      |
| U-006 | Password without numbers                    | Rejected                       | 422        | No      |
| U-007 | Brute force login attempts                  | Account locked after threshold | 401        | Yes     |
| U-008 | Expired access token                        | Rejected, use refresh token    | 401        | No      |
| U-009 | Expired refresh token                       | Re-authentication required     | 401        | Yes     |
| U-010 | Role change                                 | Audit logged                   | -          | Yes     |

### D3.7 Financial Calculation Edge Cases

| ID    | Edge Case                         | Expected Behavior                     | Error Code | Audited |
| ----- | --------------------------------- | ------------------------------------- | ---------- | ------- |
| F-001 | NetProfit <= 0                    | Dentist earnings = 0                  | -          | No      |
| F-002 | Sum of dentist percentages > 100% | Rejected at configuration             | 422        | No      |
| F-003 | Dentist percentage = 0            | Allowed (dentist earns nothing)       | -          | No      |
| F-004 | No payments in period             | Revenue = 0, Profit = -expenses       | -          | No      |
| F-005 | All payments voided               | Revenue recalculated excluding voided | -          | Yes     |

### D3.8 Medical Case Edge Cases

| ID    | Edge Case                                 | Expected Behavior                          | Error Code | Audited |
| ----- | ----------------------------------------- | ------------------------------------------ | ---------- | ------- |
| M-001 | Delete medical case with appointments     | Forbidden                                  | 422        | No      |
| M-002 | Edit base_price after usage               | Allowed (only affects future appointments) | -          | Yes     |
| M-003 | Deactivate medical case with future appts | Allowed (existing appointments unaffected) | -          | No      |

---

## DELIVERABLE 4: DECISION LOG

### Decision Log Format

Each decision follows this structure:

- **ID:** Unique identifier
- **Date:** Decision date
- **Section:** Affected specification section
- **Decision:** Final ruling
- **Rationale:** Justification
- **Status:** LOCKED

---

### D4.1 System-Wide Decisions

| ID      | Date       | Section          | Decision                             | Rationale                                         | Status |
| ------- | ---------- | ---------------- | ------------------------------------ | ------------------------------------------------- | ------ |
| DEC-001 | 2026-01-02 | 3.1 Language     | Arabic only, no English support      | Single clinic in Syria, simplifies implementation | LOCKED |
| DEC-002 | 2026-01-02 | 3.2 Clinic Scope | Single clinic only, no multi-branch  | Out of scope for initial release                  | LOCKED |
| DEC-003 | 2026-01-02 | 3.3 Timezone     | Damascus timezone for business logic | Clinic operates in Syria                          | LOCKED |
| DEC-004 | 2026-01-02 | 3.4 Currency     | SYP only, DECIMAL storage            | Local currency, precision required for accounting | LOCKED |

### D4.2 Accounting Decisions

| ID      | Date       | Section        | Decision                                     | Rationale                                      | Status |
| ------- | ---------- | -------------- | -------------------------------------------- | ---------------------------------------------- | ------ |
| DEC-005 | 2026-01-02 | 4.1 Accounting | Cash Basis Accounting enforced               | Revenue recognized only on payment collection  | LOCKED |
| DEC-006 | 2026-01-02 | 4.2 Revenue    | Revenue = sum of non-voided payments only    | Voided payments excluded from all calculations | LOCKED |
| DEC-007 | 2026-01-02 | 4.3 Refunds    | No refunds to patients                       | Cash basis, void is correction not refund      | LOCKED |
| DEC-008 | 2026-01-02 | 4.3 Inventory  | Expense at purchase (IN), not at usage (OUT) | Simplifies accounting, matches cash basis      | LOCKED |

### D4.3 Entity Lifecycle Decisions

| ID      | Date       | Section         | Decision                                        | Rationale                                              | Status |
| ------- | ---------- | --------------- | ----------------------------------------------- | ------------------------------------------------------ | ------ |
| DEC-009 | 2026-01-02 | 5.1 Appointment | Only Manager can change appointment status      | Financial implications require manager oversight       | LOCKED |
| DEC-010 | 2026-01-02 | 5.1 Appointment | COMPLETED and CANCELLED are terminal states     | Prevents data manipulation after financial events      | LOCKED |
| DEC-011 | 2026-01-02 | 5.2 Visit       | Visit auto-created on appointment completion    | Ensures visit always exists for completed appointments | LOCKED |
| DEC-012 | 2026-01-02 | 5.2 Visit       | Visit pricing is immutable after creation       | Financial integrity, audit compliance                  | LOCKED |
| DEC-013 | 2026-01-02 | 5.3 Invoice     | Invoice auto-created with visit (transactional) | Ensures invoice always exists for billing              | LOCKED |
| DEC-014 | 2026-01-02 | 5.3 Invoice     | Invoice status is derived, not stored           | Prevents status/payment mismatch                       | LOCKED |
| DEC-015 | 2026-01-02 | 5.4 Payment     | Payments are append-only with void capability   | Audit trail, no data loss                              | LOCKED |
| DEC-016 | 2026-01-02 | 5.4 Payment     | Void requires mandatory reason                  | Accountability and audit compliance                    | LOCKED |
| DEC-017 | 2026-01-02 | 5.5 Inventory   | OUT has no financial impact                     | Expense recognized at purchase, not usage              | LOCKED |

### D4.4 RBAC Decisions

| ID      | Date       | Section     | Decision                                          | Rationale                               | Status |
| ------- | ---------- | ----------- | ------------------------------------------------- | --------------------------------------- | ------ |
| DEC-018 | 2026-01-02 | 6.1 Roles   | Two roles only: Manager and Dentist               | Sufficient for clinic operations        | LOCKED |
| DEC-019 | 2026-01-02 | 6.3 Dentist | Dentist cannot view invoices or payments          | Financial data restricted to management | LOCKED |
| DEC-020 | 2026-01-02 | 6.3 Dentist | Dentist can view all patients and appointments    | Required for clinical workflow          | LOCKED |
| DEC-021 | 2026-01-02 | 6.3 Dentist | Dentist can add notes/attachments to appointments | Clinical documentation requirement      | LOCKED |
| DEC-022 | 2026-01-02 | 6.2 Manager | Only Manager can apply discounts                  | Financial control                       | LOCKED |

### D4.5 Data Integrity Decisions

| ID      | Date       | Section     | Decision                                     | Rationale                           | Status |
| ------- | ---------- | ----------- | -------------------------------------------- | ----------------------------------- | ------ |
| DEC-023 | 2026-01-02 | 7 Integrity | Hard delete forbidden system-wide            | Audit compliance, data preservation | LOCKED |
| DEC-024 | 2026-01-02 | 7 Integrity | All corrections are additive (void/reversal) | Maintains complete audit trail      | LOCKED |
| DEC-025 | 2026-01-02 | 7 Integrity | Referential integrity at database level      | Prevents orphan records             | LOCKED |
| DEC-026 | 2026-01-02 | 7 Integrity | Critical operations must be transactional    | Prevents partial state corruption   | LOCKED |

### D4.6 Business Rule Decisions

| ID      | Date       | Section         | Decision                                   | Rationale                                              | Status |
| ------- | ---------- | --------------- | ------------------------------------------ | ------------------------------------------------------ | ------ |
| DEC-027 | 2026-01-02 | 5.1 Appointment | Minimum appointment duration: 15 minutes   | Practical minimum for dental procedures                | LOCKED |
| DEC-028 | 2026-01-02 | 5.1 Appointment | No overlapping appointments per dentist    | Physical constraint - one dentist, one patient         | LOCKED |
| DEC-029 | 2026-01-02 | 5.4 Payment     | Overpayment strictly forbidden             | Prevents accounting complications                      | LOCKED |
| DEC-030 | 2026-01-02 | 5.5 Inventory   | Negative stock forbidden                   | Physical constraint - cannot use what doesn't exist    | LOCKED |
| DEC-031 | 2026-01-02 | 14 Profit       | Dentist earnings = 0 when NetProfit <= 0   | No earnings distribution when clinic is not profitable | LOCKED |
| DEC-032 | 2026-01-02 | 14 Profit       | Sum of dentist percentages must be <= 100% | Mathematical constraint                                | LOCKED |
| DEC-033 | 2026-01-02 | 5.2 Visit       | Discount after payment is forbidden        | Prevents retroactive price manipulation                | LOCKED |
| DEC-034 | 2026-01-02 | 5.2 Visit       | Discount requires mandatory reason         | Audit compliance and accountability                    | LOCKED |

### D4.7 Security Decisions

| ID      | Date       | Section          | Decision                                            | Rationale                              | Status |
| ------- | ---------- | ---------------- | --------------------------------------------------- | -------------------------------------- | ------ |
| DEC-035 | 2026-01-02 | 5 Authentication | Access token validity: 15 minutes                   | Security best practice                 | LOCKED |
| DEC-036 | 2026-01-02 | 5 Authentication | Refresh token validity: 7 days                      | Balance between security and usability | LOCKED |
| DEC-037 | 2026-01-02 | 5 Authentication | Minimum password: 10 chars with letters and numbers | Security requirement                   | LOCKED |
| DEC-038 | 2026-01-02 | 5 Authentication | Account lockout after repeated failures             | Brute force protection                 | LOCKED |

---

## 12. ACCEPTANCE CRITERIA

Phase 1 is accepted when:

- No ambiguous behavior remains
- All lifecycle transitions are explicit
- All financial logic is deterministic
- No developer assumptions are required
- The system is safe for medical and financial execution

---

## END OF PHASE 1 DOCUMENT
