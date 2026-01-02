# Dental Clinic Management System — Phase 3

## System Architecture, Module Design & API Contracts

## Locked Technical Blueprint

---

## PHASE IDENTIFICATION

- **Phase:** 3
- **Name:** System Architecture, Module Design & API Contracts
- **Depends On:**
  - Phase 1 — System Definition & Decision Lock
  - Phase 2 — UX / UI Definition & Interaction Architecture
- **Status:** Locked (after approval)

Phase 3 defines **how the system is built internally**.
It is the **technical contract** between business logic and implementation.

---

## 1. PHASE OBJECTIVE

The objective of Phase 3 is to translate:

- Locked system rules (Phase 1)
- Locked interaction flows (Phase 2)

into a **clear, enforceable technical architecture** where:

- Every module has strict ownership
- Every responsibility is explicitly assigned
- Every backend behavior is reachable **only** through defined APIs
- No developer can introduce hidden logic or shortcuts

At the end of this phase:

- Any backend developer can implement the system
- All behaviors are deterministic
- No logic is UI-dependent
- No cross-module coupling is allowed

---

## 2. PHASE SCOPE

### 2.1 In Scope

- Backend architectural style
- Module decomposition and boundaries
- Responsibility ownership per module
- API design principles
- API endpoint contracts (high-level)
- Validation and error-handling standards
- Cross-cutting concerns (auth, audit, transactions)

### 2.2 Explicitly Out of Scope

- Database schema definitions (Phase 4)
- UI implementation
- API payload schemas (defined later)
- Performance optimization
- External integrations

---

## 3. INPUT ARTIFACTS (AUTHORITATIVE)

Phase 3 MUST strictly comply with:

- Phase 1 — Locked System Specification
- Phase 2 — Locked UX / Interaction Model
- RBAC matrix
- State machines
- Edge-case enforcement rules

Any contradiction is **invalid**.

---

## 4. ARCHITECTURAL PRINCIPLES (NON-NEGOTIABLE)

### 4.1 Architecture Style

- **Modular Monolith**
- Single deployable application
- Clear internal module boundaries
- No shared mutable state between modules

Each module:

- Owns its data
- Owns its business rules
- Exposes functionality **only** through its APIs

---

### 4.2 Layered Responsibility Model

Every module MUST follow this internal structure:

1. **API Layer**
   - Request/response handling
   - Authentication & authorization checks
2. **Validation Layer**
   - Schema validation
   - Required field enforcement
3. **Domain Layer**
   - Business rules
   - State transitions
4. **Persistence Layer**
   - Database access via ORM
5. **Audit Layer**
   - Immutable audit logging

❌ No layer may be skipped  
❌ No direct DB access from API layer  
❌ No business rules in UI

---

## 5. MODULE DECOMPOSITION (FINAL)

### 5.1 Core Modules

The system is composed of the following **authoritative modules**:

1. Auth & Identity
2. Users & Roles
3. Patients
4. Medical Cases
5. Appointments
6. Visits
7. Invoices
8. Payments
9. Inventory
10. Reports
11. Audit Logs
12. File Storage

No additional modules are allowed without specification update.

---

## 6. MODULE RESPONSIBILITIES & OWNERSHIP

### 6.1 Auth & Identity

- Login / logout
- Token issuance & refresh
- Session validation
- Password management

---

### 6.2 Users & Roles

- User creation & activation
- Role assignment
- RBAC enforcement
- User deactivation rules

---

### 6.3 Patients

- Patient creation & update
- Soft deactivation
- Patient attachments access control
- Referential integrity enforcement

---

### 6.4 Medical Cases

- Medical service definition
- Base pricing enforcement
- Deactivation logic

---

### 6.5 Appointments

- Appointment scheduling
- Overlap prevention
- Notes & attachments handling
- Status transitions:
  - SCHEDULED → COMPLETED
  - SCHEDULED → CANCELLED

---

### 6.6 Visits

- Automatic creation on appointment completion
- Final price calculation
- Discount enforcement (Manager only)
- Notes management

---

### 6.7 Invoices

- Automatic invoice creation per visit
- Invoice state management
- Balance tracking

