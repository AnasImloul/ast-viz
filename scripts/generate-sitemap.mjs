import { mkdir, writeFile } from 'node:fs/promises';

const routes = [
  '/',
  '/grammar/code',
  '/grammar/dependencies',
  '/grammar/suggestions',
  '/visualize',
];

function normalizeBaseUrl(raw) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return null;
  }
}

const baseUrl =
  normalizeBaseUrl(process.env.SITEMAP_BASE_URL) ||
  normalizeBaseUrl(process.env.CF_PAGES_URL) ||
  normalizeBaseUrl(process.env.URL) ||
  'https://example.invalid';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((path, idx) => {
    const priority = idx === 0 ? '1.0' : idx === 1 ? '0.9' : '0.8';
    return `  <url>
    <loc>${baseUrl}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

await mkdir('dist', { recursive: true });
await writeFile('dist/sitemap.xml', xml, 'utf8');

if (baseUrl === 'https://example.invalid') {
  console.warn(
    '[sitemap] No SITEMAP_BASE_URL/CF_PAGES_URL/URL detected. Generated fallback URLs with https://example.invalid.'
  );
}
