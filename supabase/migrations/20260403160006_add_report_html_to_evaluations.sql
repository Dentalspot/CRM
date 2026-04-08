-- Add report_html column to ados2_evaluations to persist the generated report
-- This avoids regenerating the AI analysis + PubMed recommendations every time

ALTER TABLE ados2_evaluations ADD COLUMN IF NOT EXISTS report_html text;
