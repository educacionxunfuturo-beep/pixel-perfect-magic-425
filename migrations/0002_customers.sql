-- Pet-parent accounts (password hashed with PBKDF2-SHA256) and the link from bookings to them.
CREATE TABLE IF NOT EXISTS customers (
  email TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL
);
ALTER TABLE bookings ADD COLUMN customer_email TEXT;
CREATE INDEX IF NOT EXISTS bookings_customer ON bookings (customer_email);
