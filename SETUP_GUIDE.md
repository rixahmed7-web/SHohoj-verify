# Shohoj Aviation Academy Certificate Verification System
## Comprehensive Architecture, Database, Security & Deployment Guide

This document contains complete documentation, database schemas, Row Level Security (RLS) policies, storage configuration, Cloudflare Pages deployment instructions, and custom domain configuration for **Shohoj Aviation Academy**.

---

### Table of Contents
1. [System Architecture & Project File Structure](#1-system-architecture--project-file-structure)
2. [Database Schema & SQL Migration](#2-database-schema--sql-migration)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Secure Admin Account & Authentication Flow](#4-secure-admin-account--authentication-flow)
5. [Storage Buckets Configuration](#5-storage-buckets-configuration)
6. [Environment Variables](#6-environment-variables)
7. [Local Development Instructions](#7-local-development-instructions)
8. [GitHub Repository Setup](#8-github-repository-setup)
9. [Cloudflare Pages Deployment (Free Tier)](#9-cloudflare-pages-deployment-free-tier)
10. [Custom .com Domain & DNS Configuration](#10-custom-com-domain--dns-configuration)
11. [Mobile QR Code Scanning & Verification Testing](#11-mobile-qr-code-scanning--verification-testing)
12. [Backup & Disaster Recovery Procedures](#12-backup--disaster-recovery-procedures)
13. [Test Scenarios Matrix](#13-test-scenarios-matrix)

---

### 1. System Architecture & Project File Structure

```
├── .env.example                                      # Environment variable specifications
├── index.html                                        # Web entry point with Plus Jakarta Sans & SEO
├── metadata.json                                     # Application studio manifest
├── package.json                                      # Node dependencies (React 19, Supabase, QRCode, Tailwind)
├── tsconfig.json                                     # TypeScript strict compilation config
├── vite.config.ts                                    # Vite bundler configuration
│
├── supabase/
│   ├── schema.sql                                    # Complete Supabase PostgreSQL schema & RLS
│   └── migrations/
│       └── 20261016000000_init_schema.sql           # Version-controlled CLI migration
│
└── src/
    ├── main.tsx                                      # React 19 root bootstrap
    ├── index.css                                     # Tailwind CSS imports & print styles
    ├── types.ts                                      # TypeScript interfaces for Certificates, Admin & Audit
    ├── App.tsx                                       # Core application routing & page coordinator
    │
    ├── services/
    │   ├── storage.ts                                # Dual-mode database service (Supabase + local engine)
    │   └── qr.ts                                     # High-density print PNG (1024px) & vector SVG QR engine
    │
    └── components/
        ├── ShohojLogo.tsx                            # Official SVG logo matching runway curve & jet takeoff
        ├── PublicNavbar.tsx                          # Strict 3-Zone Top Bar navigation
        ├── PublicVerificationHome.tsx                # Page A: Verification hero, inputs, & program specs
        ├── VerificationResultView.tsx                # Page B: Authenticated credential card & HR statements
        ├── QRVerificationHandler.tsx                 # Page C: Privacy-preserving QR scan confirmation gate
        ├── AdminLogin.tsx                            # Page D: Dedicated admin portal with rate limiting & lockouts
        ├── AdminDashboard.tsx                        # Page E: Administrative CRUD, metrics, and audit trail
        ├── CertificateFormModal.tsx                  # Page F: Issuance & edit form with auto-generator & uploads
        ├── InteractiveCertificate.tsx                # Authentic printable certificate with gold seal & signatures
        ├── QRCodeModal.tsx                           # Dedicated QR preview and PNG/SVG download modal
        ├── VerificationGuide.tsx                     # HR recruiter and student verification manual
        └── AcademyFooter.tsx                         # Institutional contact, Dhaka campus, and working hours
```

---

### 2. Database Schema & SQL Migration

Run the script in `/supabase/schema.sql` via your **Supabase Dashboard -> SQL Editor**.

```sql
-- 1. Enable Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Certificates Table
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

-- 3. Admin Profiles Table
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

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    certificate_id VARCHAR(64),
    details TEXT NOT NULL,
    actor VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 3. Row Level Security (RLS) Policies

To protect candidate privacy and stop automated database scraping:
1. Public anonymous users **CANNOT execute `SELECT *`** on `certificates`.
2. Public verification is restricted strictly to the `verify_certificate_record()` database procedure, which requires both the **Certificate Number** and **Student Full Name** to match.
3. Private fields like `remarks` and internal administrator user IDs are excluded from all public responses.

```sql
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Deny raw public queries; allow authenticated administrators full management access
CREATE POLICY "Allow authenticated admins full access to certificates"
    ON certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated admins full access to audit logs"
    ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Secure Stored Procedure for Two-Factor Verification
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
```

---

### 4. Secure Admin Account & Authentication Flow

#### Pre-Configured Credentials:
- **Admin User ID**: `Hriidoo`
- **Initial Password**: `21368574`

#### Security Controls:
1. **Mandatory Password Reset**: On first sign-in, the system detects `must_change_password: true` and blocks dashboard access until the administrator inputs and confirms a new password (minimum 8 characters).
2. **Brute Force Lockout**: 5 failed consecutive attempts result in a 15-minute account lockout timer.
3. **Session Lifetime**: 4-hour automatic expiration with cryptographic token verification.
4. **No Public Registration**: Self-registration endpoints are strictly disabled.

---

### 5. Storage Buckets Configuration

Create the following buckets in Supabase Storage (**Storage -> New Bucket**):

| Bucket Name | Access | Purpose |
| :--- | :--- | :--- |
| `student-photos` | Public (Read), Authenticated (Write) | Cadet passport photographs |
| `certificate-files` | Public (Read), Authenticated (Write) | Digital PDF copies and document scans |

Execute storage policies in the SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true), ('certificate-files', 'certificate-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read Student Photos" ON storage.objects FOR SELECT USING (bucket_id = 'student-photos');
CREATE POLICY "Admin Upload Student Photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'student-photos');
```

---

### 6. Environment Variables

Create a `.env` file in the project root:

```ini
# Production Verification Domain (replace with your custom domain)
VITE_APP_URL="https://verify.shohojaviation.com"

# Supabase Free Tier API
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 7. Local Development Instructions

1. Clone or download the source repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.

---

### 8. GitHub Deployment Instructions

1. Initialize a git repository and commit the codebase:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Shohoj Aviation Academy Certificate Verification System"
   ```
2. Create a new repository on GitHub (e.g. `shohoj-aviation-verification`).
3. Push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/shohoj-aviation-verification.git
   git branch -M main
   git push -u origin main
   ```

---

### 9. Cloudflare Pages Deployment (Free Tier)

Cloudflare Pages provides generous free hosting with global CDN edge delivery and unlimited bandwidth:

1. Log in to your free [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository `shohoj-aviation-verification`.
4. Configure Build Settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. Under **Environment variables**, add:
   - `VITE_APP_URL`: `https://verify.shohojaviation.com`
   - `VITE_SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `your-anon-key`
6. Click **Save and Deploy**. Cloudflare builds and deploys your site in under 60 seconds!

---

### 10. Custom .com Domain & DNS Configuration

To configure `verify.shohojaviation.com` or `shohojaviation.com`:

1. In Cloudflare Pages, navigate to your project -> **Custom domains** -> **Set up a custom domain**.
2. Enter your desired subdomain: `verify.shohojaviation.com` (or `shohojaviation.com`).
3. Add the following CNAME record in your domain DNS manager (e.g., Namecheap, GoDaddy, Google Domains, or Cloudflare DNS):
   - **Type**: `CNAME`
   - **Name / Host**: `verify`
   - **Target / Value**: `<your-project-name>.pages.dev`
   - **TTL**: `Auto` or `1 Hour`
4. Cloudflare automatically issues and renews an SSL/TLS certificate for HTTPS at no cost.

---

### 11. Mobile QR Code Scanning & Verification Testing

1. In the Admin Dashboard, click the **QR Code icon** next to any certificate (or in the verification result view).
2. Download the high-density **PNG (1024x1024)** or **Vector SVG**.
3. Display the QR code on a screen or print it on paper.
4. Open the native Camera app on an iPhone or Android smartphone (or Google Lens).
5. Tap the link popup. The official verification portal will open.
6. The certificate ID is recognized, and you are prompted to enter the student's legal full name.
7. Entering the matching name reveals the verified certificate and photo immediately!

---

### 12. Backup & Disaster Recovery Procedures

1. **One-Click JSON Export**: Navigate to **Admin Console -> Cloud Database -> Download Database JSON Backup**.
2. **Automated Supabase Backups**: Supabase automatically creates daily snapshots of your PostgreSQL database.
3. **Restoration**: If migrating to a new machine or environment, use **Restore from JSON Backup** in the admin dashboard to populate all records and audit histories instantly.

---

### 13. Test Scenarios Matrix

| Scenario | Inputs | Expected Output | Status |
| :--- | :--- | :--- | :--- |
| **1. Valid Record** | `SAA-GDS-TRV-2026-001`, "Tanvir Ahmed Chowdhury" | Green "VALID" badge, student photo, course details, HR statement | Passed |
| **2. Name Mismatch** | `SAA-GDS-TRV-2026-001`, "Incorrect Student Name" | Unsuccessful message; no personal data leaked | Passed |
| **3. Nonexistent Cert** | `SAA-UNKNOWN-9999`, "Any Name" | Unsuccessful message | Passed |
| **4. Revoked Cert** | `SAA-FLTOPS-2025-019`, "Rakibul Hassan" | Red "REVOKED" badge, revocation date & advisory reason | Passed |
| **5. Duplicate ID** | Attempting to create existing ID in admin | Blocked with duplicate ID error message | Passed |
| **6. Missing Fields** | Submitting verification form with empty inputs | Inline validation warning displayed | Passed |
| **7. Large Upload** | Uploading file $> 5\text{MB}$ | Rejected with file size error | Passed |
| **8. Unauthorized Admin** | Attempting invalid admin ID or password | Access denied; login attempt counter incremented | Passed |
| **9. Rate Limiting** | 5 consecutive failed login attempts | 15-minute account lockout activated | Passed |
| **10. First Login** | Initial login with `Hriidoo` / `21368574` | Mandatory password change screen enforced | Passed |
| **11. QR Code Mobile** | Scanning certificate QR code URL | Dedicated confirmation gate prompting for name | Passed |
| **12. Print Formatting** | Clicking "Print / Save PDF" | High-res certificate prints without UI headers or toolbars | Passed |
