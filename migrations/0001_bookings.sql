-- Bookings made from the customer portal, the public quote and the Qimmiq cart,
-- shared between devices so the owner and groomer see them.
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bookings_date ON bookings (date);
