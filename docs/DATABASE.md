# Database Setup Guide

Multi-Tenant School ERP — PostgreSQL database creation, migrations and admin
bootstrap. Read this **once** before running the project for the first time.

---

## 1. Architecture

```
              ┌─────────────────────────────┐
              │  PostgreSQL Server          │
              │  (single instance)          │
              │                             │
              │  ┌───────────────────────┐  │   ← created manually
              │  │ school_erp_central    │  │     (stores Schools + Users)
              │  └───────────────────────┘  │
              │                             │
              │  ┌───────────────────────┐  │   ← created automatically
              │  │ school_erp_demo       │  │     by the API whenever a
              │  └───────────────────────┘  │     Super Admin registers
              │  ┌───────────────────────┐  │     a new school
              │  │ school_erp_acme       │  │
              │  └───────────────────────┘  │
              │             …               │
              └─────────────────────────────┘
```

* **Central DB (`school_erp_central`)** — owned by all 4 services. Holds
  `users`, `schools`, `academic_sessions`, and JWT-blacklist tables.
* **Per-School DB (`school_erp_<code>`)** — one DB per school. Holds
  `students`, `staff`, `attendance`, `fees`, `transport`, etc.
* The JWT token contains a `school_id` claim. `utils.tenant.TenantMiddleware`
  reads it on every request and routes ORM queries to the right DB through
  `utils.db_router.TenantDatabaseRouter`.

---

## 2. Prerequisites

| Tool        | Version |
|-------------|---------|
| PostgreSQL  | 14+     |
| Python      | 3.10+   |
| Node.js     | 18+     |
| pip / yarn  | latest  |

Make sure `psql` and `postgres` (the superuser) are on `PATH`. On macOS:

```bash
brew install postgresql@14
brew services start postgresql@14
```

On Ubuntu:

```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

---

## 3. Create the central database (one-time)

There are **two** equivalent ways:

### 3a. With the provided SQL script (recommended)

```bash
# from project root /
psql -U postgres -f scripts/sql/01_create_central_db.sql
```

This will:

1. Create a role `erp_user` (password `erp_password`) **with `CREATEDB`**.
2. Create the database `school_erp_central`.
3. Make sure the `postgres` superuser also has `CREATEDB`.

> The `CREATEDB` privilege is critical — without it the API cannot
> automatically create per-school databases.

### 3b. Manual psql commands

```bash
psql -U postgres
postgres=# CREATE USER erp_user WITH PASSWORD 'erp_password' CREATEDB;
postgres=# CREATE DATABASE school_erp_central OWNER erp_user;
postgres=# GRANT ALL PRIVILEGES ON DATABASE school_erp_central TO erp_user;
postgres=# \q
```

---

## 4. Configure backend `.env` files

Both backends share the same central database, so the DB credentials must
match.

```bash
cd services/admin-backend && cp .env.example .env
cd ../fee-backend         && cp .env.example .env
```

Edit each `.env` and update **at least** these fields:

```
DB_NAME=school_erp_central
DB_USER=postgres       # or erp_user
DB_PASSWORD=postgres   # or erp_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=<replace-with-a-long-random-string>
```

---

## 5. Apply Django migrations on the central DB

Run **each** backend's migrations once. They share the same central DB but
both manage their own JWT-blacklist tables, etc.

```bash
# Terminal 1
cd services/admin-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate          # creates users / schools / token_blacklist tables

# Terminal 2
cd services/fee-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

If you ever change a model, run:

```bash
python manage.py makemigrations
python manage.py migrate
```

---

## 6. Create the Super Admin user

Use the bundled idempotent script:

```bash
# from project root
python scripts/python/seed_superadmin.py \
    --email    superadmin@erp.com \
    --password Admin@123
```

Output:

```
Created super admin: superadmin@erp.com  /  Admin@123
```

You can re-run the script any time to reset the password.

> The user is created in the **central** `users` table with `role='super_admin'`
> and `school_id=NULL`. Only this user can access the *Schools* and
> *School Admins* screens.

---

## 7. Start all 4 microservices

