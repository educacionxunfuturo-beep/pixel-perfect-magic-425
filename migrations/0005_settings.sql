-- Business settings changed from the owner dashboard. Key 'owner' holds the owner's own sign-in
-- (email + PBKDF2 hash); once it exists the app shows only real data (no sample figures).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
