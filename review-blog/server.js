// ---------------------------------------------------------------
// server.js — the Express back-end
//
// Responsibilities:
//   1. Serve static assets (the CSS) from /public
//   2. Render EJS templates from /views with data
//   3. Handle the /post form: validate, insert, handle failures
//
// Notice what is NOT here anymore: SQL. All database work lives in
// db.js; this file only calls listReviews / getReview / etc.
// ---------------------------------------------------------------

const express = require('express');
const path = require('path');
const { categories } = require('./data');
const { listReviews, listByCategory, getReview, createReview, deleteReview } = require('./db');

const app = express();
const PORT = process.env.PORT || 80;

// --- View engine setup -----------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware -------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// --- app.locals: values every template can see ------------------
app.locals.siteName = 'Grave Reviews'; // ← placeholder, rename me!
app.locals.tagline = 'Books, film, TV & games — reviewed by lantern light.';
app.locals.categories = categories;

app.locals.formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// --- Routes ------------------------------------------------------

// Home ("Latest"): featured hero = newest review, grid = the rest.
app.get('/', (req, res) => {
  const all = listReviews();
  res.render('index', {
    pageTitle: null,
    navActive: 'latest',
    featured: all[0] || null, // null only if the table is ever emptied
    rest: all.slice(1),
  });
});

// Category pages: /category/books, /category/tv, etc.
app.get('/category/:slug', (req, res, next) => {
  const { slug } = req.params;
  const label = categories[slug];
  if (!label) return next(); // unknown slug → fall through to 404

  res.render('category', {
    pageTitle: label,
    navActive: slug,
    label,
    list: listByCategory(slug),
  });
});

// Single review page.
app.get('/review/:id', (req, res, next) => {
  // Guard the cast: /review/banana → NaN, which isn't a valid id
  // (and better-sqlite3 refuses to bind NaN at all).
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next();

  const review = getReview(id);
  if (!review) return next();

  res.render('review', {
    pageTitle: review.title,
    navActive: review.category,
    review,
  });
});

// --- Admin ---------------------------------------------------------
// Both admin pages live under the /admin path prefix on purpose:
// when this blog goes public, a login check can be added in exactly
// ONE place — an app.use('/admin', requireLogin) middleware above
// these routes — and every admin page is covered at once.
//
//   GET  /admin                     → write a new review (the form)
//   POST /admin                     → create it
//   GET  /admin/reviews             → list, filter, delete
//   POST /admin/reviews/:id/delete  → delete one review
//
// WHY deletes use POST and not a GET link: browsers prefetch links,
// and crawlers follow every GET they can find. A "GET /delete/5"
// link would let a search bot quietly empty your database. Rule of
// thumb: GET must never change data — anything destructive requires
// a deliberate form submission.

app.get('/admin', (req, res) => {
  res.render('admin/new', {
    pageTitle: 'Admin — New Review',
    navActive: 'manage',
    error: null,
    values: {},
  });
});

// Form submission.
// The flow: clean the input → validate → insert → redirect.
// If anything fails, re-render the form WITH the user's text intact —
// nobody should lose a whole written review to a duplicate title.
app.post('/admin', (req, res) => {
  // 1. Clean: trim everything, round + clamp the rating into a
  //    whole 1–5, whitelist the category. NOT NULL in the schema
  //    can't catch an empty string (''), so the app checks that
  //    itself. (Math.round(NaN) is NaN, which is falsy → || 1.)
  const values = {
    title: (req.body.title || '').trim(),
    category: categories[req.body.category] ? req.body.category : 'movies',
    rating: Math.min(5, Math.max(1, Math.round(Number(req.body.rating)) || 1)),
    excerpt: (req.body.excerpt || '').trim(),
    body: (req.body.body || '').trim(),
    image: (req.body.image || '').trim(),
  };

  // 2. Validate.
  if (!values.title || !values.body) {
    return res.status(400).render('admin/new', {
      pageTitle: 'Admin — New Review',
      navActive: 'manage',
      error: 'A review needs at least a title and a review body.',
      values,
    });
  }

  // 3. Insert — inside try/catch, because the UNIQUE constraint on
  //    title makes the database THROW on duplicates. A constraint
  //    violation is the database doing its job; catching it and
  //    explaining it is ours.
  try {
    const id = createReview({
      title: values.title,
      category: values.category,
      rating: values.rating,
      excerpt: values.excerpt || values.body.slice(0, 140).trim() + '…',
      review: values.body,
      cover_image_url: values.image || null,
    });
    res.redirect('/review/' + id);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).render('admin/new', {
        pageTitle: 'Admin — New Review',
        navActive: 'manage',
        error: `A review titled “${values.title}” already exists. Titles must be unique.`,
        values,
      });
    }
    throw err; // anything unexpected → let Express's error handler show it
  }
});

// The management list. ?cat=books filters to one shelf; anything
// else (or no ?cat at all) shows everything, newest first. The slug
// is checked against the categories map — never trust a query
// string, even on an admin page.
app.get('/admin/reviews', (req, res) => {
  const cat = categories[req.query.cat] ? req.query.cat : null;
  res.render('admin/manage', {
    pageTitle: 'Admin — Manage Reviews',
    navActive: 'manage',
    activeCat: cat || 'latest',
    list: cat ? listByCategory(cat) : listReviews(),
  });
});

// Delete, then bounce back to the list — keeping whatever filter
// was active, so cleaning up one shelf doesn't reset the view.
app.post('/admin/reviews/:id/delete', (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return next();

  deleteReview(id);

  const cat = categories[req.query.cat] ? req.query.cat : null;
  res.redirect('/admin/reviews' + (cat ? '?cat=' + cat : ''));
});

// The old /post URL lives on as a redirect — bookmarks and muscle
// memory shouldn't break just because a page moved.
app.get('/post', (req, res) => res.redirect('/admin'));

// --- 404: anything that fell through the routes above ------------
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Not Found', navActive: null });
});

app.listen(PORT, () => {
  console.log(`Grave Reviews is haunting http://localhost:${PORT}`);
});
