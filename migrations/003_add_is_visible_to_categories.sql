-- Up Migration
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

UPDATE categories
SET is_visible = COALESCE(show_in_header, TRUE)
WHERE is_visible IS NULL;

ALTER TABLE categories
DROP COLUMN IF EXISTS show_in_header;

-- Down Migration
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS show_in_header BOOLEAN DEFAULT TRUE;

UPDATE categories
SET show_in_header = COALESCE(is_visible, TRUE)
WHERE show_in_header IS NULL;

ALTER TABLE categories
DROP COLUMN IF EXISTS is_visible;
