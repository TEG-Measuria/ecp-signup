// In-memory mock of every ecp-api route (used with ?mock=1). Dummy people only.
// Magic values: practice code 123456 ok / 000000 locked; manager code 654321 (practice) / 999999 (group) / 000000 locked;
// patient email ending @fail.test -> patient_copy "failed"; Optix ID 999 -> submit 500.
// Optional URL params: ?exp=SECONDS (tablet session length), ?ms=mock|deny (Microsoft sign-in simulation, read by app.js).
import practiceData from './mock-practice.js';

const ApiErr = (status, error, message, extra = {}) => Object.assign(new Error(message), { status, code: error, body: { error, message, ...extra } });
const Q = new URLSearchParams(location.search);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const pad2 = (n) => String(n).padStart(2, '0');
const now = new Date();
const monthKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const CUR = monthKey(now);
const PREV = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
const PREV2 = monthKey(new Date(now.getFullYear(), now.getMonth() - 2, 1));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthLabel = (k) => `${MONTHS[+k.slice(5) - 1]} ${k.slice(0, 4)}`;

const practice = JSON.parse(JSON.stringify(practiceData));
const PLAN = Object.fromEntries(practice.plans.map((p) => [p.code, p]));
let staff = [['s1', 'Pam T.'], ['s2', 'Dillon R.'], ['s3', 'Sara K.'], ['s4', 'Tom B.'], ['s5', 'Amy L.']].map(([id, name]) => ({ id, name, active: true }));
let staffSeq = 5;
const former = ['Rob H.'];
const TERMS = { id: 'terms-cg-2026-11', label: 'CG-2026-11', effective: '2026-11-11', fingerprint: 'mock0123' };

function mask(email) {
  if (!email) return null;
  const [n, d] = email.split('@');
  const i = d.indexOf('.');
  return `${n[0]}•••@${d[0]}•••${i > 0 ? d.slice(i) : ''}`;
}
const hhmm = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
const sname = (id) => (staff.find((s) => s.id === id) || {}).name || 'Former staff';

// ---- seed sign-ups: refs, patient, optix, staff, plan, email, copy status, when (date), void
let seq = 140;
const signups = [];
function addSeed(patient, optix, staffId, plan, email, copy, date, extra = {}) {
  seq += 1;
  signups.push({ ref: `ECP-CG-${String(seq).padStart(4, '0')}`, patient, optix, staffId, plan, email, copy, date, void: false, changed: '', ...extra });
}
const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
const T = (h, m) => { const d = today(); d.setHours(h, m); return d; };
addSeed('Jane Sample', '10231', 's2', 'gold', 'jane.sample@example.test', 'Delivered', T(10, 12));
addSeed('Sam Example', '10232', 's1', 'ess', 'sam@bounce.example.test', 'Bounced', T(11, 40));
addSeed('Alex Testperson', '10233', 's3', 'goldfam', 'alex@example.test', 'Sending', T(13, 20));
addSeed('Robin Dummy', '10234', 's4', 'cl', null, 'Printed', T(14, 5));
addSeed('Chris Mockford', '10235', 's5', 'ess', 'chris@example.test', 'Not sent', T(15, 30), { practiceFailed: true });
// earlier this month and previous months (counts for the manager tables)
const earlier = (monthsBack, day) => new Date(now.getFullYear(), now.getMonth() - monthsBack, day, 10, 0);
const plans = ['gold', 'goldfam', 'ess', 'gold', 'cl', 'gold', 'essfam', 'gold'];
const names = ['Taylor Sampleton', 'Jordan Placeholder', 'Morgan Fakename', 'Casey Notreal', 'Riley Examplar', 'Drew Dummyson', 'Quinn Testwell', 'Avery Mockley', 'Blake Samplerton', 'Cameron Fiction'];
for (let i = 0; i < 9; i += 1) addSeed(names[(i + 3) % 10], String(20200 + i), staff[(i + 1) % 5].id, plans[(i + 2) % plans.length], `q${i}@example.test`, 'Delivered', earlier(1, 3 + i));
for (let i = 0; i < 4; i += 1) addSeed(names[(i + 5) % 10], String(20300 + i), staff[i % 5].id, plans[i % plans.length], `r${i}@example.test`, 'Delivered', earlier(2, 5 + i));
// the "signed in error" example for Find
addSeed('Jane Sampler', '10299', 's1', 'ess', 'jane2@example.test', 'Signed in error', earlier(1, 20), { void: true });
const paidMonths = new Set([PREV, PREV2]);

