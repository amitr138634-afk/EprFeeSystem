# Database Structure

Multi-Tenant School ERP — PostgreSQL database setup, table reference, and quick-access commands.

---

## Architecture

```
PostgreSQL Server
│
├── school_erp_central        ← 1 central DB (created manually once)
│     Holds: schools, users, sessions, tokens
│
├── school_erp_demo           ← tenant DB for Demo School
├── school_erp_tst            ← tenant DB for Test School
└── school_erp_<code>         ← auto-created for every new school registered
```

- **1 central database** — shared by all services and all schools
- **1 tenant database per school** — created automatically when a school is registered via the API

---

## Summary

| Database | Tables | Type |
|---|---|---|
| `school_erp_central` | 14 | Central |
| `school_erp_<code>` (per school) | 23 | Tenant |

---

## Central Database — `school_erp_central` (14 tables)

| # | Table | Description |
|---|---|---|
| 1 | `users` | All accounts — super_admin, school_admin, staff, teacher |
| 2 | `schools` | Registered school records |
| 3 | `academic_sessions` | Academic year sessions per school |
| 4 | `token_blacklist_outstandingtoken` | Issued JWT tokens |
| 5 | `token_blacklist_blacklistedtoken` | Revoked / logged-out tokens |
| 6 | `auth_group` | Django permission groups |
| 7 | `auth_group_permissions` | Group ↔ permission mapping |
| 8 | `auth_permission` | Django permissions |
| 9 | `users_groups` | User ↔ group mapping |
| 10 | `users_user_permissions` | User ↔ permission mapping |
| 11 | `django_admin_log` | Django admin action log |
| 12 | `django_content_type` | Django content type registry |
| 13 | `django_migrations` | Applied migration history |
| 14 | `django_session` | User sessions |

### `users` columns

| Column | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `email` | varchar(254) | Unique — used as username |
| `password` | varchar(128) | Hashed |
| `first_name` | varchar(100) | |
| `last_name` | varchar(100) | |
| `role` | varchar(20) | `super_admin` / `school_admin` / `staff` / `teacher` |
| `school_id` | integer | NULL for super_admin; FK → `schools.id` |
| `phone` | varchar(15) | |
| `is_active` | boolean | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `schools` columns

| Column | Type | Notes |
|---|---|---|
| `id` | bigint | PK |
| `name` | varchar(200) | |
| `code` | varchar(20) | Unique short code e.g. `DEMO` |
| `email` | varchar(254) | Unique |
| `phone` | varchar(15) | |
| `address` | text | |
| `city` | varchar(100) | |
| `state` | varchar(100) | |
| `pincode` | varchar(10) | |
| `logo` | varchar(100) | File path |
| `status` | varchar(10) | `active` / `inactive` |
| `db_name` | varchar(100) | Tenant DB name e.g. `school_erp_demo` |
| `subscription_start` | date | |
| `subscription_end` | date | |
| `max_students` | integer | Default 1000 |

---

## Tenant Database — `school_erp_<code>` (23 tables)

Created automatically when a school is registered. Each school has its own isolated copy.

| # | Table | Description |
|---|---|---|
| 1 | `students` | Student records |
| 2 | `classes` | Class definitions (Class 1, Class 2 …) |
| 3 | `sections` | Sections per class (A, B, C) |
| 4 | `subjects` | Subject master |
| 5 | `student_subjects` | Student ↔ subject enrollment |
| 6 | `subject_allocations` | Teacher assigned to subject + class |
| 7 | `staff` | Staff and teacher records |
| 8 | `departments` | Staff departments |
| 9 | `designations` | Staff designations |
| 10 | `shifts` | Work shift definitions |
| 11 | `leave_types` | Leave type master |
| 12 | `leave_requests` | Staff leave applications |
| 13 | `student_attendance` | Daily student attendance |
| 14 | `staff_attendance` | Daily staff attendance |
| 15 | `timetable` | Class timetable slots |
| 16 | `periods` | Period / time slot master |
| 17 | `substitute_teachers` | Substitute teacher assignments |
| 18 | `exam_types` | Exam type master (Unit Test, Half Yearly …) |
| 19 | `marks` | Student marks per exam |
| 20 | `remark_masters` | Report card remark templates |
| 21 | `signature_masters` | Signature / stamp images |
| 22 | `holidays` | School holiday calendar |
| 23 | `django_migrations` | Applied migration history |

---

## PostgreSQL Commands

### Connect

```bash
# Central DB
PGPASSWORD=postgres psql -U postgres -d school_erp_central

# Tenant DB
PGPASSWORD=postgres psql -U postgres -d school_erp_demo
```

### Explore

```bash
# List all school databases
PGPASSWORD=postgres psql -U postgres -c \
  "SELECT datname FROM pg_database WHERE datname LIKE 'school_erp%' ORDER BY datname;"

# List tables in a database
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c "\dt"
PGPASSWORD=postgres psql -U postgres -d school_erp_demo    -c "\dt"

# Describe a table (columns + types)
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c "\d users"
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c "\d schools"
PGPASSWORD=postgres psql -U postgres -d school_erp_demo    -c "\d students"
```

### Query

```bash
# All schools with their admin email
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c "
SELECT s.id, s.name, s.code, s.status, s.db_name, u.email AS admin_email
FROM schools s
LEFT JOIN users u ON u.school_id = s.id AND u.role = 'school_admin'
ORDER BY s.id;"

# All user accounts
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c \
  "SELECT id, email, role, school_id, is_active FROM users ORDER BY id;"

# Students in a tenant DB
PGPASSWORD=postgres psql -U postgres -d school_erp_demo -c \
  "SELECT * FROM students LIMIT 10;"

# Count rows in any table
PGPASSWORD=postgres psql -U postgres -d school_erp_central -c \
  "SELECT COUNT(*) FROM schools;"
```

---

## Setup

### 1. Create central DB (one-time)

```bash
PGPASSWORD=postgres psql -U postgres -c "CREATE DATABASE school_erp_central;"
```

### 2. Run migrations

```bash
# Admin backend
cd services/admin-backend
python manage.py migrate --settings=core.settings.development

# Fee backend
cd services/fee-backend
python manage.py migrate --settings=core.settings.development
```

### 3. Create super admin

```bash
cd services/admin-backend
python manage.py shell --settings=core.settings.development -c "
from apps.accounts.models import User
if not User.objects.filter(email='superadmin@erp.com').exists():
    User.objects.create_superuser(email='superadmin@erp.com', password='Admin@123', role='super_admin')
    print('Super admin created')
else:
    print('Already exists')
"
```

### Default credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@erp.com` | `Admin@123` |
| School Admin (Demo) | `admin@demoschool.com` | `Admin@123` |