Open **four** terminals from the project root:

```bash
# 1) Admin Backend  (port 8000)
cd services/admin-backend && source venv/bin/activate
python manage.py runserver 8000

# 2) Fee Backend    (port 8001)
cd services/fee-backend && source venv/bin/activate
python manage.py runserver 8001

# 3) Admin Frontend (port 3000)
cd services/admin-frontend && npm install && npm run dev

# 4) Fee Frontend   (port 3001)
cd services/fee-frontend && npm install && npm run dev
```

| Service        | URL                                   |
|----------------|---------------------------------------|
| Admin Panel    | http://localhost:3000                 |
| Fee Panel      | http://localhost:3001                 |
| Admin API docs | http://localhost:8000/api/docs/       |
| Fee API docs   | http://localhost:8001/api/docs/       |

---

## 8. Register your first school (creates a tenant DB automatically)

1. Open <http://localhost:3000> and log in with the super-admin credentials.
2. The top nav shows three options (Super-Admin role):
   * **Schools**
   * **Create School**
   * **Create Admin**
3. Click **Create School**, fill the form (school details **and**
   the very first school admin's email + password) and submit.
4. Behind the scenes the API will:
   1. `CREATE DATABASE school_erp_<code>` on your PostgreSQL server.
   2. Run all migrations against that new database.
   3. Insert a row in the central `schools` table.
   4. Insert a `school_admin` user in the central `users` table whose
      `school_id` points at the new school.
5. Verify it from psql:
   ```bash
   psql -U postgres -l            # should list school_erp_<code>
   psql -U postgres -d school_erp_central -c 'SELECT id, name, code, db_name FROM schools;'
   psql -U postgres -d school_erp_central -c "SELECT email, role, school_id FROM users WHERE role='school_admin';"
   ```

Need more school admins for the same school later? Use the **Create Admin**
screen (Super-Admin only) — it lets you attach another `school_admin` user
to an existing school without touching the school record.

---

## 9. Manually creating a school DB (rare)

You'll almost never do this — the API does it automatically. But for backup
restore scenarios you can run the template script:

```bash
psql -U postgres -v school_code='demo' -f scripts/sql/02_create_school_db_template.sql
```

Then run migrations against that DB from the admin backend:

```bash
cd services/admin-backend && python manage.py shell <<'EOF'
from utils.tenant import register_school_database
from django.core.management import call_command
alias = register_school_database(school_id=1, db_name='school_erp_demo')
call_command('migrate', database=alias, run_syncdb=True, interactive=False, verbosity=1)
EOF
```

---

## 10. Resetting the local environment

```bash
# Drop ALL school DBs (be careful!)
psql -U postgres -tAc "SELECT datname FROM pg_database WHERE datname LIKE 'school_erp_%';" \
  | xargs -I {} psql -U postgres -c 'DROP DATABASE "{}"'

# Then recreate central and re-seed
psql -U postgres -f scripts/sql/01_create_central_db.sql
cd services/admin-backend && python manage.py migrate
cd ../fee-backend         && python manage.py migrate
python ../../scripts/python/seed_superadmin.py
```

---

## 11. Troubleshooting

| Error                                                              | Cause / fix |
|--------------------------------------------------------------------|-------------|
| `permission denied to create database`                             | `ALTER USER <db_user> CREATEDB;` |
| `relation "users" does not exist`                                  | You forgot `python manage.py migrate` on the central DB. |
| `relation "students" does not exist` when calling the school panel | The tenant DB exists but migrations didn't run. Open shell and run `call_command('migrate', database='school_<id>', run_syncdb=True)`. |
| `connection refused`                                               | PostgreSQL is not running. `brew services start postgresql@14` or `sudo service postgresql start`. |
| `CORS error in browser`                                            | Add the frontend origin to `CORS_ALLOWED_ORIGINS` in the backend `.env`. |
| `Module not found: apps.accounts`                                  | Make sure `apps/__init__.py` exists in the backend you're running. |
| 401 on every request right after creating a school                 | Log out and back in — the JWT must be re-issued so it carries the new `school_id` claim. |
