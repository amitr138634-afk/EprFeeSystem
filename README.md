# School ERP — Multi-Tenant (Django + React + PostgreSQL)

A 4-service Multi-Tenant School ERP:

| Service          | Stack                              | Port |
|------------------|------------------------------------|------|
| **admin-backend**  | Django + DRF + PostgreSQL          | 8000 |
| **fee-backend**    | Django + DRF + PostgreSQL          | 8001 |
| **admin-frontend** | React + Vite + Tailwind CSS        | 3000 |
| **fee-frontend**   | React + Vite + Tailwind CSS        | 3001 |

> **Database & first-time setup → see [`docs/DATABASE.md`](docs/DATABASE.md).**
> It explains PostgreSQL bootstrap, env vars, migrations and Super-Admin
> seeding step by step.

---

## Quick start (TL;DR)

```bash
# 1. PostgreSQL central DB + erp_user role with CREATEDB
psql -U postgres -f scripts/sql/01_create_central_db.sql

# 2. Backends
cd services/admin-backend && cp .env.example .env  && python -m venv venv && source venv/bin/activate \
    && pip install -r requirements.txt && python manage.py migrate
cd ../fee-backend          && cp .env.example .env && python -m venv venv && source venv/bin/activate \
    && pip install -r requirements.txt && python manage.py migrate

# 3. Super Admin
python ../../scripts/python/seed_superadmin.py        # superadmin@erp.com / Admin@123

# 4. Frontends
cd ../admin-frontend && cp .env.example .env && npm install && npm run dev   # http://localhost:3000
cd ../fee-frontend   && cp .env.example .env && npm install && npm run dev   # http://localhost:3001

# 5. Run backends in two more terminals
cd services/admin-backend && source venv/bin/activate && python manage.py runserver 8000
cd services/fee-backend   && source venv/bin/activate && python manage.py runserver 8001
```

Login → http://localhost:3000 with `superadmin@erp.com / Admin@123`.

---

## Roles & UI scope

The **navigation is rendered at the TOP CENTER** of every page. There is no sidebar.

### Super Admin
The Super Admin sees **only three** sections:

| Menu          | Path             | What it does                                   |
|---------------|------------------|------------------------------------------------|
| School List   | `/schools`       | List / toggle status of all registered schools |
| Create School | `/schools/create`| Register a school + its first school-admin (auto-creates per-school DB) |
| Create Admin  | `/admins/create` | Add another school-admin to an existing school |

…plus an *Admin List* (`/admins`) that is reachable from the Create-Admin button bar.

### School Admin
After being created by the Super Admin, the school admin can sign in and gets the **full ERP** in the same panel:

* Dashboard
* Students (Student List, Strength)
* Staff (Staff List, Department Master)
* Attendance (Student / Register / Absent Log / Class-wise Summary / Staff)
* Timetable (View, Subjects)
* Academics (Marks Feeding, Subject Allocation)

And in the Fee Panel (port 3001) the same user sees Fees / Books & Uniforms / Transport / Admissions / Frontdesk.

---

## Documentation

* [`docs/DATABASE.md`](docs/DATABASE.md) — Full PostgreSQL + migrations + seeding guide
* [`scripts/sql/01_create_central_db.sql`](scripts/sql/01_create_central_db.sql) — Bootstrap central DB
* [`scripts/sql/02_create_school_db_template.sql`](scripts/sql/02_create_school_db_template.sql) — Manual tenant-DB template (rarely needed)
* [`scripts/python/seed_superadmin.py`](scripts/python/seed_superadmin.py) — Idempotent Super-Admin creator

---

## API documentation

When the backends are running:

* Admin: <http://localhost:8000/api/docs/>
* Fee:   <http://localhost:8001/api/docs/>

Authenticate by calling `POST /api/auth/login/` first and clicking **Authorize** in Swagger with `Bearer <access_token>`.

---

## Useful endpoints

### Admin Backend (`:8000`)

| Method | Path                                       | Role          |
|--------|--------------------------------------------|---------------|
| POST   | `/api/auth/login/`                         | public        |
| POST   | `/api/auth/logout/`                        | authenticated |
| POST   | `/api/auth/token/refresh/`                 | public        |
| GET    | `/api/auth/profile/`                       | authenticated |
| POST   | `/api/auth/change-password/`               | authenticated |
| GET/POST | `/api/schools/`                          | super_admin   |
| POST   | `/api/schools/<id>/toggle-status/`         | super_admin   |
| GET/POST | `/api/auth/school-admins/`               | super_admin   |
| GET/PATCH/DELETE | `/api/auth/school-admins/<id>/`  | super_admin   |
| GET/POST | `/api/auth/users/`                       | school_admin  |
| GET    | `/api/students/`, `/api/staff/`, `/api/attendance/...`, `/api/timetable/...`, `/api/academics/...` | school_admin / staff / teacher |

### Fee Backend (`:8001`)

| Method | Path                                    | Role          |
|--------|------------------------------------------|---------------|
| POST   | `/api/auth/login/`                       | public        |
| GET    | `/api/fees/heads/` etc.                  | school_admin  |
| POST   | `/api/fees/pay/`                         | staff+        |
| GET    | `/api/transport/...`, `/api/students/...`, `/api/frontdesk/...` | school_admin / staff |

---

## What was fixed in this round

* Added every missing `apps/__init__.py`, `apps/<x>/apps.py`, and `apps/<x>/migrations/__init__.py` (without them Django couldn't discover any of the inner apps).
* Enabled the JWT blacklist app properly — logout now really invalidates a refresh token.
* Hardened `LogoutView` (returns 400 if `refresh` is missing instead of silently failing).
* Locked down `CreateUserSerializer` so a school admin cannot promote anyone to `super_admin`.
* Made school creation transactional (`CREATE DATABASE` runs in autocommit, the central rows are inside `transaction.atomic`, and migrations on the tenant DB run last with `--run-syncdb`).
* Added new endpoints: `GET/POST /api/auth/school-admins/` and `GET/PATCH/DELETE /api/auth/school-admins/<id>/` for the **Create Admin** super-admin flow.
* Replaced sidebars in both frontends with a single **top-center horizontal navbar**.
* Super-Admin nav is restricted to *School List / Create School / Create Admin* only.
* Added `CreateAdmin.jsx`, `AdminList.jsx`, and wired them into the admin-frontend router.
* Added `seed_superadmin.py`, `01_create_central_db.sql`, `02_create_school_db_template.sql`, and `docs/DATABASE.md`.



dashboard should be click on school then dashboard should come in school admin and fee admin page -> not on seerate dashboards button o anv bar
