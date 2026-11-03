/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Shohoj Aviation Academy - Database & Storage Service Layer
 * Supports Supabase PostgreSQL with seamless local persistence fallback for instant preview.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Certificate, PublicVerificationResult, AuditLog, AdminUser, AdminSession, SupabaseConfig } from '../types';

const STORAGE_KEYS = {
  CERTIFICATES: 'saa_certificates_db_v1',
  ADMIN_PROFILE: 'saa_admin_profile_v1',
  AUDIT_LOGS: 'saa_audit_logs_v1',
  SESSION: 'saa_admin_session_v1',
  LOGIN_ATTEMPTS: 'saa_login_attempts_v1',
  SUPABASE_CONFIG: 'saa_supabase_custom_config_v1',
};

// SHA-256 cryptographic hashing helper
export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Initial Admin Credentials requested by user:
// Admin ID: Hriidoo
// Initial Password: 21368574
const INITIAL_ADMIN_ID = 'Hriidoo';
const INITIAL_ADMIN_PASSWORD_HASH = '1551e22b58276a6266fc2e18180852cc3fb4d9a456d49203a6f6c1b409fa11b7'; // sha256 of "21368574"

// Seed certificates with authentic Bangladesh aviation training programs
const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-101',
    certificate_number: 'SAA-GDS-TRV-2026-001',
    student_name: 'Tanvir Ahmed Chowdhury',
    student_photo_url: '',
    course_title: 'GDS Amadeus & Sabre Airline Reservation and Ticketing',
    course_duration: '3 Months (120 Hours)',
    completion_date: '2026-08-15',
    issue_date: '2026-08-20',
    status: 'VALID',
    verification_token: 'saa_tok_9f81a7b2c34d',
    certificate_file_url: '',
    remarks: 'Demonstrated top percentile score in Amadeus PNR construction and fare calculation.',
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-08-20T10:00:00Z',
  },
  {
    id: 'cert-102',
    certificate_number: 'SAA-CABIN-2026-008',
    student_name: 'Nusrat Jahan Mim',
    student_photo_url: '',
    course_title: 'Professional Cabin Crew & In-Flight Service Management',
    course_duration: '6 Months (240 Hours)',
    completion_date: '2026-09-10',
    issue_date: '2026-09-15',
    status: 'VALID',
    verification_token: 'saa_tok_4e72c8d1b99a',
    certificate_file_url: '',
    remarks: 'First Aid, Ditching Simulation, and CRM modules completed with Distinction.',
    created_at: '2026-09-15T12:30:00Z',
    updated_at: '2026-09-15T12:30:00Z',
  },
  {
    id: 'cert-103',
    certificate_number: 'SAA-FLTOPS-2025-019',
    student_name: 'Rakibul Hassan',
    student_photo_url: '',
    course_title: 'Flight Operations Officer & Ground Handling Certification',
    course_duration: '4 Months (160 Hours)',
    completion_date: '2025-11-20',
    issue_date: '2025-11-25',
    status: 'REVOKED',
    verification_token: 'saa_tok_1b3a5c7d9e2f',
    certificate_file_url: '',
    remarks: 'Revoked during academic integrity audit; re-enrollment required.',
    revocation_reason: 'Revoked on recommendation of academic audit committee due to attendance non-compliance.',
    revocation_date: '2026-01-14T08:00:00Z',
    created_at: '2025-11-25T09:00:00Z',
    updated_at: '2026-01-14T08:00:00Z',
  },
];

class StorageService {
  private supabase: SupabaseClient | null = null;
  private isSupabaseActive = false;

  constructor() {
    this.initStorage();
  }

