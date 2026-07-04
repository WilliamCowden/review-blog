// ---------------------------------------------------------------
// server.js — the Express back-end
//
// Responsibilities:
//   1. Serve static assets (the CSS) from /public
//   2. Render EJS templates from /views with data
//   3. Handle the /post form so new reviews appear immediately
// ---------------------------------------------------------------

const express = require('express');
const path = require('path');
const { categories, reviews } = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;

// --- View engine setup -----------------------------------------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Middleware -------------------------------------------------
// Static files: anything in /public is served as-is, so
// /public/css/style.css is reachable at /css/style.css.
app.use(express.static(path.join(__dirname, 'public')));

// Parses <form> POST bodies into req.body (needed for /post).
app.use(express.urlencoded({ extended: false }));

// --- app.locals: values every template can see ------------------
// WHY: things like the site name appear in header.ejs and
// footer.ejs on every page. Putting them here means you change
// them in exactly one place.
app.locals.siteName = 'Grave Reviews'; // ← placeholder, rename me!
app.locals.tagline = 'Books, film, TV & games — reviewed by lantern light.';
app.locals.categories = categories;

// Small date helper so templates never do date math themselves.
app.locals.formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// Newest first, everywhere.
const byNewest = (a, b) => new Date(b.date) - new Date(a.date);

// --- Routes ------------------------------------------------------

// Home ("Latest"): featured hero = newest review, grid = the rest.
app.get('/', (req, res) => {
  const sorted = [...reviews].sort(byNewest);
  res.render('index', {
    pageTitle: null, // null → header falls back to just the site name
    navActive: 'latest',
    featured: sorted[0],
    rest: sorted.slice(1),
  });
});

// Category pages: /category/books, /category/tv, etc.
app.get('/category/:slug', (req, res, next) => {
  const { slug } = req.params;
  const label = categories[slug];
  if (!label) return next(); // unknown slug → fall through to 404

  const list = reviews.filter((r) => r.category === slug).sort(byNewest);
  res.render('category', {
    pageTitle: label,
    navActive: slug,
    label,
    list,
  });
});

// Single review page.
app.get('/review/:id', (req, res, next) => {
  const review = reviews.find((r) => r.id === Number(req.params.id));
  if (!review) return next();

  res.render('review', {
    pageTitle: review.title,
    navActive: review.category,
    review,
  });
});

// The "Post" page: a form for writing a new review.
app.get('/post', (req, res) => {
  res.render('post', { pageTitle: 'Post a Review', navActive: 'post' });
});

// Form submission. Validates lightly, builds a review object,
// adds it to the front of the array, and redirects to the new page.
app.post('/post', (req, res) => {
  const { title, category, rating, excerpt, body, image } = req.body;

  // Minimal guard: a review needs at least a title and a body.
  if (!title || !title.trim() || !body || !body.trim()) {
    return res.redirect('/post');
  }

  const nextId = reviews.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  const review = {
    id: nextId,
    title: title.trim(),
    // Only accept known category slugs; default to movies otherwise.
    category: categories[category] ? category : 'movies',
    // Clamp rating into the 0–5 range no matter what was sent.
    rating: Math.min(5, Math.max(0, parseFloat(rating) || 0)),
    date: new Date().toISOString(),
    excerpt:
      (excerpt || '').trim() || body.trim().slice(0, 140).trim() + '…',
    body: body.trim(),
    image: (image || '').trim() || null,
  };

  reviews.unshift(review);
  res.redirect('/review/' + review.id);
});

// --- 404: anything that fell through the routes above ------------
app.use((req, res) => {
  res.status(404).render('404', { pageTitle: 'Not Found', navActive: null });
});

app.listen(PORT, () => {
  console.log(`Grave Reviews is haunting http://localhost:${PORT}`);
});
