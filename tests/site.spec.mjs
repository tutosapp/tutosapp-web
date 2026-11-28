// Every page in the sitemap, on each project (phone and desktop), in light and dark:
// no axe-core violations (WCAG 2.2 A/AA plus best practices), no sideways scroll, no broken
// images or requests, no console errors, and the SEO basics point at https://tutosapp.co.
// The stylesheet must parse whole in Chromium and load by its content hash, and the
// CSS-only demos of the app pages must switch panes. Full-page screenshots land in test-results/screens/.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apps, featured, home, catalog, services } from '../scripts/build.mjs';

const SITE = 'https://tutosapp.co/';
const pages = [...readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, loc]) => '/' + loc.slice(SITE.length)
);
const name = (path) => path.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home';
const STILL = '.reveal, .stage, .ask-card, .hero-bg, .studio-steps li { animation: none !important; }';
// The images on screen. The closed app switcher's icons load lazily, once it opens, and
// tests/app-switcher.spec.mjs checks them open.
const SHOWN = 'img:not([popover]:not(:popover-open) img)';

// Top-level rules in a stylesheet (rules, at-rules with a block, and statement at-rules), the
// number Chromium reports in CSSStyleSheet.cssRules when it parses the whole file.
function countRules(css) {
  let depth = 0;
  let count = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      i = css.indexOf('*/', i + 2) + 1;
    } else if (c === '"' || c === "'") {
      for (i++; i < css.length && css[i] !== c; i++) if (css[i] === '\\') i++;
    } else if (c === '{') {
      if (depth++ === 0) count++;
    } else if (c === '}') {
      depth--;
    } else if (c === ';' && depth === 0) {
      count++;
    }
  }
  return count;
}
const CSS = readFileSync(new URL('../site/assets/style.css', import.meta.url), 'utf8');
const CSS_VERSION = createHash('sha256').update(CSS).digest('hex').slice(0, 10);

for (const path of pages) {
  for (const scheme of ['light', 'dark']) {
    test(`${path} (${scheme})`, async ({ page }, info) => {
      const problems = [];
      page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
      page.on('requestfailed', (r) => problems.push(`failed: ${r.url()}`));
      page.on('response', (r) => r.url().startsWith('http://127.0.0.1') && r.status() >= 400 && problems.push(`${r.status()}: ${r.url()}`));

      await page.emulateMedia({ colorScheme: scheme });
      const res = await page.goto(path);
      expect(res.status()).toBe(200);

      // Scroll through so lazy images load and every scroll-driven reveal has finished. Instant,
      // because the page asks for smooth scrolling and each smooth scroll would cut the last short.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
          scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 60));
        }
        scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      });
      await page.waitForLoadState('networkidle');
      await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].every((i) => i.complete), SHOWN, { timeout: 10_000 });

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const violations = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(violations, 'axe-core violations').toEqual([]);

      const layout = await page.evaluate((sel) => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        brokenImages: [...document.querySelectorAll(sel)].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.getAttribute('src')),
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        canonical: document.querySelector('link[rel=canonical]')?.href,
        ogUrl: document.querySelector('meta[property="og:url"]')?.content,
        hreflang: document.querySelectorAll('link[rel=alternate][hreflang]').length,
        title: document.title,
        description: document.querySelector('meta[name=description]')?.content || '',
      }), SHOWN);
      expect(layout.overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
      expect(layout.brokenImages, 'images that did not load').toEqual([]);
      expect(layout.h1).toBe(1);
      expect(['es', 'en']).toContain(layout.lang);
      expect(layout.canonical).toBe(SITE + path.slice(1));
      expect(layout.ogUrl).toBe(layout.canonical);
      expect(layout.hreflang).toBe(3);
      expect(layout.title.length).toBeLessThanOrEqual(70);
      expect(layout.description.length).toBeGreaterThan(50);
      expect(problems).toEqual([]);

      // Screenshots show every section in its resting position.
      await page.addStyleTag({ content: STILL });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: `test-results/screens/${name(path)}-${info.project.name}-${scheme}.png`, fullPage: true });
    });
  }
}

