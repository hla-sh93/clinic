# Dental Clinic Management System — Phase 4

## Database Design, Data Model & Integrity Enforcement

## Locked Logical Data Model

---

## PHASE IDENTIFICATION

- **Phase:** 4
- **Name:** Database Design, Data Model & Integrity Enforcement
- **Depends On:**
  - Phase 1 — System Definition & Decision Lock
  - Phase 2 — UX / Interaction Architecture
  - Phase 3 — System Architecture & API Contracts
- **Status:** Locked (after approval)

Phase 4 defines the **authoritative data model**.
The database is treated as an **active enforcer of correctness**, not passive storage.

---

## 1. PHASE OBJECTIVE

The objective of Phase 4 is to define a **complete, enforceable, implementation-ready data model** that guarantees:

- Medical data integrity
- Financial correctness (Cash Basis)
- Historical immutability
- Referential safety
- Deterministic reporting
- Zero reliance on “developer discipline”

After this phase:

- Any violation of core rules is **blocked at DB level**
- Financial corruption becomes structurally impossible
- Reports rely on consistent, provable data

---

## 2. GLOBAL DATABASE PRINCIPLES (LOCKED)

### 2.1 Time Handling

- All timestamps stored in **UTC**
- Clinic timezone: **Damascus / Syria**
- Reporting periods are calculated using clinic local time
- Mandatory fields:
  - `created_at` (all tables)
  - `updated_at` only where mutation is allowed

---

### 2.2 Currency & Precision

- Currency: **SYP only**
- Monetary fields use **DECIMAL(18,2)**
- No floating-point types
- No currency conversion tables

---

### 2.3 Deletion Policy

- **Hard delete is forbidden system-wide**
- Logical deletion only via:
  - `is_active = false` OR
  - `deleted_at IS NOT NULL`
- Financial tables never support deletion flags (append-only)

---

### 2.4 Immutability Rules

- Financial records are immutable after creation
- Corrections are implemented via:
  - VOID records
  - Compensating entries
- No UPDATE on:
  - invoices totals
  - payments amounts
  - inventory IN records

---

## 3. CORE ENTITIES & TABLE DEFINITIONS

---

## 3.1 Users

| Field         | Type                   | Rules        |
| ------------- | ---------------------- | ------------ |
| id            | UUID                   | PK           |
| full_name     | TEXT                   | Required     |
| email         | TEXT                   | Unique       |
| password_hash | TEXT                   | Required     |
| role          | ENUM(MANAGER, DENTIST) | Required     |
| is_active     | BOOLEAN                | Default TRUE |
| created_at    | TIMESTAMP              | Required     |

### Constraints

- Unique email
- Dentist cannot be deactivated if future appointments exist

---

## 3.2 Patients

| Field      | Type      | Rules                |
| ---------- | --------- | -------------------- |
| id         | UUID      | PK                   |
| full_name  | TEXT      | Required             |
| phone      | TEXT      | Indexed (not unique) |
| notes      | TEXT      | Optional             |
| is_active  | BOOLEAN   | Default TRUE         |
| created_at | TIMESTAMP | Required             |

---

## 3.3 Medical_Cases

| Field          | Type          | Rules        |
| -------------- | ------------- | ------------ |
| id             | UUID          | PK           |
| name           | TEXT          | Unique       |
| base_price_syp | DECIMAL(18,2) | > 0          |
| description    | TEXT          | Optional     |
| is_active      | BOOLEAN       | Default TRUE |
| created_at     | TIMESTAMP     | Required     |

### Constraints

- Cannot be deactivated if referenced by appointments or visits

---

## 3.4 Appointments

| Field           | Type                                               | Rules              |
| --------------- | -------------------------------------------------- | ------------------ |
| id              | UUID                                               | PK                 |
| patient_id      | UUID                                               | FK → Patients      |
| dentist_id      | UUID                                               | FK → Users         |
| medical_case_id | UUID                                               | FK → Medical_Cases |
| start_time_utc  | TIMESTAMP                                          | Required           |
| end_time_utc    | TIMESTAMP                                          | Required           |
| status          | ENUM(SCHEDULED, COMPLETED, CANCELLED)              | Required           |
| cancel_reason   | ENUM(NO_SHOW, PATIENT_CANCELLED, CLINIC_CANCELLED) | Nullable           |
| base_price_syp  | DECIMAL(18,2)                                      | Snapshot           |
| created_at      | TIMESTAMP                                          | Required           |

### Constraints

- `end_time_utc > start_time_utc`
- No overlapping appointments per dentist
- Status transitions enforced by application + DB checks

---

## 3.5 Appointment_Notes

| Field          | Type      | Rules             |
| -------------- | --------- | ----------------- |
| id             | UUID      | PK                |
| appointment_id | UUID      | FK → Appointments |
| author_id      | UUID      | FK → Users        |
| note           | TEXT      | Required          |
| created_at     | TIMESTAMP | Required          |

---

## 3.6 Appointment_Attachments