const idem = new Map();
const sessions = new Map(); // token -> {kind, scope, practice}
let tokenSeq = 0;
const sigOf = (d) => monthKey(d);

function needSession(token, kind) {
  const s = sessions.get(token);
  if (!s || s.kind !== kind) throw ApiErr(401, 'no_session', 'Please sign in again.');
  if (s.expires && Date.now() > s.expires) { sessions.delete(token); throw ApiErr(401, 'no_session', 'Please sign in again.'); }
  return s;
}
const lockedErr = () => ApiErr(429, 'locked', 'Too many tries. Please wait 5 minutes, or ask the practice manager.', { retry_after_s: 300 });
const badCodeErr = () => ApiErr(401, 'bad_code', 'That code is not right. Try again, or ask the practice manager.');
const publicStaff = () => (Q.get('nostaff') === '1' ? [] : staff.filter((s) => s.active).map(({ id, name }) => ({ id, name })));

function sessionExpiry() {
  const sec = Number(Q.get('exp'));
  if (sec > 0) return new Date(Date.now() + sec * 1000);
  const e = new Date(); e.setHours(20, 0, 0, 0);
  if (e.getTime() < Date.now() + 30 * 60 * 1000) return new Date(Date.now() + 2 * 3600 * 1000);
  return e;
}
function tinyPdfUrl(title) {
  const txt = `%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 14 Tf 20 60 Td (${title.replace(/[()\\]/g, '')}) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF`;
  return URL.createObjectURL(new Blob([txt], { type: 'application/pdf' }));
}
const planShort = (c) => (PLAN[c] || {}).short || c;
const find = (ref) => { const r = signups.find((x) => x.ref === ref); if (!r) throw ApiErr(404, 'not_found', 'We could not find that sign-up.'); return r; };
const actionFor = (r) => (r.void ? null : ({ Delivered: 'Resend', Bounced: 'Correct email', Sending: 'Check again', Printed: 'Print again', 'Not sent': 'Resend', 'No email': 'Print again' })[r.copy] || 'Resend');
const toneFor = (c) => ({ Delivered: 'ok', Sending: 'wait', Bounced: 'bad', 'Not sent': 'bad', Printed: 'pr', 'No email': 'pr', 'Signed in error': 'bad' })[c] || 'pr';
const first = (full) => { const p = String(full).trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };
const sameDay = (a, b) => a.toDateString() === b.toDateString();

function monthData(month, pr) {
  const rows = signups.filter((r) => !r.void && sigOf(r.date) === month);
  const by = new Map();
  staff.forEach((s) => by.set(s.id, { name: s.name, g: 0, f: 0, o: 0, t: 0 }));
  rows.forEach((r) => {
    if (!by.has(r.staffId)) by.set(r.staffId, { name: sname(r.staffId), g: 0, f: 0, o: 0, t: 0 });
    const b = by.get(r.staffId);
    if (r.plan === 'gold') b.g += 1; else if (r.plan === 'goldfam') b.f += 1; else b.o += 1;
    b.t += 1;
  });
  const by_staff = [...by.values()].filter((b) => b.t > 0 || staff.some((s) => s.name === b.name && s.active));
  const total = by_staff.reduce((a, b) => ({ g: a.g + b.g, f: a.f + b.f, o: a.o + b.o, t: a.t + b.t }), { g: 0, f: 0, o: 0, t: 0 });
  return {
    month_label: monthLabel(month), is_current: month === CUR, paid: paidMonths.has(month),
    by_staff: rows.length ? by_staff : [], total,
    each: rows.map((r) => ({ ref: r.ref, date: `${pad2(r.date.getDate())}/${pad2(r.date.getMonth() + 1)}/${r.date.getFullYear()}`, patient: first(r.patient), optix: r.optix, plan_short: planShort(r.plan), staff: sname(r.staffId), changed: r.changed })),
    staff: staff.map((s) => ({ ...s })), former: former.slice(),
  };
}