// A stylesheet that stops parsing part of the way leaves pages half unstyled while every other
// check still passes; the live site once showed its nav as a bulleted list that way.
test.describe('stylesheet', () => {
  test('Chromium parses every rule and each page loads it by content hash', async ({ page }) => {
    const authored = countRules(CSS);
    for (const path of pages) {
      await page.goto(path);
      const sheet = await page.evaluate(() => {
        const s = [...document.styleSheets].find((x) => x.href?.includes('/assets/style.css'));
        return { href: s?.href, rules: s?.cssRules.length ?? 0 };
      });
      expect(sheet.href, `${path} stylesheet URL`).toContain(`style.css?v=${CSS_VERSION}`);
      expect(sheet.rules, `${path}: Chromium parsed ${sheet.rules} of ${authored} rules`).toBeGreaterThanOrEqual(Math.floor(authored * 0.95));
    }
  });
});

test.describe('demos', () => {
  for (const path of apps.flatMap((a) => Object.values(a.paths)).map((p) => '/' + p)) {
    test(`${path} hero tabs switch the phone screen`, async ({ page }) => {
      await page.goto(path);
      const screens = page.locator('.hero-demo .screen > img');
      const n = await screens.count();
      expect(n).toBeGreaterThan(1);
      await expect(screens.nth(0)).toBeVisible();
      await page.locator('.hero-demo .tabs label').nth(n - 1).click();
      await expect(screens.nth(n - 1)).toBeVisible();
      await expect(screens.nth(0)).toBeHidden();
      await expect(page.locator(`.hero-demo .tabs input`).nth(n - 1)).toBeChecked();
    });
  }
});

// The "skip to content" link stays out of sight until the keyboard reaches it.
test('the skip link shows only with keyboard focus', async ({ page }) => {
  for (const path of ['/', '/servicios/']) {
    await page.goto(path);
    const skip = page.locator('a.skip');
    await page.locator('#brief').scrollIntoViewIfNeeded();
    expect(await skip.evaluate((a) => getComputedStyle(a).clipPath)).toBe('inset(50%)');
    await expect(skip).not.toBeInViewport();
    await skip.focus();
    await expect(skip).toBeInViewport({ ratio: 1 });
    expect(await skip.evaluate((a) => getComputedStyle(a).clipPath)).toBe('none');
  }
});

// Ojito is live on the App Store and on Google Play; the App Store stays the main action.
const OJITO_APP_STORE = 'https://apps.apple.com/app/id6832288734';
const OJITO_PLAY = 'https://play.google.com/store/apps/details?id=co.ojito.ojito';
for (const path of ['/ojito/', '/ojito/en/']) {
  test(`${path} links Ojito's App Store and Google Play listings`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`.hero-copy a.store[href="${OJITO_APP_STORE}"]`)).toBeVisible();
    await expect(page.locator(`.hero-copy a.store[href="${OJITO_PLAY}"]`)).toBeVisible();
    await expect(page.locator('.nav-cta')).toHaveAttribute('href', OJITO_APP_STORE);
    await expect(page.locator('a[href^="mailto:"]', { hasText: /Android/ })).toHaveCount(0);
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
    expect(ld.installUrl).toBe(OJITO_APP_STORE);
  });
}
for (const path of ['/', '/en/']) {
  test(`${path} Ojito card links its App Store listing`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`a.store[href="${OJITO_APP_STORE}"]`).first()).toBeAttached();
  });
}