---

### 6.8 Payments

- Payment recording
- Cash-based revenue recognition
- Overpayment prevention
- Payment voiding (administrative correction)

---

### 6.9 Inventory

- Stock movement tracking
- Expense generation on IN
- Stock quantity enforcement

---

### 6.10 Reports

- Read-only aggregation queries
- Financial summaries
- Dentist earnings calculation

---

### 6.11 Audit Logs

- Immutable audit records
- Query-only access
- No modification or deletion

---

### 6.12 File Storage

- File upload & retrieval
- Access control enforcement
- Soft deletion

---

## 7. API DESIGN PRINCIPLES

### 7.1 General Rules

- REST-style endpoints
- JSON only
- Explicit HTTP methods
- No implicit side effects
- One responsibility per endpoint
- All state changes are explicit actions

---

### 7.2 Naming Conventions

- Plural nouns for resources
- Verbs only for actions
- Predictable, readable paths

Examples:

- POST `/api/appointments`
- POST `/api/appointments/{id}/complete`
- POST `/api/invoices/{id}/payments`

---

## 8. API CONTRACTS (HIGH-LEVEL)

### 8.1 Authentication

- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`

---

### 8.2 Patients

- GET `/api/patients`
- POST `/api/patients`
- PUT `/api/patients/{id}`
- POST `/api/patients/{id}/deactivate`

---

### 8.3 Medical Cases

- GET `/api/medical-cases`
- POST `/api/medical-cases`
- PUT `/api/medical-cases/{id}`
- POST `/api/medical-cases/{id}/deactivate`

---

### 8.4 Appointments

- GET `/api/appointments`
- POST `/api/appointments`
- PUT `/api/appointments/{id}`
- POST `/api/appointments/{id}/cancel`
- POST `/api/appointments/{id}/complete`

---

### 8.5 Visits

- GET `/api/visits/{id}`

---

### 8.6 Invoices

- GET `/api/invoices`
- GET `/api/invoices/{id}`

---

### 8.7 Payments

- POST `/api/invoices/{id}/payments`
- POST `/api/payments/{id}/void`

---

### 8.8 Inventory

- GET `/api/inventory`
- POST `/api/inventory/in`
- POST `/api/inventory/out`

---

### 8.9 Reports

- GET `/api/reports/revenue`
- GET `/api/reports/profit`
- GET `/api/reports/inventory`
- GET `/api/reports/dentist-earnings`

---

### 8.10 Audit Logs

- GET `/api/audit-logs`

---

## 9. VALIDATION & BUSINESS RULE ENFORCEMENT

- All inputs validated server-side
- Validation schemas defined per endpoint
- Business rule violations return **HTTP 422**
- No partial writes allowed
- All multi-step operations are transactional

---

## 10. ERROR HANDLING STANDARD

### Error Codes

- 400 — Invalid input
- 401 — Authentication required
- 403 — Authorization denied
- 409 — Conflict
- 422 — Business rule violation
- 500 — System error

### Rules

- No stack traces in responses
- Deterministic error messages
- Internal logging mandatory for 500 errors

---

## 11. AUDIT LOG INTEGRATION

Audit logging is mandatory for:

- Appointment completion / cancellation
- Visit creation
- Price or discount application
- Payment creation or voiding
- Inventory IN transactions
- Role or user status changes

Audit logging must:

- Be atomic with the action
- Never block the operation
- Never fail silently

---

## 12. DATA ACCESS RULES

- Modules access data **only** through their repositories
- No cross-module DB writes
- Cross-module reads only via APIs
- Reports module is read-only and aggregation-only

---

## 13. PHASE 3 DELIVERABLES

Phase 3 must produce:

1. Final architectural blueprint
2. Module responsibility matrix
3. Locked API contract list
4. Validation and error-handling standards
5. Audit integration rules

---

## 14. ACCEPTANCE CRITERIA

Phase 3 is accepted ONLY if:

- No module overlaps responsibilities
- No API behavior is ambiguous
- No business rule is UI-dependent
- Backend logic can be implemented without guessing
- Architecture enforces system rules by design

---

## END OF PHASE 3 DOCUMENT
