-- Initialize HRMS database
CREATE DATABASE IF NOT EXISTS hrms;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE hrms TO hrms_user;