// Roast Interview is live on the App Store for iPhone and on Google Play for Android.
const RI_APP_STORE = 'https://apps.apple.com/app/id6832640298';
const RI_PLAY = 'https://play.google.com/store/apps/details?id=com.roastinterview.app';
for (const path of ['/roast-interview/', '/roast-interview/es/']) {
  test(`${path} links Roast Interview's App Store listing`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`.hero-copy a.store[href="${RI_APP_STORE}"]`)).toBeVisible();
    await expect(page.locator('.nav-cta')).toHaveAttribute('href', RI_APP_STORE);
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
    expect(ld.installUrl).toBe(RI_APP_STORE);
    expect(ld.operatingSystem).toBe('Android, iOS');
    await expect(page.locator(`.hero-copy a.store[href="${RI_PLAY}"]`)).toBeVisible();
    await expect(page.locator('.hero-copy a.inline-link')).toHaveCount(0);
    await expect(page.locator('.nav-cta')).toHaveText(path.includes('/es/') ? 'Descargar' : 'Get the app');
  });
}
for (const path of ['/apps/', '/en/apps/']) {
  test(`${path} Roast Interview card links its App Store listing`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`a.store[href="${RI_APP_STORE}"]`).first()).toBeAttached();
    await expect(page.locator(`a.store[href="${RI_PLAY}"]`).first()).toBeAttached();
  });
}

// The home shows only the featured apps (destacada), each as a short story of our own product: the
// problem, what we built, up to three things it took and where it is today, then links to the
// catalogue. The phone in each story keeps its proportions: never stretched into a tall frame.
for (const [path, lang] of [['/', 'es'], ['/en/', 'en']]) {
  test(`${path} shows the featured apps as stories of our own products, and links every product`, async ({ page }) => {
    const h = home[lang];
    await page.goto(path);
    const stories = page.locator('.cases > .case');
    const picked = featured();
    expect(picked.length).toBeGreaterThanOrEqual(2);
    expect(picked.length).toBeLessThanOrEqual(3);
    await expect(stories).toHaveCount(picked.length);
    for (const [i, app] of picked.entries()) {
      const c = stories.nth(i);
      await expect(c.locator('.kind.own')).toHaveText(h.kind);
      await expect(c.locator('h3')).toHaveText(app[lang].work.shows);
      await expect(c.locator('.story-text p')).toHaveText(app[lang].work.story);
      await expect(c.locator('.story-label')).toHaveText(h.took);
      await expect(c.locator('.ai-chips li')).toHaveText(app[lang].work.took);
      expect(app[lang].work.took.length).toBeLessThanOrEqual(3);
      await expect(c.locator('.case-visual img')).toHaveAttribute('alt', /\S/);
      await expect(c.locator(`a.case-link[href$="${app.paths[lang]}"]`)).toHaveCount(1);
      for (const st of Object.values(app.stores).filter((x) => x.status === 'live')) await expect(c.locator(`a.store[href="${st.url}"]`)).toHaveCount(1);
      const [w, hh] = app.screenSize;
      const device = await c.locator('.case-visual > *').boundingBox();
      const screen = await c.locator('.case-visual img').boundingBox();
      expect(screen.height / screen.width, `${app.id} screen keeps its proportions`).toBeCloseTo(hh / w, 1);
      expect(device.height - screen.height, `${app.id} device frame hugs its screen`).toBeLessThan(40);
    }
    await expect(page.locator(`#${h.workId} .all-work a`)).toHaveAttribute('href', new RegExp(`${catalog.paths[lang]}$`));
    await expect(page.locator('.nav-links a', { hasText: catalog[lang].navLabel })).toHaveAttribute('href', new RegExp(`${catalog.paths[lang]}$`));
    // Nothing on the home moves by itself: no moving app band.
    await expect(page.locator('.marquee')).toHaveCount(0);
  });

  test(`/${catalog.paths[lang]} shows every app with its claim, a screen, its stores and a link to its page`, async ({ page }) => {
    await page.goto('/' + catalog.paths[lang]);
    const cases = page.locator('.cases > .case');
    await expect(cases).toHaveCount(apps.length);
    for (const [i, app] of apps.entries()) {
      const c = cases.nth(i);
      await expect(c.locator('h3')).toHaveText(app[lang].work.claim);
      await expect(c.locator('.kind.own')).toHaveText(home[lang].kind);
      await expect(c.locator('.case-visual img')).toHaveAttribute('alt', /\S/);
      await expect(c.locator(`a.case-link[href$="${app.paths[lang]}"]`)).toHaveCount(1);
      const live = Object.values(app.stores).filter((st) => st.status === 'live');
      await expect(c.locator('a.store')).toHaveCount(live.length);
      for (const st of live) await expect(c.locator(`a.store[href="${st.url}"]`)).toHaveCount(1);
      if (live.length < 2) await expect(c.locator('.soon-line')).toBeVisible();
    }
    await expect(page.locator('.home-hero .facts b').first()).toHaveText(String(apps.length));
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    expect(ld['@type']).toBe('CollectionPage');
    expect(ld.mainEntity.itemListElement.map((x) => x.name)).toEqual(apps.map((a) => a.name));
  });
}

