// Cards stack as the page scrolls: the "Our work" cards of the services page and the app cards of
// the home. Each card (or each row of cards, when they sit side by side in a grid) stays put once
// it is fully on screen and the next one slides over it. The cards are taller than many screens,
// so style.css needs each card's height to know where it can stop (its --h), its row to know how
// far below the menu bar (--i), and its column to stagger how it appears (--k), which this
// measures. A stuck card only lets go at the end of its list, so a last row with fewer cards would
// leave the rows stuck under it showing on either side: such a list does not stack. Without this
// script, or with reduced motion, the cards simply scroll too.
(() => {
  if (!window.ResizeObserver) return;
  const lists = [...document.querySelectorAll('.work-list, .cases')];
  const place = (list) => {
    const cards = [...list.children];
    if (!cards.length) return;
    // Columns from widths, which sticking never changes (positions do).
    const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0;
    const cols = Math.max(1, Math.round((list.clientWidth + gap) / (cards[0].offsetWidth + gap)));
    list.classList.toggle('stacking', cards.length % cols === 0);
    cards.forEach((card, i) => {
      card.style.setProperty('--i', Math.floor(i / cols));
      card.style.setProperty('--k', i % cols);
      card.style.setProperty('--h', `${card.offsetHeight}px`);
    });
  };
  const size = new ResizeObserver((entries) => {
    for (const list of new Set(entries.map((e) => e.target.closest('.work-list, .cases')))) place(list);
  });
  for (const list of lists) {
    size.observe(list);
    for (const card of list.children) size.observe(card);
  }
})();