| Field          | Type      | Rules             |
| -------------- | --------- | ----------------- |
| id             | UUID      | PK                |
| appointment_id | UUID      | FK → Appointments |
| file_path      | TEXT      | Required          |
| uploaded_by    | UUID      | FK → Users        |
| created_at     | TIMESTAMP | Required          |

---

## 3.7 Visits

| Field           | Type                       | Rules     |
| --------------- | -------------------------- | --------- |
| id              | UUID                       | PK        |
| appointment_id  | UUID                       | UNIQUE FK |
| base_price_syp  | DECIMAL(18,2)              | Snapshot  |
| discount_type   | ENUM(NONE, PERCENT, FIXED) | Required  |
| discount_value  | DECIMAL(18,2)              | ≥ 0       |
| final_price_syp | DECIMAL(18,2)              | Immutable |
| notes           | TEXT                       | Optional  |
| created_at      | TIMESTAMP                  | Required  |

### Constraints

- One visit per appointment
- `final_price_syp >= 0`
- Visit cannot exist without invoice

---

## 3.8 Invoices

| Field            | Type                               | Rules     |
| ---------------- | ---------------------------------- | --------- |
| id               | UUID                               | PK        |
| visit_id         | UUID                               | UNIQUE FK |
| total_amount_syp | DECIMAL(18,2)                      | Snapshot  |
| paid_amount_syp  | DECIMAL(18,2)                      | ≥ 0       |
| status           | ENUM(UNPAID, PARTIALLY_PAID, PAID) | Derived   |
| created_at       | TIMESTAMP                          | Required  |

### Constraints

- `paid_amount_syp <= total_amount_syp`

---

## 3.9 Payments

| Field          | Type                | Rules         |
| -------------- | ------------------- | ------------- |
| id             | UUID                | PK            |
| invoice_id     | UUID                | FK → Invoices |
| amount_syp     | DECIMAL(18,2)       | > 0           |
| payment_method | ENUM(CASH)          | Fixed         |
| payment_date   | TIMESTAMP           | Required      |
| status         | ENUM(VALID, VOIDED) | Required      |
| void_reason    | TEXT                | Nullable      |
| created_at     | TIMESTAMP           | Required      |

### Constraints

- Sum(VALID payments) ≤ invoice.total_amount_syp
- VOIDED payments ignored in revenue

---

## 3.10 Inventory_Items

| Field      | Type      | Rules        |
| ---------- | --------- | ------------ |
| id         | UUID      | PK           |
| name       | TEXT      | Unique       |
| is_active  | BOOLEAN   | Default TRUE |
| created_at | TIMESTAMP | Required     |

---

## 3.11 Inventory_Transactions

| Field         | Type          | Rules                |
| ------------- | ------------- | -------------------- |
| id            | UUID          | PK                   |
| item_id       | UUID          | FK → Inventory_Items |
| direction     | ENUM(IN, OUT) | Required             |
| quantity      | DECIMAL(18,3) | > 0                  |
| unit_cost_syp | DECIMAL(18,2) | Required for IN      |
| created_at    | TIMESTAMP     | Required             |

### Constraints

- OUT blocked if insufficient stock
- IN creates inventory expense

---

## 3.12 Dentist_Profit_Config

| Field      | Type         | Rules             |
| ---------- | ------------ | ----------------- |
| id         | UUID         | PK                |
| dentist_id | UUID         | UNIQUE FK → Users |
| percentage | DECIMAL(5,2) | 0–100             |
| created_at | TIMESTAMP    | Required          |

### Constraint

- Sum(percentages) ≤ 100

---

## 3.13 Audit_Logs

| Field        | Type      | Rules      |
| ------------ | --------- | ---------- |
| id           | UUID      | PK         |
| actor_id     | UUID      | FK → Users |
| action       | TEXT      | Required   |
| entity       | TEXT      | Required   |
| entity_id    | UUID      | Optional   |
| before_state | JSONB     | Optional   |
| after_state  | JSONB     | Optional   |
| created_at   | TIMESTAMP | Required   |

### Rules

- Append-only
- Immutable
- No update, no delete

---

## 4. INDEXING STRATEGY (MANDATORY)

- Appointments(dentist_id, start_time_utc)
- Appointments(status)
- Payments(invoice_id)
- Payments(payment_date)
- Inventory_Transactions(item_id, created_at)
- Audit_Logs(created_at)
- Patients(phone)

---

## 5. DATA INTEGRITY GUARANTEES

The database MUST prevent:

- Orphan visits or invoices
- Overlapping appointments
- Invoice overpayment
- Negative inventory stock
- Modification of historical financial records
- Silent loss of audit trails

---

## 6. PHASE 4 DELIVERABLES

Phase 4 produces:

1. Locked logical data model
2. Full entity relationship definition
3. Constraint & immutability rules
4. Indexing plan
5. DB-level enforcement guarantees

---

## 7. ACCEPTANCE CRITERIA

Phase 4 is accepted ONLY if:

- All Phase 1 financial rules are enforceable
- No critical rule relies only on application logic
- Schema supports all reports defined in Phase 2
- Data corruption is structurally impossible
- Schema is Prisma-ready without ambiguity

---

## END OF PHASE 4 DOCUMENT
