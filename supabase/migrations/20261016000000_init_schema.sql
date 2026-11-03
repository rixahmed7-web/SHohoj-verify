-- Supabase CLI Migration 20261016000000_init_schema.sql
-- Run: supabase db push or execute via Supabase Dashboard SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    remarks TEXT,
    revocation_reason TEXT,
    revocation_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_certificates_number ON certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_token ON certificates (verification_token);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);

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

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    certificate_id VARCHAR(64),
    details TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated admins full access to certificates"
    ON certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated admins full access to audit logs"
    ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
BEGIN
    INSERT INTO audit_logs (action, certificate_id, details, actor)
    VALUES (
        'PUBLIC_VERIFICATION_ATTEMPT',
        upper(trim(p_certificate_number)),
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
    WHERE upper(trim(c.certificate_number)) = upper(trim(p_certificate_number))
      AND lower(trim(c.student_name)) = lower(trim(p_student_name));
END;
$$;

GRANT EXECUTE ON FUNCTION verify_certificate_record(TEXT, TEXT) TO anon, authenticated;
