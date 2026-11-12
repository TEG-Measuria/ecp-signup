// Eyecare Plan tablet sign-up: router, state, timers and actions. No framework, no build step.
// Patient data lives ONLY in this module's memory (S.pt). localStorage holds: session token + expiry, device id, practice letter.
import { call, MOCK } from './api.js';
import { MS_CLIENT_ID, MS_TENANT_ID } from './config.js';
import * as V from './views.js';

const Q = new URLSearchParams(location.search);
const FAST = MOCK && Q.get('fast') === '1'; // mock only: shortens the idle timers so every timeout screen is reachable quickly
const T = { idle: FAST ? 8000 : 120000, idleLong: FAST ? 12000 : 180000, ask: FAST ? 8 : 30, mgr: FAST ? 20000 : 15 * 60000 };
const MS_SIM = MOCK ? Q.get('ms') : null; // mock only: ?ms=mock (succeed) or ?ms=deny (403)

// ---- localStorage (wrapped: can be unavailable)
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
const rand = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
let device = ls.get('ecp_device');
if (!device) { device = rand(); ls.set('ecp_device', device); }
let pcode = (Q.get('p') || ls.get('ecp_p') || 'cg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || 'cg';
ls.set('ecp_p', pcode);

const blankPt = () => ({ optix: '', staffId: '', staffName: '', plan: '', name: '', u16: false, parent: '', addr1: '', town: '', postcode: '', mobile: '', email: '', email2: '', no_email: false, ticked: false, tickedAt: null, sigMethod: 'draw', strokes: [], typed: '', termsAt: null, prevRef: null });
const S = {
  route: '', q: {}, land: false, busy: false, brand: null, practice: null, staff: [], terms: null,
  session: null, expires: 0, mgr: null, msUnset: MS_CLIENT_ID.startsWith('__') && !MS_SIM,
  pt: blankPt(), result: null, fam: null, idem: null, idemSig: '', staffUnlocked: false,
  ui: {}, stash: null, stopFrom: null, p6: null, lastTap: Date.now(), flash: null, padAspect: 0.3,
};
const app = document.getElementById('app');
const mq = window.matchMedia('(orientation: landscape) and (min-width: 900px)');
const PATIENT = new Set(['p0', 'p0b', 'p1', 'p2', 'p3', 'p4', 'p5']);

// ---------------------------------------------------------------- API wrapper
async function api(route, body, kind = 'tablet') {
  const token = kind === 'manager' ? (S.mgr && S.mgr.token) : S.session;
  try {
    return await call(route, body, token);
  } catch (e) {
    if (e.status === 401 && e.code !== 'bad_code') { e.handled = true; if (kind === 'manager') mgrOut(); else logout('Please sign in again.'); }
    throw e;
  }
}
function setSession(r) {
  S.session = r.session; S.expires = Date.parse(r.expires_at) || 0;
  S.practice = r.practice; S.staff = r.staff || []; S.terms = r.terms || S.terms;
  ls.set('ecp_session', r.session); ls.set('ecp_exp', String(S.expires));
}
function wipePatient() {
  S.pt = blankPt(); S.result = null; S.fam = null; S.idem = null; S.idemSig = ''; S.staffUnlocked = false; S.stash = null; S.stopFrom = null;
}
function logout(msg) {
  S.session = null; S.expires = 0; S.staff = []; ls.del('ecp_session'); ls.del('ecp_exp');
  wipePatient(); S.flash = msg || null; go('s1');
}
function mgrOut() { S.mgr = null; if (S.route === 'm1' || S.route === 'm2') go('s1'); }

// ---------------------------------------------------------------- router
function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  const [route, qs] = h.split('?');
  const q = {};
  new URLSearchParams(qs || '').forEach((v, k) => { q[k] = v; });
  return { route: route || '', q };
}
let keep = false;
export function go(route, opts = {}) {
  keep = !!opts.keep;
  const h = `#/${route}`;
  if (location.hash === h) onRoute(); else location.hash = h;
}
window.addEventListener('hashchange', () => onRoute());

function initUi(route, q) {
  switch (route) {
    case 's1': { const u = { pin: '', stop: 'stop' in q }; if (S.flash) { u.msg = S.flash; S.flash = null; } return u; }
    case 's2': return { optix: '', staffId: S.fam ? S.fam.staffId : '' };
    case 'm1': return { month: monthKey(new Date()), view: S.mgr && S.mgr.scope === 'group' ? 'group' : 'practice', pin: '' }; // a group sign-in always lands on the group summary
    case 'm2': return { q: '' };
    default: return {};
  }
}
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

