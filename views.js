// Screen templates. Markup, classes and wording are the signed-off canvas (wireframe/gen_boards.py);
// practice wording comes from the practice object. Every dynamic value goes through esc().
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function longDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : String(iso || '');
}

const TICK = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EFE6D2" stroke-width="3"><path d="M5 12l5 5 9-10"/></svg>';
const TTICK = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span class="sr">Covered</span>';

const pr = (S) => S.practice || S.brand || null;
const wrap = (S, inner, cls = '') => `<div class="pg${S.land ? ' land' : ''}${S.busy ? ' busy' : ''}${cls}">${inner}</div>`;
const h1 = (t, extra = '') => `<h1 tabindex="-1"${extra}>${t}</h1>`;

function top(S, { staff = false, right = '', mgr = false, label = '' } = {}) {
  const p = pr(S) || {};
  // Branding only after a code is accepted (Vik, 12 Nov 2026): the sign-in screens stay generic.
  const bp = S.practice || (S.mgr && S.mgr.practice) || null;
  // No group logo anywhere (Vik, 13 Nov 2026: "Remove any TEG logo"): before a code the header is left empty.
  const logo = bp && bp.logo ? `<img src="${esc(bp.logo)}" alt="${esc(bp.name)}">` : '<span class="nologo" aria-hidden="true"></span>';
  let s = `<header class="top">${logo}${right}</header>`;
  if (staff) s = `<div class="staffbar"><span>Staff only · ${esc(p.short)}</span><a href="#/s1" data-act="signout">Sign out</a></div>${s}`;
  if (mgr) s = `<div class="staffbar"><span>${esc(label)}</span><a href="#/s1" data-act="mgrout">Sign out</a></div>${s}`;
  return s;
}
const stop = '<a class="stop" href="#/s1?stop" data-act="stop">Staff: stop this sign-up</a>';
const bar = (pct) => `<div class="bar" aria-hidden="true"><span style="width: ${pct}"></span></div>`;
export function foot(S) {
  const p = pr(S) || {};
  return `<footer class="foot">${esc(p.name)} · ${esc(p.addr)} · ${esc(p.phone)}<br>${esc(p.legal)} Registered office: ${esc(p.registered_office)}.</footer>`;
}
const a = (cls, act, label, extra = '', arg = '') => `<a class="${cls}" href="#" role="button" data-act="${act}"${arg !== '' ? ` data-arg="${esc(arg)}"` : ''}${extra}>${label}</a>`;
const err = (id, msg) => (msg ? `<div id="${id}" class="err" role="alert">${esc(msg)}</div>` : '');
const bad = (cond) => (cond ? ' bad' : '');
const inp = (id, v, o = {}) => `<input id="${id}" class="in${bad(o.err)}" ${o.type ? `type="${o.type}" ` : ''}${o.mode ? `inputmode="${o.mode}" ` : ''}autocomplete="off" autocapitalize="${o.cap || 'off'}" spellcheck="false"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''} value="${esc(v)}" data-f="${o.f || id}"${o.err ? `  aria-invalid="true" aria-describedby="${o.desc || id + 'err'}"` : ' aria-invalid="false"'}${o.enter ? ` data-enter="${o.enter}"` : ''}>`;

// ---------------------------------------------------------------- S1
export function s1(S) {
  const u = S.ui;
  const stopMode = !!u.stop;
  const locked = !!u.locked, badc = !!u.bad;
  const heading = stopMode
    ? `<div style="display: flex; flex-direction: column; gap: 14px"><div class="step">Staff only</div>${h1('Stop this sign-up?')}<p class="help">Enter the practice code to stop. Nothing has been saved or sent.</p></div>`
    : `<div style="display: flex; flex-direction: column; gap: 14px"><div class="step">Staff only</div>${h1('Eyecare Plan sign-up')}<p class="help">Enter the practice sign-up code to start. Patients never see this screen.</p></div>`;
  const msg = locked ? (u.msg || 'Too many tries. Please wait 5 minutes, or ask the practice manager.') : badc ? (u.msg || 'That code is not right. Try again, or ask the practice manager.') : u.msg;
  const errBlock = (locked || badc || u.msg) ? err('pinerr', msg) : '<div class="err errslot" aria-hidden="true">&nbsp;</div>';
  const buttons = stopMode
    ? `${a('go', 'stopgo', 'Stop and start again')}${a('quiet', 'stopback', 'Go back to the patient&#39;s sign-up')}`
    : `${a('go' + (locked ? ' dim' : ''), 'login', 'Sign in', locked ? ' aria-disabled="true"' : '')}<a class="quiet" href="#/m1">Manager area</a>`;
  return wrap(S, `${top(S)}<main class="main ctr solo"><div class="lc">${heading}</div><div class="rc">
<div><label class="l" for="pin">Practice code</label>${inp('pin', u.pin || '', { type: 'password', mode: 'numeric', ph: '6 digits', err: locked || badc, f: 'pin', enter: stopMode ? 'stopgo' : 'login' })}${errBlock}</div>${buttons}</div></main>`);
}

