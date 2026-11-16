// "Tell us your idea": turns the form in #brief into a chat, one question at a time, and sends the
// answers as JSON to the address in its data-endpoint (a Supabase edge function; the contract is
// in README.md). Without it the same form shows every question at once and sends them as an
// email. If sending fails, it offers that email and WhatsApp, already filled in with the answers.
// The markup comes from briefForm() in scripts/build.mjs; the strings in the page's language, from
// #brief-strings.
(() => {
  const root = document.getElementById('brief');
  if (!root || !window.fetch) return;
  const form = root.querySelector('form.brief');
  const S = JSON.parse(document.getElementById('brief-strings').textContent);
  const steps = [...form.querySelectorAll('fieldset.q')];
  const done = root.querySelector('.chat-done');
  const fail = root.querySelector('.chat-fail');
  let at = 0;
  // Says how a send ended when the floating panel was closed meanwhile; set by the launcher below.
  let notice = () => {};
  // Whether the floating panel has shown the chat since the current send started.
  let inPanel = false;
  let advance;
  let pointer = 0;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };

  form.noValidate = true;
  root.classList.add('is-chat');

  // Each answered question shows the answer as the visitor's own bubble.
  for (const step of steps) step.append(el('p', 'bubble me'));

  const bar = el('div', 'chat-controls');
  const back = el('button', 'btn ghost chat-back', S.back);
  const skip = el('button', 'btn ghost chat-skip', S.skip);
  const next = el('button', 'btn primary chat-next', S.next);
  back.type = 'button';
  skip.type = 'button';
  next.type = 'submit';
  bar.append(back, skip, next);
  form.append(bar);

  const fields = (step) => [...step.querySelectorAll('input, textarea')];
  const value = (step) => {
    const [first] = fields(step);
    if (first.type === 'radio') return step.querySelector('input:checked')?.value ?? '';
    if (first.type === 'checkbox') return first.checked;
    return first.value.trim();
  };
  // What the visitor sees, and what the fallback email says, for an answer.
  const answer = (step) => {
    const checked = step.querySelector('input[type=radio]:checked');
    if (checked) return checked.nextElementSibling.textContent;
    const v = value(step);
    return typeof v === 'boolean' ? (v ? '✓' : '') : v || '—';
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s().-]+$/;
  function problem(step) {
    const key = step.dataset.key;
    const [first] = fields(step);
    const v = value(step);
    if (first.type === 'radio') return v ? '' : S.errors.choose;
    if (first.type === 'checkbox') return v ? '' : S.errors.consent;
    const min = Number(step.dataset.min || 0);
    const max = Number(step.dataset.max || Infinity);
    if (!v) return 'optional' in step.dataset ? '' : S.errors.required;
    if (v.length > max) return S.errors.long;
    if (v.length < min) return key === 'idea' ? S.errors.short : S.errors.required;
    if (key === 'contacto') {
      const digits = v.replace(/\D/g, '').length;
      if (!EMAIL_RE.test(v) && !(PHONE_RE.test(v) && digits >= 7 && digits <= 15)) return S.errors.contacto;
    }
    return '';
  }
  function check(step) {
    const p = problem(step);
    step.querySelector('.q-error').textContent = p;
    for (const f of fields(step)) f.setAttribute('aria-invalid', p ? 'true' : 'false');
    return !p;
  }

  function show(i, focus) {
    at = i;
    steps.forEach((step, k) => {
      step.classList.toggle('done', k < i);
      step.classList.toggle('active', k === i);
      step.disabled = k > i;
      if (k < i) step.querySelector('.bubble.me').textContent = answer(step);
    });
    const step = steps[i];
    back.hidden = i === 0;
    skip.hidden = !('optional' in step.dataset);
    next.textContent = next.disabled ? S.sending : i === steps.length - 1 ? S.send : S.next;
    root.style.setProperty('--progress', String(i / steps.length));
    if (focus) {
      const target = step.querySelector('input:checked') || fields(step)[0];
      target.focus({ preventScroll: true });
      // Like a chat: the conversation scrolls inside its card, never the page.
      form.scrollTop = form.scrollHeight;
    }
  }

  function forward() {
    if (!check(steps[at])) {
      fields(steps[at])[0].focus();
      return;
    }
    if (at < steps.length - 1) show(at + 1, true);
    else send();
  }

  back.addEventListener('click', () => show(at - 1, true));
  skip.addEventListener('click', () => {
    for (const f of fields(steps[at])) f.value = '';
    steps[at].querySelector('.q-error').textContent = '';
    show(at + 1, true);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    forward();
  });
  // A tap or click on an option answers and moves on, like a chat. Arrow keys only select, so
  // keyboard users move on with Enter or the button.
  form.addEventListener('pointerdown', () => (pointer = Date.now()));
  form.addEventListener('change', (e) => {
    const step = e.target.closest('fieldset.q');
    if (step !== steps[at] || !/^(radio|checkbox)$/.test(e.target.type)) return;
    check(step);
    if (e.target.type !== 'radio' || Date.now() - pointer >= 1500) return;
    clearTimeout(advance);
    advance = setTimeout(() => step === steps[at] && forward(), 220);
  });
  // A shown error goes away as soon as the answer is good. Only while typing, so the layout never
  // moves under a click on the button.
  form.addEventListener('input', (e) => {
    const step = e.target.closest('fieldset.q');
    if (step === steps[at] && step.querySelector('.q-error').textContent && !problem(step)) check(step);
  });
  // The answer bubbles of earlier questions lead back to them.
  form.addEventListener('click', (e) => {
    const bubble = e.target.closest('.q.done .bubble.me');
    if (bubble) show(steps.indexOf(bubble.closest('.q')), true);
  });

  // The answers as text, for the email and WhatsApp fallbacks.
  const summary = () =>
    steps
      .filter((s) => s.dataset.key !== 'consentimiento')
      .map((s) => `${s.dataset.label}: ${answer(s)}`)
      .join('\n');

  function fallback(why, quiet) {
    const text = summary();
    fail.querySelector('.fail-why').textContent = why;
    fail.querySelector('.fail-mail').href = `mailto:${S.email}?subject=${encodeURIComponent(S.mailSubject)}&body=${encodeURIComponent(`${text}\n`)}`;
    fail.querySelector('.fail-wa').href = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(`${S.mailSubject}\n\n${text}`)}`;
    finish(fail, quiet);
  }

  // Shows the result and, unless `quiet`, moves the focus to it, which scrolls it into view.
  function finish(panel, quiet) {
    form.hidden = true;
    panel.hidden = false;
    root.style.setProperty('--progress', '1');
    if (!quiet) panel.focus();
  }

  async function send() {
    const data = Object.fromEntries(steps.map((s) => [s.dataset.key, value(s)]));
    const body = {
      nombre: data.nombre,
      contacto: data.contacto,
      empresa: data.empresa,
      idea: data.idea,
      tipo: data.tipo,
      plazo: data.plazo,
      presupuesto: data.presupuesto,
      idioma: document.documentElement.lang === 'en' ? 'en' : 'es',
      nda: data.nda === 'si',
      consentimiento: data.consentimiento === true,
      sitio: form.elements.sitio.value,
    };

    notice();
    inPanel = Boolean(sheet?.open);
    next.disabled = true;
    back.disabled = true;
    next.textContent = S.sending;
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 15000);
    let status = 0;
    try {
      const res = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: timeout.signal,
      });
      status = res.status;
    } catch {
      status = 0;
    } finally {
      clearTimeout(timer);
      next.disabled = false;
      back.disabled = false;
      next.textContent = S.send;
    }
    // The floating panel was closed while this was on its way: the visitor is elsewhere, so the
    // page and the focus stay put, and a notice by the floating button says how it went. Opening
    // the panel again shows the result.
    const quiet = inPanel && !sheet.open;
    const ok = status >= 200 && status < 300;
    if (ok) {
      const title = done.querySelector('.thanks-title');
      title.textContent = title.dataset.template.replace('{nombre}', body.nombre.split(/\s+/)[0]);
      finish(done, quiet);
    } else if (status === 400) fallback(S.fail.datos, quiet);
    else if (status === 429) fallback(S.fail.limite, quiet);
    else fallback(S.fail.red, quiet);
    if (quiet) notice(ok ? S.notice.sent : S.notice.failed, !ok);
  }

  // After a failed send: back to the last question, sending again with the same answers.
  fail.querySelector('.fail-retry').addEventListener('click', () => {
    fail.hidden = true;
    form.hidden = false;
    show(at, true);
    send();
  });

  show(0, false);

  // The floating launcher: a round button in the corner of every page that opens this chat in a
  // panel (a modal dialog, so the rest of the page is inert, Tab stays inside and Esc closes it).
  // On a page with the chat in its contact section, the panel borrows that same chat, answers
  // and all, and gives it back on close. The button steps aside while the chat is open, while the
  // contact section is on screen and while a button or store badge of the page passes under it.
  // It also waits for the first scroll: on the first screen the page speaks for itself, so the
  // button shows once the visitor has scrolled a little (at once on a page too short to scroll).
  // It never pops up a message over the content.
  // If a send ends after the panel was closed, a short notice by the button says so: sent (it goes
  // away by itself) or not sent (it stays, with a dot on the button, until the panel is opened).
  const sheet = document.getElementById('chat-sheet');
  const float = document.querySelector('.chat-float');
  if (!sheet || !float || !sheet.showModal) return;
  const fab = float.querySelector('.chat-fab');
  const note = float.querySelector('.chat-note');
  const slot = sheet.querySelector('.chat-slot');
  const inline = !slot.contains(root);
  const section = inline ? root.closest('section') || root.parentElement : null;
  let pressed = false;
  let spacer = null;
  let noteTimer = 0;
  let frame = 0;

  const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const covers = () => {
    const r = fab.getBoundingClientRect();
    if (!r.width) return false;
    const zone = { left: r.left - 8, right: r.right + 8, top: r.top - 8, bottom: r.bottom + 8 };
    return [...document.querySelectorAll('main :is(.btn, .store)')].some((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && overlaps(zone, b);
    });
  };
  const contactShown = () => {
    if (!section) return false;
    const r = section.getBoundingClientRect();
    return r.top < innerHeight * 0.75 && r.bottom > innerHeight * 0.25;
  };

  // Still on the first screen: less than a third of a screen scrolled, on a page that can scroll
  // that far, and the chat not opened yet. Once past it, the button stays for the rest of the page.
  let started = false;
  const early = () => {
    started ||= sheet.open || scrollY >= Math.min(innerHeight / 3, document.documentElement.scrollHeight - innerHeight - 1);
    return !started;
  };

  // Shows or hides the button for where the page is now.
  function update() {
    frame = 0;
    float.hidden = false;
    const away = sheet.open || contactShown();
    float.classList.toggle('is-away', away);
    float.classList.toggle('is-early', !away && early());
    float.classList.toggle('is-tucked', !away && covers());
  }
  const schedule = () => frame || (frame = requestAnimationFrame(update));

  notice = (text, failed = false) => {
    clearTimeout(noteTimer);
    note.replaceChildren();
    fab.classList.toggle('has-alert', failed);
    if (!text) return;
    const item = el(failed ? 'button' : 'p', failed ? 'chat-note-open' : 'chat-toast', text);
    if (failed) {
      item.type = 'button';
      item.addEventListener('click', open);
    } else noteTimer = setTimeout(notice, 6000);
    note.append(item);
  };

  function open() {
    inPanel = true;
    notice();
    if (inline) {
      spacer = el('div', 'chat-spacer');
      spacer.style.height = `${root.offsetHeight}px`;
      root.replaceWith(spacer);
      slot.append(root);
    }
    sheet.showModal();
    fab.setAttribute('aria-expanded', 'true');
    update();
    if (!form.hidden) show(at, true);
    else (done.hidden ? fail : done).focus();
  }

  sheet.addEventListener('close', () => {
    if (spacer) {
      spacer.replaceWith(root);
      spacer = null;
    }
    fab.setAttribute('aria-expanded', 'false');
    update();
    if (!float.matches('.is-away, .is-early, .is-tucked')) fab.focus({ preventScroll: true });
  });
  // The modal dialog makes the page inert, but Tab can still leave it for the browser's own
  // controls; wrap it from the last control to the first and back instead.
  sheet.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const stops = [...sheet.querySelectorAll('a[href], button, input, textarea')].filter((n) => !n.disabled && n.tabIndex >= 0 && n.getClientRects().length);
    const first = stops[0];
    const last = stops.at(-1);
    const now = document.activeElement;
    if (e.shiftKey ? now === first || !sheet.contains(now) : now === last || !sheet.contains(now)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  });
  // A click on the dimmed page around the panel closes it: pressed and released there, so a drag
  // that starts or ends in the panel (selecting the text of an answer) does not.
  sheet.addEventListener('pointerdown', (e) => (pressed = e.target === sheet));
  sheet.addEventListener('pointerup', (e) => (pressed &&= e.target === sheet));
  sheet.addEventListener('click', (e) => e.target === sheet && pressed && sheet.close());
  sheet.querySelector('.chat-close').addEventListener('click', () => sheet.close());
  fab.addEventListener('click', open);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
})();
