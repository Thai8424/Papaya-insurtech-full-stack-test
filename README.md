# Papaya Insurtech: Multi-Tenant Insurance Configuration Platform

Welcome to the **Multi-Tenant Insurance Configuration Platform** for Papaya Insurtech! This advanced enterprise administration system allows an operations team member to onboard new insurance companies (tenants) and configure branding, claim workflows, required documents, SLA business rules, and approval tiers dynamically **without a single line of code change**.

---

## 🚀 Tech Stack

### Backend (`back-end/`)
* **Framework**: NestJS (TypeScript, Node.js)
* **ORM & Database**: TypeORM connecting to a local **SQLite** database (`db.sqlite` is automatically seeded on first startup)
* **Libraries**: `class-validator` for API input validations, `@nestjs/common`
* **Port**: Runs on `http://localhost:3000`

### Frontend (`front-end/`)
* **Framework**: React 18, Vite, TypeScript
* **Styling**: TailwindCSS, **Shadcn UI** (Select, Switch, Checkbox primitive overlays)
* **Icons**: **Lucide React** (Unified icon set used throughout the system)
* **Port**: Runs on `http://localhost:5173`

---

## 📦 Folder Structure

### Backend (`back-end/src`)
* `app.module.ts`: Root module bootstrapping the system.
* `modules/web-admin/tenant/`:
  * `tenant.service.ts`: Tenant CRUD operations, rollback handler, and automatic database seeds.
  * `entities/tenant.entity.ts` & `tenant-version.entity.ts`: Database models for Tenants and their Version histories.
* `modules/web-admin/claim/`:
  * `claim.service.ts` & `claim.controller.ts`: Handles claim submission sandbox.
  * `engine/claim-processor.ts`: Core rules engine implementing `processClaim()` to dynamically calculate required documents, approval routes, notifications, custom field validations, and SLA business days.

### Frontend (`front-end/src`)
* `App.tsx`: Layout structure including the premium **Sidebar Workspace Switcher**.
* `components/ui/`: Shared UI primitives like Shadcn-derived `Select`, `Switch`, `Checkbox`, and the dynamic `TenantLogo` (featuring vector image-loading backup fallbacks).
* `features/organizations/components/`:
  * `ConfigEditor.tsx`: Advanced Multi-tab tenant configuration CRUD editor with full schema validations.
  * `ConfigDiff.tsx`: Side-by-side comparative difference visualizer.
  * `ConfigHistory.tsx`: Timeline audit log allowing instant configuration rollbacks with reverting indicators.
* `features/claims/components/`:
  * `ClaimPlayground.tsx`: Interactive simulator providing a real-time sandbox preview of how claims are evaluated before saving.

---

## 🛠️ Getting Started & Run Instructions

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed.

### 1. Start the Backend Server
```bash
cd back-end
npm install
npm run start:dev
```
* **Database Seeding**: The server will automatically initialize an SQLite database `db.sqlite` and seed **Tenant A (SafeGuard)**, **Tenant B (HealthFirst)**, and **Tenant C (GovHealth)** on startup if the database is empty.
* **API URL**: `http://localhost:3000`

### 2. Start the Frontend Dev Server
```bash
cd ../front-end
npm install
npm run dev
```
* **Client URL**: Open `http://localhost:5173` in your browser.

---

## ⚙️ Core Claims Engine Rules & SLA Calculation

The runtime rules engine is implemented in the `processClaim(tenant, claimData)` function at `back-end/src/modules/web-admin/claim/engine/claim-processor.ts`:

1. **Claim Type Check**: Returns an error if the selected claim type is disabled for the tenant.
2. **Custom Fields Check**: Dynamically inspects custom inputs based on the tenant's custom fields definition (e.g. validating number/boolean types and enforcing required inputs).
3. **Document Resolution**: Maps all required and optional documents configured for the claim type.
4. **Approval Routing**:
   * If `amount <= autoApprovalThreshold`, the claim is marked `requiresApproval = false` and routed to the `system` (Auto-Approved).
   * Otherwise, the engine maps the amount to the appropriate tier range (`minAmount` to `maxAmount`) and assigns the manual reviewer role (e.g., Assessor, Manager, Team Lead, Committee).
5. **Notification Dispatch**: Emits simulated events (`claim_submitted`, `approved`, `rejected`, `payment_sent`) dynamically mapped to the channels (Email, SMS, Webhook) configured by the tenant.
6. **SLA Business Day Calculator**: Excludes Saturdays and Sundays to correctly project the target completion deadline (`submissionDate + targetSlaDays`).

---

## 📝 Step-by-Step Demo Script for Evaluators

Open the admin UI at `http://localhost:5173` and follow this kịch bản (script) to verify all constraints of **AI Challenge 15**:

### 1️⃣ Verify Unique Processing Behavior for Seeded Tenants
1. Go to the **Claims Playground** tab on the sidebar.
2. Select **SafeGuard Insurance** from the workspace dropdown. Enter `8,000` outpatient claim. Note that it is **Auto-Approved** (threshold is 20,000) and only requires the custom field **Employee ID** to submit.
3. Select **HealthFirst** from the dropdown. Enter the same `8,000` outpatient claim. Note that it is routed to **Assessor** (threshold is 5,000) for review, expects **Email + SMS** notifications, and has no custom fields.
4. Select **GovHealth** from the dropdown. Enter the same `8,000` outpatient claim. Note that it is routed to **Committee** (threshold is 0, all manual), expects **Email + Webhook** notifications, and enforces **Department** and **Budget Code** custom fields.

### 2️⃣ Onboard a 4th Tenant (Zero Code Changes)
1. In the sidebar, under **Tenant Insurers**, click the **Onboard Insurer** (Plus `+`) button in the main panel.
2. Fill out the details:
   * **Company Name**: `Papaya Care`
   * **Primary Color**: `#db2777` (Deep pink)
   * **Secondary Color**: `#be185d`
   * **Logo URL**: `https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&auto=format&fit=crop&q=60`
3. In the **Claim Types** tab, enable `DENTAL` and configure required documents (e.g. `Dental invoice`).
4. In the **Approvals** tab, set auto-approval threshold to `3,000`. Add a tier for `3,001` - `50,000` with the role `Lead Assessor`.
5. Click **Save Configuration**.
6. **Observe**: The 4th tenant `Papaya Care` is successfully saved, rendered in the list, and immediately becomes selectable in the **Active Workspace** switcher dropdown!
7. Switch to `Papaya Care` and process a dental claim of `15,000` in the Playground to see it automatically routed to `Lead Assessor`.

### 3️⃣ Validate Form Constraints
1. Click **Edit Configuration** on any tenant.
2. Try setting the **Auto-approval threshold** to `-100`. Try unticking all claim types. Try setting an enabled SLA day to `0`.
3. Click **Save**. Note that the editor displays clean, localized validation warnings block and prevents the save action.

### 4️⃣ Compare Tenant Configurations
1. Go to the **Config Diff Tool** tab on the sidebar.
2. Select **SafeGuard Insurance** on the left and **GovHealth** on the right.
3. Note the premium visual highlights comparing differences in branding colors, claim types, SLA business days, and dynamic approval ranges.

### 5️⃣ Audit Logs and Config Rollbacks
1. Go to the **Version Rollback** tab.
2. Click **Rollback** on any older version (e.g., Version 1).
3. **Observe**: A new version is generated preserving history, and is immediately set as the active version. A gorgeous audit trail badge **`↩ Reverted to v1`** is rendered next to the version name.
