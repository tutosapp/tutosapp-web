// The site with more apps: local-only fixture builds (tests/fixtures.setup.mjs) of the real site
// plus fake apps until there are 4, 5, 6, 7 and 8, among them a web app and apps coming soon. On a
// phone and a desktop, and with 8 apps also on a narrower desktop that fits three per row: the
// catalogue (/apps/) shows every app, as a grid of full rows on a wide screen, with the counts
// computed from the list, while the home keeps showing only the featured ones.
// Full rows stack row by row as the page scrolls; when the last row is short (5 and 7 apps, or 8 in
// rows of three) the cards scroll instead, so no row stays stuck showing beside it. The menus, the
// services page and the footer hold them without sideways scroll; and a web app and an app coming
// soon get the right page. Full-page screenshots of the catalogue land in
// test-results/screens/scaling-*.png.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apps as realApps, featured } from '../scripts/build.mjs';
import { SIZES } from './fixtures.setup.mjs';

const STILL = '.reveal, .stage, .ask-card, .hero-bg, .studio-steps li { animation: none !important; }';
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

// The fixture script deletes its output folder before writing it, so it only takes a folder of
// its own and checks everything before it deletes.
test.describe('the fixture output folder', () => {
  const fixture = (...args) => spawnSync(process.execPath, ['scripts/fixture.mjs', ...args], { encoding: 'utf8' });
  let tmp;
  test.beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tutosapp-guard-'));
  });
  test.afterEach(() => rmSync(tmp, { recursive: true, force: true }));

  test('a folder with other content is refused and left as it was', () => {
    writeFileSync(join(tmp, 'notes.txt'), 'mine');
    expect(fixture('4', tmp).status).toBe(2);
    expect(readFileSync(join(tmp, 'notes.txt'), 'utf8')).toBe('mine');
    expect(existsSync(join(tmp, 'site'))).toBe(false);
  });

  test('a folder inside the repository is refused, except under test-results/', () => {
    expect(fixture('4', 'scripts/fixture-out').status).toBe(2);
    expect(existsSync('scripts/fixture-out')).toBe(false);
    expect(fixture('4', 'site-fixture').status).toBe(2);
    expect(existsSync('site-fixture')).toBe(false);
  });

  test('a total out of range leaves an earlier fixture as it was, and a valid one replaces it', () => {
    const out = join(tmp, 'out');
    expect(fixture('4', out).status).toBe(0);
    writeFileSync(join(out, 'site', 'kept.txt'), 'kept');
    expect(fixture('99', out).status).toBe(2);
    expect(readFileSync(join(out, 'site', 'kept.txt'), 'utf8')).toBe('kept');
    expect(fixture('4', out).status).toBe(0);
    expect(existsSync(join(out, 'site', 'kept.txt'))).toBe(false);
    expect(existsSync(join(out, 'site', 'index.html'))).toBe(true);
  });
});