async function onRoute() {
  let { route, q } = parseHash();
  if (!route) { route = S.session ? 's2' : 's1'; history.replaceState(null, '', `#/${route}`); }
  if (!VIEWS[route]) { route = 's1'; history.replaceState(null, '', '#/s1'); }
  if (MOCK) { await seedMock(route, q); mockUi(route, q); if ((route === 'm1' || route === 'm2') && q.as && !S.mgr) { const r = await call('manager-login', { code: q.as === 'group' ? '999999' : '654321', device }); S.mgr = { token: r.session, scope: r.scope, practice: r.practice || null, label: r.label }; S.lastTap = Date.now(); } }
  // guards
  const needSession = PATIENT.has(route) || route === 's2' || route === 's3';
  if (needSession && !S.session) { history.replaceState(null, '', '#/s1'); route = 's1'; q = {}; }
  else if (route === 'p2' || route === 'p3') { if (!S.pt.plan) { history.replaceState(null, '', '#/p1'); route = 'p1'; } }
  else if (route === 'p4') { if (!S.pt.plan) { history.replaceState(null, '', '#/p1'); route = 'p1'; } else if (!S.pt.addr1) { history.replaceState(null, '', '#/p3'); route = 'p3'; } }
  else if (route === 'p5' && !S.result) { history.replaceState(null, '', '#/s2'); route = 's2'; }
  else if (route === 'm2' && !S.mgr) { history.replaceState(null, '', '#/m1'); route = 'm1'; }
  if (route === 'p6' && !S.p6) S.p6 = { kind: 'half' };
  if (route === 'p6' && q.k) S.p6 = { kind: { ask: 'ask', half: 'half', emailed: 'emailed', noemail: 'noemail', stopped: 'stopped' }[q.k] || 'half', askAt: Date.now(), from: 'p0' };
  if (PATIENT.has(route) && route !== 'p5') S.staffUnlocked = false;
  S.route = route; S.q = q;
  if (!keep) S.ui = initUi(route, q);
  keep = false;
  if (route === 'p4') enterP4();
  if (MOCK) mockUi(route, q);
  render({ focusH1: true });
  enter(route);
}

async function enter(route) {
  try {
    if (route === 's2' && S.session) {
      const r = await api('practice', {});
      S.staff = r.staff || S.staff; S.practice = r.practice || S.practice; S.terms = r.terms || S.terms;
      if (S.route === 's2') { if (S.ui.staffId && !S.staff.some((x) => x.id === S.ui.staffId)) S.ui.staffId = ''; render(); }
    } else if (route === 's3') { await loadToday(); if (MOCK && S.q.v === 'fix') { S.ui.fix = { ref: S.ui.rows[1].ref, email: '', email2: '' }; render(); } if (MOCK && S.q.v === 'void') { S.ui.void = { ref: S.ui.rows[0].ref, reason: '' }; render(); } if (MOCK && S.q.v === 'resent') { await ACT.rowact(S.ui.rows[0].ref); } }
    else if (route === 'm1' && S.mgr) { if (MOCK && S.q.v === 'empty') S.ui.month = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 4, 1)); if (MOCK && S.q.v === 'paid') S.ui.month = monthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)); await loadM1(); }
    else if (route === 'm2' && S.mgr && MOCK && S.q.v) { S.ui.q = { none: 'Zzzzz', results: '10231', error: 'Jane Sample', sent: '10231' }[S.q.v] || ''; await ACT.search(); if (S.q.v === 'sent') { await ACT.sendcopy(S.ui.rows[0].ref); await ACT.sendgo(); } }
  } catch (e) { if (!e.handled && S.route === route) { S.ui.error = e.message; render(); } }
}

// ---------------------------------------------------------------- render
const VIEWS = { s1: V.s1, s2: V.s2, p0: V.p0, p0b: V.p0b, p1: V.p1, p2: V.p2, p3: V.p3, p4: V.p4, p5: V.p5, p6: V.p6, s3: V.s3, m1: V.m1, m2: V.m2 };
function render(o = {}) {
  if (!VIEWS[S.route]) return;
  if (!S.practice && !S.brand) { app.innerHTML = '<div id="boot">Loading…</div>'; }
  S.land = mq.matches;
  const ae = document.activeElement;
  const had = ae && ae.id && app.contains(ae) ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
  const sy = window.scrollY;
  document.title = 'Eyecare Plan sign-up';
  app.innerHTML = VIEWS[S.route](S);
  if (S.route === 'p4') initPad();
  if (o.focusId) { const el = document.getElementById(o.focusId); if (el) el.focus(); }
  else if (o.focusH1) { const h = app.querySelector('h1'); if (h) h.focus({ preventScroll: false }); window.scrollTo(0, 0); }
  else if (had) {
    const el = document.getElementById(had.id);
    if (el) { el.focus({ preventScroll: true }); try { if (had.s != null) el.setSelectionRange(had.s, had.e); } catch (e) { /* not a text input */ } }
    window.scrollTo(0, sy);
  } else window.scrollTo(0, sy);
}
mq.addEventListener('change', () => render());
window.addEventListener('resize', () => { if (S.route === 'p4') { clearTimeout(window.__rz); window.__rz = setTimeout(() => render(), 200); } });
const firstErrId = (ids) => ids.find((id) => document.getElementById(id));

// ---------------------------------------------------------------- inactivity / session timers
function touch() { S.lastTap = Date.now(); }
['pointerdown', 'keydown', 'input', 'touchstart'].forEach((ev) => document.addEventListener(ev, touch, { passive: true, capture: true }));

function startAsk() {
  const from = S.route === 's1' ? S.stopFrom || 'p0' : S.route;
  if (S.route === 's1') S.ui = S.stash || {};
  else S.stash = S.ui;
  S.stash = S.ui;
  S.p6 = { kind: 'ask', from, askAt: Date.now(), left: T.ask };
  go('p6', { keep: true });
}
function clearScreen() {
  const signed = !!S.result;
  const kind = signed ? (S.result.patient_copy === 'sent' ? 'emailed' : 'noemail') : 'half';
  wipePatient();
  S.p6 = { kind };
  go('p6');
}
setInterval(() => {
  const now = Date.now();
  if (S.session && S.expires && now > S.expires) { logout('Your sign-in ended at 8pm. Please sign in again.'); return; }
  const r = S.route;
  if ((r === 'm1' || r === 'm2') && S.mgr && now - S.lastTap > T.mgr) { api('sign-out', {}, 'manager').catch(() => {}); S.mgr = null; go('s1'); return; }
  const inStop = r === 's1' && S.ui.stop && S.stopFrom;
  if (PATIENT.has(r) || inStop) {
    const base = inStop ? S.stopFrom : r;
    const long = base === 'p4' || (base === 'p2' && ((inStop ? S.stash : S.ui) || {}).terms);
    if (now - S.lastTap > (long ? T.idleLong : T.idle)) startAsk();
  } else if (r === 'p6' && S.p6 && S.p6.kind === 'ask') {
    const left = Math.ceil(T.ask - (now - S.p6.askAt) / 1000);
    if (left <= 0) { clearScreen(); return; }
    const el = document.getElementById('countdown');
    if (el && el.textContent !== String(left)) el.textContent = left;
  }
}, 400);