const R = {
  async brand() { return { practice }; },

  async 'tablet-login'({ code, device }) {
    if (code === '000000') throw lockedErr();
    if (code !== '123456') throw badCodeErr();
    if (Q.get('closed') === '1') throw ApiErr(403, 'closed', 'Sign-ups are closed after 8pm. Sign the tablet in again tomorrow.');
    const token = `mock-tablet-${++tokenSeq}`;
    const exp = sessionExpiry();
    sessions.set(token, { kind: 'tablet', expires: exp.getTime(), device });
    return { session: token, expires_at: exp.toISOString(), practice, staff: publicStaff(), terms: TERMS };
  },
  async practice(_b, token) { const s = needSession(token, 'tablet'); return { expires_at: new Date(s.expires).toISOString(), practice, staff: publicStaff(), terms: TERMS }; },
  async 'verify-code'({ code }, token) {
    needSession(token, 'tablet');
    if (code === '000000') throw lockedErr();
    if (code !== '123456') throw badCodeErr();
    return { ok: true };
  },

  async submit(b, token) {
    needSession(token, 'tablet');
    if (idem.has(b.idempotency_key)) return idem.get(b.idempotency_key);
    await wait(1200);
    if (String(b.optix).trim() === '999') throw ApiErr(500, 'server', 'We could not save your form. Nothing has been sent.');
    const fields = {};
    if (!/^\d+$/.test(String(b.optix || ''))) fields.optix = 'An Optix ID is numbers only.';
    if (!PLAN[b.plan]) fields.plan = 'Please choose a plan.';
    if (!String(b.name || '').trim()) fields.name = 'Please enter the full name.';
    if (!b.no_email && (!b.email || b.email !== b.email2)) fields.email2 = 'The two emails are different. Please check both.';
    if (b.sig_method === 'draw' && !String(b.sig_png || '').startsWith('data:image/png')) fields.sig_png = 'Please sign in the box.';
    if (b.sig_method === 'type' && !String(b.sig_typed || '').trim()) fields.sig_typed = 'Please type your name.';
    if (Object.keys(fields).length) throw ApiErr(400, 'invalid', 'Some details need checking.', { fields });
    seq += 1;
    const ref = `ECP-CG-${String(seq).padStart(4, '0')}`;
    const noEmail = !!b.no_email || !b.email;
    const failed = !noEmail && /@fail\.test$/i.test(b.email);
    const rec = { ref, patient: b.name, optix: String(b.optix), staffId: b.staff_id, plan: b.plan, email: noEmail ? null : b.email, copy: noEmail ? 'No email' : failed ? 'Not sent' : 'Sending', date: new Date(), void: false, changed: '' };
    signups.push(rec);
    const out = { ref, signed_at: new Date().toISOString(), masked_email: noEmail ? null : mask(b.email), patient_copy: noEmail ? 'no_email' : failed ? 'failed' : 'sent', practice_copy: 'sent' };
    idem.set(b.idempotency_key, out);
    return out;
  },
  async today(_b, token) {
    needSession(token, 'tablet');
    const rows = signups.filter((r) => Q.get('empty') !== '1' && sameDay(r.date, new Date())).sort((a, b) => a.date - b.date)
      .map((r) => ({ ref: r.ref, time: hhmm(r.date), patient: first(r.patient), optix: r.optix, staff: sname(r.staffId), plan_short: planShort(r.plan), copy: r.void ? 'Signed in error' : r.copy, practice_copy: r.practiceFailed ? 'failed' : 'sent', tone: toneFor(r.void ? 'Signed in error' : r.copy), action: actionFor(r) }));
    return { rows };
  },
  async resend({ ref }, token) {
    needSession(token, 'tablet'); const r = find(ref);
    if (!r.email) throw ApiErr(400, 'invalid', 'This patient gave no email. Print the copy instead.');
    r.practiceFailed = false;
    r.copy = /@fail\.test$/i.test(r.email) ? 'Not sent' : 'Sending';
    if (r.copy === 'Not sent') throw ApiErr(502, 'email_failed', 'The email did not send. Check the address, or print the copy.');
    return { masked_email: mask(r.email), at: hhmm(), status: r.copy };
  },
  async 'correct-email'({ ref, email, email2 }, token) {
    needSession(token, 'tablet'); const r = find(ref);
    const fields = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) fields.email = 'Please check the email address.';
    else if (email !== email2) fields.email2 = 'The two emails are different. Please check both.';
    if (Object.keys(fields).length) throw ApiErr(400, 'invalid', Object.values(fields)[0], { fields });
    r.email = email; r.copy = 'Sending';
    return { masked_email: mask(email), at: hhmm(), status: 'Sending' };
  },
  async check({ ref }, token) {
    needSession(token, 'tablet'); const r = find(ref);
    if (r.copy === 'Sending') r.copy = 'Delivered';
    return { copy: r.copy, tone: toneFor(r.copy) };
  },
  async pdf({ ref }, token) { needSession(token, 'tablet'); const r = find(ref); if (r.copy === 'Sending' || r.copy === 'Not sent' || r.copy === 'Bounced') { /* still printable */ } r.copy = r.email ? r.copy : 'Printed'; return { url: tinyPdfUrl(`Signed copy ${ref} (mock)`) }; },
  async void({ ref, reason }, token) {
    needSession(token, 'tablet'); const r = find(ref);
    if (!String(reason || '').trim()) throw ApiErr(400, 'invalid', 'Please give a reason.', { fields: { reason: 'Please give a reason.' } });
    r.void = true; const told = Q.get('voidfail') !== '1';
    return told ? { ok: true, practice_told: true, message: 'Marked as signed in error. The practice inbox has been told.' } : { ok: true, practice_told: false, message: 'Marked as signed in error, but the practice inbox could not be told. Please tell the practice manager.' };
  },

  async 'manager-login'({ code }) {
    if (code === '000000') throw lockedErr();
    if (code === '654321') return mgrSession('practice', 'Culver & Glass manager');
    if (code === '999999') return mgrSession('group', 'Group');
    throw ApiErr(401, 'bad_code', 'That code is not right. After 5 tries it locks for 5 minutes.');
  },
  async 'm365-login'({ id_token, nonce }) {
    if (typeof nonce !== 'string' || nonce.length < 16) throw ApiErr(403, 'forbidden', "This account can't open the manager area.");
    if (id_token === 'mock-deny') throw ApiErr(403, 'forbidden', "This account can't open the manager area.");
    return mgrSession('group', 'Vik (Microsoft)');
  },
  async 'by-staff'({ month, practice: pr }, token) {
    const s = needSession(token, 'manager');
    if (s.scope === 'practice' && pr && pr !== 'cg') throw ApiErr(403, 'forbidden', 'This code cannot open that practice.');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw ApiErr(400, 'invalid', 'Month must look like 2026-11.');
    return monthData(month, pr);
  },
  async group({ month }, token) {
    const s = needSession(token, 'manager');
    if (s.scope !== 'group') throw ApiErr(403, 'forbidden', 'This code cannot open the group view.');
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw ApiErr(400, 'invalid', 'Month must look like 2026-11.');
    const d = monthData(month);
    const live = d.total;
    return { month_label: d.month_label, by_practice: live.t === 0 ? [] : [
      { code: 'cg', name: 'Culver & Glass', ...live },
      { code: 're', name: 'Ryley & Evans', g: 5, f: 2, o: 3, t: 10 }, { code: 'kings', name: 'Kings', g: 7, f: 3, o: 4, t: 14 }, { code: 'hc', name: 'Harrison Coley', g: 6, f: 2, o: 2, t: 10 }] };
  },
  async 'change-staff'({ ref, staff_id, reason }, token) {
    needSession(token, 'manager'); const r = find(ref);
    if (!String(reason || '').trim()) throw ApiErr(400, 'invalid', 'Please give a reason.', { fields: { reason: 'Please give a reason.' } });
    const old = sname(r.staffId);
    r.staffId = staff_id; r.changed = `Moved from ${old} by Manager (mock), ${new Date().toLocaleDateString('en-GB')}: ${reason}`;
    return { ok: true, msg: `${first(r.patient)} now counts for ${sname(staff_id)}. Change recorded.`, after_payroll: paidMonths.has(sigOf(r.date)) };
  },
  async 'staff-add'({ name }, token) {
    needSession(token, 'manager');
    const n = String(name || '').trim();
    if (n.length < 2) throw ApiErr(400, 'invalid', 'Type a first name and surname initial, for example Pam T.', { fields: { name: 'Type a first name and surname initial, for example Pam T.' } });
    if (staff.some((s) => s.active && s.name.toLowerCase() === n.toLowerCase())) throw ApiErr(400, 'invalid', 'That name is already on the list.', { fields: { name: 'That name is already on the list.' } });
    staffSeq += 1; staff.push({ id: `s${staffSeq}`, name: n, active: true });
    return { staff: staff.map((s) => ({ ...s })) };
  },
  async 'staff-hide'({ staff_id }, token) {
    needSession(token, 'manager');
    const s = staff.find((x) => x.id === staff_id); if (s) { s.active = false; if (!former.includes(s.name)) former.push(s.name); }
    return { staff: staff.map((x) => ({ ...x })) };
  },
  async download({ month, practice: pr }, token) {
    needSession(token, 'manager');
    const d = monthData(month || CUR);
    const lines = ['date,practice,staff,optix_id,plan,reference,changed'];
    signups.filter((r) => !r.void && sigOf(r.date) === (month || CUR)).forEach((r) => lines.push(`${r.date.toISOString().slice(0, 10)},cg,${sname(r.staffId)},${r.optix},${planShort(r.plan)},${r.ref},${r.changed ? 'yes' : ''}`));
    return { filename: `ecp-signups-${pr === 'all' ? 'all-practices-' : ''}${month || CUR}.csv`, csv: lines.join('\r\n') + '\r\n', rows: d.total.t };
  },
  async find({ q }, token) {
    needSession(token, 'manager');
    const s = String(q || '').trim();
    const letters = s.replace(/[^a-z]/gi, '').length;
    const isId = /^\d+$/.test(s) && s.length >= 4; const isRef = /^ECP-CG-\d+$/i.test(s);
    if (!isId && !isRef && letters < 3) throw ApiErr(400, 'invalid', 'Type at least 3 letters of the name, or a full Optix ID or reference.', { fields: { q: 'Type at least 3 letters of the name, or a full Optix ID or reference.' } });
    const rows = signups.filter((r) => r.patient.toLowerCase().includes(s.toLowerCase()) || r.optix === s || r.ref.toLowerCase() === s.toLowerCase())
      .map((r) => ({ ref: r.ref, date: `${pad2(r.date.getDate())}/${pad2(r.date.getMonth() + 1)}/${r.date.getFullYear()}`, patient: r.patient, optix: r.optix, staff: sname(r.staffId), plan_short: planShort(r.plan), status: r.void ? 'Signed in error' : 'Signed', tone: r.void ? 'bad' : 'ok' }));
    return { rows };
  },
  async open({ ref }, token) { needSession(token, 'manager'); find(ref); return { url: tinyPdfUrl(`Signed copy ${ref} (mock)`) }; },
  async 'send-copy'({ ref, confirm }, token) {
    needSession(token, 'manager'); const r = find(ref);
    if (!confirm) return { masked_email: mask(r.email) };
    if (!r.email) throw ApiErr(400, 'invalid', 'This patient gave no email.');
    return { masked_email: mask(r.email), at: hhmm() };
  },
  async 'sign-out'(_b, token) { sessions.delete(token); return { ok: true }; },
};

function mgrSession(scope, label) {
  const token = `mock-mgr-${++tokenSeq}`;
  sessions.set(token, { kind: 'manager', scope });
  return scope === 'group' ? { session: token, scope, label } : { session: token, scope, practice, label };
}

export async function mockCall(route, body, token) {
  await wait(120 + Math.random() * 120);
  const fn = R[route];
  if (!fn) throw ApiErr(404, 'not_found', 'Unknown route.');
  const out = await fn(body, token);
  return JSON.parse(JSON.stringify(out));
}