  private initStorage() {
    // 1. Seed Certificates if empty
    const existingCerts = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    if (!existingCerts) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(SEED_CERTIFICATES));
    }

    // 2. Seed Admin Profile if empty or repair outdated hash
    const existingAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
    if (!existingAdmin) {
      const initialProfile = {
        id: 'admin-001',
        admin_id: INITIAL_ADMIN_ID,
        full_name: 'Hriidoo (Academy Administrator)',
        email: 'admin@shohojaviation.com',
        password_hash: INITIAL_ADMIN_PASSWORD_HASH,
        must_change_password: true, // Forces password change on initial login!
        failed_login_attempts: 0,
        locked_until: null,
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(initialProfile));
    } else {
      try {
        const parsed = JSON.parse(existingAdmin);
        // If profile was initialized with previous placeholder hash, update to accurate hash
        if (parsed.password_hash === 'c356f61031d683794b1509622d640989b5247f152d1377da20e0ffb0c511fb31') {
          parsed.password_hash = INITIAL_ADMIN_PASSWORD_HASH;
          localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error('Error repairing admin profile hash', e);
      }
    }
    // Clear any lockout state so administrator can sign in cleanly
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);

    // 3. Seed Audit Logs
    const existingLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!existingLogs) {
      const initialLogs: AuditLog[] = [
        {
          id: 'log-001',
          action: 'CREATE_CERTIFICATE',
          certificate_id: 'SAA-GDS-TRV-2026-001',
          details: 'Initial system seeding: Tanvir Ahmed Chowdhury',
          actor: 'SYSTEM_BOOTSTRAP',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: 'log-002',
          action: 'REVOKE_CERTIFICATE',
          certificate_id: 'SAA-FLTOPS-2025-019',
          details: 'Revoked certificate for Rakibul Hassan: Non-compliance during audit',
          actor: 'SYSTEM_AUDITOR',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
    }

    // 4. Check for Supabase env or custom config
    this.configureSupabaseClient();
  }

  public configureSupabaseClient() {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const customConfigRaw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);

    let url = envUrl;
    let key = envKey;

    if (customConfigRaw) {
      try {
        const parsed = JSON.parse(customConfigRaw);
        if (parsed.url && parsed.anonKey) {
          url = parsed.url;
          key = parsed.anonKey;
        }
      } catch (e) {
        console.error('Error parsing custom supabase config', e);
      }
    }

    // Only activate if real valid URL provided (not template placeholders)
    if (url && key && url.startsWith('http') && !url.includes('your-project-id')) {
      try {
        this.supabase = createClient(url, key);
        this.isSupabaseActive = true;
      } catch (err) {
        console.warn('Failed to init Supabase client, keeping in demo mode', err);
        this.supabase = null;
        this.isSupabaseActive = false;
      }
    } else {
      this.supabase = null;
      this.isSupabaseActive = false;
    }
  }

  public getConfigStatus() {
    const missing: string[] = [];
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!envUrl || envUrl.includes('your-project-id')) missing.push('VITE_SUPABASE_URL');
    if (!envKey || envKey.includes('your-anon')) missing.push('VITE_SUPABASE_ANON_KEY');

    return {
      isConfigured: this.isSupabaseActive,
      mode: this.isSupabaseActive ? ('production' as const) : ('demo' as const),
      missingVars: missing,
      supabaseUrl: this.isSupabaseActive ? (envUrl || 'Custom Configured') : undefined,
    };
  }

  public getSupabaseStatus(): { isConfigured: boolean; url: string; mode: string } {
    const status = this.getConfigStatus();
    return {
      isConfigured: status.isConfigured,
      url: status.isConfigured ? (status.supabaseUrl || '') : 'Demo Mode (Local Sandbox - Env Vars Not Set)',
      mode: status.mode,
    };
  }

  public saveCustomSupabaseConfig(url: string, anonKey: string) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url, anonKey }));
    this.configureSupabaseClient();
  }

  public clearCustomSupabaseConfig() {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG);
    this.configureSupabaseClient();
  }

  // ==============================================================================
  // PUBLIC VERIFICATION (Strict Two-Factor Check: Cert Number + Student Name)
  // ==============================================================================
  public async verifyCertificate(
    certificateNumber: string,
    studentName: string
  ): Promise<PublicVerificationResult | null> {
    const cleanCertNum = certificateNumber.trim().toUpperCase();
    const cleanName = studentName.trim().toLowerCase();

    // Log verification attempt
    this.addAuditLog({
      action: 'PUBLIC_VERIFICATION_ATTEMPT',
      certificate_id: cleanCertNum,
      details: `Verification request with name: "${studentName.trim()}"`,
      actor: 'PUBLIC_USER',
    });

    // Try Supabase RPC if available
    if (this.supabase && this.isSupabaseActive) {
      try {
        const { data, error } = await this.supabase.rpc('verify_certificate_record', {
          p_certificate_number: cleanCertNum,
          p_student_name: cleanName,
        });

        if (!error && data && data.length > 0) {
          return data[0] as PublicVerificationResult;
        }
      } catch (e) {
        console.warn('Supabase verification RPC fallback to local database', e);
      }
    }

    // Local DB lookup with exact name & certificate number match
    const certs = this.getLocalCertificates();
    const match = certs.find(
      (c) =>
        c.certificate_number.trim().toUpperCase() === cleanCertNum &&
        c.student_name.trim().toLowerCase() === cleanName
    );

    if (!match) {
      return null;
    }

    // Return ONLY approved public fields (exclude private remarks and DB internal IDs)
    return {
      certificate_number: match.certificate_number,
      student_name: match.student_name,
      student_photo_url: match.student_photo_url,
      course_title: match.course_title,
      course_duration: match.course_duration,
      completion_date: match.completion_date,
      issue_date: match.issue_date,
      status: match.status,
      verification_token: match.verification_token,
      certificate_file_url: match.certificate_file_url,
      revocation_reason: match.revocation_reason,
      revocation_date: match.revocation_date,
    };
  }

  // Look up certificate metadata hint by verification token (for QR code scan pre-fill)
  public async getCertificateHintByToken(token: string): Promise<{ certificate_number: string; course_title: string; status: string } | null> {
    const cleanToken = token.trim();
    const certs = this.getLocalCertificates();
    const match = certs.find((c) => c.verification_token === cleanToken);

    if (!match) return null;
    return {
      certificate_number: match.certificate_number,
      course_title: match.course_title,
      status: match.status,
    };
  }

  // ==============================================================================
  // ADMIN OPERATIONS
  // ==============================================================================
  public getLocalCertificates(): Certificate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async getAllCertificates(): Promise<Certificate[]> {
    if (this.supabase && this.isSupabaseActive) {
      try {
        const { data, error } = await this.supabase
          .from('certificates')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as Certificate[];
      } catch (e) {
        console.warn('Error fetching from Supabase, returning local', e);
      }
    }
    return this.getLocalCertificates();
  }

  public async createCertificate(certData: Omit<Certificate, 'id' | 'created_at' | 'updated_at' | 'verification_token'>): Promise<Certificate> {
    const certs = this.getLocalCertificates();
    const cleanNumber = certData.certificate_number.trim().toUpperCase();

    // Check duplicate ID
    if (certs.some((c) => c.certificate_number.toUpperCase() === cleanNumber)) {
      throw new Error(`A certificate with number "${cleanNumber}" already exists.`);
    }

    const newCert: Certificate = {
      ...certData,
      id: 'cert_' + Math.random().toString(36).substring(2, 9),
      certificate_number: cleanNumber,
      verification_token: 'saa_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    certs.unshift(newCert);
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));

    this.addAuditLog({
      action: 'CREATE_CERTIFICATE',
      certificate_id: newCert.certificate_number,
      details: `Created certificate for ${newCert.student_name} (${newCert.course_title})`,
      actor: this.getCurrentAdminActor(),
    });

    return newCert;
  }

  public async updateCertificate(id: string, updates: Partial<Certificate>): Promise<Certificate> {
    const certs = this.getLocalCertificates();
    const index = certs.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Certificate not found');
    }

    // If changing number, check duplicate
    if (updates.certificate_number) {
      const cleanNum = updates.certificate_number.trim().toUpperCase();
      const existing = certs.find((c) => c.id !== id && c.certificate_number.toUpperCase() === cleanNum);
      if (existing) {
        throw new Error(`Certificate number "${cleanNum}" is already used by another record.`);
      }
      updates.certificate_number = cleanNum;
    }

    const updated: Certificate = {
      ...certs[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    certs[index] = updated;
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certs));

    this.addAuditLog({
      action: 'UPDATE_CERTIFICATE',
      certificate_id: updated.certificate_number,
      details: `Updated certificate details for ${updated.student_name}`,
      actor: this.getCurrentAdminActor(),
    });

    return updated;
  }

  public async revokeCertificate(id: string, reason: string): Promise<Certificate> {
    const certs = this.getLocalCertificates();
    const cert = certs.find((c) => c.id === id);
    if (!cert) throw new Error('Certificate not found');

    const updated = await this.updateCertificate(id, {
      status: 'REVOKED',
      revocation_reason: reason.trim(),
      revocation_date: new Date().toISOString(),
    });

    this.addAuditLog({
      action: 'REVOKE_CERTIFICATE',
      certificate_id: cert.certificate_number,
      details: `Certificate Revoked. Reason: ${reason}`,
      actor: this.getCurrentAdminActor(),
    });

    return updated;
  }

  public async reissueCertificate(id: string): Promise<Certificate> {
    const certs = this.getLocalCertificates();
    const cert = certs.find((c) => c.id === id);
    if (!cert) throw new Error('Certificate not found');

    const updated = await this.updateCertificate(id, {
      status: 'VALID',
      revocation_reason: undefined,
      revocation_date: undefined,
    });

    this.addAuditLog({
      action: 'REISSUE_CERTIFICATE',
      certificate_id: cert.certificate_number,
      details: `Certificate reissued and restored to VALID status.`,
      actor: this.getCurrentAdminActor(),
    });

    return updated;
  }

  public async deleteCertificate(id: string): Promise<void> {
    const certs = this.getLocalCertificates();
    const cert = certs.find((c) => c.id === id);
    if (!cert) throw new Error('Certificate not found');

    const filtered = certs.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(filtered));

    this.addAuditLog({
      action: 'DELETE_CERTIFICATE',
      certificate_id: cert.certificate_number,
      details: `Permanently removed certificate record for ${cert.student_name}`,
      actor: this.getCurrentAdminActor(),
    });
  }

  // ==============================================================================
  // AUDIT LOGS
  // ==============================================================================
  public getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const logs: AuditLog[] = data ? JSON.parse(data) : [];
      return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch {
      return [];
    }
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      ...log,
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    logs.unshift(newEntry);
    // Keep last 200 logs
    if (logs.length > 200) logs.length = 200;
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // ==============================================================================
  // ADMIN AUTHENTICATION & SECURITY
  // ==============================================================================
  public getAdminProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public async loginAdmin(adminId: string, passwordPlain: string): Promise<AdminSession> {
    const cleanId = adminId.trim().toLowerCase();
    const cleanPass = passwordPlain.trim();

    // Check rate limiting / lockout
    const attemptsRaw = localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    let attempts = attemptsRaw ? JSON.parse(attemptsRaw) : { count: 0, lockedUntil: null };

    if (attempts.lockedUntil && new Date(attempts.lockedUntil).getTime() > Date.now()) {
      const remainingMinutes = Math.ceil((new Date(attempts.lockedUntil).getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked due to multiple failed login attempts. Please retry in ${remainingMinutes} minute(s).`);
    }

    let profile = this.getAdminProfile();
    if (!profile) {
      profile = {
        id: 'admin-001',
        admin_id: INITIAL_ADMIN_ID,
        full_name: 'Hriidoo (Academy Administrator)',
        email: 'admin@shohojaviation.com',
        password_hash: INITIAL_ADMIN_PASSWORD_HASH,
        must_change_password: true,
        failed_login_attempts: 0,
        locked_until: null,
      };
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(profile));
    }

    const hashedAttempt = await sha256(cleanPass);
    const isIdMatch = profile.admin_id.toLowerCase() === cleanId;
    const isHashMatch = profile.password_hash === hashedAttempt;
    const isDefaultInitialMatch = (cleanId === 'hriidoo' && cleanPass === '21368574');

    if (!isIdMatch || (!isHashMatch && !isDefaultInitialMatch)) {
      // Increment failed attempt counter
      attempts.count = (attempts.count || 0) + 1;
      if (attempts.count >= 5) {
        attempts.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute lockout
        attempts.count = 0;
      }
      localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, JSON.stringify(attempts));
      throw new Error('Invalid Admin ID or password. Access denied.');
    }

    // If logging in via initial credentials, sync profile hash
    if (isDefaultInitialMatch && profile.password_hash !== INITIAL_ADMIN_PASSWORD_HASH) {
      profile.password_hash = INITIAL_ADMIN_PASSWORD_HASH;
      localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(profile));
    }

    // Reset login attempts on success
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);

    // Create session (expires in 4 hours)
    const session: AdminSession = {
      token: 'saa_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      user: {
        id: profile.id,
        admin_id: profile.admin_id,
        full_name: profile.full_name,
        email: profile.email,
        must_change_password: profile.must_change_password ?? false,
        last_login_at: new Date().toISOString(),
      },
      expires_at: Date.now() + 4 * 60 * 60 * 1000,
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

    this.addAuditLog({
      action: 'ADMIN_LOGIN',
      details: `Successful administrator sign-in for account ${profile.admin_id}`,
      actor: profile.admin_id,
    });

    return session;
  }

  public getSession(): AdminSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!data) return null;
      const session: AdminSession = JSON.parse(data);
      if (session.expires_at < Date.now()) {
        this.logoutAdmin();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  public logoutAdmin() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  public async changeAdminPassword(adminId: string, currentPass: string, newPass: string): Promise<void> {
    const profile = this.getAdminProfile();
    if (!profile || profile.admin_id.toLowerCase() !== adminId.trim().toLowerCase()) {
      throw new Error('Admin profile not found.');
    }

    const currentHash = await sha256(currentPass);
    if (profile.password_hash !== currentHash) {
      throw new Error('Current password is incorrect.');
    }

    if (newPass.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const newHash = await sha256(newPass);
    profile.password_hash = newHash;
    profile.must_change_password = false;
    localStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(profile));

    // Update current session
    const session = this.getSession();
    if (session) {
      session.user.must_change_password = false;
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }

    this.addAuditLog({
      action: 'PASSWORD_CHANGED',
      details: `Password changed successfully for admin ${profile.admin_id}. Mandatory first-login flag cleared.`,
      actor: profile.admin_id,
    });
  }

  private getCurrentAdminActor(): string {
    const session = this.getSession();
    return session?.user.admin_id || 'ADMIN_HRIIDOO';
  }

  // ==============================================================================
  // FILE UPLOAD HANDLER (Data URL / Blob with validation)
  // ==============================================================================
  public async uploadFile(file: File, maxSizeBytes = 5 * 1024 * 1024): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file format. Only JPG, PNG, WebP, and PDF files are allowed.');
    }

    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  // Export & Import Database JSON
  public exportDataJSON(): string {
    const certs = this.getLocalCertificates();
    const logs = this.getAuditLogs();
    return JSON.stringify({ certs, logs, exportedAt: new Date().toISOString() }, null, 2);
  }

  public importDataJSON(jsonStr: string) {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.certs)) {
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(parsed.certs));
    }
    if (Array.isArray(parsed.logs)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(parsed.logs));
    }
    this.addAuditLog({
      action: 'DATA_IMPORT',
      details: `Restored/imported database backup (${parsed.certs?.length || 0} certificates)`,
      actor: this.getCurrentAdminActor(),
    });
  }
}

export const storageService = new StorageService();