// ---------------------------------------------------------------- S2
export function s2(S) {
  const u = S.ui;
  const noList = S.staff.length === 0;
  const badId = !!u.badId, noName = !!u.noName;
  const radios = S.staff.map((n) => `<label class="${u.staffId === n.id ? 'on' : ''}"><input class="sr" type="radio" name="who" value="${esc(n.id)}" data-f="who"${u.staffId === n.id ? ' checked' : ''}><span class="dot" aria-hidden="true"></span>${esc(n.name)}</label>`).join('');
  return wrap(S, `${top(S, { staff: true, right: '<a class="who" href="#/s3">Today&#39;s sign-ups</a>' })}<main class="main solo s2">${S.fam ? '<div class="alert" role="status" style="background: var(--alt)">Next family member: enter their Optix ID.</div>' : ''}<div class="hd2">
<div class="step">Staff · new sign-up</div>${h1('Start a sign-up')}
<p class="help">Enter the Optix ID and choose your name, then hand the tablet to the patient.</p></div><div class="lc">
<div><label class="l" for="optix">Patient&#39;s Optix ID</label>${inp('optix', u.optix || '', { mode: 'numeric', err: badId, f: 'optix', enter: 'handover', desc: 'iderr' })}
${badId ? '<div id="iderr" class="err" role="alert">An Optix ID is numbers only. Check it on the patient&#39;s record.</div>' : ''}</div></div><div class="rc">
<fieldset style="border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px" aria-describedby="nmerr"><legend class="l" style="padding: 0 0 6px; font-weight: 600">Who is signing this patient up?</legend>
${noList ? '<div class="err" role="alert">No names on the staff list yet. Ask the practice manager to add them before starting a sign-up.</div>' : ''}
<div class="pick${noName ? ' bad' : ''}">${radios}</div>
${noName ? '<div id="nmerr" class="err" role="alert">Choose your name, so the sign-up counts for you.</div>' : ''}
<div class="sub">Choose your name for every sign-up, so it counts for the right person. It goes on the form as &quot;Signed up by&quot;. Not on the list? Ask the practice manager to add you.</div></fieldset>
${a('go' + (noList ? ' dim' : ''), 'handover', 'Hand to patient', noList ? ' aria-disabled="true"' : '')}
<a class="quiet" href="#/s3">See today&#39;s sign-ups</a></div></main>`);
}

// ---------------------------------------------------------------- P0
export function p0(S) {
  const p = S.practice;
  // The board has the straight apostrophe in this copy; practice data may carry a curly one.
  const w = JSON.parse(JSON.stringify(p.why).replace(/[‘’]/g, "'"));
  const wb = w.benefits.map((b) => `<div class="box" style="display: flex; gap: 12px; align-items: center; padding: 14px 16px"><svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9A7420" stroke-width="1.6" style="flex: none">${b.icon}</svg><h2 style="font-size: 19px; line-height: 1.25">${esc(b.t)}</h2></div>`).join('');
  const gl = w.gold.map((g) => `<div class="sumr" style="justify-content: flex-start"><b style="flex: none; width: 92px; text-align: left">${esc(g.a)}</b><span>${esc(g.b)}</span></div>`).join('');
  return wrap(S, `${top(S, { right: stop })}<main class="main ctr"><div class="lc">
<div class="step">${esc(w.eyebrow)}</div>${h1(esc(w.h1), ' style="font-size: 44px"')}
<p class="help" style="font-size: 18px"><b>${esc(w.lead_b)}</b> ${esc(w.lead)}</p>
<div class="wb" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 12px">${wb}</div></div><div class="rc">
<section class="box" aria-label="What is covered in ${esc(w.gold_h)}" style="display: flex; flex-direction: column; gap: 4px">
<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap"><h2>${esc(w.gold_h)}</h2><span class="step" style="color: var(--ink)">${w.gold_tag}</span></div>${gl}</section>
<a class="go" href="#/p1">Choose your plan</a>
<a class="quiet" href="#/p0b">Compare all the plans and everything in them</a></div></main>${foot(S)}`);
}

// ---------------------------------------------------------------- P0b
export function p0b(S) {
  const p = S.practice, c = p.compare;
  const bestCode = (p.plans.find((x) => x.best) || {}).code;
  const gdIdx = c.tiers.findIndex((t) => t.plan && t.plan === bestCode);
  let th = '<div class="tr th" role="row"><span class="b e" role="columnheader"><span class="sr">Benefit</span></span>';
  c.tiers.forEach((t, i) => {
    th += `<span role="columnheader" class="${i === gdIdx ? 'gd' : (i === 0 ? 'p0' : '')}">${i === gdIdx ? '<span class="tagb">Best value</span>' : ''}<span class="nm">${esc(t.name)}</span>${t.price ? `<span class="pp"><span class="tp">${esc(t.price)}</span> <span class="mo">${esc(t.mo)}</span></span>` : `<span class="mo">${esc(t.mo)}</span>`}</span>`;
  });
  th += '</div>';
  const cell = (i, v) => {
    const cls = ((i === gdIdx ? 'gd' : '') + (i === 0 ? ' p0' : '')).trim();
    const inner = v === 'Covered' ? TTICK : (v === '–' || v === '-') ? '<span class="no" aria-hidden="true">—</span><span class="sr">Not included</span>' : esc(v);
    return `<span role="cell" class="${cls}"><span class="tk">${esc(c.tiers[i].name)}</span>${inner}</span>`;
  };
  let rows = '';
  c.groups.forEach((g) => {
    rows += `<div class="tr grp" role="row"><span class="b" role="rowheader">${esc(g.name)}</span>${c.tiers.map((_, i) => `<span class="${i === gdIdx ? 'gd' : ''}" role="cell"></span>`).join('')}</div>`;
    g.rows.forEach((r) => { rows += `<div class="tr" role="row"><span class="b" role="rowheader">${esc(r.name)}</span>${r.vals.map((v, i) => cell(i, v)).join('')}</div>`; });
  });
  let ft = '<div class="tr ft" role="row"><span class="b e" role="cell"></span><span role="cell"></span>';
  c.tiers.forEach((t, i) => { if (i > 0) ft += `<span role="cell" class="${i === gdIdx ? 'gd' : ''}">${t.plan ? a(i === gdIdx ? 'go' : 'btn2', 'choosetier', `Choose ${esc(t.name)}`, '', t.plan) : ''}</span>`; });
  ft += '</div>';
  return wrap(S, `${top(S, { right: stop })}<main class="main one" style="max-width: 1000px">
<div class="p0b-hd" style="display: flex; flex-direction: column; gap: 8px"><div class="step">Compare the plans</div>${h1('Which plan suits you?')}
<p class="help" style="margin: 0">Each plan side by side. Tap Choose under the one you want.</p><a class="quiet p0b-up" href="#/p0">Back to why join</a></div>
<div class="tg" role="table" aria-label="Compare the plans">${th}${rows}${ft}</div>
<a class="quiet p0b-dn" href="#/p0">Back to why join</a></main>`);
}

