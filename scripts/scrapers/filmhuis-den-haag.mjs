import {
  fetchWithRetry,
  decodeAndTrim,
  finalizeFilms,
  normalizeSubtitles,
  parseFilmLength,
} from './utils.mjs';

// Filmhuis Den Haag runs a Statamic site whose agenda is rendered client-side by
// Livewire, but the same data is available as a single JSON document at
// /api/program. It carries the FULL upcoming programme keyed by date — every
// film plus its screenings, with director, runtime, genre, subtitle language,
// hall and a ticket URL — so one fetch is all we need.
//
// Shape: { "YYYY-MM-DD": { date, day, day_month, films: { <key>: Film } } }
// where each Film has a stable `id` and a `programs[]` array of screenings. The
// same film recurs under every date it plays, so entries are grouped by `id`.
const PROGRAM_URL = 'https://filmhuisdenhaag.nl/api/program?lang=nl';
const SITE_ORIGIN = 'https://filmhuisdenhaag.nl';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
};

// Programme strands Filmhuis appends to a film's title as " - <strand>" (a
// curated series, festival or themed night). They name the screening context,
// not the film, so they'd stop the film grouping with the same title elsewhere
// ("Midsommar - Gather Round Folks") and break the TMDB lookup. This is a fixed
// vocabulary rather than a blanket dash strip, so real dash titles survive.
const STRAND_SUFFIX =
  /\s+[-–—]\s+(gather round folks|liff|best of nl|black achievement month|bam|no lonely dance ?floors|de betovering(\s+\d{4})?|festival dag in de branding|cinematheek|connect|next|cinemini|jacques demy|late night anime|no limits festival|cin[eé] premi[eè]re|hoe lees ik een film\??)\s*$/i;

function stripStrand(title) {
  let out = title;
  // A title can carry two strands ("... - LIFF - EN subs" reduces to one here,
  // but e.g. a festival plus a series would stack); strip until stable.
  for (let i = 0; i < 3; i++) {
    const next = out.replace(STRAND_SUFFIX, '').trim();
    if (next === out || next === '') break;
    out = next;
  }
  return out;
}

// The subtitle field is a Dutch language description, sometimes with a display
// label appended: "Nederlands of Engels [label: EN SUBS]" means this screening
// is the English-subtitled one. Prefer the label when present, since the bare
// description is ambiguous between the two. "Geen" (none) and "N.v.t."
// (not applicable) both mean no subtitles.
function parseSubtitles(subtitle) {
  const text = decodeAndTrim(subtitle);
  if (!text) return null;

  const label = text.match(/\[label:\s*([^\]]+)\]/i);
  if (label) {
    const code = normalizeSubtitles(label[1].replace(/\s*subs?\s*/i, ''));
    if (code) return code;
  }

  // "N.v.t." is Dutch "niet van toepassing" — no subtitles on this screening.
  if (/^n\.?v\.?t\.?$/i.test(text)) return 'none';
  return normalizeSubtitles(text.replace(/\s*\[label:[^\]]*\]\s*/i, ''));
}

async function fetchFilmhuisDenHaag() {
  console.log('Fetching Filmhuis Den Haag...');

  const response = await fetchWithRetry(PROGRAM_URL, {
    headers: BROWSER_HEADERS,
  });
  const program = await response.json();

  const filmMap = new Map();
  let skippedPast = 0;

  // Iterate the date buckets; a film recurs under each date it plays, so the
  // screenings accumulate onto one entry per film id.
  for (const day of Object.values(program ?? {})) {
    for (const entry of Object.values(day?.films ?? {})) {
      // `hero_title` is the film's own name; `title` is the booking title, which
      // bakes in the screening context ("Kokuho - EN subs", "Youri - met Q&A").
      const title = stripStrand(decodeAndTrim(entry.hero_title || entry.title));
      if (!title) continue;

      // Separate subtitle variants into their own group so each renders its own
      // badge, matching how the other scrapers key films.
      const subtitles = parseSubtitles(entry.subtitle);
      const key = `${entry.id}-${subtitles ?? ''}`;

      if (!filmMap.has(key)) {
        filmMap.set(key, {
          title,
          director: decodeAndTrim(entry.director) || null,
          runtime: parseFilmLength(entry.duration),
          // Poster paths are site-relative (/img/asset/...), already sized by a
          // signed query string; absolutize so the <img> resolves off-site.
          posterUrl: entry.poster ? `${SITE_ORIGIN}${entry.poster}` : '',
          subtitles,
          showtimes: [],
        });
      }

      for (const show of entry.programs ?? []) {
        // The feed marks elapsed screenings rather than dropping them.
        if (show.past) {
          skippedPast++;
          continue;
        }
        if (!show.starts_at_date || !show.starts_at_time) continue;

        filmMap.get(key).showtimes.push({
          date: show.starts_at_date,
          time: show.starts_at_time,
          ticketUrl: show.ticket_url || '',
          screen: decodeAndTrim(show.location) || '',
        });
      }
    }
  }

  // The same screening can appear under more than one date bucket; de-duplicate
  // on date+time so a film doesn't show the same slot twice.
  for (const film of filmMap.values()) {
    const seen = new Set();
    film.showtimes = film.showtimes.filter((s) => {
      const id = `${s.date} ${s.time}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  return finalizeFilms(
    filmMap,
    'Filmhuis Den Haag',
    skippedPast ? ` (skipped ${skippedPast} past screenings)` : ''
  );
}

export { fetchFilmhuisDenHaag };
