-- =============================================================================
-- School ERP — Per-School (Tenant) PostgreSQL Database Template
-- =============================================================================
-- You normally do NOT need to run this file by hand.
-- Whenever a Super Admin creates a school from the UI, the admin-backend
-- automatically:
--   1) issues  CREATE DATABASE "school_erp_<school_code>"
--   2) runs Django migrations against it (creates all tables).
--
-- This file is provided ONLY for the case where you want to manually
-- pre-create a tenant database (e.g. for a backup restore).
--
-- Usage:
--   1. Edit the placeholder name on the next line.
--   2. Run:  psql -U postgres -f scripts/sql/02_create_school_db_template.sql
--   3. Then run migrations:
--        cd services/admin-backend
--        python manage.py migrate --database=school_<school_id> --run-syncdb
-- =============================================================================

\set school_code 'demo'
\set db_name     'school_erp_:school_code'

-- Create the DB (no-op if already exists)
SELECT format('CREATE DATABASE %I OWNER erp_user ENCODING ''UTF8''', :'db_name')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name')\gexec

GRANT ALL PRIVILEGES ON DATABASE :"db_name" TO erp_user;
