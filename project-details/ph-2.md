# Dental Clinic Management System — Phase 2

## UX / UI Definition & Interaction Architecture

## Deterministic Interaction Layer (Locked)

---

## PHASE IDENTIFICATION

- **Phase:** 2
- **Name:** UX / UI Definition & Interaction Architecture
- **Depends On:** Phase 1 — System Definition & Decision Lock
- **Status:** Locked (after approval)

Phase 2 translates the locked system rules into a **non-ambiguous interaction model**.
The UI is treated as a **control and protection layer**, not a cosmetic layer.

---

## 1. PHASE OBJECTIVE

The objective of Phase 2 is to:

- Convert system rules into **explicit user interactions**
- Ensure every entity lifecycle is enforced through UI behavior
- Prevent invalid actions before they reach backend logic
- Eliminate developer interpretation of flows or permissions
- Align UX strictly with:
  - Accounting rules
  - RBAC rules
  - Audit requirements
  - Data immutability

At the end of this phase:

- Every screen
- Every action
- Every form
- Every button state  
  is **defined, justified, and constrained**.

---

## 2. PHASE SCOPE

### 2.1 In Scope

- Information Architecture (IA)
- Module & screen definitions
- User flows & transitions
- Form behavior & validation logic
- Role-based UI visibility
- Error & confirmation handling
- RTL enforcement (Arabic only)

### 2.2 Explicitly Out of Scope

- Visual branding
- UI styling & theming
- Frontend component implementation
- Backend APIs
- Database structure

---

## 3. INPUT ARTIFACTS (AUTHORITATIVE)

Phase 2 MUST strictly follow:

- Phase 1 locked specification
- Decision log
- Entity state machines
- RBAC matrix
- Edge-case enforcement rules

Any contradiction between UX and Phase 1 is **not allowed**.

---

## 4. INFORMATION ARCHITECTURE (IA)

### 4.1 Global Modules

The system UI MUST be organized into the following modules:

- Dashboard
- Patients
- Medical Cases
- Appointments
- Visits
- Invoices
- Payments
- Inventory
- Reports
- Audit Logs
- Users & Roles
- System Settings

Each module:

- Has a single functional purpose
- Is fully RBAC-protected
- Never exposes inaccessible actions

---

### 4.2 Role-Based Module Visibility

#### Manager

- Sees **all modules**

#### Dentist

Sees ONLY:

- Dashboard (limited)
- Patients (read-only)
- Appointments (read-only)
- Visits (read-only)
- Reports (own earnings only)

Dentist MUST NOT see:

- Payments
- Invoices
- Inventory
- Audit logs
- System settings
- Clinic-level financial data

Hidden modules must not appear in menus, breadcrumbs, or shortcuts.

---

## 5. SCREEN DEFINITIONS (BY MODULE)

---

### 5.1 Dashboard

#### Manager Dashboard

Displays:

- Today’s appointments (all dentists)
- Collected revenue (period-based)
- Deferred receivables total
- Inventory expenses
- Net profit indicator
- Alerts:
  - Overdue invoices
  - Low inventory stock

#### Dentist Dashboard

Displays:

- Today’s own appointments
- Completed visits (period-based)
- Own earnings summary (read-only)

No clinic-wide totals are visible.

---

### 5.2 Patients Module

#### Patient List

- Search by name or phone
- Status filter (active / inactive)
- No delete action
- Row click opens Patient Profile

#### Patient Profile

Tabs:

- Overview
- Appointments
- Visits
- Attachments

Rules:

- Dentist can view all patients
- Dentist cannot edit patient core data
- Deactivated patients cannot receive new appointments

---

### 5.3 Medical Cases Module (Manager Only)

#### Medical Case List

- Name
- Base price
- Status

Rules:

- Base price editable ONLY if case has never been used
- Deactivation hides case from new appointments
- No deletion allowed

---

### 5.4 Appointments Module

#### Calendar View

- Timezone: Damascus, Syria
- Dentist filter
- Status color indicators

#### Appointment Create / Edit (Manager Only)

Fields:

- Patient
- Dentist
- Medical case
- Start time / End time

Rules:

- Overlap prevention enforced before save
- Price is never editable here
- Cancellation requires reason + confirmation

#### Appointment Notes & Attachments

- Manager and Dentist may add:
  - Notes
  - Images
- Allowed only while status = SCHEDULED

---

### 5.5 Appointment Completion Flow (Critical)

Only Manager may:

- Change status from SCHEDULED → COMPLETED

On completion:

1. System creates Visit automatically
2. System redirects to Visit confirmation screen
3. Completion is irreversible

---

### 5.6 Visits Module

#### Visit View

Displays:

- Appointment reference
- Base price (read-only)
- Discount (Manager only)
- Final price (read-only)
- Notes
- Attachments

Rules:

- Dentist may add notes only
- Manager controls pricing
- Saving Visit is irreversible
- Editing final price is forbidden

---

### 5.7 Invoices Module (Manager Only)

#### Invoice View

Displays:

- Visit reference
- Total amount
- Paid amount
- Remaining balance
- Status

Rules:

- Invoice auto-created
- No manual creation
- No deletion
- Status is system-derived only

---

### 5.8 Payments Module (Manager Only)

#### Payment Entry

Fields:

- Invoice
- Amount
- Payment method (CASH only)
- Payment date

Rules:

- Amount cannot exceed remaining balance
- Zero-amount payments are forbidden
- Confirmation modal required
- Payment cannot be edited or deleted

#### Payment Correction

- Implemented as VOID payment
- Mandatory reason
- Audit logged
- Does not affect collected revenue

---

### 5.9 Inventory Module (Manager Only)

#### Inventory List

- Item name
- Current stock quantity

#### Inventory Transaction

- Direction: IN / OUT
- Quantity
- Unit cost (IN only)

Rules:

- OUT blocked if insufficient stock
- IN immediately affects expenses
- No edits or deletions

---

### 5.10 Reports Module

#### Manager Reports