// On a narrow computer the studio menu still fits in its bar, with the contact button in view, and on
// both pages the menu's contact link goes to the contact section of that same page.
for (const lang of ['es', 'en']) {
  for (const path of [home.paths[lang], catalog.paths[lang]]) {
    test(`/${path} keeps its menu and its contact button inside the bar on a narrow computer`, async ({ page }, info) => {
      test.skip(info.project.name !== 'desktop', 'computer widths');
      const h = home[lang];
      for (const width of [861, 870, 1000, 1040, 1041]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/' + path);
        expect(await page.locator('.nav-bar').evaluate((b) => b.scrollWidth - b.clientWidth), `bar overflow at ${width}`).toBeLessThanOrEqual(0);
        await expect(page.locator('.nav-cta'), `contact button at ${width}`).toBeInViewport({ ratio: 1 });
        await expect(page.locator('.nav-links a', { hasText: catalog[lang].navLabel })).toBeVisible();
        await expect(page.locator(`.nav-links a[href$="#${h.aboutId}"]`)).toBeVisible();
      }
      await expect(page.locator(`.nav-links a[href$="#${h.contactId}"]`)).toHaveAttribute('href', `#${h.contactId}`);
      await expect(page.locator(`main > section#${h.contactId}`)).toHaveCount(1);
      await expect(page.locator('.nav-links li')).toHaveCount(6);
      for (const a of await page.locator('.nav-links a').all()) await expect(a).toBeVisible();
    });
  }
}

// We have no client projects, so the home and the catalogue never present our apps as client work:
// no client-project label, testimonial, client logo or client count, and every card says it is ours.
for (const path of ['/', '/en/', '/' + catalog.paths.es, '/' + catalog.paths.en]) {
  test(`${path} never presents our own products as client work`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('.kind.client, .testimonial, .logos, blockquote')).toHaveCount(0);
    const text = await page.locator('main').innerText();
    // Saying that they are not client projects is fine; a client label, case or claim is not.
    expect(text).not.toMatch(/\b(Proyecto para cliente|Client project|casos? de clientes?|client case|nuestros clientes|our clients|clientes satisfechos|happy clients|trusted by)\b/i);
    const cards = page.locator('.cases > .case');
    await expect(cards.locator('.kind.own')).toHaveCount(await cards.count());
  });
}

// Right after the hero, the proof: our own apps live in the stores, with numbers anyone can check.
// Then what we do for the visitor, who it is for, how we work (a timeline, one short line per
// stage), who we are, the questions the services page marks for the home, and the contact.
for (const lang of ['es', 'en']) {
  test(`/${home.paths[lang]} shows our apps right after the hero, then what we do, who it is for, the process, who we are and the questions marked for the home`, async ({ page }) => {
    const h = home[lang];
    const s = services[lang];
    await page.goto('/' + home.paths[lang]);
    const order = await page.locator('main > section[id]').evaluateAll((all) => all.map((x) => x.id));
    expect(order).toEqual([h.workId, h.offerId, h.whoId, h.processId, h.aboutId, h.faqId, h.contactId]);
    await expect(page.locator(`#${h.workId} .stats b`)).toHaveText(h.stats().map(([big]) => big));
    const listings = apps.flatMap((a) => ['appStore', 'play'].filter((k) => a.stores[k]?.status === 'live'));
    expect(h.stats()[1][0]).toBe(String(listings.length));
    await expect(page.locator(`#${h.offerId} .offer-list > li h3`)).toHaveText(h.offer.map(([, title]) => title));
    await expect(page.locator(`#${h.processId} .timeline h3`)).toHaveText(s.process.map(([name]) => name));
    await expect(page.locator(`#${h.processId} .timeline li > p:not(.who-line)`)).toHaveText(h.processShort);
    const marked = s.faq.filter(([, , where]) => where === 'home').map(([q]) => q);
    expect(marked.length).toBeGreaterThan(0);
    await expect(page.locator(`#${h.faqId} summary`)).toHaveText(marked);
  });
}