// ---------------------------------------------------------------- P1
export function p1(S) {
  const p = S.practice, cur = S.pt.plan;
  const none = !cur;
  const plan = p.plans.find((x) => x.code === cur);
  const opts = p.plans.map((x) => `<label class="choice${x.code === cur ? ' on' : ''}"><input class="sr" type="radio" name="plan" value="${esc(x.code)}" data-f="plan"${x.code === cur ? ' checked' : ''}><span class="k" aria-hidden="true"></span><span><span class="t">${esc(x.name)}${x.best ? ' <span class="tagb">Best value</span>' : ''}</span><span class="d" style="display: block">${esc(x.desc)}</span></span><span class="pr">${esc(x.price)}<small>a month</small></span></label>`).join('');
  return wrap(S, `${top(S, { right: stop })}${bar('25%')}<main class="main abc"><div class="ga">
<div class="step">Step 1 of 4</div>${h1('Choose your Eyecare Plan')}<p class="help">Pick one. You can upgrade at any time.</p>
${none ? '<div class="alert bad" role="alert">Please choose a plan to carry on.</div>' : ''}</div><div class="gb">
<fieldset style="border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px"><legend class="sr">Plans</legend>${opts}</fieldset></div><div class="gc">
<p class="sub" style="margin: 0">Family cover: each person covered has their own quick sign-up, one after another. We keep the plan and email for the next one.</p>
<a class="btn2" href="#/p0b">Compare the plans side by side</a>
${a('go' + (none ? ' dim' : ''), 'p1go', none ? 'Choose a plan to continue' : `Continue with ${esc(plan.short)}`)}
<a class="quiet" href="#/p0">Back to why join</a></div></main>`);
}

// ---------------------------------------------------------------- P2
export function keyTermLines(S) {
  const p = S.practice, plan = p.plans.find((x) => x.code === S.pt.plan) || p.plans[0];
  return p.key_terms.map((k, i) => {
    if (i === 0) return { h: k.h, x: `${plan.name}, ${plan.price} a month by Direct Debit, taken around the 1st or 15th of each month.` };
    if (k.h === 'Glasses cover' && !plan.glasses_cover) return null;
    return k;
  }).filter(Boolean);
}
function fullTerms(S) {
  const out = [];
  let ul = false;
  const close = () => { if (ul) { out.push('</ul>'); ul = false; } };
  S.practice.terms_full.forEach((t) => {
    if (t.k === 'b') { if (!ul) { out.push('<ul style="margin: 8px 0 0; padding-left: 22px; display: flex; flex-direction: column; gap: 6px">'); ul = true; } out.push(`<li>${esc(t.x)}</li>`); return; }
    close();
    if (t.k === 'h') out.push(`<p style="margin: 18px 0 0"><b>${esc(t.x)}</b></p>`);
    else if (t.k === 's') out.push(`<p style="margin: 12px 0 0"><b style="color: var(--brassink)">${esc(t.x)}</b></p>`);
    else if (t.k === 'd') out.push(`<p style="margin: 8px 0 0"><b>${esc(t.t || '')}</b> ${esc(t.x)}</p>`);
    else out.push(`<p style="margin: 10px 0 0">${esc(t.x)}</p>`);
  });
  close();
  return out.join('');
}
export function p2(S) {
  const open = !!S.ui.terms;
  const lis = keyTermLines(S).map((k) => `<li><b>${esc(k.h)}</b><span>${esc(k.x)}</span></li>`).join('');
  const t = S.terms || {};
  return wrap(S, `${top(S, { right: stop })}${bar('50%')}<main class="main abc"><div class="ga">
<div class="step">Step 2 of 4</div>${h1('The key terms')}
<p class="help">The main points of your agreement. The full terms are below, and we email you a copy.</p></div>
<div class="gb"><ul class="kt">${lis}</ul></div><div class="gc">
${open ? `<section class="box" aria-label="Full terms"><h2>Full terms and conditions</h2><div id="fullterms" tabindex="0" role="region" aria-label="Full terms text">${fullTerms(S)}</div>${a('quiet', 'terms', 'Close the full terms', '', 'close')}</section>` : a('btn2', 'terms', 'Read the full terms', '', 'open')}
<p class="sub" style="margin: 0">Eyecare Plan terms · version ${esc(t.label)} · from ${esc(longDate(t.effective))}</p>
${a('go', 'p2go', 'Accept terms and continue')}<a class="quiet" href="#/p1">Back</a></div></main>${foot(S)}`, open ? ' terms-open' : '');
}

// ---------------------------------------------------------------- P3
export function p3(S) {
  const P = S.pt, e = S.ui.errs || {};
  const u16 = !!P.u16, noEmail = !!P.no_email;
  const fld = (id, label, key, o = {}) => `<div><label class="l" for="${id}">${label}</label>${inp(id, P[key], { ...o, err: !!e[key], f: key })}${e[key] ? `<div id="${id}err" class="err" role="alert">${esc(e[key])}</div>` : ''}${o.sub ? `<div class="sub">${o.sub}</div>` : ''}</div>`;
  const left = `${fld('nm', 'Patient&#39;s full name', 'name', { cap: 'words' })}
<label class="check" style="font-size: 16px"><input class="sr" type="checkbox" data-f="u16"${u16 ? ' checked' : ''}><span class="sq${u16 ? ' on' : ''}" aria-hidden="true">${TICK}</span><span>The patient is under 16</span></label>
${u16 ? fld('pg', 'Parent or guardian&#39;s full name', 'parent', { cap: 'words', sub: 'The parent or guardian signs on the next screen, and the copy goes to their email.' }) : ''}
${fld('ad1', 'Home address', 'addr1', { cap: 'words' })}
<div class="tp2" style="display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 12px">${fld('ad2', 'Town', 'town', { cap: 'words' })}${fld('pc', 'Postcode', 'postcode', { cap: 'characters' })}</div>`;
  const emailBlock = noEmail
    ? `<div class="box">No problem. We will print the signed copy and the benefits booklet before you leave.${a('quiet', 'noemail', 'There is an email address', ' style="justify-content: flex-start"', 'off')}</div>`
    : `<div style="display: flex; flex-direction: column; gap: 18px">
${fld('em', u16 ? 'Parent or guardian’s email, for the copy' : 'Email for your copy', 'email', { type: 'email' })}
${fld('em2', 'Type it again', 'email2', { type: 'email' })}
${a('quiet', 'noemail', 'There is no email address', ' style="justify-content: flex-start"', 'on')}</div>`;
  const right = `${fld('mob', u16 ? 'Parent or guardian’s mobile number' : 'Mobile number', 'mobile', { type: 'tel', mode: 'tel' })}${emailBlock}
${a('go', 'p3go', 'Continue to sign')}<a class="quiet" href="#/p2">Back</a>`;
  return wrap(S, `${top(S, { right: stop })}${bar('75%')}<main class="main"><div class="hd2"><div class="step">Step 3 of 4</div>${h1('Your details')}</div><div class="lc">${left}</div><div class="rc">${right}</div></main>`);
}

