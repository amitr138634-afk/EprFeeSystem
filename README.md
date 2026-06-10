# School ERP System - Multi-Tenant

A full-featured Multi-Tenant School ERP built with **Django + DRF** (backend) and **React + Tailwind CSS** (frontend), powered by **PostgreSQL**.

---

## Architecture

```
EprFeeSystem/
├── services/
│   ├── admin-backend/       Django API  →  PORT 8000
│   ├── admin-frontend/      React App   →  PORT 3000
│   ├── fee-backend/         Django API  →  PORT 8001
│   └── fee-frontend/        React App   →  PORT 3001
└── README.md
```

### Multi-Tenancy Design
- **Central Database** (`school_erp_central`): Stores `schools` and `users` (super admin, school admins)
- **Per-School Database** (`school_erp_<code>`): Auto-created when a school is registered. Contains students, staff, attendance, fees, etc.
- JWT tokens carry `school_id` → middleware routes DB queries automatically

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- pip, npm

---

## Step 1 — PostgreSQL Setup

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Create central database
psql -U postgres -c "CREATE DATABASE school_erp_central;"

# (Optional) Create a dedicated user
psql -U postgres -c "CREATE USER erp_user WITH PASSWORD 'erp_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE school_erp_central TO erp_user;"
```

---

## Step 2 — Admin Backend Setup

```bash
cd services/admin-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
# OR on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials (DB_PASSWORD, etc.)

# Run migrations on central DB
python manage.py migrate

# Create a Super Admin user
python manage.py createsuperuser
# OR run this shell command:
python manage.py shell -c "
from apps.accounts.models import User
User.objects.create_superuser(
    email='superadmin@erp.com',
    password='Admin@123',
    first_name='Super',
    last_name='Admin'
)
print('Super admin created: superadmin@erp.com / Admin@123')
"

# Start server on port 8000
python manage.py runserver 8000
```

API docs available at: http://localhost:8000/api/docs/

---

## Step 3 — Fee Backend Setup

```bash
cd services/fee-backend

# Create virtual environment (separate from admin-backend)
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Use the SAME DB credentials as admin-backend (shared central DB)

# Run migrations
python manage.py migrate

# Start server on port 8001
python manage.py runserver 8001
```

API docs available at: http://localhost:8001/api/docs/

---

## Step 4 — Admin Frontend Setup

```bash
cd services/admin-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env already points to http://localhost:8000/api

# Start dev server on port 3000
npm run dev
```

Admin Panel: http://localhost:3000

---

## Step 5 — Fee Frontend Setup

```bash
cd services/fee-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env already points to http://localhost:8001/api

# Start dev server on port 3001
npm run dev
```

Fee Panel: http://localhost:3001

---

## Running All Services (Quick Start)

Open **4 separate terminals**:

```bash
# Terminal 1 — Admin Backend
cd services/admin-backend && source venv/bin/activate && python manage.py runserver 8000

# Terminal 2 — Fee Backend
cd services/fee-backend && source venv/bin/activate && python manage.py runserver 8001

# Terminal 3 — Admin Frontend
cd services/admin-frontend && npm run dev

# Terminal 4 — Fee Frontend
cd services/fee-frontend && npm run dev
```

---

## Creating Your First School

1. Open **Admin Panel**: http://localhost:3000
2. Login with super admin credentials: `superadmin@erp.com` / `Admin@123`
3. Go to **Schools → Create School**
4. Fill in school details + admin credentials
5. Click **Create School** — this will:
   - Create a new PostgreSQL database for the school
   - Set up all tables in that database
   - Create a school admin user

6. Now login to **Admin Panel** or **Fee Panel** using the school admin credentials
7. Both panels will automatically scope all data to that school's database

---

## Default Ports Summary

| Service          | Port  | URL                          |
|-----------------|-------|------------------------------|
| Admin Backend   | 8000  | http://localhost:8000/api/   |
| Fee Backend     | 8001  | http://localhost:8001/api/   |
| Admin Frontend  | 3000  | http://localhost:3000        |
| Fee Frontend    | 3001  | http://localhost:3001        |
| API Docs (Admin)| 8000  | http://localhost:8000/api/docs/ |
| API Docs (Fee)  | 8001  | http://localhost:8001/api/docs/ |

---

## Module Overview

### Admin Panel (Port 3000 + 8000)
| Menu | Features |
|------|----------|
| Students | Student List, Class Strength, Sections |
| Staff | Staff List, Departments, Designations, Shifts, Leave |
| Attendance | Student Attendance, Register, Absent Log, Staff Attendance |
| Timetable | View/Manage Timetable, Subjects, Substitutes |
| CCE/Academics | Marks Feeding, Subject Allocation, Exam Types |
| Super Admin | Create/Manage Schools, Toggle Status |

### Fee Panel (Port 3001 + 8001)
| Menu | Features |
|------|----------|
| Fee Management | Fee Heads, Structures, Discounts, Pay Fee, Receipts |
| Books | Book Sets, Inventory, Sell Books, Sales Reports |
| Uniforms | Item Master, Stock, Sell Uniforms |
| Transport | Vehicles, Routes, Stops, Student Transport, Attendance |
| Student Management | New Admissions, Enquiry, Follow-ups, Promote/Demote |
| Frontdesk | Visitors, Short Leaves, Feedbacks, HRM Letters |
| Reports | Daily/Monthly Collection, Class-wise, Fee Defaulters |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10, Django 4.2, Django REST Framework |
| Auth | JWT via djangorestframework-simplejwt |
| Database | PostgreSQL (multi-tenant: 1 DB per school) |
| Frontend | React 18, Vite, Tailwind CSS |
| State Management | Zustand |
| API Client | Axios + TanStack Query |
| Forms | React Hook Form |
| Font | Poppins (Google Fonts) |

---

## Environment Variables

### Backend (.env)
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=school_erp_central
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend (.env)
```
# admin-frontend
VITE_API_URL=http://localhost:8000/api

# fee-frontend
VITE_API_URL=http://localhost:8001/api
```

---

## Production Build

```bash
# Build frontends
cd services/admin-frontend && npm run build
cd services/fee-frontend && npm run build

# Collect static files (backends)
cd services/admin-backend && python manage.py collectstatic
cd services/fee-backend && python manage.py collectstatic
```

---

## Troubleshooting

**CORS errors:** Ensure `CORS_ALLOWED_ORIGINS` in backend `.env` includes your frontend URL.

**DB connection error:** Check PostgreSQL is running and credentials in `.env` are correct.

**Module not found (Python):** Ensure virtualenv is activated before running `python manage.py`.

**Port already in use:** Change port with `python manage.py runserver 8002` or `npm run dev -- --port 3002`.

**School DB not created:** The `CREATE DATABASE` command requires PostgreSQL superuser privileges. Ensure `DB_USER` has `CREATEDB` permission:
```sql
ALTER USER postgres CREATEDB;
```
