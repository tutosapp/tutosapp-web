// The site with more apps: local-only fixture builds (tests/fixtures.setup.mjs) of the real site
// plus fake apps until there are 4, 6 and 8, among them a web app and apps coming soon. On a phone
// and a desktop: the home shows every app, as a grid of even rows on a wide screen that stack row by
// row as the page scrolls, with the counts computed from the list; the menus, the services page and
// the footer hold them without sideways scroll; and a web app and an app coming soon get the right
// page. Full-page screenshots of the home land in test-results/screens/scaling-*.png.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apps as realApps } from '../scripts/build.mjs';
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

    for (const [path, lang] of [['/', 'es'], ['/en/', 'en']]) {
      test(`${path} home shows every app and counts them`, async ({ page }, info) => {
        await page.goto(base + path);
        const cases = page.locator('.cases > .case');
        await expect(cases).toHaveCount(n);
        await expect(page.locator('.cases')).toHaveClass(/\bgrid\b/);
        const facts = page.locator('.home-hero .facts b');
        await expect(facts.first()).toHaveText(String(n));
        expect(await overflow(page)).toBeLessThanOrEqual(0);

        // Every card is whole inside the page column, and on a wide screen they sit in even rows:
        // the same width each, and each row as full as the columns allow.
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
          expect(Math.max(...rows) - Math.min(...rows), 'rows of even length').toBeLessThanOrEqual(1);
        }

        // They stack row by row as the page scrolls: cards side by side share a row (--i), which
        // sets where they stop, and the next row slides over them.
        await expect(cases.first()).toHaveCSS('position', 'sticky');
        const rowOf = await cases.evaluateAll((all) => all.map((c) => c.style.getPropertyValue('--i')));
        const sameRow = (i, j) => Math.round(boxes[i].y) === Math.round(boxes[j].y);
        for (let i = 1; i < n; i++) expect(rowOf[i] === rowOf[i - 1], `card ${i} row`).toBe(sameRow(i, i - 1));

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
        await page.screenshot({ path: `test-results/screens/scaling-n${n}-home-${lang}-${info.project.name}.png`, fullPage: true });
      });
    }

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
  await page.goto('/');
  await expect(page.locator('.cases > .case')).toHaveCount(realApps.length);
  await expect(page.locator('a[href*="fx-"]')).toHaveCount(0);
});
