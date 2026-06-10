-- =============================================================================
-- School ERP — Central PostgreSQL Database Bootstrap
-- =============================================================================
-- Run this file ONCE on a fresh PostgreSQL server (as the postgres superuser):
--
--   psql -U postgres -f scripts/sql/01_create_central_db.sql
--
-- After running this, you can run Django migrations on the central DB:
--   cd services/admin-backend && python manage.py migrate
-- =============================================================================

-- Drop any leftover database / role from a previous attempt (safe in dev only)
-- DROP DATABASE IF EXISTS school_erp_central;
-- DROP ROLE     IF EXISTS erp_user;

-- 1) Optional dedicated application role
--    The role MUST have CREATEDB so Django can create per-school databases
--    when a Super Admin registers a new school.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'erp_user') THEN
        CREATE ROLE erp_user WITH LOGIN PASSWORD 'erp_password' CREATEDB;
    ELSE
        ALTER ROLE erp_user WITH LOGIN PASSWORD 'erp_password' CREATEDB;
    END IF;
END$$;

-- 2) Central database (stores Schools + Users only)
SELECT 'CREATE DATABASE school_erp_central OWNER erp_user ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'school_erp_central')\gexec

GRANT ALL PRIVILEGES ON DATABASE school_erp_central TO erp_user;

-- 3) (If you are using the `postgres` superuser instead of `erp_user`,
--     make sure it still has CREATEDB — it does by default.)
ALTER ROLE postgres WITH CREATEDB;
