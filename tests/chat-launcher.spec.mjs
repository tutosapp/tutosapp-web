// The floating "Tell us your idea" launcher (site/assets/brief.js) on a phone and a desktop: the
// button shows on every kind of page, opens the chat in a panel that keeps the focus inside and
// closes with Esc, its button or a click outside (not a drag that starts or ends in the panel), and
// gives the focus back. The home and the services page lend their own chat to the panel and get it
// back, answers and all; the button steps aside on their contact section. A result that arrives
// after the panel was closed does not move the page. The page for a missing path has the launcher
// too. The hint shows once per visit, can be dismissed, never shows once the chat was opened or
// used (also on a page the browser restores on Back), and never with reduced motion. A result in
// the chat of the contact section is scrolled into view.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { apps, home, services, companyPrivacy, legalPages, CONTACT_ENDPOINT } from '../scripts/build.mjs';

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

test('a drag that starts or ends in the panel does not close it', async ({ page }) => {
  test.skip(page.viewportSize().width < 620, 'the panel fills a phone screen');
  await page.goto('/' + ojito.paths.es);
  await untilShown(page);
  await fab(page).click();
  const name = page.locator('#brief-nombre');
  await name.fill('Ana María');
  const box = await name.boundingBox();
  const inside = [box.x + box.width / 2, box.y + box.height / 2];

  // Selecting the answer and letting go over the dimmed page.
  await page.mouse.move(...inside);
  await page.mouse.down();
  await page.mouse.move(40, 40, { steps: 5 });
  await page.mouse.up();
  await expect(sheet(page)).toHaveJSProperty('open', true);

  // Pressing on the dimmed page and letting go in the panel.
  await page.mouse.move(40, 40);
  await page.mouse.down();
  await page.mouse.move(...inside, { steps: 5 });
  await page.mouse.up();
  await expect(sheet(page)).toHaveJSProperty('open', true);

  await page.mouse.click(40, 40);
  await expect(sheet(page)).toHaveJSProperty('open', false);
});

