// A local-only build of the site with fake apps added, to check that every page holds up as the
// list of apps grows. It is never published: it writes a copy of site/ and legal/ to <dir>, adds
// fake apps until there are <total> (a web app, an app coming soon, an app in one store only, a web
// app coming soon and an app in both stores, in that order), and builds there with the same
// scripts/build.mjs and its checks. The fake apps use drawn SVG images and short legal pages.
//   node scripts/fixture.mjs <total> <dir>     then: SITE_DIR=<dir>/site node scripts/serve.mjs
// tests/scaling.spec.mjs builds 4, 6 and 8 apps this way and checks the home, the services page,
// the menus and the new apps' pages on a phone and a desktop.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const [total, dir] = [Number(process.argv[2]), process.argv[3]];
if (!Number.isInteger(total) || !dir) {
  console.error('Usage: node scripts/fixture.mjs <total apps> <output dir>');
  process.exit(2);
}
const repo = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(dir);
if (out === repo || out.startsWith(join(repo, 'site')) || out.startsWith(join(repo, 'legal'))) {
  console.error('The fixture must be written outside site/ and legal/');
  process.exit(2);
}
const root = join(out, 'site');
const legal = join(out, 'legal');
rmSync(out, { recursive: true, force: true });
cpSync(join(repo, 'site'), root, { recursive: true });
cpSync(join(repo, 'legal'), legal, { recursive: true });

const write = (file, body) => {
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, body);
};

// The kinds of app a new entry can be, in the order they are added.
const kinds = [
  { id: 'fx-panel', name: 'Panel Demo', color: '#0f766e', stores: { web: { status: 'live', url: 'https://example.com/' } }, device: 'browser', status: 'live' },
  { id: 'fx-pronto', name: 'Pronto Demo', color: '#b45309', stores: { play: { status: 'soon' }, appStore: { status: 'soon' } }, status: 'soon' },
  { id: 'fx-agenda', name: 'Agenda Demo', color: '#be185d', stores: { play: { status: 'live', url: 'https://play.google.com/store/apps/details?id=com.example.agenda' }, appStore: { status: 'soon' } }, status: 'live' },
  { id: 'fx-mapa', name: 'Mapa Demo', color: '#4338ca', stores: { web: { status: 'soon' } }, device: 'browser', status: 'soon' },
  { id: 'fx-recetas', name: 'Recetas Demo', color: '#15803d', stores: { play: { status: 'live', url: 'https://play.google.com/store/apps/details?id=com.example.recetas' }, appStore: { status: 'live', url: 'https://apps.apple.com/app/id000000000' } }, status: 'live' },
];

