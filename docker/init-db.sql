-- Create judge0 database and user on the shared postgres (if needed)
-- This runs only on first container start
SELECT 'CREATE DATABASE judge0' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'judge0')\gexec
