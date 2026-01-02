# Phase 5 — Authentication, Authorization & RBAC Enforcement (Corrected)

## Dental Clinic Management System

---

## 1. PHASE OBJECTIVE

The objective of **Phase 5** is to implement a **secure, deterministic, and fully enforceable identity and access control layer** for the system.

By the end of this phase:

- Every request is authenticated and authorized **server-side**
- Role-Based Access Control (RBAC) is enforced consistently across the system
- No sensitive operation can be executed without explicit permission
- Authentication, authorization, and auditability are technically inseparable
- Security rules are not duplicated, implied, or UI-dependent

This phase guarantees that **who can do what, when, and why** is technically enforced and auditable.

---

## 2. PHASE SCOPE

This phase covers:

- Authentication mechanisms
- Session and token management
- Role-Based Access Control (RBAC)
- Permission enforcement on all server actions
- User lifecycle management (activation/deactivation)
- Security-related audit logging
- Error handling for auth-related failures

❌ No UI styling or theming  
❌ No business workflow coding beyond permission boundaries

---

## 3. INPUT ARTIFACTS

- Locked system specification (Phase 1)
- UX interaction definitions (Phase 2)
- Architecture & API contracts (Phase 3)
- Database schema & constraints (Phase 4)

---

## 4. IDENTITY & AUTHENTICATION MODEL

### 4.1 Authentication Strategy

- JWT-based authentication
- Stateless access control
- Tokens validated on every protected request

#### Token Types

1. **Access Token**

- Short-lived
- Used for all API calls
- Contains `user_id` and `role`

2. **Refresh Token**

- Longer-lived
- Used only to obtain new access tokens
- Stored securely (HTTP-only cookie recommended)

### 4.2 Token Lifetimes

- Access Token: 15 minutes
- Refresh Token: 7 days

Tokens must include:

- user_id
- role
- issued_at
- expiration

### 4.3 Password Management

- Minimum length: 10 characters
- Must include letters and numbers
- Stored only as a secure hash (bcrypt or equivalent)
- Password reset is token-based and fully audited

---

## 5. USER LIFECYCLE MANAGEMENT

### 5.1 User Creation

- Only **Manager** can create users
- Required fields:
  - full_name
  - email
  - role
  - initial password
- Newly created users are active by default

### 5.2 User Activation / Deactivation

Rules:

- Users are never deleted
- Deactivated users:
  - Cannot log in
  - Cannot perform any action
  - Remain visible in audit logs

Special rule for Dentists:

- A dentist cannot be deactivated if they have future appointments

All activation/deactivation actions:

- Require Manager role
- Are fully audited

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC)

### 6.1 Defined Roles (Authoritative)

- **Manager**
- **Dentist**

No additional roles are allowed in this system version.

### 6.2 Global RBAC Enforcement Rules

- RBAC is enforced **server-side only**
- UI visibility does not grant permission
- Every protected API endpoint must:
  1. Verify authentication
  2. Verify user is active
  3. Verify role authorization
  4. Verify ownership (if applicable)
  5. Proceed or reject

### 6.3 Corrected Permission Matrix (Authoritative)

#### Manager Permissions

- Full access to all system modules
- User management (create/activate/deactivate)
- Financial operations (invoices, payments, profit)
- Inventory management
- Audit log access
- Price and discount modifications (where applicable)
- Can also change appointment statuses (admin override), but Dentist remains primary owner for own appointments

#### Dentist Permissions (Corrected Rule)

Dentist has:

- View own appointments (where `dentist_id = current_user_id`)
- View patients linked to own appointments/visits
- Create and update clinical notes for own visits (as allowed by Phase 1)
- View own earnings summary (read-only)
- **FULL CONTROL OVER APPOINTMENT STATUS for own appointments**:
  - Can set appointment status to:
    - SCHEDULED (only in specific correction scenarios if allowed)
    - COMPLETED
    - CANCELLED
    - NO_SHOW
  - This change is **Doctor-owned**, not Manager-owned by default.
- No access to:
  - Inventory
  - User management
  - Global financial totals
  - Editing prices/discounts unless explicitly allowed in Phase 1

---

## 7. OWNERSHIP & DATA ACCESS RULES (Critical)

Ownership rules must be enforced for Dentist role:

- Dentist can access ONLY:
  - Appointments where `dentist_id = current_user_id`
  - Visits linked to those appointments
  - Patients linked through those appointments/visits
  - Dentist own earnings summary

Any attempt to access other dentists’ data:

- MUST return HTTP 403
- MAY be logged as a security audit event (recommended)

Manager role bypasses ownership checks.

