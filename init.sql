-- UMKM Mahasiswa Platform Database Initialization
-- This file creates the database and sets up initial configurations

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS umkm_mahasiswa_db;

-- Connect to the database
\c umkm_mahasiswa_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For accent-insensitive search

-- Create custom functions for search
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$func$
SELECT unaccent('unaccent', $1)
$func$;

-- Create indexes for better performance (will be created after tables)
-- These will be added by Sequelize migrations

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Create application user (optional - for production)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'umkm_app_user') THEN
--         CREATE ROLE umkm_app_user LOGIN PASSWORD 'secure_password_here';
--     END IF;
-- END
-- $$;

-- Grant permissions (optional - for production)
-- GRANT CONNECT ON DATABASE umkm_mahasiswa_db TO umkm_app_user;
-- GRANT USAGE ON SCHEMA public TO umkm_app_user;
-- GRANT CREATE ON SCHEMA public TO umkm_app_user;

-- Log completion
SELECT 'Database initialization completed successfully' AS status;