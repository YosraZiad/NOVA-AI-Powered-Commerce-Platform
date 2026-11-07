# NOVA — Deployment Modes Architecture

NOVA supports two approved business deployment models configured via the single environment variable `NOVA_DEPLOYMENT_MODE`:

1. **Independent Store Deployment (`standalone`)**
2. **Centrally Hosted Multi-Tenant Deployment (`hosted`)**

---

## 1. Mode A: Independent Store Deployment (`standalone`)

### Target Use Case
- Sold as a standalone software package to a single business customer.
- Deployed on the client's private VPS, dedicated server, or customer-managed cloud environment.
- The client owns all server resources and data exclusively.

### Architectural Characteristics:
- **Tenant Context:** Automatically resolves to the local primary store (Tenant #1).
- **Storefront URL:** Can be accessed directly at `/` or `/store/{slug}`. If an arbitrary or missing slug is requested, the system automatically falls back to the active store without throwing a 404 error.
- **Administration:** Merchant dashboard operates at `/merchant`. The Platform Admin portal can be disabled or used for local server oversight.
- **Resource Footprint:** Lightweight; operates comfortably on a 2 GB RAM server instance.

### Configuration (`.env`):
```dotenv
NOVA_DEPLOYMENT_MODE=standalone
NOVA_DEFAULT_CURRENCY=SAR
APP_URL=https://my-store.com
```

---

## 2. Mode B: Centrally Hosted Multi-Tenant Deployment (`hosted`)

### Target Use Case
- Managed commerce service hosting multiple isolated customer stores on shared, centrally maintained infrastructure.
- Zero public merchant self-registration: each store is provisioned exclusively by authorized platform administrators.

### Architectural Characteristics:
- **Tenant Context:** Dynamically resolved from the URL slug (`/store/{tenant_slug}`), custom subdomains, or the `X-Tenant-ID` header for authenticated merchant sessions.
- **Strict Isolation:**
  - Non-existent or inactive tenant slugs immediately return `404 Not Found`.
  - Global query scopes (`TenantScope`) ensure database queries are scoped to `tenant_id = ?`.
  - Merchants cannot view, query, or mutate catalog, orders, analytics, or inventory of other stores.
- **Customer AI & Merchant AI:** AI conversations, business metrics, and customer insights are strictly isolated per tenant.
- **Platform Oversight:** Central administrators use `/platform` to monitor aggregate performance and manage store lifecycles.

### Configuration (`.env`):
```dotenv
NOVA_DEPLOYMENT_MODE=hosted
NOVA_DEFAULT_CURRENCY=SAR
APP_URL=https://nova-commerce.com
```

---

## 3. Comparative Architecture Matrix

| Feature | Independent Mode (`standalone`) | Centrally Hosted Mode (`hosted`) |
| :--- | :--- | :--- |
| **Primary Environment** | Client VPS / Private Cloud | Managed Central Infrastructure |
| **Number of Stores** | 1 (Single Client Store) | Multiple Isolated Stores ($N$) |
| **Slug Resolution** | Automatic local store fallback | Strict slug / domain validation (404 on missing) |
| **Database Structure** | Single isolated database | Shared database with `tenant_id` foreign keys |
| **Storage Isolation** | Unified disk root | Subdirectory or tenant disk prefixes |
| **Platform Admin** | Optional local management | Required for tenant provisioning |
| **Merchant AI Context** | Scoped to the single store | Scoped to active authenticated tenant |
| **Public Self-Registration** | Disabled (Single Merchant) | Disabled (Explicit Provisioning Only) |