- Collected revenue
- Deferred receivables
- Inventory expenses
- Net profit
- Dentist earnings
- Inventory summary

#### Dentist Reports

- Completed visits
- Earnings summary only

Exports allowed (PDF / CSV).

---

### 5.11 Audit Logs (Manager Only)

Displays:

- Actor
- Action
- Entity
- Timestamp
- Before / After snapshot

Read-only. Immutable.

---

## 6. FORM BEHAVIOR & VALIDATION

- Required fields clearly marked
- Disabled fields preferred over hidden fields
- No auto-save for financial data
- Confirmation dialogs required for:
  - Appointment completion
  - Payments
  - Inventory IN / OUT
  - Deactivation actions

---

## 7. ERROR PRESENTATION STRATEGY

### Error Types

- Validation → inline
- Authorization → blocking modal
- Business rule violation → descriptive message
- System error → generic message + reference ID

Errors must:

- Never expose technical details
- Prevent partial submission
- Clearly explain why action failed

---

## 8. RTL & LOCALIZATION RULES

- Full RTL enforcement
- Numbers remain LTR
- Currency always displayed as SYP
- Local date formats
- Layout mirroring enforced system-wide

---

## 9. UX INTEGRITY RULES (NON-NEGOTIABLE)

- No destructive action without confirmation
- No financial operation without audit
- No hidden side effects
- UI must always reflect backend truth
- Disabled actions must explain WHY

---

## 10. PHASE 2 DELIVERABLES

Phase 2 must produce:

1. Complete module & screen list
2. Defined flows for all operations
3. Role-based visibility matrix
4. Validation rules per form
5. UX constraints aligned with business rules

---

## DELIVERABLE 1: COMPLETE MODULE & SCREEN LIST

### D1.1 Module Registry

| Module ID | Module Name     | Primary Purpose                   | Manager | Dentist        |
| --------- | --------------- | --------------------------------- | ------- | -------------- |
| MOD-01    | Dashboard       | Overview and alerts               | ✓       | ✓ (limited)    |
| MOD-02    | Patients        | Patient management                | ✓       | ✓ (read-only)  |
| MOD-03    | Medical Cases   | Service/procedure definitions     | ✓       | ✗              |
| MOD-04    | Appointments    | Scheduling and status management  | ✓       | ✓ (read-only)  |
| MOD-05    | Visits          | Clinical records                  | ✓       | ✓ (notes only) |
| MOD-06    | Invoices        | Billing records                   | ✓       | ✗              |
| MOD-07    | Payments        | Payment collection and voiding    | ✓       | ✗              |
| MOD-08    | Inventory       | Stock management                  | ✓       | ✗              |
| MOD-09    | Reports         | Financial and operational reports | ✓       | ✓ (own only)   |
| MOD-10    | Audit Logs      | System activity tracking          | ✓       | ✗              |
| MOD-11    | Users & Roles   | User management                   | ✓       | ✗              |
| MOD-12    | System Settings | Clinic configuration              | ✓       | ✗              |

---

### D1.2 Screen Registry by Module

#### MOD-01: Dashboard

| Screen ID | Screen Name       | Description                        | Manager | Dentist |
| --------- | ----------------- | ---------------------------------- | ------- | ------- |
| SCR-0101  | Manager Dashboard | Full clinic overview               | ✓       | ✗       |
| SCR-0102  | Dentist Dashboard | Personal appointments and earnings | ✗       | ✓       |

#### MOD-02: Patients

| Screen ID | Screen Name     | Description                  | Manager | Dentist |
| --------- | --------------- | ---------------------------- | ------- | ------- |
| SCR-0201  | Patient List    | Searchable patient directory | ✓       | ✓       |
| SCR-0202  | Patient Create  | New patient form             | ✓       | ✗       |
| SCR-0203  | Patient Profile | Patient details with tabs    | ✓       | ✓       |
| SCR-0204  | Patient Edit    | Edit patient information     | ✓       | ✗       |

#### MOD-03: Medical Cases

| Screen ID | Screen Name         | Description           | Manager | Dentist |
| --------- | ------------------- | --------------------- | ------- | ------- |
| SCR-0301  | Medical Case List   | All medical cases     | ✓       | ✗       |
| SCR-0302  | Medical Case Create | New medical case form | ✓       | ✗       |
| SCR-0303  | Medical Case Edit   | Edit medical case     | ✓       | ✗       |

#### MOD-04: Appointments

| Screen ID | Screen Name          | Description                   | Manager | Dentist |
| --------- | -------------------- | ----------------------------- | ------- | ------- |
| SCR-0401  | Appointment Calendar | Calendar view with filters    | ✓       | ✓       |
| SCR-0402  | Appointment List     | Table view of appointments    | ✓       | ✓       |
| SCR-0403  | Appointment Create   | New appointment form          | ✓       | ✗       |
| SCR-0404  | Appointment Detail   | Appointment view with actions | ✓       | ✓       |
| SCR-0405  | Appointment Edit     | Edit scheduled appointment    | ✓       | ✗       |
| SCR-0406  | Appointment Complete | Completion confirmation flow  | ✓       | ✗       |
| SCR-0407  | Appointment Cancel   | Cancellation with reason      | ✓       | ✗       |

#### MOD-05: Visits

| Screen ID | Screen Name        | Description                    | Manager | Dentist |
| --------- | ------------------ | ------------------------------ | ------- | ------- |
| SCR-0501  | Visit List         | All visits                     | ✓       | ✓       |
| SCR-0502  | Visit Detail       | Visit record with pricing      | ✓       | ✓       |
| SCR-0503  | Visit Confirmation | Post-completion pricing screen | ✓       | ✗       |

#### MOD-06: Invoices

| Screen ID | Screen Name    | Description                  | Manager | Dentist |
| --------- | -------------- | ---------------------------- | ------- | ------- |
| SCR-0601  | Invoice List   | All invoices with status     | ✓       | ✗       |
| SCR-0602  | Invoice Detail | Invoice with payment history | ✓       | ✗       |

