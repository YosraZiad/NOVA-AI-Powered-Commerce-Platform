# NOVA — Security & Hardening Architecture

This document describes the security controls, tenant isolation mechanisms, authentication boundaries, and compliance protections built into the **NOVA — AI-Powered Commerce Platform**.

---

## 1. Authentication & Session Security

### Token-Based Authentication (Sanctum)
- Mobile, SPA, and API requests authenticate using **Laravel Sanctum** Personal Access Tokens.
- Plaintext tokens are returned only upon initial creation (`plainTextToken`) and stored in the database hashed via SHA-256.
- The `passwords` and `remember_token` attributes are hidden from JSON responses across all User models.
- Passwords are encrypted using Bcrypt with a minimum work factor of 12 (`BCRYPT_ROUNDS=12`).

### Session Security in Production
- `SESSION_SECURE_COOKIE=true`: Session cookies are transmitted exclusively over encrypted HTTPS connections.
- `SESSION_HTTP_ONLY=true`: Mitigates Cross-Site Scripting (XSS) by preventing JavaScript access to session cookies (`document.cookie`).
- `SESSION_SAME_SITE=lax`: Restricts cross-site cookie transmission to defend against Cross-Site Request Forgery (CSRF).

---

## 2. Authorization & Role Boundaries

NOVA enforces role-based access control (RBAC) powered by **Spatie Laravel Permission**:

| Role | Scope | Permitted Capabilities |
| :--- | :--- | :--- |
| **Platform Admin** | Platform-Wide | Provision new stores, inspect platform metrics, update store lifecycle status, audit system security. |
| **Merchant** | Tenant-Scoped | Full control over assigned store: product catalog, categories, inventory adjustments, orders, store settings, and Merchant AI Studio. |
| **Staff** | Tenant-Scoped | Day-to-day store operations: manage orders, update product information, view catalog. Restricted from destructive store actions. |
| **Customer** | Self-Scoped | Browse storefront, manage cart, place orders, view order history, interact with Customer AI Shopping Assistant. Strictly blocked from merchant/platform routes. |

### Access Control Rules:
1. Attempting to access Merchant or Platform routes with a `Customer` role produces `403 Forbidden`.
2. Public self-registration assigns the `Customer` role exclusively; requests attempting to pass `role: 'Merchant'` or `role: 'Platform Admin'` are safely stripped.
3. Merchant and Staff accounts are provisioned exclusively by authorized administrators.

---

## 3. Multi-Tenant Isolation Architecture

NOVA operates with strict tenant isolation across both **Hosted Multi-Tenant** and **Standalone** deployment modes:

### Server-Side Context Resolution
- Tenant context is resolved on the server via `ResolveTenant` middleware and `TenantContextInterface`.
- Client header spoofing (`X-Tenant-ID`) is actively verified against the authenticated user's tenant memberships. If a merchant attempts to supply another store's tenant ID, the request is immediately rejected with `403 Forbidden`.

### Scoped Database Queries
- Models implementing `BelongsToTenant` automatically apply the `TenantScope` global query scope.
- In every read, update, or delete operation, queries automatically append `WHERE tenant_id = ?`.
- Cross-tenant resource IDs (e.g., requesting Tenant B's product while in Tenant A's context) return `404 Not Found` without database mutation.

---

## 4. Application Security Controls

### HTTP Security Headers
Attached to every response via `SecurityHeaders` middleware:
- `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing).
- `X-Frame-Options: SAMEORIGIN` (Defends against Clickjacking attacks).
- `X-XSS-Protection: 1; mode=block` (Legacy browser XSS filter).
- `Referrer-Policy: strict-origin-when-cross-origin` (Protects navigation privacy).
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` (Restricts browser APIs).
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS enforced in production).

### Cross-Origin Resource Sharing (CORS)
- Managed via `config/cors.php`.
- Wildcards (`*`) are disallowed in production; `CORS_ALLOWED_ORIGINS` restricts API access to authorized frontend domains.
- Exposed headers are limited strictly to required application metadata (`X-Tenant-ID`).

### Database & Error Sanitization
- SQL Injection Defense: All database operations use Eloquent ORM or parameterized query bindings (`?`).
- Production Error Masking: When `APP_DEBUG=false`, unhandled exceptions and `QueryException` instances render safe JSON responses (`DATABASE_ERROR`) without leaking table schema, column names, or stack traces.

---

## 5. AI Security & Privacy Protections

### Server-Side Containment
- Provider API keys (`OPENAI_API_KEY`, `GEMINI_API_KEY`) are stored in server environment variables and never returned in API payloads or sent to frontend clients.

### Prompt Injection Neutralization
- User input is sanitized via `strip_tags()` and filtered against known prompt injection jailbreak patterns (`ignore instructions`, `developer mode`, `DAN mode`).
- Maximum input length is strictly clamped to prevent buffer or token exhaustion.

### Zero Personally Identifiable Information (PII) Leakage
- Customer analytical insights aggregate numbers (order counts, repeat purchase rate, geographic city distribution) without passing customer names, emails, phones, or payment methods to LLMs.
- All numeric calculations (revenue, AOV, inventory velocity) are computed in PHP/MySQL arithmetic before prompting, preventing AI numerical hallucinations.

### No Automated Database Mutations
- Neither the Customer AI Assistant nor the Merchant AI Studio can mutate database records directly.
- AI-generated product descriptions, marketing campaigns, and inventory recommendations remain non-binding drafts until explicit merchant approval.
