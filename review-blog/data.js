// ---------------------------------------------------------------
// data.js — categories + first-run seed data
//
// This file no longer stores live reviews (the database does).
// Its two jobs now:
//   1. categories: the slug → label map used by the nav, the
//      templates, and server-side validation
//   2. seedReviews: sample content inserted ONCE, the first time
//      the app runs against an empty database
//
// The seed objects use the DATABASE's column names (review,
// cover_image_url, created_at) so they can be passed straight
// into the prepared INSERT in db.js.
// ---------------------------------------------------------------

const categories = {
  books: 'Books',
  tv: 'TV',
  movies: 'Movies',
  'video-games': 'Video Games',
};

const seedReviews = [
  {
    title: 'Lantern Men',
    category: 'movies',
    rating: 4,
    excerpt:
      'A fenland folk horror that trusts its silence. The scariest thing in it is a light on the water, and that is exactly the point.',
    review:
      'Lantern Men understands the oldest rule of folklore: the warning matters more than the monster. For most of its runtime we only get the story the villagers tell — do not follow lights across the marsh — and the film wrings almost unbearable tension out of watching people decide, one by one, that the rule surely does not apply to them.\n\nWhen the lights finally come close, the film stays restrained. No lunging CGI, just wet reeds, held breath, and a slow understanding of what the lanterns are for. A late-night watch with the sound up. Highly recommended.',
    cover_image_url: null,
    created_at: '2026-07-01',
  },
  {
    title: 'Whisperwood',
    category: 'video-games',
    rating: 4,
    excerpt:
      'A survival horror game where the forest remembers what you did. Clever sound design carries it further than its combat does.',
    review:
      'Whisperwood strips survival horror down to walking, listening, and a map you draw yourself. The forest rearranges itself when you break its unwritten rules — take too much firewood, and paths you trusted quietly close. It is the rare game where the mechanics themselves feel like superstition.\n\nCombat is the weak branch. Encounters are stiff, and the game is at its worst when it hands you a weapon. But when you are just out among the trees with a dying lantern, listening for the thing that whistles back, it is genuinely one of the best horror experiences of the year.',
    cover_image_url: null,
    created_at: '2026-06-24',
  },
  {
    title: 'The Hollow Beneath the Ferns',
    category: 'books',
    rating: 5,
    excerpt:
      'A novel of Appalachian folk horror told through three generations of bad bargains. The best thing I have read this year.',
    review:
      'Structured as a family history assembled from letters, hymnal margins, and one terrifying court transcript, The Hollow Beneath the Ferns follows a hollow where debts get paid whether or not you remember taking them on. The prose is spare and sure of itself, and the dread accumulates the way it does in real folktales — by repetition, by pattern, by the reader noticing before the characters do.\n\nNo twist, no explanation, no relief. Just the slow confirmation of the thing you feared from chapter one. A perfect book of its kind.',
    cover_image_url: null,
    created_at: '2026-06-17',
  },
  {
    title: 'The Parish — Season 1',
    category: 'tv',
    rating: 3,
    excerpt:
      'A slow-burn coastal ghost story with two brilliant episodes and several that mistake fog for atmosphere.',
    review:
      'The Parish has a killer premise — a village priest who realizes his congregation has been attending two different churches, and only one of them is his. Episodes three and six are as good as television horror gets, built around confession-booth scenes that I will not spoil here.\n\nThe rest of the season drifts. Subplots surface and sink without consequence, and the finale explains far more than it should. Still worth watching for the highs, and the bell-ringing sequence alone earns it a recommendation.',
    cover_image_url: null,
    created_at: '2026-06-09',
  },
  {
    title: 'Static Saints',
    category: 'movies',
    rating: 2,
    excerpt:
      'Analog horror hits the big screen and loses most of what made it scary on a small one.',
    review:
      'Static Saints wants to be the definitive analog horror film — cursed broadcast, emergency tones, saints that appear one frame at a time. On a laptop at 2 a.m., this formula works because it feels found. Projected in a theater with a score telling you when to be scared, the seams show immediately.\n\nThere is one great sequence involving a test pattern that refuses to end. The rest is a loud, over-lit imitation of quieter and better work.',
    cover_image_url: null,
    created_at: '2026-05-30',
  },
  {
    title: 'A Field Guide to Household Ghosts',
    category: 'books',
    rating: 4,
    excerpt:
      'Part short story collection, part fake taxonomy. Funny until it very suddenly is not.',
    review:
      'Presented as a naturalist\u2019s handbook, each chapter of A Field Guide to Household Ghosts catalogs a different domestic spirit — the one that unplugs things, the one that stands in doorways, the one that answers when you talk to yourself. The joke is that the entries are footnoted with case studies, and the case studies keep getting longer and darker.\n\nBy the final chapter the taxonomy has collapsed entirely and you realize what the book has actually been documenting. A clever, creepy little volume that rewards reading in order.',
    cover_image_url: null,
    created_at: '2026-05-21',
  },
  {
    title: 'Kelpie Road',
    category: 'video-games',
    rating: 3,
    excerpt:
      'A Scottish highway horror driving game with an unforgettable passenger and about two hours too much road.',
    review:
      'You drive a night bus along a loch. Passengers board. Some of them are people. Kelpie Road\u2019s central mechanic — deciding who to let on using only your mirrors and your nerve — is superb, and the wet-tarmac atmosphere is thick enough to drink.\n\nThe problem is padding. Runs between stops stretch on long after the tension has peaked, and the mid-game introduces a fuel system nobody asked for. A tighter version of this game would be a classic; this version is a very good idea you will probably not finish.',
    cover_image_url: null,
    created_at: '2026-05-12',
  },
];

module.exports = { categories, seedReviews };