#### MOD-07: Payments

| Screen ID | Screen Name    | Description              | Manager | Dentist |
| --------- | -------------- | ------------------------ | ------- | ------- |
| SCR-0701  | Payment List   | All payments             | ✓       | ✗       |
| SCR-0702  | Payment Create | New payment entry        | ✓       | ✗       |
| SCR-0703  | Payment Detail | Payment record view      | ✓       | ✗       |
| SCR-0704  | Payment Void   | Void payment with reason | ✓       | ✗       |

#### MOD-08: Inventory

| Screen ID | Screen Name           | Description                    | Manager | Dentist |
| --------- | --------------------- | ------------------------------ | ------- | ------- |
| SCR-0801  | Inventory Item List   | All inventory items with stock | ✓       | ✗       |
| SCR-0802  | Inventory Item Create | New inventory item             | ✓       | ✗       |
| SCR-0803  | Inventory Item Edit   | Edit inventory item            | ✓       | ✗       |
| SCR-0804  | Inventory Transaction | IN/OUT transaction form        | ✓       | ✗       |
| SCR-0805  | Transaction History   | Transaction log per item       | ✓       | ✗       |

#### MOD-09: Reports

| Screen ID | Screen Name        | Description                     | Manager | Dentist |
| --------- | ------------------ | ------------------------------- | ------- | ------- |
| SCR-0901  | Revenue Report     | Collected revenue by period     | ✓       | ✗       |
| SCR-0902  | Receivables Report | Deferred receivables with aging | ✓       | ✗       |
| SCR-0903  | Expenses Report    | Inventory expenses              | ✓       | ✗       |
| SCR-0904  | Profit Report      | Net profit calculation          | ✓       | ✗       |
| SCR-0905  | Dentist Earnings   | All dentist earnings            | ✓       | ✗       |
| SCR-0906  | Own Earnings       | Personal earnings summary       | ✓       | ✓       |
| SCR-0907  | Inventory Summary  | Stock levels report             | ✓       | ✗       |
| SCR-0908  | Visit History      | Patient visit history           | ✓       | ✓       |

#### MOD-10: Audit Logs

| Screen ID | Screen Name      | Description                | Manager | Dentist |
| --------- | ---------------- | -------------------------- | ------- | ------- |
| SCR-1001  | Audit Log List   | Searchable audit entries   | ✓       | ✗       |
| SCR-1002  | Audit Log Detail | Full before/after snapshot | ✓       | ✗       |

#### MOD-11: Users & Roles

| Screen ID | Screen Name    | Description           | Manager | Dentist |
| --------- | -------------- | --------------------- | ------- | ------- |
| SCR-1101  | User List      | All system users      | ✓       | ✗       |
| SCR-1102  | User Create    | New user form         | ✓       | ✗       |
| SCR-1103  | User Profile   | User details          | ✓       | ✓ (own) |
| SCR-1104  | User Edit      | Edit user information | ✓       | ✗       |
| SCR-1105  | Password Reset | Reset user password   | ✓       | ✗       |

#### MOD-12: System Settings

| Screen ID | Screen Name         | Description                | Manager | Dentist |
| --------- | ------------------- | -------------------------- | ------- | ------- |
| SCR-1201  | General Settings    | Clinic configuration       | ✓       | ✗       |
| SCR-1202  | Dentist Percentages | Profit share configuration | ✓       | ✗       |

---

## DELIVERABLE 2: DEFINED FLOWS FOR ALL OPERATIONS

### D2.1 Authentication Flows

#### FLOW-AUTH-01: Login

```
[Login Screen]
    ↓
[Enter credentials]
    ↓
[Validate] ──(invalid)──→ [Show error, remain on login]
    ↓ (valid)
[Generate tokens]
    ↓
[Redirect to Dashboard (role-appropriate)]
    ↓
[Audit: LOGIN event]
```

#### FLOW-AUTH-02: Logout

```
[Any Screen]
    ↓
[Click Logout]
    ↓
[Revoke refresh token]
    ↓
[Clear session]
    ↓
[Redirect to Login]
    ↓
[Audit: LOGOUT event]
```

#### FLOW-AUTH-03: Token Refresh

```
[Access token expired]
    ↓
[Send refresh token]
    ↓
[Validate refresh] ──(invalid/expired)──→ [Redirect to Login]
    ↓ (valid)
[Issue new access token]
    ↓
[Continue operation]
```

---

### D2.2 Patient Flows

#### FLOW-PAT-01: Create Patient

```
[Patient List] → [+ New Patient]
    ↓
[SCR-0202: Patient Create Form]
    ↓
[Fill required fields: full_name, phone]
    ↓
[Validate] ──(invalid)──→ [Show inline errors]
    ↓ (valid)
[Save]
    ↓
[Redirect to Patient Profile]
    ↓
[Audit: PATIENT_CREATED]
```

#### FLOW-PAT-02: Deactivate Patient

```
[Patient Profile] → [Deactivate]
    ↓
[Confirmation Modal: "هل أنت متأكد؟"]
    ↓
[Confirm] ──(cancel)──→ [Close modal]
    ↓
[Set is_active = false]
    ↓
[Refresh Profile (show inactive badge)]
    ↓
[Audit: PATIENT_DEACTIVATED]
```

---

### D2.3 Medical Case Flows

#### FLOW-MC-01: Create Medical Case

```
[Medical Case List] → [+ New Case]
    ↓
[SCR-0302: Medical Case Create Form]
    ↓
[Fill: name, base_price_syp, description]
    ↓
[Validate] ──(invalid)──→ [Show inline errors]
    ↓ (valid)
[Save]
    ↓
[Redirect to Medical Case List]
    ↓
[Audit: MEDICAL_CASE_CREATED]
```

#### FLOW-MC-02: Edit Medical Case Price

```
[Medical Case Edit]
    ↓
[Check: has_appointments?]
    ↓ (yes)
[base_price field DISABLED with tooltip: "لا يمكن تعديل السعر بعد الاستخدام"]
    ↓ (no)
[base_price field ENABLED]
    ↓
[Save]
    ↓
[Audit: MEDICAL_CASE_UPDATED (if price changed)]
```