const icon = (k) => `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="${k.color}"/><text x="128" y="168" font-family="Arial, sans-serif" font-size="128" font-weight="700" fill="#fff" text-anchor="middle">${k.name[0]}</text></svg>`;
// A plain drawing of a screen: a header in the app's color and a few rows.
const screen = (k, [w, h], n) => {
  const rows = Array.from({ length: 6 }, (_, i) => `<rect x="${w * 0.08}" y="${h * (0.22 + i * 0.11)}" width="${w * (0.84 - (i % 3) * 0.14)}" height="${h * 0.07}" rx="${w * 0.02}" fill="#e7e5ef"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fbfbfd"/><rect width="${w}" height="${h * 0.16}" fill="${k.color}"/><text x="${w * 0.08}" y="${h * 0.1}" font-family="Arial, sans-serif" font-size="${Math.round(h * 0.045)}" font-weight="700" fill="#fff">${k.name} · ${n}</text>${rows}</svg>`;
};
const legalDoc = (k, lang, doc) => {
  const title = { es: { privacy: 'Política de privacidad', terms: 'Términos y condiciones' }, en: { privacy: 'Privacy policy', terms: 'Terms and conditions' } }[lang][doc];
  const [a, b] = lang === 'es' ? ['Qué es', 'Contacto'] : ['What it is', 'Contact'];
  return `<h1>${k.name}: ${title}</h1>\n<h2>${a}</h2>\n<p>${k.name}: fixture (local only).</p>\n<h2>${b}</h2>\n<p>{{stores}}</p>\n`;
};

function fakeApp(k) {
  const size = k.device === 'browser' ? [1280, 800] : [600, 1300];
  const screens = (lang) => [1, 2, 3].map((n) => `assets/img/${k.id}/${lang}-${n}.svg`);
  for (const lang of ['es', 'en']) {
    screens(lang).forEach((src, i) => write(join(root, src), screen(k, size, i + 1)));
    cpSync(join(root, `assets/img/og/home-${lang}.jpg`), join(root, `assets/img/og/${k.id}-${lang}.jpg`));
    for (const doc of ['privacy', 'terms']) write(join(legal, k.id, `${lang}-${doc}.html`), legalDoc(k, lang, doc));
  }
  write(join(root, `assets/img/${k.id}/icon.svg`), icon(k));
  const live = Object.values(k.stores).some((s) => s.status === 'live');
  const copy = (lang) => {
    const es = lang === 'es';
    const t = (a, b) => (es ? a : b);
    return {
      category: t('Producto de prueba', 'Test product'),
      for: t('Para revisar el sitio con más apps', 'For checking the site with more apps'),
      title: `${k.name}: ${t('app de prueba', 'test app')}`,
      description: t(`${k.name} es una app de prueba, solo para revisar localmente cómo se ve el sitio con más apps.`, `${k.name} is a test app, only for checking locally how the site looks with more apps.`),
      headline: t(`${k.name}, *de prueba*.`, `${k.name}, *for testing*.`),
      lead: t('Una app que no existe, para ver el sitio con más apps.', 'An app that does not exist, to see the site with more apps.'),
      pitch: t('Así se ve una app nueva.', 'This is how a new app looks.'),
      tabs: [1, 2, 3].map((n) => [t(`Pantalla ${n}`, `Screen ${n}`), n === 2 ? 'fair' : 'good', t(`La pantalla ${n} de ${k.name}.`, `Screen ${n} of ${k.name}.`)]),
      navCta: live ? t('Abrir', 'Open') : t('Avísame', 'Notify me'),
      benefits: [['spark', t('Uno', 'One'), t('Primer beneficio.', 'First benefit.')], ['gauge', t('Dos', 'Two'), t('Segundo beneficio.', 'Second benefit.')], ['shield', t('Tres', 'Three'), t('Tercer beneficio.', 'Third benefit.')], ['bolt', t('Cuatro', 'Four'), t('Cuarto beneficio.', 'Fourth benefit.')]],
      steps: [[t('Abre', 'Open'), t('Primer paso.', 'First step.')], [t('Usa', 'Use'), t('Segundo paso.', 'Second step.')], [t('Listo', 'Done'), t('Tercer paso.', 'Third step.')]],
      faq: [[t('¿Es real?', 'Is it real?'), t('No, es de prueba.', 'No, it is for testing.')]],
      ...(live ? {} : { notify: `mailto:hola@tutosapp.co?subject=${encodeURIComponent(k.name)}` }),
      closing: [t('Una app *de prueba*.', 'A *test* app.'), t('Solo para revisar el sitio.', 'Only to check the site.')],
      share: `${k.name}.`,
      work: {
        shows: t('Una app de prueba', 'A test app'),
        claim: t(`${k.name} es una app de prueba para ver el sitio con más apps.`, `${k.name} is a test app to see the site with more apps.`),
        problem: t('El sitio debe verse bien con más apps.', 'The site must look right with more apps.'),
        built: t('Una entrada más en la lista de apps.', 'One more entry in the list of apps.'),
        ai: [t('Ninguna', 'None')],
      },
    };
  };
  return {
    id: k.id,
    name: k.name,
    color: k.color,
    icon: `assets/img/${k.id}/icon.svg`,
    paths: { es: `${k.id}/`, en: `${k.id}/en/` },
    status: k.status,
    stores: k.stores,
    device: k.device,
    category: 'UtilitiesApplication',
    legal: { privacy: '2026-11-16', terms: '2026-11-16' },
    screenSize: size,
    screens,
    es: copy('es'),
    en: copy('en'),
  };
}

globalThis.TUTOSAPP_FIXTURE = {
  root,
  legal,
  apps: (real) => {
    if (total < real || total - real > kinds.length) throw new Error(`total must be between ${real} and ${real + kinds.length}`);
    return kinds.slice(0, total - real).map(fakeApp);
  },
};
const { run } = await import('./build.mjs');
run();