---

## 8. APPOINTMENT STATUS AUTHORIZATION RULE (CORRECTED)

### 8.1 Authoritative Rule

- **Dentist is the primary authority to change the appointment status for their own appointments.**
- Manager may have admin override, but this does not remove Dentist ownership.

### 8.2 Server-Side Enforcement Requirements

For any endpoint that changes appointment status:

- Must validate:
  - Authenticated
  - User active
  - If role = Dentist:
    - Appointment.dentist_id MUST equal current_user_id
  - If role = Manager:
    - Allowed (admin override)

### 8.3 Status Change Must Be Audited

Every status change MUST create an audit log entry with:

- actor_user_id
- action: `APPOINTMENT_STATUS_CHANGE`
- entity: `appointment`
- entity_id
- before_state.status
- after_state.status
- timestamp

### 8.4 Optional: Reason Requirement

Choose the safer default for medical operations:

- For CANCELLED and NO_SHOW:
  - Require an optional reason (recommended) OR enforce as mandatory (if clinic policy wants)
- For COMPLETED:
  - No reason required by default

(If this is not defined elsewhere, adopt: **optional reason** to avoid blocking flow.)

---

## 9. AUTHORIZATION IMPLEMENTATION STRATEGY

### 9.1 Centralized Authorization Layer

Authorization checks must be implemented via:

- Middleware (route-level protection)
- Shared authorization utilities (domain-level checks)

No authorization logic is allowed:

- Inside UI components
- Hidden inside database queries as the only guard

### 9.2 Authorization Decision Flow

For every protected request:

1. Validate access token
2. Check user active status
3. Verify role permission
4. Verify ownership (if required)
5. Proceed or reject immediately

Any failure stops the request immediately.

---

## 10. AUTHENTICATION & AUTHORIZATION ERRORS

### Error Classification

| Condition             | HTTP Code |
| --------------------- | --------- |
| Missing token         | 401       |
| Invalid/expired token | 401       |
| Deactivated user      | 403       |
| Role not permitted    | 403       |
| Ownership violation   | 403       |

Rules:

- Errors must not expose internal details
- Messages must be deterministic and localizable
- No partial processing allowed on auth failures

---

## 11. AUDIT LOGGING (SECURITY-CRITICAL)

The following actions MUST be audited:

- Login success
- Logout
- Token refresh
- Password reset
- User creation
- Role assignment (if any)
- User activation/deactivation
- **Appointment status changes** (mandatory)
- Financial actions (payments, invoice status updates)
- Inventory IN (purchase) actions
- Authorization violations (recommended)

Each audit record must include:

- actor_user_id (if available)
- action
- entity + entity_id (if applicable)
- before_state / after_state where relevant
- timestamp
- source_ip (if available)

Audit logging must:

- Be atomic with the action
- Never fail silently
- Never block the primary operation (audit failure must be handled safely and reported)

---

## 12. SESSION & CONCURRENCY RULES

- Multiple active sessions per user are allowed unless restricted later
- Deactivated users lose access immediately:
  - token checks MUST verify `is_active = true`

---

## 13. SECURITY HARDENING REQUIREMENTS

- Rate limiting on:
  - Login
  - Token refresh
  - Password reset
- CSRF protection where applicable
- Secure headers enforced
- HTTPS required in production

---

## 14. TESTING REQUIREMENTS (MANDATORY)

### Unit Tests

- Token validation logic
- Role enforcement
- Ownership checks
- Deactivated user handling
- Appointment status change authorization (Dentist own only)

### Integration Tests

- Dentist attempts to change another dentist’s appointment status → 403
- Dentist changes own appointment status → 200 + audited
- Manager changes any appointment status → 200 + audited
- Access after user deactivation → blocked

### Security Tests

- Unauthorized access attempts
- Token tampering
- Expired token handling

---

## 15. DELIVERABLES OF PHASE 5

- Fully implemented authentication flow
- Enforced RBAC on all endpoints
- Ownership enforcement rules
- Security audit logs
- Auth-related error handling consistency
- Correct doctor-owned appointment status transitions

---

## 16. ACCEPTANCE CRITERIA

Phase 5 is complete ONLY if:

- No protected endpoint is accessible without authentication
- No role can exceed its defined permissions
- Deactivated users are fully blocked immediately
- All auth-related actions are audited
- Appointment status changes are:
  - Allowed for Dentist on OWN appointments
  - Forbidden for Dentist on others
  - Audited always
- Security rules are enforced server-side only
- Developers cannot accidentally bypass RBAC

---

## END OF PHASE 5 DOCUMENT
