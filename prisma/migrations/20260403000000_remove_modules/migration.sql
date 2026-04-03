-- Migration: Remove Payroll, Helpdesk, Document Storage modules
-- Run: npx prisma migrate dev --name remove_payroll_helpdesk_modules

-- Step 1: Drop support tickets (child tables first)
DROP TABLE IF EXISTS ticket_attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

-- Step 2: Drop payroll tables (child tables first)
DROP TABLE IF EXISTS payroll_line_items CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS salary_structure_items CASCADE;
DROP TABLE IF EXISTS salary_structures CASCADE;
DROP TABLE IF EXISTS payroll_components CASCADE;
DROP TABLE IF EXISTS tax_slabs CASCADE;
DROP TABLE IF EXISTS tax_configs CASCADE;

-- Step 3: Document Storage (OPTIONAL - uncomment if you want to remove)
-- WARNING: This removes employee documents (ID cards, certificates, photos)
-- Only uncomment if you want to completely remove document functionality
-- DROP TABLE IF EXISTS documents CASCADE;

-- Step 4: Reassign PAYROLL_MANAGER users to HR_ADMIN
-- Uncomment if needed:
-- UPDATE users SET role = 'HR_ADMIN' WHERE role = 'PAYROLL_MANAGER';

-- Step 5: Verify tables removed
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%payroll%' 
OR table_name LIKE '%ticket%' 
OR table_name LIKE '%support%';