// ---------------------------------------------------------------- P4
export function p4(S) {
  const P = S.pt, u = S.ui, p = S.practice, plan = p.plans.find((x) => x.code === P.plan) || {};
  const u16 = !!P.u16, typed = P.sigMethod === 'type', sending = S.busy, failed = !!u.failed;
  const noTick = !!u.noTick;
  const agree = esc(p.agree) + (u16 ? ` ${esc(p.agree_u16)}` : '');
  const copyTo = P.no_email ? 'No email: we will print your copy' : esc(P.email);
  const sum = `<div class="sumr"><span>Plan</span><b>${esc(plan.name)} · ${esc(plan.price)} a month</b></div><div class="sumr"><span>Patient</span><b>${esc(P.name)}</b></div>
${u16 ? `<div class="sumr"><span>Signed by</span><b>${esc(P.parent)}, parent or guardian</b></div>` : ''}
<div class="sumr"><span>Address</span><b>${esc(P.addr1)}, ${esc(P.town)} ${esc(P.postcode)}</b></div><div class="sumr"><span>Mobile</span><b>${esc(P.mobile)}</b></div><div class="sumr"><span>Copy to</span><b>${copyTo}</b></div><a class="quiet" href="#/p3" style="justify-content: flex-start">Change these</a>`;
  const tabs = `<div class="tabs" role="tablist" aria-label="How to sign"><a class="${typed ? '' : 'on'}" href="#" role="tab" data-act="sigtab" data-arg="draw" aria-selected="${typed ? 'false' : 'true'}">Sign with your finger</a><a class="${typed ? 'on' : ''}" href="#" role="tab" data-act="sigtab" data-arg="type" aria-selected="${typed ? 'true' : 'false'}">Type your name</a></div>`;
  const sigErr = u.noSig ? `<div id="sigerr" class="err" role="alert">${typed ? 'Please type your full name to sign.' : 'Please sign in the box with your finger.'}</div>` : '';
  const sig = typed
    ? `<div><label class="l" for="tn">Type your full name as your signature</label>${inp('tn', P.typed, { cap: 'words', f: 'typed' })}</div><div class="pad" style="height: 120px"><span class="typed" id="typedprev">${esc(P.typed)}</span></div>${sigErr}`
    : `<div class="l" style="font-size: 16px; font-weight: 600">${u16 ? 'Parent or guardian signature' : 'Your signature'}</div><div class="pad"><span class="x" aria-hidden="true">×</span><span class="base"></span><canvas id="sigpad" class="sigcanvas" aria-label="Signature box. Draw your signature with your finger."></canvas></div>${sigErr}${a('quiet', 'sigclear', 'Clear and sign again', ' style="justify-content: flex-end"')}`;
  const btn = sending ? '<div class="go dim" role="status" aria-live="polite">Saving your signed copy…</div>' : a('go', 'p4go', failed ? 'Try again' : 'Sign and join');
  return wrap(S, `${top(S, { right: stop })}${bar('100%')}<main class="main"><div class="hd2"><div class="step">Step 4 of 4</div>${h1('Check and sign')}</div><div class="lc">
<div>${sum}</div>
<label class="check${noTick ? ' bad' : ''}"><input class="sr" type="checkbox" data-f="ticked"${P.ticked ? ' checked' : ''}${noTick ? ' aria-describedby="tkerr"' : ''}><span class="sq${P.ticked ? ' on' : ''}" aria-hidden="true">${TICK}</span><span>${agree}</span></label>
${noTick ? '<div id="tkerr" class="err" role="alert">Please tick to say you agree before signing.</div>' : ''}</div><div class="rc">
${tabs}${sig}
${failed ? `<div class="alert bad" role="alert">${esc(u.failMsg || 'We could not save your form. Nothing has been sent. Please tap Try again, or ask the team.')}</div>` : ''}
${btn}<a class="quiet" href="#/p2">Read the terms again</a></div></main>${foot(S)}`);
}