// ---------------------------------------------------------------- signature pad
const INK = '#2C3639';
function drawStrokes(ctx, strokes, W, H, lw) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = lw;
  strokes.forEach((s) => {
    if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0] * W, s[0][1] * H, lw / 2, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.beginPath(); ctx.moveTo(s[0][0] * W, s[0][1] * H);
    for (let i = 1; i < s.length; i += 1) ctx.lineTo(s[i][0] * W, s[i][1] * H);
    ctx.stroke();
  });
}
function initPad() {
  const c = document.getElementById('sigpad');
  if (!c) return;
  const r = c.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.max(1, Math.round(r.width * dpr)); c.height = Math.max(1, Math.round(r.height * dpr));
  if (r.width) S.padAspect = r.height / r.width;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  drawStrokes(ctx, S.pt.strokes, r.width, r.height, 2.5);
  let cur = null;
  const pt = (e) => { const b = c.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), Math.min(1, Math.max(0, (e.clientY - b.top) / b.height))]; };
  c.addEventListener('pointerdown', (e) => {
    if (S.busy) return;
    e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    cur = [pt(e)]; S.pt.strokes.push(cur); S.ui.noSig = false;
    const b = c.getBoundingClientRect(); drawStrokes(ctx, [cur], b.width, b.height, 2.5);
    const err = document.getElementById('sigerr'); if (err) err.remove();
  });
  c.addEventListener('pointermove', (e) => {
    if (!cur) return; e.preventDefault();
    const p = pt(e), last = cur[cur.length - 1]; cur.push(p);
    const b = c.getBoundingClientRect(); drawStrokes(ctx, [[last, p]], b.width, b.height, 2.5);
  });
  const end = () => { cur = null; };
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end); c.addEventListener('pointerleave', () => {});
}
const hasInk = (strokes) => strokes.reduce((n, s) => n + s.length, 0) >= 4 || strokes.length >= 2;
function padPng() {
  const W = 600, H = Math.max(120, Math.round(W * (S.padAspect || 0.3)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  drawStrokes(c.getContext('2d'), S.pt.strokes, W, H, 3);
  return c.toDataURL('image/png');
}

// ---------------------------------------------------------------- P4 helpers
function payload(forSig) {
  const P = S.pt, typed = P.sigMethod === 'type';
  const o = {
    optix: P.optix, staff_id: P.staffId, plan: P.plan, name: P.name.trim(), u16: !!P.u16, parent: P.u16 ? P.parent.trim() : '',
    addr1: P.addr1.trim(), town: P.town.trim(), postcode: P.postcode.trim().toUpperCase(), mobile: P.mobile.trim(),
    email: P.no_email ? '' : P.email.trim(), email2: P.no_email ? '' : P.email2.trim(), no_email: !!P.no_email,
    sig_method: P.sigMethod, sig_typed: typed ? P.typed.trim() : '', terms_version_id: S.terms ? S.terms.id : null,
    terms_accepted_at: P.termsAt, ticked_at: P.tickedAt, prev_ref: P.prevRef || null,
  };
  if (forSig) return JSON.stringify(o);
  o.sig_png = typed ? '' : padPng();
  return o;
}
function enterP4() {
  const sig = payload(true);
  if (!S.idem || S.idemSig !== sig) { S.idem = rand(); S.idemSig = sig; }
}

// ---------------------------------------------------------------- validation (format only)
const UKPC = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export function normPhone(v) {
  let s = String(v || '').replace(/[\s\-().]/g, '');
  if (s.startsWith('+44')) s = `0${s.slice(3)}`; else if (s.startsWith('0044')) s = `0${s.slice(4)}`;
  return s;
}
export function phoneOk(v) {
  const s = normPhone(v);
  return /^07\d{9}$/.test(s) || /^0(1\d{8,9}|2\d{9}|3\d{9})$/.test(s);
}
function validateP3(P) {
  const e = {};
  if (P.name.trim().length < 2) e.name = 'Please enter the patient’s full name.';
  if (P.u16 && P.parent.trim().length < 2) e.parent = 'Please enter the parent or guardian’s full name.';
  if (!P.addr1.trim()) e.addr1 = 'Please enter the home address.';
  if (!P.town.trim()) e.town = 'Please enter the town.';
  if (!UKPC.test(P.postcode.trim())) e.postcode = 'Please check the postcode. It looks like LE11 2PY.';
  if (!phoneOk(P.mobile)) e.mobile = 'Please check the number. A mobile is 11 digits starting 07; a landline starts 01, 02 or 03.';
  if (!P.no_email) {
    if (!EMAIL.test(P.email.trim())) e.email = 'Please check the email address.';
    if (P.email.trim().toLowerCase() !== P.email2.trim().toLowerCase()) e.email2 = 'The two emails are different. Please check both.';
  }
  return e;
}
const P3_IDS = { name: 'nm', parent: 'pg', addr1: 'ad1', town: 'ad2', postcode: 'pc', mobile: 'mob', email: 'em', email2: 'em2' };

// ---------------------------------------------------------------- data loaders
async function loadToday() {
  const r = await api('today', {});
  if (S.route === 's3') { S.ui.rows = r.rows; render(); }
}
async function loadM1(focus) {
  const u = S.ui;
  const group = u.view === 'group';
  const d = group ? await api('group', { month: u.month }, 'manager') : await api('by-staff', { month: u.month, practice: u.practiceCode }, 'manager');
  if (S.route !== 'm1') return;
  u.data = d;
  if (MOCK && !u.mockDone && S.q.v) {
    u.mockDone = true;
    if (S.q.v === 'change' || S.q.v === 'paid') ACT.changeopen(d.each[1].ref);
    if (S.q.v === 'list') ACT.stafflist();
    if (S.q.v === 'done') { u.done = 'Taylor S. now counts for Dillon R. Change recorded.'; }
  }
  render(focus ? { focusId: focus } : {});
}
function downloadCsv(name, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function openUrl(promise) { // open a new window straight away (popup blockers), then point it at the signed link
  const w = window.open('', '_blank');
  try {
    const r = await promise;
    if (w) { w.location.href = r.url; } else window.open(r.url, '_blank');
  } catch (e) { if (w) w.close(); throw e; }
}
const setBusy = (b) => { S.busy = b; };

// ---------------------------------------------------------------- actions
const ACT = {
  // ---- S1
  async login() {
    const u = S.ui; u.bad = false; u.msg = '';
    if (!u.pin) { u.bad = true; render({ focusId: 'pin' }); return; }
    setBusy(true);
    try {
      const r = await call('tablet-login', { code: u.pin, device });
      setBusy(false); setSession(r); u.pin = ''; go('s2');
    } catch (e) {
      setBusy(false); u.pin = '';
      if (e.code === 'locked') { u.locked = true; u.msg = e.message; setTimeout(() => { if (S.route === 's1') { S.ui.locked = false; S.ui.msg = ''; render(); } }, (e.body.retry_after_s || 300) * 1000); }
      else if (e.code === 'bad_code') u.bad = true; else if (e.code === 'closed') { u.bad = true; u.msg = e.message; } else u.msg = e.message;
      render({ focusId: 'pin' });
    }
  },
  stop() { S.stopFrom = S.route; S.stash = S.ui; keep = false; },
  async stopgo() {
    const u = S.ui; u.bad = false; u.msg = '';
    if (!u.pin) { u.bad = true; render({ focusId: 'pin' }); return; }
    setBusy(true);
    try { await api('verify-code', { code: u.pin }); setBusy(false); wipePatient(); S.p6 = { kind: 'stopped' }; go('p6'); }
    catch (e) {
      setBusy(false); u.pin = '';
      if (e.handled) return;
      if (e.code === 'locked') { u.locked = true; u.msg = e.message; } else if (e.code === 'bad_code') u.bad = true; else u.msg = e.message;
      render({ focusId: 'pin' });
    }
  },
  stopback() { S.ui = S.stash || {}; const back = S.stopFrom || 'p0'; S.stopFrom = null; go(back, { keep: true }); },
  signout() { const wasS = S.session; if (wasS) api('sign-out', {}).catch(() => {}); S.session = null; ls.del('ecp_session'); ls.del('ecp_exp'); wipePatient(); S.staff = []; },
  // ---- S2
  handover() {
    const u = S.ui;
    if (!S.staff.length) return;
    const optix = (u.optix || '').trim();
    u.badId = !/^\d+$/.test(optix); u.noName = !u.staffId;
    if (u.badId || u.noName) { render({ focusId: u.badId ? 'optix' : null }); return; }
    const st = S.staff.find((x) => x.id === u.staffId);
    const fam = S.fam;
    S.pt = blankPt(); S.result = null; S.idem = null; S.staffUnlocked = false;
    Object.assign(S.pt, { optix, staffId: u.staffId, staffName: st ? st.name : '' });
    S.stopFrom = null;
    if (fam) {
      Object.assign(S.pt, { plan: fam.plan, email: fam.email, email2: fam.email2, no_email: fam.no_email, prevRef: fam.prevRef, termsAt: fam.termsAt });
      S.fam = null; go('p3');
    } else go('p0');
  },
  // ---- P0b / P1 / P2 / P3
  choosetier(code) { S.pt.plan = code; go('p1'); },
  p1go() { if (!S.pt.plan) { S.ui.none = true; render(); return; } go('p2'); },
  terms(arg) { S.ui.terms = arg === 'open'; render({ focusId: null }); touch(); },
  p2go() { S.pt.termsAt = new Date().toISOString(); go('p3'); },
  noemail(arg) { const P = S.pt; P.no_email = arg === 'on'; if (P.no_email) { P.email = ''; P.email2 = ''; } if (S.ui.errs) { delete S.ui.errs.email; delete S.ui.errs.email2; } render(); },
  p3go() {
    const P = S.pt;
    ['name', 'parent', 'addr1', 'town', 'postcode', 'mobile', 'email', 'email2'].forEach((k) => { P[k] = P[k].trim(); });
    const e = validateP3(P);
    S.ui.errs = Object.keys(e).length ? e : null;
    if (S.ui.errs) { const order = Object.keys(P3_IDS).filter((k) => e[k]); render(); const el = document.getElementById(P3_IDS[order[0]]); if (el) el.focus(); return; }
    go('p4');
  },
  // ---- P4
  sigtab(arg) { S.pt.sigMethod = arg; S.ui.noSig = false; render({ focusId: arg === 'type' ? 'tn' : null }); },
  sigclear() { S.pt.strokes = []; render(); },
  async p4go() {
    const P = S.pt, u = S.ui;
    u.noTick = !P.ticked;
    u.noSig = P.sigMethod === 'type' ? P.typed.trim().length < 2 : !hasInk(P.strokes);
    if (u.noTick || u.noSig) { render(); if (u.noTick) { const el = document.querySelector('.check input'); if (el) el.focus(); } return; }
    u.failed = false; setBusy(true); render();
    try {
      const res = await api('submit', { idempotency_key: S.idem, ...payload(false) });
      setBusy(false); S.result = res; S.staffUnlocked = false; S.stash = null; go('p5');
    } catch (e) {
      setBusy(false);
      if (e.handled) return;
      u.failed = true; u.failMsg = e.code === 'invalid' || e.code === 'server' || e.code === 'network' ? e.message : ''; render();
    }
  },
  // ---- P5
  staffask() { S.ui.askCode = true; S.ui.pin = ''; S.ui.perr = ''; render({ focusId: 'pin' }); },
  staffcancel() { S.ui.askCode = false; render(); },
  async staffgo() {
    const u = S.ui; u.perr = '';
    if (!u.pin) { u.perr = 'Enter the practice code.'; render({ focusId: 'pin' }); return; }
    setBusy(true);
    try { await api('verify-code', { code: u.pin }); setBusy(false); S.staffUnlocked = true; u.askCode = false; u.pin = ''; render({ focusH1: true }); }
    catch (e) { setBusy(false); u.pin = ''; if (e.handled) return; u.perr = e.message; render({ focusId: 'pin' }); }
  },
  async p5retry() {
    const u = S.ui; u.perr = ''; setBusy(true);
    try {
      const r = await api('resend', { ref: S.result.ref });
      setBusy(false); S.result.patient_copy = 'sent'; S.result.masked_email = r.masked_email; u.note = `Sent again to ${r.masked_email} at ${r.at}.`; render();
    } catch (e) { setBusy(false); if (e.handled) return; u.perr = e.message; render(); }
  },
  async p5print() { try { await openUrl(api('pdf', { ref: S.result.ref })); S.ui.note = 'Opened the signed copy to print.'; S.ui.perr = ''; } catch (e) { if (!e.handled) S.ui.perr = e.message; } render(); },
  next() { wipePatient(); go('s2'); },
  family() {
    // To S2 first (the board asks for the Optix ID only there). S2's Hand to patient then goes straight to P3, keeping staff name, plan, email, terms-accepted time and prev_ref.
    const P = S.pt, r = S.result;
    const fam = { plan: P.plan, email: P.email, email2: P.email2, no_email: P.no_email, prevRef: r.ref, termsAt: P.termsAt, staffId: P.staffId };
    wipePatient(); S.fam = fam; go('s2');
  },
  // ---- P6
  carryon() {
    const from = S.p6.from || 'p0';
    S.ui = S.stash || {}; S.stash = null; S.p6 = null; S.lastTap = Date.now();
    go(from, { keep: true });
  },
  startagain() { wipePatient(); S.p6 = null; },
  // ---- S3
  async rowact(ref) {
    const row = S.ui.rows.find((x) => x.ref === ref); if (!row) return;
    const u = S.ui; u.done = ''; u.error = '';
    try {
      if (row.action === 'Correct email') { u.fix = { ref, email: '', email2: '' }; render({ focusId: 'ne' }); return; }
      if (row.action === 'Print again') { await openUrl(api('pdf', { ref })); u.done = 'Opened the signed copy to print.'; }
      else if (row.action === 'Check again') { const r = await api('check', { ref }); u.done = `Checked: the patient copy is now ${r.copy}.`; }
      else { const r = await api('resend', { ref }); u.done = `Sent again to ${r.masked_email} at ${r.at}.`; }
      await loadToday();
    } catch (e) { if (!e.handled) { u.error = e.message; render(); } }
  },
  async fixsend() {
    const f = S.ui.fix; f.errs = {};
    if (!EMAIL.test((f.email || '').trim())) f.errs.email = 'Please check the email address.';
    else if ((f.email || '').trim().toLowerCase() !== (f.email2 || '').trim().toLowerCase()) f.errs.email2 = 'The two emails are different. Please check both.';
    if (Object.keys(f.errs).length) { render({ focusId: f.errs.email ? 'ne' : 'ne2' }); return; }
    setBusy(true);
    try { const r = await api('correct-email', { ref: f.ref, email: f.email.trim(), email2: f.email2.trim() }); setBusy(false); S.ui.fix = null; S.ui.done = `Sent to ${r.masked_email} at ${r.at}.`; await loadToday(); }
    catch (e) { setBusy(false); if (!e.handled) { f.errs = { email2: e.message }; render({ focusId: 'ne2' }); } }
  },
  voidopen(ref) { S.ui.void = { ref, reason: '' }; render({ focusId: 'why' }); },
  async voidgo() {
    const v = S.ui.void;
    if (!(v.reason || '').trim()) { v.err = 'Please give a reason.'; render({ focusId: 'why' }); return; }
    setBusy(true);
    try {
      const r = await api('void', { ref: v.ref, reason: v.reason.trim() }); setBusy(false); S.ui.void = null;
      if (r && r.practice_told === false) { S.ui.error = r.message || 'Marked as signed in error, but the practice inbox could not be told. Please tell the practice manager.'; await loadToday(); } else go('s2');
    }
    catch (e) { setBusy(false); if (!e.handled) { v.err = e.message; render({ focusId: 'why' }); } }
  },
  modalcancel() { const u = S.ui; u.fix = null; u.void = null; u.change = null; u.confirm = null; render(); },
  // ---- Manager
  async mcodego() {
    const u = S.ui; u.bad = false; u.msg = '';
    if (!u.pin) { u.bad = true; render({ focusId: 'mpin' }); return; }
    setBusy(true);
    try { const r = await call('manager-login', { code: u.pin, device }); setBusy(false); await mgrIn(r); }
    catch (e) { setBusy(false); u.pin = ''; u.bad = true; u.msg = e.code === 'locked' ? e.message : e.code === 'bad_code' ? '' : e.message; render({ focusId: 'mpin' }); }
  },
  async msgo() {
    if (MS_SIM) {
      setBusy(true);
      try { const r = await call('m365-login', { id_token: MS_SIM === 'deny' ? 'mock-deny' : 'mock-id-token', nonce: rand().replace(/-/g, '') }); setBusy(false); await mgrIn(r); }
      catch (e) { setBusy(false); S.ui.msErr = e.message; render(); }
      return;
    }
    const nonce = rand().replace(/-/g, ''), state = rand().replace(/-/g, '');
    try { sessionStorage.setItem('ecp_ms', JSON.stringify({ nonce, state })); } catch (e) { S.ui.msErr = 'This browser blocked sign-in. Use the manager code.'; render(); return; }
    const p = new URLSearchParams({ client_id: MS_CLIENT_ID, response_type: 'id_token', response_mode: 'fragment', scope: 'openid profile email', redirect_uri: location.origin + location.pathname, nonce, state, prompt: 'select_account' });
    location.assign(`https://login.microsoftonline.com/${encodeURIComponent(MS_TENANT_ID)}/oauth2/v2.0/authorize?${p}`);
  },
  mgrout() { api('sign-out', {}, 'manager').catch(() => {}); S.mgr = null; },
  async month(arg) {
    const u = S.ui;
    const [y, m] = u.month.split('-').map(Number);
    u.month = monthKey(new Date(y, m - 1 + Number(arg), 1)); u.done = ''; u.error = ''; u.change = null; u.list = null;
    try { await loadM1(); } catch (e) { if (!e.handled) { u.error = e.message; render(); } }
  },
  async openpractice(arg) {
    const [code, name] = arg.split('|'); const u = S.ui; u.view = 'practice'; u.practiceCode = code; u.practiceName = name; u.data = null; u.done = '';
    render(); try { await loadM1(); } catch (e) { if (!e.handled) { u.error = e.message; render(); } }
  },
  async allpractices() { const u = S.ui; u.view = 'group'; u.practiceCode = undefined; u.data = null; u.done = ''; render(); try { await loadM1(); } catch (e) { if (!e.handled) { u.error = e.message; render(); } } },
  async download(arg) {
    const u = S.ui; u.error = ''; u.done = '';
    try { const r = await api('download', { month: u.month, practice: arg === 'all' ? 'all' : u.practiceCode }, 'manager'); downloadCsv(r.filename, r.csv); u.done = `Downloaded ${r.filename}.`; render(); }
    catch (e) { if (!e.handled) { u.error = e.message; render(); } }
  },
  changeopen(ref) {
    const e = S.ui.data.each.find((x) => x.ref === ref); const act = (S.ui.data.staff || []).filter((s) => s.active);
    const cur = act.find((s) => s.name === e.staff);
    const other = act.find((s) => !cur || s.id !== cur.id);
    S.ui.change = { ref, patient: e.patient, staff: e.staff, staffId: other ? other.id : '', reason: '' }; S.ui.done = ''; render({ focusId: 'ns' });
  },
  async changesave() {
    const c = S.ui.change;
    if (!(c.reason || '').trim()) { c.err = 'Please give a reason, so the record shows why.'; render({ focusId: 'rs' }); return; }
    setBusy(true);
    try { const r = await api('change-staff', { ref: c.ref, staff_id: c.staffId, reason: c.reason.trim() }, 'manager'); setBusy(false); S.ui.change = null; S.ui.done = r.msg; await loadM1(); }
    catch (e) { setBusy(false); if (!e.handled) { c.err = e.message; render({ focusId: 'rs' }); } }
  },
  stafflist() { S.ui.list = { name: '' }; S.ui.done = ''; render({ focusId: 'nn' }); },
  listdone() { S.ui.list = null; render(); },
  async staffadd() {
    const l = S.ui.list; l.err = '';
    if (!(l.name || '').trim()) { l.err = 'Type a first name and surname initial, for example Pam T.'; render({ focusId: 'nn' }); return; }
    setBusy(true);
    try { const r = await api('staff-add', { name: l.name.trim() }, 'manager'); setBusy(false); S.ui.data.staff = r.staff; l.name = ''; render({ focusId: 'nn' }); }
    catch (e) { setBusy(false); if (!e.handled) { l.err = e.message; render({ focusId: 'nn' }); } }
  },
  async staffhide(id) {
    try { const r = await api('staff-hide', { staff_id: id }, 'manager'); S.ui.data.staff = r.staff; await loadM1(); } catch (e) { if (!e.handled) { S.ui.list.err = e.message; render(); } }
  },
  // ---- M2
  async search() {
    const u = S.ui; u.qerr = ''; u.error = ''; u.sent = ''; u.confirm = null;
    try { const r = await api('find', { q: (u.q || '').trim() }, 'manager'); u.rows = r.rows; u.searched = (u.q || '').trim(); render(); }
    catch (e) { if (e.handled) return; if (e.code === 'invalid') { u.qerr = e.message; u.rows = null; } else u.error = e.message; render({ focusId: u.qerr ? 'q' : null }); }
  },
  async openref(ref) { try { await openUrl(api('open', { ref }, 'manager')); S.ui.confirm = null; S.ui.error = ''; } catch (e) { if (e.handled) return; S.ui.error = e.message; } render(); },
  async sendcopy(ref) {
    const u = S.ui; u.sent = ''; u.error = '';
    try { const r = await api('send-copy', { ref, confirm: false }, 'manager'); const row = u.rows.find((x) => x.ref === ref); u.confirm = { ref, patient: row ? row.patient : '', masked: r.masked_email }; render(); }
    catch (e) { if (!e.handled) { u.error = e.message; render(); } }
  },
  async sendgo() {
    const u = S.ui, c = u.confirm; setBusy(true);
    try { const r = await api('send-copy', { ref: c.ref, confirm: true }, 'manager'); setBusy(false); u.confirm = null; u.sent = `Copy sent to ${r.masked_email} at ${r.at}.`; render(); }
    catch (e) { setBusy(false); if (!e.handled) { u.confirm = null; u.error = e.message; render(); } }
  },
};

async function mgrIn(r) {
  S.mgr = { token: r.session, scope: r.scope, practice: r.practice || null, label: r.label };
  S.lastTap = Date.now();
  S.ui = initUi('m1', {}); S.ui.view = r.scope === 'group' ? 'group' : 'practice';
  S.route = 'm1'; render({ focusH1: true });
  try { await loadM1(); } catch (e) { if (!e.handled) { S.ui.error = e.message; render(); } }
}

// ---------------------------------------------------------------- events
app.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  const link = ev.target.closest('a[href]');
  if (S.busy && (el || link)) { ev.preventDefault(); return; }
  if (el) {
    const name = el.dataset.act;
    if (el.getAttribute('aria-disabled') === 'true') { ev.preventDefault(); return; }
    const fn = ACT[name];
    // links that also navigate by href (stop, signout, mgrout, startagain) keep their default; pure buttons do not
    if (!['stop', 'signout', 'mgrout', 'startagain'].includes(name)) ev.preventDefault();
    if (fn) { Promise.resolve(fn(el.dataset.arg, el)).catch((e) => console.error(e)); }
  }
});
app.addEventListener('keydown', (ev) => {
  const t = ev.target;
  if (ev.key === 'Enter' && t.dataset && t.dataset.enter && t.tagName === 'INPUT') { ev.preventDefault(); ACT[t.dataset.enter]?.(); return; }
  if (ev.key === ' ' && t.tagName === 'A' && t.getAttribute('role') === 'button') { ev.preventDefault(); t.click(); }
});
const PT_KEYS = new Set(['name', 'parent', 'addr1', 'town', 'postcode', 'mobile', 'email', 'email2', 'typed']);
function setUiPath(path, v) { const [a, b] = path.split('.'); if (b) { S.ui[a] = S.ui[a] || {}; S.ui[a][b] = v; } else S.ui[a] = v; }
app.addEventListener('input', (ev) => {
  const t = ev.target, f = t.dataset && t.dataset.f; if (!f) return;
  if (t.type === 'checkbox' || t.type === 'radio') return;
  if (PT_KEYS.has(f) && S.route !== 'm1' && S.route !== 'm2') {
    S.pt[f] = t.value;
    if (f === 'typed') { const pv = document.getElementById('typedprev'); if (pv) pv.textContent = t.value; S.ui.noSig = false; const er = document.getElementById('sigerr'); if (er) er.remove(); }
    if (S.ui.errs && S.ui.errs[f]) { delete S.ui.errs[f]; t.classList.remove('bad'); t.setAttribute('aria-invalid', 'false'); const er = document.getElementById(`${t.id}err`); if (er) er.remove(); }
    if (f === 'email' && S.ui.errs && S.ui.errs.email2) { /* leave until Continue */ }
  } else setUiPath(f, t.value);
  if (t.id === 'pin' || t.id === 'mpin') { S.ui.bad = false; }
});
app.addEventListener('change', (ev) => {
  const t = ev.target, f = t.dataset && t.dataset.f; if (!f) return;
  if (f === 'u16') { S.pt.u16 = t.checked; if (!t.checked) S.pt.parent = ''; if (S.ui.errs) delete S.ui.errs.parent; render(); }
  else if (f === 'ticked') { S.pt.ticked = t.checked; S.pt.tickedAt = t.checked ? new Date().toISOString() : null; S.ui.noTick = false; render(); }
  else if (f === 'plan') { S.pt.plan = t.value; S.ui.none = false; render(); }
  else if (f === 'who') { S.ui.staffId = t.value; S.ui.noName = false; render(); }
  else if (f === 'change.staffId') { S.ui.change.staffId = t.value; }
});

// ---------------------------------------------------------------- mock-only helpers (deep links used by STATES.md)
async function seedMock(route, q) {
  if (!['s2', 's3', 'p0', 'p0b', 'p1', 'p2', 'p3', 'p4', 'p5'].includes(route) || S.session) return;
  const r = await call('tablet-login', { code: '123456', device }); setSession(r);
}
function mockUi(route, q) {
  const P = S.pt, v = q.v || '';
  S.busy = route === 'p4' && v === 'saving';
  if (route === 's1') { if (v === 'wrong') S.ui.bad = true; if (v === 'locked') { S.ui.locked = true; S.ui.msg = 'Too many tries. Please wait 5 minutes, or ask the practice manager.'; } }
  if (route === 'm1' && v === 'wrong') { S.ui.bad = true; }
  if (route === 's2') { if (v === 'badid') { S.ui.badId = true; S.ui.optix = '12O456'; } if (v === 'noname') { S.ui.noName = true; } }
  if (route === 'p1' && v === 'none') { P.plan = ''; S.ui.none = true; }
  if (route === 'p2' && v === 'terms') S.ui.terms = true;
  if (route === 'p6' && v) { /* see q.k */ }
  if (!S.session) return;
  if (['p2', 'p3', 'p4', 'p5'].includes(route) && !P.plan) P.plan = q.plan || 'gold';
  if (q.plan && PATIENT.has(route)) P.plan = q.plan;
  if (['p3', 'p4', 'p5'].includes(route) && !P.optix && !P.prevRef) { P.optix = '10234'; P.staffId = 's2'; P.staffName = 'Dillon R.'; P.termsAt = P.termsAt || new Date().toISOString(); }
  const fill = () => Object.assign(P, { name: 'Jane Sample', addr1: '1 Example Street', town: 'Loughborough', postcode: 'LE11 2PY', mobile: '07700 900123', email: 'jane.sample@example.test', email2: 'jane.sample@example.test' });
  if (route === 'p3' && !P.addr1 && (v === 'u16' || v === 'noemail' || v === 'mismatch')) {
    fill();
    if (v === 'u16') { P.u16 = true; P.parent = 'Pat Sample'; }
    if (v === 'noemail') { P.no_email = true; P.email = ''; P.email2 = ''; }
    if (v === 'mismatch') P.email2 = 'jane.sample@exmaple.test';
  }
  if (route === 'p3' && v === 'mismatch' && P.addr1) S.ui.errs = validateP3(P); // the error shows on arrival (initUi wipes it between the two mockUi calls, so set it every time)
  if (route === 'p4') {
    const seeded = !P.addr1;
    if (!P.addr1) { fill(); if (v === 'u16') { P.u16 = true; P.parent = 'Pat Sample'; } if (v === 'noemail') { P.no_email = true; P.email = ''; P.email2 = ''; } }
    if (v === 'u16' && !P.u16) { P.u16 = true; P.parent = 'Pat Sample'; }
    if (!P.ticked && v !== 'notticked' && (seeded || v)) { P.ticked = true; P.tickedAt = new Date().toISOString(); }
    if (v === 'notticked') S.ui.noTick = true;
    if (v === 'typed') { P.sigMethod = 'type'; P.typed = 'Jane Sample'; }
    if (v === 'drawn' && !P.strokes.length) P.strokes = [[[0.08, 0.5], [0.15, 0.3], [0.22, 0.6], [0.3, 0.35], [0.38, 0.62], [0.47, 0.3], [0.58, 0.6], [0.7, 0.4], [0.85, 0.55]]];
    if (v === 'failed') S.ui.failed = true;
  }
  if (route === 'p5' && !S.result) {
    P.name = P.name || 'Jane Sample'; P.email = P.email || 'jane.sample@example.test';
    if (v === 'u16') { P.u16 = true; P.parent = 'Pat Sample'; }
    S.result = { ref: 'ECP-CG-0142', signed_at: new Date().toISOString(), masked_email: 'j•••@e•••.test', patient_copy: v === 'failed' ? 'failed' : v === 'noemail' ? 'no_email' : 'sent', practice_copy: 'sent' };
    if (v === 'noemail') P.no_email = true;
    S.staffUnlocked = ['staff', 'failed', 'noemail'].includes(v);
  }
  if (route === 'p6' && q.k === 'ask') { S.p6.left = T.ask; }
}

// ---------------------------------------------------------------- boot
async function handleMsReturn() {
  const h = location.hash;
  if (!/(^#|&)(id_token|error)=/.test(h)) return false;
  const p = new URLSearchParams(h.replace(/^#/, ''));
  history.replaceState(null, '', location.pathname + location.search + '#/m1');
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem('ecp_ms') || 'null'); sessionStorage.removeItem('ecp_ms'); } catch (e) { /* ignore */ }
  S.route = 'm1'; S.ui = initUi('m1', {});
  const fail = (m) => { S.ui.msErr = m; };
  if (p.get('error')) fail('Microsoft sign-in did not finish. Try again, or use the manager code.');
  else if (!saved || p.get('state') !== saved.state) fail('That sign-in could not be checked. Please try again.');
  else {
    try {
      const claims = JSON.parse(atob(p.get('id_token').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.nonce !== saved.nonce) fail('That sign-in could not be checked. Please try again.');
      else { const r = await call('m365-login', { id_token: p.get('id_token'), nonce: saved.nonce }); await mgrIn(r); return true; }
    } catch (e) { fail(e.message || 'Microsoft sign-in did not work. Use the manager code.'); }
  }
  return false;
}

async function boot() {
  S.land = mq.matches;
  try { const b = await call('brand', { practice: pcode }); S.brand = b.practice; S.practice = null; } catch (e) { S.brand = null; }
  const tok = ls.get('ecp_session'), exp = Number(ls.get('ecp_exp') || 0);
  if (tok && exp > Date.now()) {
    S.session = tok; S.expires = exp;
    try { const r = await call('practice', {}, tok); S.practice = r.practice; S.staff = r.staff; S.terms = r.terms; S.expires = Date.parse(r.expires_at) || exp; }
    catch (e) { S.session = null; S.expires = 0; ls.del('ecp_session'); ls.del('ecp_exp'); }
  } else { ls.del('ecp_session'); ls.del('ecp_exp'); }
  if (!S.practice) S.practice = null;
  await handleMsReturn();
  await onRoute();
}
window.__ecp = MOCK ? { S, ACT, go } : undefined; // mock only: handy for the validator
boot();
