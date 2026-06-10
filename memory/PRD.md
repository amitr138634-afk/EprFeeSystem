# School ERP — PRD / Progress Log

## Original problem statement
> fix all ai probleam
> run all 4 micro services
> enhance and test all apis
> create proper document read me file for database creation
> create school create admin
> IN super admin only option to be create school/ school list/create admin
> rest all  in school admin
> keep nav  in center side bar not required
>
> (also requested explicitly: PostgreSQL only, do not change programming languages — must remain Django + React.)

## Architecture (unchanged stack, refactored UI/roles)

| Service          | Stack                       | Port |
|------------------|-----------------------------|------|
| admin-backend    | Django 4.2 + DRF + Postgres | 8000 |
| fee-backend      | Django 4.2 + DRF + Postgres | 8001 |
| admin-frontend   | React 18 + Vite + Tailwind  | 3000 |
| fee-frontend     | React 18 + Vite + Tailwind  | 3001 |

Multi-tenant: central DB (`school_erp_central`) holds Schools + Users; per-school DBs (`school_erp_<code>`) are auto-created and migrated by the API.

## What was done in this session (10 Jan 2026)

### Backend bug fixes (Django)
- Added every missing `apps/__init__.py` (without it Django couldn't even import the apps).
- Added a proper `AppConfig` (`apps.py`) for **every** sub-app of both backends.
- Created empty `migrations/` directories so `makemigrations` works.
- Enabled `rest_framework_simplejwt.token_blacklist` in INSTALLED_APPS of both services and added `token_blacklist` to the `CENTRAL_APPS` set in `db_router.py` so it lives in the central DB only.
- Hardened `LogoutView` (returns 400 on missing refresh, requires authentication).
- Locked down `CreateUserSerializer` so a school admin can never promote a user to `super_admin`.
- Rewrote `SchoolListCreateView.create()`: `CREATE DATABASE` now runs in autocommit, central rows are inside `transaction.atomic`, tenant migrations run last with `--run-syncdb` and a partial-failure response is returned cleanly if migrations break.
- Added Super-Admin-only `POST /api/auth/school-admins/` + list/detail endpoints for the **Create Admin** flow.
- Cleaned up `fee-backend` view `class_id` unused-variable bug.

### Frontend
- Removed `Sidebar.jsx` / `Header.jsx` from both frontends (no sidebar per user requirement).
- New `Layout.jsx` + `TopNav.jsx` deliver a **horizontal top-center navbar**.
- Super-Admin nav is restricted to exactly 3 active entries: *School List*, *Create School*, *Create Admin* (plus the *Admin List* button on the Create-Admin page).
- School-Admin nav: Dashboard, Students, Staff, Attendance, Timetable, Academics (admin-frontend) + Fees / Books / Transport / Admissions / Frontdesk (fee-frontend).
- New pages: `superadmin/CreateAdmin.jsx`, `superadmin/AdminList.jsx`.
- Updated `services/api.js` with `listSchoolAdmins/createSchoolAdmin/...`.
- Route guard added: super_admin is auto-redirected to `/schools`; school admins go to `/`.

### Documentation & scripts
- `docs/DATABASE.md` — full step-by-step Postgres setup, env-var, migration and super-admin seeding guide.
- `scripts/sql/01_create_central_db.sql` — central DB bootstrap (creates `erp_user` with `CREATEDB`).
- `scripts/sql/02_create_school_db_template.sql` — manual per-school DB template (rare).
- `scripts/python/seed_superadmin.py` — idempotent super-admin creator.
- Rewrote `README.md` with quick-start + role-scope docs + endpoint table.

### Verification
- `manage.py check` passes on both backends.
- `manage.py makemigrations --dry-run` produces clean migrations for all 12 apps (7 admin + 5 fee).
- `eslint` / `ruff` lint pass for the whole tree.

## Test credentials
- Super Admin: `superadmin@erp.com` / `Admin@123` (created by `scripts/python/seed_superadmin.py`)
- School Admins: created from the Super-Admin UI; the password is set at creation time.

## Next action items (backlog)
- P1: Real `FeeDefaulters` computation (currently returns a "paid_count" placeholder).
- P1: Wire School Admin → manage staff users page in the admin-frontend (uses existing `/api/auth/users/` endpoints).
- P2: Pre-create a "default" `AcademicSession` row when a school is created.
- P2: Add a "Reset password" button on the Admin List page.
- P2: Soft-delete vs hard-delete for schools (currently DELETE just removes from central DB but leaves the tenant DB orphaned).
- P3: API integration tests (pytest + factory-boy) for the create-school flow.
