// ---------------------------------------------------------------
// db.js — the only file that talks SQL
//
// WHY one file: server.js asks questions in plain English
// (listReviews, getReview, createReview) and this file answers
// them in SQL. If you ever swap SQLite for Postgres, you rewrite
// this file and touch nothing else.
//
// ABOUT better-sqlite3: it is synchronous on purpose. There is no
// await anywhere below. For a local SQLite file, queries finish in
// microseconds, so blocking is cheaper and simpler than promise
// bookkeeping — it's the main reason this library is loved.
// ---------------------------------------------------------------

const path = require('path');
const Database = require('better-sqlite3');
const { seedReviews } = require('./data');

// Opens (or creates on first run) the database file next to this file.
const db = new Database(path.join(__dirname, 'reviews.db'));

// WAL = Write-Ahead Logging. Readers don't block the writer and a
// crash mid-write can't corrupt the file. The standard first line
// of nearly every better-sqlite3 app.
db.pragma('journal_mode = WAL');

// --- Schema ------------------------------------------------------
// Notes on the choices here (details in the chat):
//   rating INTEGER, 1–5 ...... whole stars only, enforced twice: the
//                              CHECK rejects out-of-range values, and
//                              STRICT (below) rejects non-integers
//   title UNIQUE ............. one review per title; the insert
//                              THROWS on duplicates, handled in server.js
//   AUTOINCREMENT ............ ids are never reused, so an old
//                              /review/9 link can never quietly point
//                              at a different, newer review
//   created_at ............... stored as ISO-8601 UTC ("...T...Z") so
//                              JavaScript's new Date() parses it
//                              unambiguously in every timezone
//
// IMPORTANT: "IF NOT EXISTS" means editing this schema does NOT
// change a reviews.db that already exists on disk. After a schema
// change, delete reviews.db (it re-seeds on next start) — or, once
// you have real data worth keeping, write a migration instead.
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    excerpt TEXT,
    review TEXT NOT NULL,
    cover_image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
  ) STRICT
`);

// --- First-run seeding ---------------------------------------------
// If the table is empty, load the sample reviews so the site never
// starts blank. db.transaction() wraps all seven inserts into one
// atomic unit: they all succeed or none do, and it's much faster
// than seven separate writes.
const rowCount = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;

if (rowCount === 0) {
  const insertSeed = db.prepare(`
    INSERT INTO reviews (title, category, rating, excerpt, review, cover_image_url, created_at)
    VALUES (@title, @category, @rating, @excerpt, @review, @cover_image_url, @created_at)
  `);

  const seedAll = db.transaction((rows) => {
    for (const row of rows) insertSeed.run(row);
  });

  // Reversed so the OLDEST review gets id 1 — ids then grow with
  // time, the way they will for every post you publish from now on.
  seedAll([...seedReviews].reverse());
  console.log(`Seeded ${seedReviews.length} sample reviews into reviews.db`);
}

// --- Prepared statements --------------------------------------------
// prepare() compiles the SQL once, at startup; .run()/.get()/.all()
// then execute it as many times as needed. Compile once, run many —
// that's the pattern (and the performance win).
//
// The AS aliases below are the adapter between two worlds: the
// database's column names (review, cover_image_url, created_at) and
// the shape the EJS templates already expect (body, image, date).
// Neither side has to bend.
const COLUMNS = `
  id, title, category, rating, excerpt,
  review AS body,
  cover_image_url AS image,
  created_at AS date
`;

const statements = {
  all: db.prepare(`
    SELECT ${COLUMNS} FROM reviews
    ORDER BY created_at DESC, id DESC
  `),
  byCategory: db.prepare(`
    SELECT ${COLUMNS} FROM reviews
    WHERE category = ?
    ORDER BY created_at DESC, id DESC
  `),
  byId: db.prepare(`
    SELECT ${COLUMNS} FROM reviews
    WHERE id = ?
  `),
  insert: db.prepare(`
    INSERT INTO reviews (title, category, rating, excerpt, review, cover_image_url)
    VALUES (@title, @category, @rating, @excerpt, @review, @cover_image_url)
  `),
  remove: db.prepare(`
    DELETE FROM reviews WHERE id = ?
  `),
};

// --- Public API -------------------------------------------------------
// (the "id DESC" tiebreaker above: if two reviews share a timestamp,
// the newer id wins, so ordering is always deterministic)

function listReviews() {
  return statements.all.all(); // .all() → every matching row, as objects
}

function listByCategory(slug) {
  return statements.byCategory.all(slug);
}

function getReview(id) {
  return statements.byId.get(id); // .get() → first row or undefined
}

// Inserts and returns the new row's id (used for the redirect).
// NOTE: this THROWS on a duplicate title — the route catches it.
function createReview(data) {
  const info = statements.insert.run(data);
  return info.lastInsertRowid;
}

// Deletes by id. Returns how many rows were removed (0 or 1) —
// deleting an id that's already gone is a harmless no-op.
function deleteReview(id) {
  return statements.remove.run(id).changes;
}

module.exports = { listReviews, listByCategory, getReview, createReview, deleteReview };
