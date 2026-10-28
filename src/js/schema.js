export const schema = `
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    position INTEGER NOT NULL UNIQUE,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('food', 'physical', 'chocolate')),
    text TEXT NOT NULL,
    category TEXT,
    portions REAL CHECK(portions > 0),
    meal TEXT,
    preparation TEXT,
    level TEXT CHECK(level IN ('S', 'M', 'L')),
    linked_to TEXT REFERENCES entries(id) DEFERRABLE INITIALLY DEFERRED
  );
  CREATE INDEX IF NOT EXISTS entries_date_category ON entries(date, category);
  CREATE TABLE IF NOT EXISTS measurements (
    week TEXT PRIMARY KEY,
    weight REAL CHECK(weight > 0 AND weight <= 500),
    fat REAL CHECK(fat > 0 AND fat < 100)
  );
  CREATE TABLE IF NOT EXISTS targets (category TEXT PRIMARY KEY, value REAL NOT NULL CHECK(value >= 0));
  CREATE TABLE IF NOT EXISTS hidden_categories (category TEXT PRIMARY KEY);
`;
