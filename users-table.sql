-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text UNIQUE,
  mobile text UNIQUE,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public access
CREATE POLICY "Allow public access" ON users FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);