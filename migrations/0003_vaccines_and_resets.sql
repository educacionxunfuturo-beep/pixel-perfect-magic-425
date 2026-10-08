-- Vaccine certificates uploaded by pet parents (base64, up to 1.4 MB each) and password resets.
CREATE TABLE IF NOT EXISTS vaccine_docs (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  kind TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  data TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS vaccine_docs_email ON vaccine_docs (email);
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reset_requests (
  email TEXT PRIMARY KEY,
  requested_at TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0
);
