-- ==============================================================================
-- SHOHOJ AVIATION ACADEMY - CERTIFICATE VERIFICATION & MANAGEMENT SYSTEM
-- PostgreSQL Schema, Row Level Security (RLS) & Stored Procedures for Supabase
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean Up Existing (for clean reinstall if needed)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS certificates CASCADE;
-- DROP TABLE IF EXISTS admin_profiles CASCADE;

-- ==============================================================================
-- 3. CERTIFICATES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(64) NOT NULL UNIQUE,
    student_name VARCHAR(255) NOT NULL,
    student_photo_url TEXT,
    course_title VARCHAR(255) NOT NULL,
    course_duration VARCHAR(100) NOT NULL,
    completion_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'REVOKED')),
    verification_token VARCHAR(64) NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    certificate_file_url TEXT,
    remarks TEXT, -- Private internal administrator notes (never exposed publicly)
    revocation_reason TEXT,
    revocation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning-fast public lookup and admin indexing
CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_token ON certificates (verification_token);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);
CREATE INDEX IF NOT EXISTS idx_certificates_student_name ON certificates USING gin (to_tsvector('english', student_name));

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_certificates_updated_at ON certificates;
CREATE TRIGGER trg_certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. ADMIN PROFILES & CREDENTIALS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL DEFAULT 'Academy Administrator',
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT true,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    certificate_id VARCHAR(64),
    details TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_cert ON audit_logs (certificate_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict least-privilege model:
--   - Public users CANNOT browse, SELECT * or enumerate the certificates table.
--   - Public users can ONLY verify certificates via the secure stored procedure.
--   - Authenticated Admins have full access to manage records and view audit logs.
-- ==============================================================================

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Clear previous policies
DROP POLICY IF EXISTS "Deny direct public read of certificates" ON certificates;
DROP POLICY IF EXISTS "Allow admins full access to certificates" ON certificates;
DROP POLICY IF EXISTS "Allow admins full access to audit logs" ON certificates;
DROP POLICY IF EXISTS "Deny public read of admin profiles" ON admin_profiles;

-- Deny direct SELECT to anonymous users on certificates table (prevent DB scraping)
-- Authenticated users (logged in admins) can perform CRUD
CREATE POLICY "Allow authenticated admins full access to certificates"
    ON certificates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admins full access to audit logs"
    ON audit_logs
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 7. SECURE PUBLIC VERIFICATION FUNCTION (RPC)
-- Validates Certificate Number AND Student Full Name simultaneously.
-- Returns ONLY approved public verification columns.
-- Never exposes private remarks or internal IDs.
-- ==============================================================================
CREATE OR REPLACE FUNCTION verify_certificate_record(
    p_certificate_number TEXT,
    p_student_name TEXT
)
RETURNS TABLE (
    certificate_number VARCHAR,
    student_name VARCHAR,
    student_photo_url TEXT,
    course_title VARCHAR,
    course_duration VARCHAR,
    completion_date DATE,
    issue_date DATE,
    status VARCHAR,
    verification_token VARCHAR,
    certificate_file_url TEXT,
    revocation_reason TEXT,
    revocation_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_cert_number TEXT := upper(trim(p_certificate_number));
    v_clean_student_name TEXT := lower(trim(p_student_name));
BEGIN
    -- Log verification attempt
    INSERT INTO audit_logs (action, certificate_id, details, actor)
    VALUES (
        'PUBLIC_VERIFICATION_ATTEMPT',
        v_clean_cert_number,
        'Verification attempt with name: ' || p_student_name,
        'ANONYMOUS_VERIFIER'
    );

    RETURN QUERY
    SELECT 
        c.certificate_number,
        c.student_name,
        c.student_photo_url,
        c.course_title,
        c.course_duration,
        c.completion_date,
        c.issue_date,
        c.status,
        c.verification_token,
        c.certificate_file_url,
        c.revocation_reason,
        c.revocation_date
    FROM certificates c
    WHERE upper(trim(c.certificate_number)) = v_clean_cert_number
      AND lower(trim(c.student_name)) = v_clean_student_name;
END;
$$;

-- Grant execution of verification RPC to public anonymous web users
GRANT EXECUTE ON FUNCTION verify_certificate_record(TEXT, TEXT) TO anon, authenticated;

-- Function to look up certificate ID by unique verification token (for QR code scan pre-fill)
CREATE OR REPLACE FUNCTION get_certificate_hint_by_token(
    p_token TEXT
)
RETURNS TABLE (
    certificate_number VARCHAR,
    course_title VARCHAR,
    status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.certificate_number,
        c.course_title,
        c.status
    FROM certificates c
    WHERE c.verification_token = trim(p_token);
END;
$$;

GRANT EXECUTE ON FUNCTION get_certificate_hint_by_token(TEXT) TO anon, authenticated;

-- ==============================================================================
-- 8. SUPABASE STORAGE BUCKET CONFIGURATION
-- Run in Supabase SQL Editor to establish storage buckets
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('student-photos', 'student-photos', true),
    ('certificate-files', 'certificate-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read, Admin write
CREATE POLICY "Public Read Student Photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "Admin Upload Student Photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Public Read Certificate Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-files');

CREATE POLICY "Admin Upload Certificate Files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificate-files');
