// Draws the social-share images of the home, the catalogue and the services page
// (site/assets/img/og/home-es.jpg, home-en.jpg, apps-es.jpg, apps-en.jpg, services-es.jpg and
// services-en.jpg, 1200 × 630) from the same data as the site:
// each page's eyebrow and headline, and one icon per app. It also draws the images of any app that
// does not have its own yet (og/<id>-es.jpg and -en.jpg: its icon, name, tagline and headline, in
// its color); an app's existing images are kept.
// Run it after changing either headline or the app list:  npm run og
// Needs the dev dependencies (npm ci) and Google Chrome.
import { existsSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { apps, home, catalog, services, DOMAIN } from './build.mjs';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const file = (p) => pathToFileURL(join(SITE, p)).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rich = (s) => esc(s).replace(/\*([^*]+)\*([.,!?]?)/g, '<em>$1$2</em>');

const page = (lang, copy, app) => `<!doctype html>
<html lang="${lang}">
<meta charset="utf-8">
<style>
  @font-face { font-family: "Geist"; font-weight: 100 900; src: url("${file('assets/fonts/geist-latin-wght.woff2')}") format("woff2"); }
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; position: relative; background: #17151f; color: #f4f2fb; font-family: "Geist", sans-serif; }
  .wrap { position: absolute; inset: 60px 72px; display: flex; flex-direction: column; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 14px; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; }
  .brand img { width: 48px; height: 48px; border-radius: 12px; }
  .eyebrow { margin: 0 0 18px; font-size: 19px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #b9b4cc; }
  h1 { margin: 0; max-width: 1000px; font-size: 80px; font-weight: 650; line-height: 1.02; letter-spacing: -0.04em; }
  h1 em { font-style: normal; color: ${app ? app.color : '#c9bdff'}; }
  .app { display: flex; align-items: center; gap: 22px; }
  .app img { width: 96px; height: 96px; border-radius: 22px; }
  .app b { display: block; font-size: 44px; letter-spacing: -0.03em; }
  .app span { font-size: 24px; color: #b9b4cc; }
  .foot { display: flex; align-items: center; justify-content: space-between; }
  .icons { display: flex; gap: 14px; }
  .icons img { width: 64px; height: 64px; border-radius: 15px; box-shadow: 0 0 0 1px rgb(255 255 255 / 14%); }
  .domain { font-size: 28px; font-weight: 550; color: #d6d2e6; }
  .foot h1 { max-width: 820px; font-size: 60px; }
</style>
<body>
  <div class="wrap">
    <div class="brand"><img src="${file('favicon.svg')}" alt=""> Tutos App</div>
    ${app
      ? `<div class="app"><img src="${file(app.icon)}" alt=""><div><b>${esc(app.name)}</b><span>${esc(copy.category)}</span></div></div>`
      : `<div><p class="eyebrow">${esc(copy.eyebrow)}</p><h1>${rich(copy.headline)}</h1></div>`}
    <div class="foot">
      ${app ? `<h1>${rich(copy.headline)}</h1>` : `<div class="icons">${apps.map((a) => `<img src="${file(a.icon)}" alt="">`).join('')}</div>`}
      <div class="domain">${DOMAIN}</div>
    </div>
  </div>
</body>
</html>
`;

const dir = mkdtempSync(join(tmpdir(), 'tutosapp-og-'));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const jobs = [['home', home], ['apps', catalog], ['services', services]].flatMap(([name, source]) => ['es', 'en'].map((lang) => [name, lang, source[lang]]));
  for (const app of apps) for (const lang of ['es', 'en']) {
    if (!existsSync(join(SITE, `assets/img/og/${app.id}-${lang}.jpg`))) jobs.push([app.id, lang, app[lang], app]);
  }
  for (const [name, lang, copy, app] of jobs) {
    const html = join(dir, `${name}-${lang}.html`);
    writeFileSync(html, page(lang, copy, app));
    await tab.goto(pathToFileURL(html).href);
    await tab.evaluate(() => document.fonts.ready);
    const out = join(SITE, `assets/img/og/${name}-${lang}.jpg`);
    await tab.screenshot({ path: out, type: 'jpeg', quality: 86 });
    console.log(`Wrote ${out}`);
  }
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}
