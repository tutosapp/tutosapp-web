// The floating "Tell us your idea" launcher (site/assets/brief.js) on a phone and a desktop: the
// button shows on every kind of page, opens the chat in a panel that keeps the focus inside and
// closes with Esc, its button or a click outside, and gives the focus back. The home and the
// services page lend their own chat to the panel and get it back, answers and all; the button
// steps aside on their contact section. The hint shows once per visit, can be dismissed, and never
// with reduced motion.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apps, home, services, companyPrivacy, legalPages } from '../scripts/build.mjs';

const ojito = apps.find((a) => a.id === 'ojito');
const pages = [
  { path: '/' + home.paths.es, lang: 'es', inline: true },
  { path: '/' + home.paths.en, lang: 'en', inline: true },
  { path: '/' + services.paths.es, lang: 'es', inline: true },
  { path: '/' + ojito.paths.es, lang: 'es', inline: false },
  { path: '/' + ojito.paths.en, lang: 'en', inline: false },
  { path: '/' + companyPrivacy.paths.en, lang: 'en', inline: false },
  { path: '/' + legalPages[0].path, lang: legalPages[0].lang, inline: false },
];
const LABEL = { es: 'Abrir el chat: Cuéntanos tu idea', en: 'Open the chat: Tell us your idea' };
const CUE = { es: '¿Tienes una idea de app? Escríbenos', en: 'Have an app idea? Chat with us' };

const fab = (page) => page.locator('.chat-fab');
const sheet = (page) => page.locator('#chat-sheet');
const shown = (page) => page.locator('.chat-float:not(.is-away, .is-tucked) .chat-fab');
const focusInSheet = (page) => page.evaluate(() => document.getElementById('chat-sheet').contains(document.activeElement));

// Scrolls until the button is not stepping aside for a page button or the contact section.
async function untilShown(page) {
  for (let y = 0; y < 20 && !(await shown(page).isVisible()); y++) {
    await page.evaluate(() => scrollBy({ top: innerHeight / 3, behavior: 'instant' }));
    await page.waitForTimeout(80);
  }
  await expect(shown(page)).toBeVisible();
}

for (const { path, lang, inline } of pages) {
  test(`${path} launcher opens the chat in a panel and closes it`, async ({ page }) => {
    await page.goto(path);
    await expect(fab(page)).toHaveAccessibleName(LABEL[lang]);
    await expect(fab(page)).toHaveAttribute('aria-expanded', 'false');
    await untilShown(page);
    const box = await fab(page).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    const viewport = page.viewportSize();
    expect(box.x + box.width, 'bottom-right corner').toBeGreaterThan(viewport.width - 100);
    expect(box.y + box.height, 'bottom-right corner').toBeGreaterThan(viewport.height - 100);

    // Keyboard: the button takes the focus and Enter opens the panel on the first question.
    await fab(page).focus();
    await page.keyboard.press('Enter');
    await expect(sheet(page)).toHaveJSProperty('open', true);
    await expect(sheet(page).locator('#brief')).toBeVisible();
    await expect(page.locator('#brief')).toHaveCount(1);
    await expect(page.locator('#brief-nombre')).toBeFocused();
    await expect(fab(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.chat-float')).toHaveClass(/is-away/);

    // The panel holds the focus while it is open.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await focusInSheet(page), `focus stays in the panel after ${i + 1} Tab`).toBe(true);
    }
    const axe = await new AxeBuilder({ page }).include('#chat-sheet').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

    // An answer typed in the panel survives closing it.
    await page.locator('#brief-nombre').fill('Ana');
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveJSProperty('open', false);
    await expect(fab(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(fab(page)).toBeFocused();

    if (inline) {
      // The page's own chat is back in its contact section, with the answer.
      await expect(page.locator('section #brief')).toHaveCount(1);
      await expect(page.locator('section #brief-nombre')).toHaveValue('Ana');
      await expect(page.locator('.chat-spacer')).toHaveCount(0);
    }

    // The close button and a click outside the panel close it too.
    await untilShown(page);
    await fab(page).click();
    await expect(page.locator('#brief-nombre')).toHaveValue('Ana');
    await page.locator('.chat-close').click();
    await expect(sheet(page)).toHaveJSProperty('open', false);
    await fab(page).click();
    await expect(sheet(page)).toHaveJSProperty('open', true);
    if (viewport.width >= 620) {
      await page.mouse.click(40, 40);
      await expect(sheet(page)).toHaveJSProperty('open', false);
    }
  });
}

for (const path of ['/' + home.paths.es, '/' + services.paths.en]) {
  test(`${path} launcher steps aside on the contact section, where the chat already is`, async ({ page }) => {
    await page.goto(path);
    await untilShown(page);
    await page.locator('section:has(#brief)').evaluate((s) => s.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect(page.locator('.chat-float')).toHaveClass(/is-away/);
    await expect(fab(page)).toBeHidden();
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('.chat-float')).not.toHaveClass(/is-away/);
  });
}

test('the launcher never covers a page button or store badge', async ({ page }) => {
  for (const path of pages.map((p) => p.path)) {
    await page.goto(path);
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 150) {
      await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y);
      const hit = await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const float = document.querySelector('.chat-float');
                if (float.hidden || getComputedStyle(float).visibility === 'hidden') return resolve(null);
                const f = document.querySelector('.chat-fab').getBoundingClientRect();
                const under = [...document.querySelectorAll('main :is(.btn, .store)')].find((el) => {
                  const b = el.getBoundingClientRect();
                  return b.width > 0 && b.left < f.right && f.left < b.right && b.top < f.bottom && f.top < b.bottom;
                });
                resolve(under ? under.outerHTML.slice(0, 80) : null);
              })
            )
          )
      );
      expect(hit, `${path} at ${y}px`).toBeNull();
    }
  }
});

test.describe('launcher hint', () => {
  test('shows once per visit, after a few seconds, and can be dismissed', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + home.paths.es);
    const cue = page.locator('.chat-cue');
    await page.clock.runFor(5000);
    await expect(cue).toBeHidden();
    await page.clock.runFor(3000);
    await expect(cue).toBeVisible();
    await expect(cue).toContainText(CUE.es);
    await expect(fab(page)).toHaveClass(/is-nudging/);
    await page.locator('.chat-cue-close').click();
    await expect(cue).toBeHidden();
    await expect(fab(page)).toBeFocused();

    // Another page of the same visit: no hint, ever.
    await page.goto('/' + ojito.paths.es);
    await page.clock.runFor(30_000);
    await expect(cue).toBeHidden();
    await page.reload();
    await page.clock.runFor(30_000);
    await expect(cue).toBeHidden();
  });

  test('opens the chat when tapped', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + home.paths.en);
    await page.clock.runFor(8000);
    const cue = page.locator('.chat-cue');
    await expect(cue).toContainText(CUE.en);
    await page.locator('.chat-cue-open').click();
    await expect(sheet(page)).toHaveJSProperty('open', true);
    await expect(cue).toBeHidden();
  });

  test('stays hidden on its own after a while', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + services.paths.es);
    await page.clock.runFor(8000);
    await expect(page.locator('.chat-cue')).toBeVisible();
    await page.clock.runFor(13_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
  });

  test('never shows with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install();
    await page.goto('/' + home.paths.es);
    await page.clock.runFor(30_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
    await expect(fab(page)).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the launcher stays hidden', async ({ page }) => {
    await page.goto('/' + ojito.paths.es);
    await expect(fab(page)).toBeHidden();
    await expect(sheet(page)).toBeHidden();
  });
});