for (const n of SIZES) {
  test.describe(`with ${n} apps`, () => {
    let server;
    let base;
    test.beforeAll(async ({}, info) => {
      const port = 4300 + n * 10 + info.workerIndex;
      server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, SITE_DIR: join(process.env.TUTOSAPP_FIXTURES, `n${n}`, 'site'), PORT: String(port) }, stdio: 'ignore' });
      base = `http://127.0.0.1:${port}`;
      await expect.poll(() => fetch(base + '/').then((r) => r.status, () => 0)).toBe(200);
    });
    test.afterAll(() => server?.kill());

    // The narrower desktop fits three cards per row, which leaves 8 apps a short last row.
    const NARROW = 1100;
    for (const [path, lang, width] of [['/apps/', 'es'], ['/en/apps/', 'en'], ...(n === 8 ? [['/apps/', 'es', NARROW]] : [])]) {
      test(`${path} catalogue${width ? ` at ${width}px` : ''} shows every app and counts them`, async ({ page }, info) => {
        test.skip(!!width && info.project.name !== 'desktop', 'a desktop width');
        if (width) await page.setViewportSize({ width, height: 900 });
        await page.goto(base + path);
        const cases = page.locator('.cases > .case');
        await expect(cases).toHaveCount(n);
        await expect(page.locator('.cases')).toHaveClass(/\bgrid\b/);
        const facts = page.locator('.home-hero .facts b');
        await expect(facts.first()).toHaveText(String(n));
        expect(await overflow(page)).toBeLessThanOrEqual(0);

        // Every card is whole inside the page column, and on a wide screen they sit in rows: the
        // same width each, and every row full except, at most, the last.
        const boxes = await cases.evaluateAll((all) => all.map((c) => c.getBoundingClientRect()).map(({ x, y, width }) => ({ x, y, width })));
        const wrap = await page.locator('.cases').boundingBox();
        for (const b of boxes) {
          expect(b.x).toBeGreaterThanOrEqual(wrap.x - 1);
          expect(b.x + b.width).toBeLessThanOrEqual(wrap.x + wrap.width + 1);
        }
        const widths = new Set(boxes.map((b) => Math.round(b.width)));
        expect(widths.size, 'cards of one width').toBe(1);
        const rows = [...new Set(boxes.map((b) => Math.round(b.y)))].map((y) => boxes.filter((b) => Math.round(b.y) === y).length);
        if (info.project.name === 'desktop') {
          expect(rows.length, 'more than one card per row').toBeLessThan(n);
          expect(new Set(rows.slice(0, -1)).size, 'full rows before the last').toBeLessThanOrEqual(1);
          expect(rows.at(-1), 'last row no longer than the others').toBeLessThanOrEqual(rows[0]);
          if (width) expect(rows, `rows at ${width}px`).toEqual([3, 3, 2]);
        }
        const short = rows.at(-1) < rows[0];
        expect(short, 'a short last row').toBe(info.project.name === 'desktop' && (n === 5 || n === 7 || !!width));

        // Cards side by side share a row (--i) and follow each other by column (--k), which staggers
        // how a row appears.
        const sameRow = (i, j) => Math.round(boxes[i].y) === Math.round(boxes[j].y);
        const placed = await cases.evaluateAll((all) => all.map((c) => ({ row: c.style.getPropertyValue('--i'), col: Number(c.style.getPropertyValue('--k')) })));
        for (let i = 1; i < n; i++) {
          expect(placed[i].row === placed[i - 1].row, `card ${i} row`).toBe(sameRow(i, i - 1));
          expect(placed[i].col, `card ${i} column`).toBe(sameRow(i, i - 1) ? placed[i - 1].col + 1 : 0);
        }

        if (short) {
          // A short last row does not cover the row before it, so nothing sticks: once the last row
          // is up under the menu bar, the row before it has scrolled away above it instead of
          // staying stuck on either side.
          for (const c of await cases.all()) await expect(c).not.toHaveCSS('position', 'sticky');
          await cases.last().evaluate((c) => scrollTo({ top: scrollY + c.getBoundingClientRect().top - 120, behavior: 'instant' }));
          const now = await cases.evaluateAll((all) => all.map((c) => c.getBoundingClientRect()).map(({ top, bottom }) => ({ top, bottom })));
          const lastTop = now.at(-1).top;
          expect(Math.round(lastTop), 'last row under the menu bar').toBe(120);
          for (let i = 0; i < n - rows.at(-1); i++) expect(now[i].bottom, `card ${i} above the last row`).toBeLessThanOrEqual(lastTop);
        } else {
          // Full rows stack row by row as the page scrolls: the row sets where its cards stop, and
          // the next row slides over them.
          for (const c of await cases.all()) await expect(c).toHaveCSS('position', 'sticky');
        }

        // The app switcher lists them all and fits on screen, and the menu bar does not overflow.
        await page.locator('.apps-toggle').click();
        const menu = page.locator('#apps-menu');
        await expect(menu.locator('a')).toHaveCount(n + 1);
        await expect(menu).toBeInViewport({ ratio: 1 });
        await page.keyboard.press('Escape');
        expect(await page.locator('.nav-bar').evaluate((b) => b.scrollWidth - b.clientWidth)).toBeLessThanOrEqual(0);

        // The footer lists every app and its legal pages.
        await expect(page.locator('.foot .legal-group')).toHaveCount(n + 1);

        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
            scrollTo({ top: y, behavior: 'instant' });
            await new Promise((r) => setTimeout(r, 40));
          }
        });
        await page.waitForFunction(() => [...document.querySelectorAll('.cases img')].every((i) => i.complete && i.naturalWidth > 0));
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((x) => x.target.join(' ')).join(', ')}`)).toEqual([]);
        await page.addStyleTag({ content: STILL });
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: `test-results/screens/scaling-n${n}-apps-${lang}-${info.project.name}${width ? `-${width}` : ''}.png`, fullPage: true });
      });
    }

    test('the home keeps showing only the featured apps and links the catalogue', async ({ page }) => {
      await page.goto(base + '/');
      await expect(page.locator('.cases > .case')).toHaveCount(featured().length);
      await expect(page.locator('.all-work a')).toHaveAttribute('href', 'apps/');
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });

    test('/servicios/ shows a work card per app without sideways scroll', async ({ page }) => {
      await page.goto(base + '/servicios/');
      await expect(page.locator('.work-card')).toHaveCount(n);
      await expect(page.locator('.studio-proof a')).toHaveCount(n);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });

    test('a web app and an app coming soon get the right page', async ({ page }) => {
      await page.goto(base + '/fx-panel/');
      await expect(page.locator('.hero-demo .browser')).toBeVisible();
      await expect(page.locator('.hero-copy a.store[href="https://example.com/"]')).toContainText('la web');
      const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
      expect(ld['@type']).toBe('WebApplication');
      expect(ld.operatingSystem).toBe('Web');
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      if (n < 6) return;
      await page.goto(base + '/fx-pronto/en/');
      await expect(page.locator('.hero-copy .status.soon')).toHaveText('Coming soon');
      await expect(page.locator('.hero-copy a.btn.primary[href^="mailto:"]')).toBeVisible();
      await expect(page.locator('.hero-copy a.store')).toHaveCount(0);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  });
}

test('the published site has only the real apps', async ({ page }) => {
  await page.goto('/apps/');
  await expect(page.locator('.cases > .case')).toHaveCount(realApps.length);
  await expect(page.locator('a[href*="fx-"]')).toHaveCount(0);
});
