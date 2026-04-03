# ================================================================================
# MODULE REMOVAL GUIDE - Payroll, Help Desk, Document Storage
# ================================================================================
# This guide provides step-by-step instructions to safely remove:
# 1. Payroll Processing Module
# 2. Help Desk & Support Ticketing Module  
# 3. Document Storage & Management Module
#
# IMPORTANT: Multi-tenant architecture and RBAC will remain intact.
# ================================================================================

## PHASE 1: DATABASE CHANGES
### =========================

### Step 1.1: Create Prisma Migration to Drop Tables

# Run this command in your terminal:
npx prisma migrate dev --name remove_payroll_helpdesk_document_modules

# This will create a migration that drops the following tables:
# - payroll_components
# - salary_structures
# - salary_structure_items
# - payroll_runs
# - payroll_records
# - payroll_line_items
# - tax_configs
# - tax_slabs
# - support_tickets
# - ticket_comments
# - ticket_attachments
# - documents (WARNING: This affects employee documents - see note below)

### Step 1.2: Manual SQL (Alternative - if migration fails)

-- DROP TABLES (execute in order due to foreign keys)
DROP TABLE IF EXISTS payroll_line_items CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS salary_structure_items CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS payroll_components CASCADE;
DROP TABLE IF EXISTS tax_slabs CASCADE;
DROP TABLE IF EXISTS tax_configs CASCADE;
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

-- WARNING: Document table is used for employee documents (ID cards, certificates)
-- If you want to keep employee documents, SKIP this line:
-- DROP TABLE IF EXISTS documents CASCADE;

-- NOTE: If you keep documents, consider renaming to "employee_documents" for clarity


## PHASE 2: REMOVE BACKEND FILES
### ============================

# Delete the following files (run these commands):

# Payroll Files
rm lib/server/payroll.ts
rm lib/validations/payroll.ts
rm -rf app/api/payroll/

# Help Desk Files  
rm lib/server/helpdesk.ts
rm lib/validations/helpdesk.ts
rm -rf app/api/support/

# Schema files (if present)
rm prisma/schema-payroll.prisma
rm prisma/schema-helpdesk.prisma

# Notifications file (if standalone)
rm lib/server/notifications.ts


## PHASE 3: UPDATE RBAC
### ===================

# Update lib/rbac.ts to remove PAYROLL_MANAGER role references

# The file already has payroll permissions defined. After removal:
# - PAYROLL_MANAGER role will no longer have access to any active modules
# - Users with this role will need to be reassigned to another role

# OPTIONAL: Update the role to a more general permission or remove entirely
# If removing, update database:
# UPDATE users SET role = 'HR_ADMIN' WHERE role = 'PAYROLL_MANAGER';


## PHASE 4: VERIFICATION CHECKLIST
### ===============================

# Run these to verify removal:

# 1. Check for any remaining references (should return empty):
grep -r "payroll" --include="*.ts" --include="*.tsx" lib/ app/
grep -r "helpdesk\|support.*ticket" --include="*.ts" --include="*.tsx" lib/ app/
grep -r "document.*upload\|Document.*storage" --include="*.ts" --include="*.tsx" lib/

# 2. Verify Prisma still generates:
npx prisma generate

# 3. Test API endpoints still work:
curl http://localhost:3000/api/employees
curl http://localhost:3000/api/attendance


## PHASE 5: IMPORTANT NOTES
### ========================

### Document Storage Note:
# The Document model in schema.prisma is used for employee documents like:
# - ID proofs (Aadhar, PAN)
# - Certificates
# - Photos
# - Signatures
#
# If you want to KEEP employee document functionality but remove
# standalone document storage, simply keep the Document model.
# Only remove if you want to disable document upload entirely.

### Multi-Tenant Isolation:
# All existing tenant isolation (companyId-based) remains intact.
# No changes needed to the authentication or authorization system.

### Backup Recommendation:
# Before running migrations, backup your database:
pg_dump -h localhost -U your_user your_db > backup_before_removal.sql


## QUICK REMOVAL (One-liner for testing)
# ======================================
# Only run this in DEVELOPMENT - creates migration and removes files:

# npx prisma migrate dev --name remove_modules && \
# rm -f lib/server/payroll.ts lib/validations/payroll.ts && \
# rm -f lib/server/helpdesk.ts lib/validations/helpdesk.ts && \
# rm -rf app/api/payroll/ app/api/support/ && \
# rm -f prisma/schema-payroll.prisma prisma/schema-helpdesk.prisma && \
# npx prisma generate