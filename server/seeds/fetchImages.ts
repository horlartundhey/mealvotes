/**
 * Finds a real photo for each meal and records where it came from.
 *   - Wikimedia Commons: no key needed (free-licence files only, credit stored)
 *   - Unsplash: used first when UNSPLASH_ACCESS_KEY is set
 * Photos are hotlinked from their CDNs (nothing is stored on our server), so attribution travels with the URL.
 * Meals with no confident match are left out of images.json and render the patterned placeholder.
 * Entries with `"manual": true` are never overwritten, so you can hand-pick a better photo.
 *
 *   npm run seed:images -w server            # only meals without an image yet
 *   npm run seed:images -w server -- --all   # retry everything (except manual)
 */
import fs from 'node:fs';
import path from 'node:path';
import '../src/lib/env';

interface SeedMeal { slug: string; name: string; imageQuery: string }
interface ImageEntry { url: string; credit?: string; creditUrl?: string; source: string; license?: string; manual?: boolean; matched?: string }

const imagesFile = path.join(__dirname, 'images.json');
const meals: SeedMeal[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'meals.json'), 'utf8'));
const images: Record<string, ImageEntry> = fs.existsSync(imagesFile) ? JSON.parse(fs.readFileSync(imagesFile, 'utf8')) : {};
const retryAll = process.argv.includes('--all');
const blocklist: Record<string, string> = fs.existsSync(path.join(__dirname, 'image-blocklist.json'))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, 'image-blocklist.json'), 'utf8'))
  : {};
const UA = 'MealVoteSeeder/0.1 (household meal voting app; contact: horlartundhey@gmail.com)';

const STOP = new Set(['and', 'the', 'with', 'nigerian', 'african', 'food', 'sauce', 'soup']);
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').trim();

async function fromUnsplash(query: string): Promise<ImageEntry | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } },
  );
  if (!res.ok) return null;
  const hit = (await res.json()).results?.[0];
  if (!hit) return null;
  return {
    url: `${hit.urls.raw}&w=900&h=675&fit=crop&q=75&fm=jpg`,
    credit: hit.user.name,
    creditUrl: `${hit.user.links.html}?utm_source=mealvote&utm_medium=referral`,
    source: 'unsplash',
    license: 'Unsplash License',
  };
}

async function fromWikimedia(query: string): Promise<ImageEntry | null> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '8',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '900',
    origin: '*',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const pages = Object.values((await res.json()).query?.pages ?? {}) as any[];
  const q = words(query);
  const need = Math.max(1, Math.ceil(q.length / 2));

  const scored = pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info || info.mime !== 'image/jpeg' || info.width < 700 || info.width < info.height * 0.9) return null;
      const meta = info.extmetadata ?? {};
      const license: string = meta.LicenseShortName?.value ?? '';
      if (!/^(CC|Public domain|PD)/i.test(license)) return null;
      const haystack = `${p.title} ${stripHtml(meta.ImageDescription?.value)} ${stripHtml(meta.ObjectName?.value)}`.toLowerCase();
      const score = q.filter((w) => haystack.includes(w)).length;
      if (score < need) return null;
      return { score, p, info, meta, license };
    })
    .filter(Boolean) as { score: number; p: any; info: any; meta: any; license: string }[];

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;
  return {
    url: best.info.thumburl ?? best.info.url,
    credit: stripHtml(best.meta.Artist?.value) || 'Wikimedia Commons contributor',
    creditUrl: best.info.descriptionurl,
    source: 'wikimedia',
    license: best.license,
    matched: best.p.title,
  };
}

async function main() {
  let found = 0;
  let missing = 0;
  for (const meal of meals) {
    const existing = images[meal.slug];
    if (blocklist[meal.slug] && !process.env.UNSPLASH_ACCESS_KEY) continue; // bad Wikimedia match; retry only with Unsplash
    if (existing?.manual || (existing && !retryAll)) continue;
    let hit: ImageEntry | null = null;
    try {
      hit = (await fromUnsplash(meal.imageQuery)) ?? (await fromWikimedia(meal.imageQuery));
    } catch (e) {
      console.warn(`  ! ${meal.slug}: ${(e as Error).message}`);
    }
    if (hit) {
      images[meal.slug] = hit;
      found++;
      console.log(`  ✓ ${meal.name}  ←  ${hit.source}${hit.matched ? ` (${hit.matched})` : ''}`);
    } else {
      delete images[meal.slug];
      missing++;
      console.log(`  · ${meal.name}  →  placeholder`);
    }
    await new Promise((r) => setTimeout(r, 400)); // be polite to the APIs
  }
  fs.writeFileSync(imagesFile, JSON.stringify(images, null, 2));
  writeContactSheet();
  console.log(`\nDone: ${found} matched, ${missing} placeholders. Review: seeds/contact-sheet.html`);
}

/** A local HTML page to eyeball every match before seeding. */
function writeContactSheet() {
  const cards = meals
    .map((m) => {
      const i = images[m.slug];
      const img = i
        ? `<img src="${i.url}" loading="lazy"><small>${i.source} · ${i.license ?? ''}<br>${i.matched ?? ''}</small>`
        : '<div class="ph">placeholder</div>';
      return `<figure><code>${m.slug}</code>${img}<figcaption>${m.name}</figcaption></figure>`;
    })
    .join('');
  fs.writeFileSync(
    path.join(__dirname, 'contact-sheet.html'),
    `<!doctype html><meta charset="utf-8"><title>Meal images</title><style>
    body{font:14px system-ui;background:#fff6e5;margin:16px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
    figure{margin:0;background:#fff;border:2px solid #231a14;border-radius:12px;padding:8px}img,.ph{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;background:#eee;display:grid;place-items:center}
    figcaption{font-weight:700;margin-top:6px}small{color:#555;display:block}code{font-size:11px;color:#a92510}</style>
    <h1>Meal images (${Object.keys(images).length}/${meals.length} matched)</h1><main>${cards}</main>`,
  );
}

main();