---

### D2.4 Appointment Flows

#### FLOW-APT-01: Create Appointment

```
[Appointment Calendar] → [+ New Appointment]
    ↓
[SCR-0403: Appointment Create Form]
    ↓
[Select: patient, dentist, medical_case, start_time, end_time]
    ↓
[Validate:]
    - Patient is active?
    - Dentist is active?
    - Medical case is active?
    - Duration >= 15 minutes?
    - No overlap with dentist's other appointments?
    - Start time is in future?
    ↓ (any fail)
[Show specific error message]
    ↓ (all pass)
[Snapshot base_price from medical_case]
    ↓
[Save with status = SCHEDULED]
    ↓
[Redirect to Calendar]
    ↓
[Audit: APPOINTMENT_CREATED]
```

#### FLOW-APT-02: Complete Appointment (CRITICAL)

```
[Appointment Detail (status = SCHEDULED)]
    ↓
[Click "إكمال الموعد"]
    ↓
[Confirmation Modal:]
    "سيتم إنشاء زيارة وفاتورة. هذا الإجراء لا يمكن التراجع عنه."
    [إلغاء] [تأكيد]
    ↓ (cancel)
[Close modal]
    ↓ (confirm)
[BEGIN TRANSACTION]
    ↓
[Set appointment.status = COMPLETED]
    ↓
[Create Visit with pricing snapshot]
    ↓
[Create Invoice with total = visit.final_price]
    ↓
[COMMIT TRANSACTION]
    ↓
[Redirect to SCR-0503: Visit Confirmation]
    ↓
[Audit: APPOINTMENT_COMPLETED, VISIT_CREATED, INVOICE_CREATED]
```

#### FLOW-APT-03: Cancel Appointment

```
[Appointment Detail (status = SCHEDULED)]
    ↓
[Click "إلغاء الموعد"]
    ↓
[Modal: Select cancellation reason]
    - NO_SHOW
    - PATIENT_CANCELLED
    - CLINIC_CANCELLED
    ↓
[Reason selected?] ──(no)──→ [Disable confirm button]
    ↓ (yes)
[Confirm]
    ↓
[Set appointment.status = CANCELLED]
[Set appointment.cancellation_reason = selected]
    ↓
[Redirect to Calendar]
    ↓
[Audit: APPOINTMENT_CANCELLED]
```

#### FLOW-APT-04: Add Notes/Attachments (Dentist Allowed)

```
[Appointment Detail (status = SCHEDULED)]
    ↓
[Add Note or Upload Attachment]
    ↓
[Save]
    ↓
[Refresh view]
    ↓
[Audit: APPOINTMENT_NOTE_ADDED / ATTACHMENT_ADDED]
```

---

### D2.5 Visit Flows

#### FLOW-VIS-01: Visit Confirmation (Post-Completion)

```
[Redirected from Appointment Completion]
    ↓
[SCR-0503: Visit Confirmation]
    ↓
[Display:]
    - base_price_syp (read-only)
    - Discount section (Manager only):
        - discount_type: NONE / PERCENT / FIXED
        - discount_value
        - discount_reason (required if discount applied)
    - final_price_syp (calculated, read-only)
    ↓
[Manager applies discount?]
    ↓ (yes)
[Validate: final_price >= 0]
[Validate: discount_reason provided]
    ↓ (no discount or valid)
[Save Visit]
    ↓
[Visit pricing now IMMUTABLE]
    ↓
[Redirect to Visit Detail]
    ↓
[Audit: VISIT_DISCOUNT_APPLIED (if applicable)]
```

#### FLOW-VIS-02: Edit Visit Notes

```
[Visit Detail]
    ↓
[Edit notes field]
    ↓
[Save]
    ↓
[Audit: VISIT_NOTES_UPDATED (before/after)]
```

---

### D2.6 Invoice Flows

#### FLOW-INV-01: View Invoice

```
[Invoice List] → [Click row]
    ↓
[SCR-0602: Invoice Detail]
    ↓
[Display:]
    - Visit reference
    - total_amount_syp (immutable)
    - paid_amount_syp (sum of active payments)
    - remaining_balance (calculated)
    - status (derived: UNPAID / PARTIALLY_PAID / PAID)
    - Payment history table
    ↓
[If remaining_balance > 0:]
    [Show "إضافة دفعة" button]
```

---

### D2.7 Payment Flows

#### FLOW-PAY-01: Create Payment

```
[Invoice Detail] → [+ إضافة دفعة]
    ↓
[SCR-0702: Payment Create Form]
    ↓
[Fields:]
    - amount_syp (max = remaining_balance)
    - payment_method: CASH / CARD / TRANSFER
    - payment_date (default: today)
    ↓
[Validate:]
    - amount > 0?
    - amount <= remaining_balance?
    ↓ (fail)
[Show error: "المبلغ يتجاوز الرصيد المتبقي"]
    ↓ (pass)
[Confirmation Modal:]
    "سيتم تسجيل دفعة بمبلغ [X] ل.س. هذا الإجراء لا يمكن التراجع عنه."
    ↓
[Confirm]
    ↓
[Create Payment with status = ACTIVE]
    ↓
[Update invoice.paid_amount (derived)]
    ↓
[Redirect to Invoice Detail]
    ↓
[Audit: PAYMENT_CREATED]
```

#### FLOW-PAY-02: Void Payment

```
[Payment Detail] → [إلغاء الدفعة]
    ↓
[Check: payment.status = ACTIVE?] ──(no)──→ [Button disabled]
    ↓ (yes)
[Modal: Enter void_reason (required)]
    ↓
[Reason provided?] ──(no)──→ [Disable confirm]
    ↓ (yes)
[Confirm]
    ↓
[Set payment.status = VOIDED]
[Set payment.void_reason = entered]
[Set payment.voided_at = now]
    ↓
[Recalculate invoice status]
    ↓
[Redirect to Invoice Detail]
    ↓
[Audit: PAYMENT_VOIDED]
```

