// Lighthouse CI: the home, the catalogue of our apps, the services page and every app page, in both languages, plus one legal
// page per app and the company's privacy policy. The list comes from the same data as the site
// (scripts/build.mjs), so a new app is checked as soon as it is added.
const { apps, home, catalog, services, companyPrivacy, legalPages } = require('./scripts/build.mjs');

const url = (path) => `http://localhost/${path}index.html`;
const legal = apps.map((app, i) => {
  // A different document and language for each app, so between them they cover every kind.
  const docs = legalPages.filter((l) => l.app === app);
  return docs[i % docs.length].path;
});

module.exports = {
  ci: {
    collect: {
      staticDistDir: './site',
      url: [
        ...Object.values(home.paths),
        ...Object.values(catalog.paths),
        ...Object.values(services.paths),
        ...apps.flatMap((a) => Object.values(a.paths)),
        ...legal,
        companyPrivacy.paths.es,
      ].map(url),
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 1 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