// ---------------------------------------------------------------- P5
export function p5(S) {
  const r = S.result, P = S.pt, u = S.ui;
  const staffView = !!S.staffUnlocked;
  const u16 = !!P.u16;
  const fn = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const headline = u16 ? `Thank you, ${esc(fn(P.parent))}. ${esc(fn(P.name))} is signed up.` : `Thank you, ${esc(fn(P.name))}. You are signed up.`;
  const failed = r.patient_copy === 'failed', noEmail = r.patient_copy === 'no_email';
  const copyLine = failed ? 'Your form is signed and saved. The email has not gone through yet, so the team will sort your copy now.'
    : noEmail ? 'Your form is signed and saved. We will print your copy and the benefits booklet for you now.'
      : `We have sent your signed form and the benefits booklet to ${esc(r.masked_email)}. If it is not there in a few minutes, check your junk folder.`;
  const rc = S.practice.reception_email;
  let staff = '';
  if (staffView) {
    staff = `<section style="border-top: 3px solid var(--ink); padding-top: 18px; display: flex; flex-direction: column; gap: 14px" aria-label="For staff">
<div class="step">For staff · ref ${esc(r.ref)}</div>
${u.note ? `<div class="alert ok" role="status">${esc(u.note)}</div>` : ''}
${!failed && !noEmail ? `<div class="alert ok" role="status">Signed copy sent to the patient and to ${esc(rc)}. Delivery shows on Today&#39;s sign-ups.</div>` : ''}
${failed ? `<div class="alert bad" role="alert">The patient&#39;s email has not sent. Check the address with them, then try again, or print it. The practice copy has gone to ${esc(rc)}.</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">${a('btn2', 'p5retry', 'Try again')}${a('btn2', 'p5print', 'Print the copy')}</div>` : ''}
${noEmail ? a('btn2', 'p5print', 'Print the signed copy and booklet') : ''}
${r.practice_copy === 'failed' ? `<div class="alert bad" role="alert">The practice copy to ${esc(rc)} has not sent. Print the signed copy and keep it with the patient&#39;s record.</div>` : ''}
${u.perr ? `<div class="err" role="alert">${esc(u.perr)}</div>` : ''}
<div class="alert" style="background: var(--alt)"><b>To do:</b> 1. Set up the Direct Debit in Optix as usual. 2. Attach the signed copy to the patient&#39;s Optix record (it is in the reception inbox).</div>
${a('go', 'next', 'Start the next sign-up')}
${a('btn2', 'family', 'Sign up the next family member (same plan and email)')}
<a class="quiet" href="#/s3">Today&#39;s sign-ups</a></section>`;
  } else if (u.askCode) {
    staff = `<section class="box" aria-label="Staff code" style="display: flex; flex-direction: column; gap: 14px"><div><label class="l" for="pin">Practice code</label>${inp('pin', u.pin || '', { type: 'password', mode: 'numeric', ph: '6 digits', err: !!u.perr, f: 'pin', enter: 'staffgo' })}${u.perr ? `<div id="pinerr" class="err" role="alert">${esc(u.perr)}</div>` : ''}</div>${a('go', 'staffgo', 'Continue')}${a('quiet', 'staffcancel', 'Cancel')}</section>`;
  }
  return wrap(S, `${top(S)}<main class="main ${staffView ? '' : 'solo'}"><div class="lc">${h1(headline)}
<p class="help">${copyLine}</p>
<div class="box" style="font-size: 18px; line-height: 1.5"><b>Next:</b> a member of the team will set up your Direct Debit with you. Please hand the tablet back to them.</div>
${!staffView && !u.askCode ? a('stop', 'staffask', 'Staff: continue (practice code needed)', ' style="align-self: center"') : ''}</div><div class="rc">${staff}</div></main>`);
}

// ---------------------------------------------------------------- P6
export function p6(S) {
  const k = S.p6 || { kind: 'half' };
  if (k.kind === 'ask') {
    return wrap(S, `${top(S)}<main class="main solo" style="justify-content: center"><div style="display: flex; flex-direction: column; gap: 22px">${h1('Are you still there?')}
<p class="help">For your privacy this screen will clear in <span id="countdown">${esc(k.left ?? 30)}</span> seconds.</p>${a('go', 'carryon', 'Yes, carry on')}</div></main>`);
  }
  const m = {
    half: ['This screen was cleared', 'Nothing was saved. Please ask the team if you would like to start again.'],
    emailed: ['This screen was cleared', 'The sign-up was finished and saved. Your copy is on its way.'],
    noemail: ['This screen was cleared', 'The sign-up was finished and saved. Your copy is being printed.'],
    stopped: ['Sign-up stopped', 'Nothing was saved or sent.'],
  }[k.kind] || ['This screen was cleared', ''];
  return wrap(S, `${top(S)}<main class="main solo" style="justify-content: center"><div style="display: flex; flex-direction: column; gap: 22px">${h1(m[0])}
<p class="help">${m[1]}</p><a class="go" href="#/s2" data-act="startagain">Staff: start again</a></div></main>`);
}