---

### D2.8 Inventory Flows

#### FLOW-INV-01: Create Inventory Item

```
[Inventory List] → [+ New Item]
    ↓
[SCR-0802: Inventory Item Create]
    ↓
[Fields: name]
    ↓
[Save]
    ↓
[Redirect to Inventory List]
    ↓
[Audit: INVENTORY_ITEM_CREATED]
```

#### FLOW-INV-02: Inventory IN Transaction

```
[Inventory Item] → [+ IN]
    ↓
[SCR-0804: Transaction Form (direction = IN)]
    ↓
[Fields:]
    - quantity (required, > 0)
    - unit_cost_syp (required, > 0)
    ↓
[Validate]
    ↓
[Confirmation Modal:]
    "سيتم إضافة [X] وحدة بتكلفة [Y] ل.س. سيتم احتساب المصروف فوراً."
    ↓
[Confirm]
    ↓
[Create transaction with status = ACTIVE]
    ↓
[Update current_stock]
    ↓
[Audit: INVENTORY_IN]
```

#### FLOW-INV-03: Inventory OUT Transaction

```
[Inventory Item] → [- OUT]
    ↓
[SCR-0804: Transaction Form (direction = OUT)]
    ↓
[Fields:]
    - quantity (required, > 0)
    ↓
[Validate: quantity <= current_stock?]
    ↓ (fail)
[Error: "الكمية المطلوبة تتجاوز المخزون المتاح"]
    ↓ (pass)
[Confirmation Modal:]
    "سيتم سحب [X] وحدة من المخزون."
    ↓
[Confirm]
    ↓
[Create transaction with status = ACTIVE]
    ↓
[Update current_stock]
    ↓
[Audit: INVENTORY_OUT]
```

---

### D2.9 User Management Flows

#### FLOW-USR-01: Create User

```
[User List] → [+ New User]
    ↓
[SCR-1102: User Create Form]
    ↓
[Fields:]
    - full_name
    - username
    - password (min 10 chars, letters + numbers)
    - role (Manager / Dentist)
    - profit_percentage (if Dentist)
    ↓
[Validate password policy]
[Validate: sum of all dentist percentages <= 100%]
    ↓
[Save]
    ↓
[Audit: USER_CREATED]
```

#### FLOW-USR-02: Deactivate User

```
[User Profile] → [Deactivate]
    ↓
[Check: Is Dentist with future appointments?]
    ↓ (yes)
[Error: "لا يمكن تعطيل طبيب لديه مواعيد مستقبلية"]
    ↓ (no)
[Check: Is last active Manager?]
    ↓ (yes)
[Error: "لا يمكن تعطيل آخر مدير نشط"]
    ↓ (no)
[Confirmation Modal]
    ↓
[Confirm]
    ↓
[Set is_active = false]
    ↓
[Audit: USER_DEACTIVATED]
```

---

## DELIVERABLE 3: ROLE-BASED VISIBILITY MATRIX

### D3.1 Navigation Menu Visibility

| Menu Item      | Manager | Dentist | Notes                      |
| -------------- | ------- | ------- | -------------------------- |
| لوحة التحكم    | ✓       | ✓       | Different content per role |
| المرضى         | ✓       | ✓       | Dentist: read-only         |
| الحالات الطبية | ✓       | ✗       | Hidden from menu           |
| المواعيد       | ✓       | ✓       | Dentist: read-only         |
| الزيارات       | ✓       | ✓       | Dentist: notes only        |
| الفواتير       | ✓       | ✗       | Hidden from menu           |
| المدفوعات      | ✓       | ✗       | Hidden from menu           |
| المخزون        | ✓       | ✗       | Hidden from menu           |
| التقارير       | ✓       | ✓       | Dentist: limited reports   |
| سجل المراجعة   | ✓       | ✗       | Hidden from menu           |
| المستخدمين     | ✓       | ✗       | Hidden from menu           |
| الإعدادات      | ✓       | ✗       | Hidden from menu           |

### D3.2 Action Button Visibility

| Screen               | Action            | Manager | Dentist | Condition           |
| -------------------- | ----------------- | ------- | ------- | ------------------- |
| Patient List         | + New Patient     | ✓       | ✗       |                     |
| Patient Profile      | Edit              | ✓       | ✗       |                     |
| Patient Profile      | Deactivate        | ✓       | ✗       | Only if active      |
| Appointment Calendar | + New Appointment | ✓       | ✗       |                     |
| Appointment Detail   | Edit              | ✓       | ✗       | Only if SCHEDULED   |
| Appointment Detail   | Complete          | ✓       | ✗       | Only if SCHEDULED   |
| Appointment Detail   | Cancel            | ✓       | ✗       | Only if SCHEDULED   |
| Appointment Detail   | Add Note          | ✓       | ✓       | Only if SCHEDULED   |
| Appointment Detail   | Add Attachment    | ✓       | ✓       | Only if SCHEDULED   |
| Visit Detail         | Edit Notes        | ✓       | ✓       |                     |
| Visit Confirmation   | Apply Discount    | ✓       | ✗       |                     |
| Invoice Detail       | + Add Payment     | ✓       | ✗       | Only if balance > 0 |
| Payment Detail       | Void              | ✓       | ✗       | Only if ACTIVE      |
| Inventory Item       | + IN              | ✓       | ✗       |                     |
| Inventory Item       | - OUT             | ✓       | ✗       | Only if stock > 0   |
| User List            | + New User        | ✓       | ✗       |                     |
| User Profile         | Deactivate        | ✓       | ✗       | With constraints    |

### D3.3 Field Visibility by Role

