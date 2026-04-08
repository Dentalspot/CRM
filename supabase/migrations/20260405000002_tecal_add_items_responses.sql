-- Add item-level responses to TECAL for qualitative analysis
ALTER TABLE tecal_evaluations ADD COLUMN IF NOT EXISTS items_responses JSONB DEFAULT '{}'::jsonb;
-- items_responses format: { "1": true, "2": false, "3": true, ... } (true=correct, false=error)