// ---------------------------------------------------------------- S3
export function s3(S) {
  const u = S.ui, rows = u.rows;
  const empty = rows && rows.length === 0;
  const body = !rows ? '<p class="help" role="status">Loading…</p>' : empty
    ? `<section class="box empty" aria-label="No sign-ups yet"><h2>No sign-ups yet today</h2><p style="margin: 0">Each sign-up shows here as soon as it is signed, with whether the patient&#39;s copy arrived. Earlier days are in the manager area.</p><a class="go" href="#/s2">Start a sign-up</a></section>`
    : `<div class="rows" role="table" aria-label="Today&#39;s sign-ups"><div class="row hd" role="row"><span role="columnheader">Time</span><span role="columnheader">Patient</span><span role="columnheader">Plan</span><span role="columnheader">Patient copy</span><span role="columnheader">Action</span></div>${rows.map((r) => `<div class="row" role="row">
<span role="cell"><span class="k">Time</span>${esc(r.time)}</span><span role="cell"><span class="k">Patient</span>${esc(r.patient)}<br><span class="sub">Optix ${esc(r.optix)} · by ${esc(r.staff)}</span></span>
<span role="cell"><span class="k">Plan</span>${esc(r.plan_short)}</span><span role="cell"><span class="k">Patient copy</span><span class="pill ${esc(r.tone)}">${esc(r.copy)}</span>${r.practice_copy === 'failed' ? `<div class="err" role="alert">Practice copy not sent: ${r.action === 'Resend' ? 'tap Resend' : 'tell the practice manager'}</div>` : ''}</span>
<span role="cell" style="display: flex; flex-direction: column; gap: 6px"><span class="k">Action</span>${r.action ? a('btn2', 'rowact', esc(r.action), ' style="min-height: 44px"', r.ref) : ''}${r.copy !== 'Signed in error' ? a('stop', 'voidopen', 'Signed in error', ' style="justify-content: center"', r.ref) : ''}</span></div>`).join('')}</div>`;
  const fixRow = u.fix && rows ? rows.find((r) => r.ref === u.fix.ref) : null;
  const fix = u.fix ? `<section class="box pnl" aria-label="Correct the email" style="display: flex; flex-direction: column; gap: 14px"><h2>Send to a corrected email</h2>
<p style="margin: 0">${esc(fixRow ? fixRow.patient : '')} · the signed copy stays the same, only the email changes.</p>
<div><label class="l" for="ne">New email</label>${inp('ne', u.fix.email || '', { type: 'email', f: 'fix.email', err: !!(u.fix.errs && u.fix.errs.email) })}${u.fix.errs && u.fix.errs.email ? `<div id="neerr" class="err" role="alert">${esc(u.fix.errs.email)}</div>` : ''}</div>
<div><label class="l" for="ne2">Type it again</label>${inp('ne2', u.fix.email2 || '', { type: 'email', f: 'fix.email2', enter: 'fixsend', err: !!(u.fix.errs && u.fix.errs.email2) })}${u.fix.errs && u.fix.errs.email2 ? `<div id="ne2err" class="err" role="alert">${esc(u.fix.errs.email2)}</div>` : ''}</div>
<div class="pair">${a('go', 'fixsend', 'Send')}${a('btn2', 'modalcancel', 'Cancel')}</div></section>` : '';
  const vr = u.void && rows ? rows.find((r) => r.ref === u.void.ref) : null;
  const voidIt = u.void ? `<section class="box pnl" aria-label="Signed in error" style="display: flex; flex-direction: column; gap: 14px"><h2>Mark ${esc(vr ? vr.patient : '')}&#39;s sign-up as signed in error?</h2>
<p style="margin: 0">Use this for a wrong plan, name or Optix ID. The signed copy is kept, marked &quot;Signed in error&quot;, and the practice inbox gets a note. Then start a new sign-up with the right details.</p>
<div><label class="l" for="why">Reason</label>${inp('why', u.void.reason || '', { f: 'void.reason', ph: 'For example: wrong plan chosen', enter: 'voidgo', err: !!u.void.err })}${u.void.err ? `<div id="whyerr" class="err" role="alert">${esc(u.void.err)}</div>` : ''}</div>
<div class="pair">${a('go', 'voidgo', 'Mark and start again')}${a('btn2', 'modalcancel', 'Cancel')}</div></section>` : '';
  return wrap(S, `${top(S, { staff: true, right: '<a class="who" href="#/s2">New sign-up</a>' })}<main class="main one s3" style="max-width: 1000px">
<div class="eh"><div class="step">Staff</div>${h1('Today&#39;s sign-ups')}</div>
${u.done ? `<div class="alert ok" role="status">${esc(u.done)}</div>` : ''}${u.error ? `<div class="alert bad" role="alert">${esc(u.error)}</div>` : ''}${body}${fix}${voidIt}</main>`);
}

// ---------------------------------------------------------------- Manager
const MTABS = (on) => `<nav class="tabs" aria-label="Manager area">${[['m1', 'Sign-ups by staff'], ['m2', 'Find a sign-up']].map(([k, v]) => `<a class="${k === on ? 'on' : ''}" href="#/${k}"${k === on ? ' aria-current="page"' : ''}>${v}</a>`).join('')}</nav>`;

function mcode(S) {
  const u = S.ui;
  const badc = !!u.bad;
  const msNo = S.msUnset;
  const msBtn = msNo ? '<div class="err" role="status">Microsoft sign-in is not set up yet</div>' : a('go', 'msgo', 'Sign in with Microsoft');
  return `<section style="display: flex; flex-direction: column; gap: 14px"><div class="step">Manager only</div>${h1('Manager area')}
<p class="help">Sign in with your own Microsoft work account. The shared reception account can&#39;t open this area.</p>
${msBtn}${u.msErr ? `<div class="err" role="alert">${esc(u.msErr)}</div>` : ''}
<div class="sub" style="text-align: center">or use the manager code</div>
<div><label class="l" for="mpin">Manager code</label>${inp('mpin', u.pin || '', { type: 'password', mode: 'numeric', ph: '6 digits', err: badc, f: 'pin', enter: 'mcodego', desc: 'mperr' })}${badc ? `<div id="mperr" class="err" role="alert">${esc(u.msg || 'That code is not right. After 5 tries it locks for 5 minutes.')}</div>` : ''}</div>
${a('btn2', 'mcodego', 'Open with the code')}<a class="quiet" href="#/s1">Back</a></section>`;
}