| Screen          | Field                | Manager | Dentist | Notes                  |
| --------------- | -------------------- | ------- | ------- | ---------------------- |
| Dashboard       | Collected Revenue    | ✓       | ✗       |                        |
| Dashboard       | Deferred Receivables | ✓       | ✗       |                        |
| Dashboard       | Net Profit           | ✓       | ✗       |                        |
| Dashboard       | Inventory Expenses   | ✓       | ✗       |                        |
| Dashboard       | Own Earnings         | ✓       | ✓       |                        |
| Visit Detail    | base_price           | ✓       | ✓       | Read-only for both     |
| Visit Detail    | discount_type        | ✓       | ✗       |                        |
| Visit Detail    | discount_value       | ✓       | ✗       |                        |
| Visit Detail    | final_price          | ✓       | ✓       | Read-only for both     |
| Patient Profile | Invoice History      | ✓       | ✗       | Tab hidden for dentist |
| Patient Profile | Payment History      | ✓       | ✗       | Tab hidden for dentist |

### D3.4 Report Visibility

| Report                | Manager | Dentist | Notes                 |
| --------------------- | ------- | ------- | --------------------- |
| Collected Revenue     | ✓       | ✗       |                       |
| Deferred Receivables  | ✓       | ✗       | With aging breakdown  |
| Inventory Expenses    | ✓       | ✗       |                       |
| Net Profit            | ✓       | ✗       |                       |
| All Dentist Earnings  | ✓       | ✗       |                       |
| Own Earnings          | ✓       | ✓       | Dentist sees only own |
| Inventory Summary     | ✓       | ✗       |                       |
| Patient Visit History | ✓       | ✓       |                       |
| Appointment Schedule  | ✓       | ✓       |                       |

---

## DELIVERABLE 4: VALIDATION RULES PER FORM

### D4.1 Patient Forms

#### SCR-0202: Patient Create

| Field     | Type     | Required | Validation                 | Error Message                          |
| --------- | -------- | -------- | -------------------------- | -------------------------------------- |
| full_name | text     | ✓        | min 2 chars, max 100 chars | الاسم مطلوب ويجب أن يكون بين 2-100 حرف |
| phone     | text     | ✓        | valid phone format         | رقم الهاتف غير صالح                    |
| notes     | textarea | ✗        | max 1000 chars             | الملاحظات تتجاوز الحد المسموح          |

#### SCR-0204: Patient Edit

| Field     | Type     | Required | Validation                 | Error Message                          |
| --------- | -------- | -------- | -------------------------- | -------------------------------------- |
| full_name | text     | ✓        | min 2 chars, max 100 chars | الاسم مطلوب ويجب أن يكون بين 2-100 حرف |
| phone     | text     | ✓        | valid phone format         | رقم الهاتف غير صالح                    |
| notes     | textarea | ✗        | max 1000 chars             | الملاحظات تتجاوز الحد المسموح          |

---

### D4.2 Medical Case Forms

#### SCR-0302: Medical Case Create

| Field          | Type     | Required | Validation                 | Error Message                  |
| -------------- | -------- | -------- | -------------------------- | ------------------------------ |
| name           | text     | ✓        | min 2 chars, max 100 chars | اسم الحالة مطلوب               |
| base_price_syp | number   | ✓        | > 0, integer               | السعر يجب أن يكون رقماً موجباً |
| description    | textarea | ✗        | max 500 chars              | الوصف يتجاوز الحد المسموح      |

#### SCR-0303: Medical Case Edit

| Field          | Type     | Required | Validation                 | Error Message                  | Condition        |
| -------------- | -------- | -------- | -------------------------- | ------------------------------ | ---------------- |
| name           | text     | ✓        | min 2 chars, max 100 chars | اسم الحالة مطلوب               |                  |
| base_price_syp | number   | ✓        | > 0, integer               | السعر يجب أن يكون رقماً موجباً | DISABLED if used |
| description    | textarea | ✗        | max 500 chars              | الوصف يتجاوز الحد المسموح      |                  |

---

### D4.3 Appointment Forms

#### SCR-0403: Appointment Create

| Field           | Type     | Required | Validation             | Error Message                             |
| --------------- | -------- | -------- | ---------------------- | ----------------------------------------- |
| patient_id      | select   | ✓        | must be active patient | يجب اختيار مريض نشط                       |
| dentist_id      | select   | ✓        | must be active dentist | يجب اختيار طبيب نشط                       |
| medical_case_id | select   | ✓        | must be active case    | يجب اختيار حالة طبية نشطة                 |
| start_time      | datetime | ✓        | must be in future      | وقت البداية يجب أن يكون في المستقبل       |
| end_time        | datetime | ✓        | > start_time           | وقت النهاية يجب أن يكون بعد البداية       |
| -               | -        | -        | duration >= 15 min     | مدة الموعد يجب أن تكون 15 دقيقة على الأقل |
| -               | -        | -        | no overlap for dentist | يوجد تعارض مع موعد آخر للطبيب             |

#### SCR-0405: Appointment Edit

| Field           | Type     | Required | Validation                       | Error Message                             | Condition |
| --------------- | -------- | -------- | -------------------------------- | ----------------------------------------- | --------- |
| patient_id      | select   | ✓        | must be active patient           | يجب اختيار مريض نشط                       | DISABLED  |
| dentist_id      | select   | ✓        | must be active dentist           | يجب اختيار طبيب نشط                       |           |
| medical_case_id | select   | ✓        | must be active case              | يجب اختيار حالة طبية نشطة                 |           |
| start_time      | datetime | ✓        | must be in future                | وقت البداية يجب أن يكون في المستقبل       |           |
| end_time        | datetime | ✓        | > start_time, duration >= 15 min | مدة الموعد يجب أن تكون 15 دقيقة على الأقل |           |

#### SCR-0407: Appointment Cancel

| Field               | Type   | Required | Validation      | Error Message         |
| ------------------- | ------ | -------- | --------------- | --------------------- |
| cancellation_reason | select | ✓        | must select one | يجب تحديد سبب الإلغاء |

---

### D4.4 Visit Forms

#### SCR-0503: Visit Confirmation