// The "Our work" cards of the services page and the app cards of the home and the catalogue stack as the page
// scrolls: each card stays put once it is on screen and the next one slides over it. With reduced
// motion they simply scroll.
const stacks = [
  ['/', '.cases > .case'],
  ['/en/', '.cases > .case'],
  ['/' + catalog.paths.es, '.cases > .case'],
  ['/' + catalog.paths.en, '.cases > .case'],
  ['/servicios/', '.work-card'],
  ['/en/services/', '.work-card'],
];
const tops = (page, sel) => page.locator(sel).evaluateAll((cards) => cards.map((c) => c.getBoundingClientRect().top));
for (const [path, sel] of stacks) {
  test(`${path} ${sel} cards stack on scroll, and scroll normally with reduced motion`, async ({ page }) => {
    await page.goto(path);
    const cards = page.locator(sel);
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.first()).toHaveCSS('position', 'sticky');

    // Scroll until the second card is halfway up the screen: the first card has stopped, with its
    // whole bottom edge on screen, and the second one covers part of it.
    const { innerHeight } = await page.evaluate(() => ({ innerHeight }));
    const second = await cards.nth(1).evaluate((c) => c.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), second - innerHeight / 2);
    const before = await tops(page, sel);
    await page.mouse.wheel(0, 200);
    await expect.poll(async () => (await tops(page, sel))[1]).toBeLessThan(before[1] - 150);
    const after = await tops(page, sel);
    expect(after[0]).toBeCloseTo(before[0], 0);
    const first = await cards.first().boundingBox();
    expect(first.y + first.height).toBeLessThanOrEqual(innerHeight);
    expect(after[1]).toBeLessThan(first.y + first.height);
    expect(await cards.nth(1).evaluate((c, s) => document.elementFromPoint(innerWidth / 2, c.getBoundingClientRect().top + 40)?.closest(s) === c, sel)).toBe(true);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(cards.first()).not.toHaveCSS('position', 'sticky');
  });
}

// Calm is not motionless: when the visitor has not asked for less motion, the home keeps its
// motion. The hero's glow drifts and the screen rises; where the browser supports scroll-driven
// animations, the process line draws itself, its numbers light up and the big numbers grow in.
for (const path of ['/', '/en/']) {
  test(`${path} moves when motion is allowed`, async ({ page, browserName }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(path);
    const names = await page.evaluate(() => [...new Set(document.getAnimations().filter((a) => a instanceof CSSAnimation).map((a) => a.animationName))]);
    expect(names).toEqual(expect.arrayContaining(['glow-drift', 'rise-in']));
    if (browserName === 'chromium') expect(names).toEqual(expect.arrayContaining(['draw', 'node-on', 'count-in', 'settle']));
  });
}

// With reduced motion the home is still: no entrance, nothing fades in or slides on scroll, and
// every section and card is fully shown wherever the page is scrolled.
for (const path of ['/', '/en/', '/' + catalog.paths.es]) {
  test(`${path} is still and fully shown with reduced motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    const moving = await page.evaluate(() => document.getAnimations().filter((a) => a instanceof CSSAnimation).map((a) => a.animationName));
    expect(moving).toEqual([]);
    const faded = await page.locator('main .reveal, .case-copy, .case-visual > *, .home-figure > *').evaluateAll((all) =>
      all.filter((e) => getComputedStyle(e).opacity !== '1' || !['none', '0px 0px'].includes(getComputedStyle(e).translate)).map((e) => e.className)
    );
    expect(faded).toEqual([]);
  });
}