export function m1(S) {
  const m = S.mgr;
  if (!m) return wrap(S, `${top(S)}<main class="main one solo" style="max-width: 1000px">${mcode(S)}</main>`);
  const u = S.ui, d = u.data;
  const group = u.view === 'group';
  const barL = group ? 'Group · All practices' : (m.scope === 'group' ? `Manager · ${u.practiceName || ''}` : `Manager · ${(m.practice || S.practice || {}).short || ''}`);
  const month = d ? d.month_label : '';
  let inner = '';
  if (!d) inner = '<p class="help" role="status">Loading…</p>';
  else if (group) {
    inner = `<section class="box" aria-label="All practices" style="display: flex; flex-direction: column; gap: 14px"><h2>All practices, ${esc(month)}</h2>
<p style="margin: 0">Signed in with the group code: every practice, each in its own brand on its own tablet.</p>
<div class="rows" role="table" aria-label="Sign-ups by practice, ${esc(month)}" style="border-top: 1px solid var(--line)"><div class="mrow hd" role="row"><span role="columnheader">Practice</span><span role="columnheader">Gold</span><span role="columnheader">Gold Family</span><span role="columnheader">Other plans (Essential, Contacts)</span><span role="columnheader">Total</span></div>
${d.by_practice.map((r) => `<div class="mrow" role="row"><span class="nm" role="cell"><a href="#" data-act="openpractice" data-arg="${esc(r.code)}|${esc(r.name)}">${esc(r.name)}</a></span><span role="cell"><span class="k">Gold</span><span class="num">${r.g}</span></span><span role="cell"><span class="k">Gold Family</span><span class="num">${r.f}</span></span><span role="cell"><span class="k">Other plans</span><span class="num">${r.o}</span></span><span role="cell"><span class="k">Total</span><b class="num">${r.t}</b></span></div>`).join('')}</div>
${a('go', 'download', 'Download all practices for payroll', '', 'all')}
<p class="sub" style="margin: 0">One spreadsheet, one line per sign-up, with a practice column. Open a practice to see its staff and sign-ups, as its manager does.</p></section>`;
  } else if (!d.by_staff.length && !d.each.length) {
    inner = `<section class="box empty" aria-label="No sign-ups this month"><h2>No sign-ups in ${esc(month)}</h2><p style="margin: 0">Use the arrows to see another month. There is nothing to download for payroll this month.</p>${a('stop', 'stafflist', 'Edit the staff list', ' style="color: var(--ink)"')}</section>`;
  } else {
    const t = d.total;
    inner = `<div class="two" style="display: flex; flex-direction: column; gap: 14px"><div class="lc"><div class="rows" role="table" aria-label="Sign-ups by staff, ${esc(month)}" style="border-top: 1px solid var(--line)">
<div class="mrow hd" role="row"><span role="columnheader">Staff</span><span role="columnheader">Gold</span><span role="columnheader">Gold Family</span><span role="columnheader">Other plans (Essential, Contacts)</span><span role="columnheader">Total</span></div>
${d.by_staff.map((r) => `<div class="mrow" role="row"><span class="nm" role="cell">${esc(r.name)}</span><span role="cell"><span class="k">Gold</span><span class="num">${r.g}</span></span><span role="cell"><span class="k">Gold Family</span><span class="num">${r.f}</span></span><span role="cell"><span class="k">Other plans</span><span class="num">${r.o}</span></span><span role="cell"><span class="k">Total</span><b class="num">${r.t}</b></span></div>`).join('')}
<div class="mrow tot" role="row"><span class="nm" role="cell">All staff</span><span role="cell"><span class="k">Gold</span><span class="num">${t.g}</span></span><span role="cell"><span class="k">Gold Family</span><span class="num">${t.f}</span></span><span role="cell"><span class="k">Other plans</span><span class="num">${t.o}</span></span><span role="cell"><span class="k">Total</span><span class="num">${t.t}</span></span></div></div>
${a('go', 'download', 'Download for payroll', '', 'one')}
<p class="sub" style="margin: 0">A spreadsheet with one line per sign-up: date, staff, patient Optix ID, plan, reference. Signed-in-error sign-ups are left out; changed ones are marked. Every download is recorded with who and when.</p></div><div class="rc">
<h2>Each sign-up this month</h2><div class="rows" role="table" aria-label="Each sign-up, ${esc(month)}"><div class="row hd" role="row"><span role="columnheader">Date</span><span role="columnheader">Patient</span><span role="columnheader">Plan</span><span role="columnheader">Signed up by</span><span role="columnheader">Action</span></div>
${d.each.map((e) => `<div class="row" role="row"><span role="cell"><span class="k">Date</span>${esc(e.date)}</span><span role="cell"><span class="k">Patient</span>${esc(e.patient)}<br><span class="sub">Optix ${esc(e.optix)}</span></span><span role="cell"><span class="k">Plan</span>${esc(e.plan_short)}</span><span role="cell"><span class="k">Signed up by</span>${esc(e.staff)}${e.changed ? `<br><span class="sub">${esc(e.changed)}</span>` : ''}</span><span role="cell"><span class="k">Action</span>${a('stop', 'changeopen', 'Change who signed up', '', e.ref)}</span></div>`).join('')}</div>
${a('quiet', 'stafflist', 'Edit the staff list', ' style="justify-content: flex-start"')}</div></div>`;
  }
  // change who signed up
  let change = '';
  if (u.change && d) {
    const c = u.change;
    const opts = (d.staff || []).filter((s) => s.active).map((s) => `<option value="${esc(s.id)}"${s.id === c.staffId ? ' selected' : ''}>${esc(s.name)}</option>`).join('');
    change = `<section class="box" aria-label="Change who signed up" style="display: flex; flex-direction: column; gap: 14px"><h2>Change who signed up ${esc(c.patient)}</h2>
<p style="margin: 0">Now: ${esc(c.staff)}. Use this when the wrong name was chosen on the tablet. The signed PDF still shows ${esc(c.staff)} as &quot;Signed up by&quot;; the counts and the payroll download use the new name. The change is recorded with your name, the time and the reason, and shows on the sign-up.</p>
${d.paid ? `<div class="err" role="alert">${esc(month)} payroll has already been run. This change will show in next month&#39;s download as a correction.</div>` : ''}
<div><label class="l" for="ns">Signed up by</label><select id="ns" class="in" data-f="change.staffId">${opts}</select></div>
<div><label class="l" for="rs">Reason</label>${inp('rs', c.reason || '', { f: 'change.reason', ph: 'For example: wrong name chosen on the tablet', enter: 'changesave', err: !!c.err })}${c.err ? `<div id="rserr" class="err" role="alert">${esc(c.err)}</div>` : ''}</div>
<div class="pair">${a('go', 'changesave', 'Save')}${a('btn2', 'modalcancel', 'Cancel')}</div></section>`;
  }
  let list = '';
  if (u.list && d) {
    const act = (d.staff || []).filter((s) => s.active);
    list = `<section class="box pnl2" aria-label="Staff list" style="display: flex; flex-direction: column; gap: 12px"><h2>Staff list</h2><p style="margin: 0">These names appear on the tablet when a sign-up starts.</p>
${act.map((n) => `<div class="sumr"><span>${esc(n.name)}</span>${a('stop', 'staffhide', 'Stop showing on the tablet', '', n.id)}</div>`).join('')}
${d.former && d.former.length ? `<p class="sub" style="margin: 0">Former staff (past sign-ups still counted): ${esc(d.former.join(', '))}</p>` : ''}
<div><label class="l" for="nn">Add a name</label>${inp('nn', u.list.name || '', { f: 'list.name', ph: 'For example: Pam T.', cap: 'words', enter: 'staffadd', err: !!u.list.err })}${u.list.err ? `<div id="nnerr" class="err" role="alert">${esc(u.list.err)}</div>` : ''}<div class="sub">First name and surname initial, so two people with the same first name can be told apart.</div></div>
${a('go', 'staffadd', 'Add')}${a('quiet', 'listdone', 'Done', ' style="justify-content: flex-start"')}</section>`;
  }
  const showMain = !u.change && !u.list;
  const nav = group ? '' : `<div style="display: flex; gap: 8px; align-items: center">${a('btn2', 'month', '‹', ' aria-label="Previous month" style="min-height: 44px"', '-1')}<b style="font-size: 18px; min-width: 130px; text-align: center">${esc(month)}</b>${a('btn2', 'month', '›', ' aria-label="Next month" style="min-height: 44px"', '1')}</div>`;
  const navG = group ? `<div style="display: flex; gap: 8px; align-items: center">${a('btn2', 'month', '‹', ' aria-label="Previous month" style="min-height: 44px"', '-1')}<b style="font-size: 18px; min-width: 130px; text-align: center">${esc(month)}</b>${a('btn2', 'month', '›', ' aria-label="Next month" style="min-height: 44px"', '1')}</div>` : nav;
  const back = m.scope === 'group' && !group ? a('quiet', 'allpractices', 'All practices', ' style="justify-content: flex-start"') : '';
  return wrap(S, `${top(S, { mgr: true, label: barL })}<main class="main one" style="max-width: 1000px"><div class="mstk" style="display: flex; flex-direction: column; gap: 22px">${MTABS('m1')}${back}
<div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap"><div class="eh"><div class="step">Manager</div>${h1('Sign-ups by staff')}</div>${navG}</div>
${u.done ? `<div class="alert ok" role="status">${esc(u.done)}</div>` : ''}${u.error ? `<div class="alert bad" role="alert">${esc(u.error)}</div>` : ''}${change}${list}${showMain ? inner : ''}</div></main>`);
}

// The board lists the earlier sign-up first (dd/mm/yyyy, then reference), whatever order the server sends.
const dkey = (r) => String(r.date || '').split('/').reverse().join('');
const earlierFirst = (rows) => (rows ? rows.slice().sort((x, y) => dkey(x).localeCompare(dkey(y)) || String(x.ref).localeCompare(String(y.ref))) : rows);
export function m2(S) {
  const u = S.ui, rows = earlierFirst(u.rows);
  const none = rows && rows.length === 0;
  const conf = u.confirm ? (() => {
    const c = u.confirm;
    return c.masked
      ? `<section class="box pnl" aria-label="Send the patient a copy" style="display: flex; flex-direction: column; gap: 14px"><h2>Send ${esc(c.patient)} a copy?</h2><p style="margin: 0">The signed copy will go to ${esc(c.masked)}, the email they gave when signing.</p><div class="pair">${a('go', 'sendgo', 'Send')}${a('btn2', 'modalcancel', 'Cancel')}</div></section>`
      : `<section class="box pnl" aria-label="No email on file" style="display: flex; flex-direction: column; gap: 14px"><h2>No email for ${esc(c.patient)}</h2><p style="margin: 0">They gave no email when signing. Open the signed copy to print it.</p><div class="pair">${a('go', 'openref', 'Open signed copy', '', c.ref)}${a('btn2', 'modalcancel', 'Cancel')}</div></section>`;
  })() : '';
  return wrap({ ...S, land: false }, `${top(S, { mgr: true, label: `${S.mgr && S.mgr.scope === 'group' ? 'Group · All practices' : `Manager · ${(S.mgr && S.mgr.practice ? S.mgr.practice.short : '')}`}` })}<main class="main" style="max-width: 1000px">${MTABS('m2')}
<div class="eh"><div class="step">Manager</div>${h1('Find a sign-up')}</div>
<div><label class="l" for="q">Patient name, Optix ID or reference</label>${inp('q', u.q || '', { type: 'search', f: 'q', enter: 'search', err: !!u.qerr })}${u.qerr ? `<div id="qerr" class="err" role="alert">${esc(u.qerr)}</div>` : ''}</div>
${a('go', 'search', 'Search')}
${none ? `<div class="alert" role="status" style="background: var(--alt)">No sign-up found for &quot;${esc(u.searched)}&quot;. Paper sign-ups from before the tablet are in Optix only.</div>` : ''}
${u.sent ? `<div class="alert ok" role="status">${esc(u.sent)}</div>` : ''}${u.error ? `<div class="alert bad" role="alert">${esc(u.error)}</div>` : ''}
${rows && rows.length ? `<p class="sub" style="margin: 0">${rows.length === 1 ? '1 sign-up found' : `${rows.length} sign-ups found`}</p>
<div class="rows" role="table" aria-label="Sign-ups found"><div class="row hd" role="row"><span role="columnheader">Signed</span><span role="columnheader">Patient</span><span role="columnheader">Plan</span><span role="columnheader">Status</span><span role="columnheader">Action</span></div>
${rows.map((r) => `<div class="row" role="row"><span role="cell"><span class="k">Signed</span>${esc(r.date)}</span><span role="cell"><span class="k">Patient</span>${esc(r.patient)}<br><span class="sub">Optix ${esc(r.optix)} · ${esc(r.ref)} · by ${esc(r.staff)}</span></span><span role="cell"><span class="k">Plan</span>${esc(r.plan_short)}</span><span role="cell"><span class="k">Status</span><span class="pill ${esc(r.tone)}">${esc(r.status)}</span></span>
<span role="cell" style="display: flex; flex-direction: column; gap: 6px"><span class="k">Action</span>${a('btn2', 'openref', 'Open signed copy', ' style="min-height: 44px"', r.ref)}${a('stop', 'sendcopy', 'Send the patient a copy', ' style="justify-content: center"', r.ref)}</span></div>`).join('')}</div>` : ''}
${conf}</main>`);
}