| Field           | Type   | Required | Validation                   | Error Message                        | Condition        |
| --------------- | ------ | -------- | ---------------------------- | ------------------------------------ | ---------------- |
| base_price_syp  | number | -        | -                            | -                                    | READ-ONLY        |
| discount_type   | select | ✗        | NONE / PERCENT / FIXED       | -                                    | Manager only     |
| discount_value  | number | cond.    | required if type != NONE     | قيمة الخصم مطلوبة                    | Manager only     |
| discount_value  | number | cond.    | if PERCENT: 0-100            | نسبة الخصم يجب أن تكون بين 0-100     |                  |
| discount_value  | number | cond.    | if FIXED: <= base_price      | قيمة الخصم تتجاوز السعر الأساسي      |                  |
| discount_reason | text   | cond.    | required if discount applied | سبب الخصم مطلوب                      | Manager only     |
| final_price_syp | number | -        | >= 0                         | السعر النهائي لا يمكن أن يكون سالباً | READ-ONLY (calc) |

---

### D4.5 Payment Forms

#### SCR-0702: Payment Create

| Field          | Type   | Required | Validation             | Error Message                           |
| -------------- | ------ | -------- | ---------------------- | --------------------------------------- |
| amount_syp     | number | ✓        | > 0                    | المبلغ يجب أن يكون أكبر من صفر          |
| amount_syp     | number | ✓        | <= remaining_balance   | المبلغ يتجاوز الرصيد المتبقي            |
| payment_method | select | ✓        | CASH / CARD / TRANSFER | يجب تحديد طريقة الدفع                   |
| payment_date   | date   | ✓        | <= today               | تاريخ الدفع لا يمكن أن يكون في المستقبل |

#### SCR-0704: Payment Void

| Field       | Type     | Required | Validation                 | Error Message                        |
| ----------- | -------- | -------- | -------------------------- | ------------------------------------ |
| void_reason | textarea | ✓        | min 5 chars, max 500 chars | سبب الإلغاء مطلوب (5 أحرف على الأقل) |

---

### D4.6 Inventory Forms

#### SCR-0802: Inventory Item Create

| Field | Type | Required | Validation                 | Error Message    |
| ----- | ---- | -------- | -------------------------- | ---------------- |
| name  | text | ✓        | min 2 chars, max 100 chars | اسم المادة مطلوب |

#### SCR-0804: Inventory Transaction (IN)

| Field         | Type   | Required | Validation   | Error Message                         |
| ------------- | ------ | -------- | ------------ | ------------------------------------- |
| quantity      | number | ✓        | > 0, integer | الكمية يجب أن تكون رقماً موجباً       |
| unit_cost_syp | number | ✓        | > 0          | تكلفة الوحدة يجب أن تكون رقماً موجباً |

#### SCR-0804: Inventory Transaction (OUT)

| Field    | Type   | Required | Validation       | Error Message                         |
| -------- | ------ | -------- | ---------------- | ------------------------------------- |
| quantity | number | ✓        | > 0, integer     | الكمية يجب أن تكون رقماً موجباً       |
| quantity | number | ✓        | <= current_stock | الكمية المطلوبة تتجاوز المخزون المتاح |

---

### D4.7 User Forms

#### SCR-1102: User Create

| Field             | Type     | Required | Validation                 | Error Message                             |
| ----------------- | -------- | -------- | -------------------------- | ----------------------------------------- |
| full_name         | text     | ✓        | min 2 chars, max 100 chars | الاسم مطلوب                               |
| username          | text     | ✓        | min 4 chars, unique        | اسم المستخدم مطلوب ويجب أن يكون فريداً    |
| password          | password | ✓        | min 10 chars               | كلمة المرور يجب أن تكون 10 أحرف على الأقل |
| password          | password | ✓        | contains letters           | كلمة المرور يجب أن تحتوي على أحرف         |
| password          | password | ✓        | contains numbers           | كلمة المرور يجب أن تحتوي على أرقام        |
| role              | select   | ✓        | Manager / Dentist          | يجب تحديد الدور                           |
| profit_percentage | number   | cond.    | required if Dentist, 0-100 | نسبة الأرباح مطلوبة للطبيب                |
| -                 | -        | -        | sum(all %) <= 100          | مجموع نسب الأطباء يتجاوز 100%             |

#### SCR-1105: Password Reset

| Field        | Type     | Required | Validation                      | Error Message                |
| ------------ | -------- | -------- | ------------------------------- | ---------------------------- |
| new_password | password | ✓        | min 10 chars, letters + numbers | كلمة المرور لا تستوفي الشروط |

---

## DELIVERABLE 5: UX CONSTRAINTS ALIGNED WITH BUSINESS RULES

### D5.1 Financial Immutability Constraints

| Constraint ID | Rule                                | UX Enforcement                           |
| ------------- | ----------------------------------- | ---------------------------------------- |
| UX-FIN-01     | Visit final_price is immutable      | Field always disabled after save         |
| UX-FIN-02     | Invoice total_amount is immutable   | No edit button, field always disabled    |
| UX-FIN-03     | Payments cannot be edited           | No edit action available                 |
| UX-FIN-04     | Payments cannot be deleted          | No delete action, only void              |
| UX-FIN-05     | Discount after payment is forbidden | Discount fields hidden if payments exist |
| UX-FIN-06     | Overpayment is forbidden            | Amount field max = remaining_balance     |

### D5.2 State-Based Action Constraints

| Constraint ID | Entity      | State     | Allowed Actions                   | Forbidden Actions                 |
| ------------- | ----------- | --------- | --------------------------------- | --------------------------------- |
| UX-STA-01     | Appointment | SCHEDULED | Edit, Complete, Cancel, Add Notes | -                                 |
| UX-STA-02     | Appointment | COMPLETED | View only                         | Edit, Complete, Cancel, Add Notes |
| UX-STA-03     | Appointment | CANCELLED | View only                         | Edit, Complete, Cancel, Add Notes |
| UX-STA-04     | Payment     | ACTIVE    | View, Void                        | Edit, Delete                      |
| UX-STA-05     | Payment     | VOIDED    | View only                         | Edit, Delete, Void                |
| UX-STA-06     | Patient     | INACTIVE  | View, Reactivate                  | New Appointment                   |
| UX-STA-07     | User        | INACTIVE  | View, Reactivate                  | Login                             |