test('a result that arrives after the panel was closed does not move the page', async ({ page }) => {
  let respond;
  const held = new Promise((resolve) => (respond = resolve));
  await page.route(CONTACT_ENDPOINT, async (route) => {
    await held;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/' + home.paths.es);
  await untilShown(page);
  await fab(page).click();
  await page.locator('#brief-nombre').fill('Ana María');
  await page.keyboard.press('Enter');
  await page.locator('#brief-contacto').fill('ana@example.com');
  await page.keyboard.press('Enter');
  await page.locator('.chat-skip').click();
  await page.locator('#brief-idea').fill('Una app para pedir turnos en peluquerías de barrio.');
  await page.locator('.chat-next').click();
  for (const key of ['tipo', 'plazo', 'presupuesto', 'nda']) {
    await page.locator(`.q.active[data-key=${key}] .choice`).first().click();
    await expect(page.locator('.q.active')).not.toHaveAttribute('data-key', key);
  }
  await page.locator('#brief-consentimiento').check();
  await page.locator('.chat-next').click();
  const next = page.locator('.chat-next');
  await expect(next).toBeDisabled();
  const sending = await next.textContent();

  // Closed and opened again while it sends: the button still says it is sending.
  await page.keyboard.press('Escape');
  await fab(page).click();
  await expect(next).toBeDisabled();
  await expect(next).toHaveText(sending);

  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveJSProperty('open', false);
  const before = await page.evaluate(() => scrollY);
  respond();
  await expect(page.locator('section .chat-done')).toBeAttached();
  await expect(page.locator('section .chat-done')).not.toHaveAttribute('hidden');
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBe(before);

  // Opening the panel again shows the thanks.
  await untilShown(page);
  await fab(page).click();
  await expect(sheet(page).locator('.chat-done')).toBeFocused();
});

test('a result for the chat of the contact section is scrolled into view', async ({ page }) => {
  await page.route(CONTACT_ENDPOINT, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('/' + home.paths.es);
  await page.locator('section #brief').scrollIntoViewIfNeeded();
  await page.locator('#brief-nombre').fill('Ana María');
  await page.keyboard.press('Enter');
  await page.locator('#brief-contacto').fill('ana@example.com');
  await page.keyboard.press('Enter');
  await page.locator('.chat-skip').click();
  await page.locator('#brief-idea').fill('Una app para pedir turnos en peluquerías de barrio.');
  await page.locator('.chat-next').click();
  for (const key of ['tipo', 'plazo', 'presupuesto', 'nda']) {
    await page.locator(`.q.active[data-key=${key}] .choice`).first().click();
    await expect(page.locator('.q.active')).not.toHaveAttribute('data-key', key);
  }
  await page.locator('#brief-consentimiento').check();
  // The visitor has the send button at the top of the screen, the start of the chat above it.
  await page.locator('.chat-controls').evaluate((bar) => bar.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect(page.locator('#brief .chat-head')).not.toBeInViewport();
  await page.locator('.chat-next').click();
  await expect(page.locator('section .chat-done')).toBeFocused();
  await expect(page.locator('section .chat-done')).toBeInViewport();
});

test('the page for a missing path has the launcher, the chat and its privacy link', async ({ page, baseURL }) => {
  // That page loads everything from the published site; here the same paths come from this build.
  await page.route('https://tutosapp.co/**', async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: baseURL + url.pathname + url.search });
    await route.fulfill({ response, headers: { ...response.headers(), 'content-type': url.pathname.endsWith('.js') ? 'text/javascript' : response.headers()['content-type'] } });
  });
  await page.goto('/no/existe/esta-pagina/');
  await expect(page.locator('h1')).toHaveText('404');
  await untilShown(page);
  await fab(page).click();
  await expect(sheet(page)).toHaveJSProperty('open', true);
  await expect(page.locator('#brief-nombre')).toBeFocused();
  await expect(sheet(page).locator('.consent a')).toHaveAttribute('href', 'https://tutosapp.co/' + companyPrivacy.paths.es);
  await page.keyboard.press('Escape');
  await expect(sheet(page)).toHaveJSProperty('open', false);
  await expect(fab(page)).toBeFocused();
});

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

  test('never shows after the chat was opened from the button', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + ojito.paths.es);
    await untilShown(page);
    await fab(page).click();
    await page.keyboard.press('Escape');
    await page.goto('/' + ojito.paths.en);
    await page.clock.runFor(30_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
    await expect(fab(page)).toBeVisible();
  });

  test('never shows after answering in the chat of the contact section', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + home.paths.es);
    await page.locator('section #brief-nombre').fill('Ana');
    await page.goto('/' + ojito.paths.es);
    await page.clock.runFor(30_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
    await expect(fab(page)).toBeVisible();
  });

  test('never shows on a page restored after the chat was used on another one', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + ojito.paths.es);
    await page.clock.runFor(3000);
    // What the browser does on Back: the page comes back as it was, with the visit's memory of the
    // chat used elsewhere, and says so with a persisted pageshow.
    await page.evaluate(() => {
      sessionStorage.setItem('tutosapp-chat-cue', '1');
      dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    await page.clock.runFor(30_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
    await expect(fab(page)).not.toHaveClass(/is-nudging/);
  });

  test('goes away on a page restored after the chat was used on another one', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + ojito.paths.es);
    await page.clock.runFor(8000);
    await expect(page.locator('.chat-cue')).toBeVisible();
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await expect(page.locator('.chat-cue')).toBeHidden();
  });

  test('never shows once the visit remembers the chat, even without a restore event', async ({ page }) => {
    await page.clock.install();
    await page.goto('/' + ojito.paths.es);
    await page.clock.runFor(3000);
    await page.evaluate(() => sessionStorage.setItem('tutosapp-chat-cue', '1'));
    await page.clock.runFor(30_000);
    await expect(page.locator('.chat-cue')).toBeHidden();
    await expect(fab(page)).not.toHaveClass(/is-nudging/);
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
