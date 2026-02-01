-- Migration: Add multi-tenant infrastructure, custom domains, and privacy settings
-- Date: 2026-02-01
-- Description: Adds tenants table, custom_domains table, and updates existing tables for multi-tenancy

-- =============================================
-- 1. Create tenants table
-- =============================================
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "logo_url" varchar(500),
  "primary_color" varchar(7),
  "favicon_url" varchar(500),
  "domain_whitelist" jsonb DEFAULT '[]',
  "whitelist_mode" varchar NOT NULL DEFAULT 'warn',
  "privacy_settings" jsonb DEFAULT '{"ipAnonymization":"full","analyticsRetentionDays":90,"auditLogRetentionDays":365,"collectReferrer":false,"collectDeviceType":true,"collectGeoData":true}',
  "contact_email" varchar(255),
  "dpo_email" varchar(255),
  "imprint_url" varchar(500),
  "privacy_policy_url" varchar(500),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add constraint for whitelist_mode
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_whitelist_mode_check"
  CHECK ("whitelist_mode" IN ('warn', 'block', 'allow'));

-- =============================================
-- 2. Create custom_domains table
-- =============================================
CREATE TABLE IF NOT EXISTS "custom_domains" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" varchar NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "domain" varchar(255) NOT NULL UNIQUE,
  "is_primary" boolean NOT NULL DEFAULT false,
  "ssl_status" varchar NOT NULL DEFAULT 'pending',
  "verification_token" varchar(64),
  "verified_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add constraint for ssl_status
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_ssl_status_check"
  CHECK ("ssl_status" IN ('pending', 'active', 'failed'));

-- Create indexes for custom_domains
CREATE INDEX IF NOT EXISTS "IDX_custom_domain_tenant" ON "custom_domains" ("tenant_id");
CREATE INDEX IF NOT EXISTS "IDX_custom_domain_domain" ON "custom_domains" ("domain");

-- =============================================
-- 3. Add tenant_id to users table
-- =============================================
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");

-- =============================================
-- 4. Add tenant_id to links table
-- =============================================
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");
CREATE INDEX IF NOT EXISTS "IDX_links_tenant" ON "links" ("tenant_id");
CREATE INDEX IF NOT EXISTS "IDX_links_short_code" ON "links" ("short_code");

-- =============================================
-- 5. Add tenant_id to audit_logs table
-- =============================================
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");
CREATE INDEX IF NOT EXISTS "IDX_audit_tenant" ON "audit_logs" ("tenant_id");

-- =============================================
-- 6. Add anonymized_ip to analytics table
-- =============================================
ALTER TABLE "analytics" ADD COLUMN IF NOT EXISTS "anonymized_ip" varchar(45);

-- =============================================
-- 7. Create default tenant (optional, for existing data)
-- =============================================
-- Uncomment if you want to migrate existing data to a default tenant:
-- INSERT INTO "tenants" ("id", "name", "slug", "is_active")
-- VALUES ('default', 'BundLink Platform', 'bundlink', true)
-- ON CONFLICT ("slug") DO NOTHING;

-- Update existing records to default tenant (if needed):
-- UPDATE "users" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;
-- UPDATE "links" SET "tenant_id" = 'default' WHERE "tenant_id" IS NULL;