### D5.3 Confirmation Requirements

| Action               | Confirmation Required | Confirmation Type | Message Template                           |
| -------------------- | --------------------- | ----------------- | ------------------------------------------ |
| Complete Appointment | ✓                     | Modal             | سيتم إنشاء زيارة وفاتورة. لا يمكن التراجع. |
| Cancel Appointment   | ✓                     | Modal + Reason    | يجب تحديد سبب الإلغاء.                     |
| Create Payment       | ✓                     | Modal             | سيتم تسجيل دفعة بمبلغ [X] ل.س.             |
| Void Payment         | ✓                     | Modal + Reason    | سيتم إلغاء الدفعة. يجب تحديد السبب.        |
| Inventory IN         | ✓                     | Modal             | سيتم إضافة [X] وحدة. سيتم احتساب المصروف.  |
| Inventory OUT        | ✓                     | Modal             | سيتم سحب [X] وحدة من المخزون.              |
| Deactivate Patient   | ✓                     | Modal             | هل أنت متأكد من تعطيل هذا المريض؟          |
| Deactivate User      | ✓                     | Modal             | هل أنت متأكد من تعطيل هذا المستخدم؟        |
| Apply Discount       | ✓                     | Inline            | سبب الخصم مطلوب.                           |

### D5.4 Disabled State Explanations

| Element                   | Condition                 | Tooltip / Explanation                   |
| ------------------------- | ------------------------- | --------------------------------------- |
| Complete Button           | Appointment not SCHEDULED | الموعد ليس في حالة مجدول                |
| Cancel Button             | Appointment not SCHEDULED | لا يمكن إلغاء موعد مكتمل أو ملغى        |
| Edit Appointment          | Appointment not SCHEDULED | لا يمكن تعديل موعد مكتمل أو ملغى        |
| Add Payment Button        | Invoice fully paid        | الفاتورة مدفوعة بالكامل                 |
| Void Payment Button       | Payment already voided    | الدفعة ملغاة مسبقاً                     |
| base_price (Medical Case) | Case has been used        | لا يمكن تعديل السعر بعد الاستخدام       |
| Discount Fields           | Invoice has payments      | لا يمكن تطبيق خصم بعد استلام دفعات      |
| Inventory OUT Button      | Stock = 0                 | لا يوجد مخزون متاح                      |
| Deactivate Dentist        | Has future appointments   | لا يمكن تعطيل طبيب لديه مواعيد مستقبلية |
| Deactivate Manager        | Last active manager       | لا يمكن تعطيل آخر مدير نشط              |
| New Appointment           | Patient inactive          | لا يمكن حجز موعد لمريض غير نشط          |

### D5.5 Audit Trigger Points

| Action                     | Audit Event                | Captured Data                          |
| -------------------------- | -------------------------- | -------------------------------------- |
| Login                      | AUTH_LOGIN                 | user_id, timestamp, IP                 |
| Logout                     | AUTH_LOGOUT                | user_id, timestamp                     |
| Patient Created            | PATIENT_CREATED            | patient_id, created_by                 |
| Patient Deactivated        | PATIENT_DEACTIVATED        | patient_id, deactivated_by             |
| Appointment Created        | APPOINTMENT_CREATED        | appointment_id, created_by             |
| Appointment Completed      | APPOINTMENT_COMPLETED      | appointment_id, completed_by           |
| Appointment Cancelled      | APPOINTMENT_CANCELLED      | appointment_id, reason, cancelled_by   |
| Visit Created              | VISIT_CREATED              | visit_id, appointment_id               |
| Visit Discount Applied     | VISIT_DISCOUNT_APPLIED     | visit_id, discount_type, value, reason |
| Visit Notes Updated        | VISIT_NOTES_UPDATED        | visit_id, before, after                |
| Invoice Created            | INVOICE_CREATED            | invoice_id, visit_id, total            |
| Payment Created            | PAYMENT_CREATED            | payment_id, invoice_id, amount, method |
| Payment Voided             | PAYMENT_VOIDED             | payment_id, void_reason, voided_by     |
| Inventory IN               | INVENTORY_IN               | item_id, quantity, unit_cost           |
| Inventory OUT              | INVENTORY_OUT              | item_id, quantity                      |
| User Created               | USER_CREATED               | user_id, role, created_by              |
| User Deactivated           | USER_DEACTIVATED           | user_id, deactivated_by                |
| User Role Changed          | USER_ROLE_CHANGED          | user_id, old_role, new_role            |
| Password Reset             | PASSWORD_RESET             | user_id, reset_by                      |
| Medical Case Price Changed | MEDICAL_CASE_PRICE_CHANGED | case_id, old_price, new_price          |

### D5.6 Error Prevention Matrix

| Error Type              | Prevention Method                 | Fallback                                |
| ----------------------- | --------------------------------- | --------------------------------------- |
| Overlapping Appointment | Real-time validation on date pick | Server rejection with clear message     |
| Overpayment             | Max amount = remaining_balance    | Server rejection                        |
| Negative Stock          | OUT button disabled if stock = 0  | Server rejection                        |
| Invalid Password        | Real-time validation feedback     | Server rejection with requirements list |
| Duplicate Username      | Async check on blur               | Server rejection                        |
| Percentage > 100%       | Sum calculated in real-time       | Server rejection                        |
| Past Appointment        | Date picker min = now             | Server rejection                        |
| Short Duration          | End time auto-adjusted            | Server rejection                        |

---

## 11. ACCEPTANCE CRITERIA

Phase 2 is accepted ONLY if:

- Every Phase 1 rule is enforced by UX
- No UI behavior is ambiguous
- No developer assumptions are required
- UX actively prevents invalid financial actions
- A designer or developer can implement without questions

---

## END OF PHASE 2 DOCUMENT
