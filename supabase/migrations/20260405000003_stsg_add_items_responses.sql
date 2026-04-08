ALTER TABLE stsg_evaluations ADD COLUMN IF NOT EXISTS items_responses JSONB DEFAULT '{}'::jsonb;
-- format: { "r1": true, "r2": false, ..., "e1": true, "e2": false, ... }
-- r = receptivo, e = expresivo, true = correct
