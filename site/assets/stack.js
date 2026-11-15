// "Our work" cards stack as the page scrolls: each card stays put once it is fully on screen and
// the next one slides over it. The cards are taller than many screens, so style.css needs each
// card's height to know where it can stop (its --h), which this measures. Without this script, or
// with reduced motion, the cards simply scroll.
(() => {
  if (!window.ResizeObserver) return;
  const size = new ResizeObserver((entries) => {
    for (const e of entries) e.target.style.setProperty('--h', `${e.target.offsetHeight}px`);
  });
  for (const list of document.querySelectorAll('.work-list')) {
    for (const card of list.querySelectorAll('.work-card')) size.observe(card);
    list.classList.add('stacking');
  }
})();
