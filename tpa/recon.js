/* TPA Desk: applies an employer's eligibility file to the roster, checks every paid claim against the coverage dates
   that result, measures claimants against the stop-loss contract and builds the employer's monthly report. */
const Recon = (() => {
  const D = s => new Date(s + "T12:00:00");
  const iso = d => d.toISOString().slice(0, 10);
  const monthEnd = s => { const d = D(s); return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 12))); };
  const firstAfter = s => { const d = D(s); return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 1, 12))); };
  const addDays = (s, n) => iso(new Date(D(s).getTime() + n * 864e5));
  const days = (a, b) => Math.round((D(b) - D(a)) / 864e5);
  const cents = n => Math.round(n * 100) / 100;
  const us = s => s ? `${s.slice(5, 7)}/${s.slice(8, 10)}/${s.slice(0, 4)}` : "";
  const key = p => `${p.emp}|${p.rel}|${p.first.toLowerCase()}`;
  const age = (dob, on) => { const a = D(dob), b = D(on); return b.getFullYear() - a.getFullYear() - (b < new Date(b.getFullYear(), a.getMonth(), a.getDate(), 12) ? 1 : 0); };

  /* the file against last month's roster: who's new, who left, who changed, and what needs a person */
  function roster(E, H, G) {
    const prior = H.roster.map(r => ({ ...r, dob: Parsers.isoDate(r.dob) }));
    let nextId = Math.max(...prior.map(r => +r.id.slice(3))) + 1;
    const seen = new Set(), members = [];
    const find = (p, test) => prior.find(r => !seen.has(r.id) && test(r));
    for (const p of E.people) {                                                     // name and birth date, then name, then birth date
      const was = find(p, r => key(r) === key(p) && r.dob === p.dob) || find(p, r => key(r) === key(p)) || find(p, r => r.emp === p.emp && r.rel === p.rel && r.dob === p.dob);
      const m = { ...p, id: was ? was.id : `RM-${nextId++}`, prior: was || null, start: null, end: null, events: [] };
      if (was) seen.add(was.id);
      members.push(m);
    }
    const emps = new Map(members.filter(m => m.rel === "E").map(m => [m.emp, m]));
    for (const m of members) {
      const ee = emps.get(m.emp);
      if (!m.prior) {                                                               // new to the plan
        if (m.rel === "E") { m.start = firstAfter(m.hire); m.events.push({ type: "add", text: `New hire ${us(m.hire)} · covered from ${us(m.start)}` }); }
        else if (ee && !ee.prior) { m.start = firstAfter(ee.hire); m.events.push({ type: "add", text: `Dependent of a new hire · covered from ${us(m.start)}` }); }
        else if (m.rel === "C" && days(m.dob, G.monthStart) < 60) { m.start = m.dob; m.events.push({ type: "add", text: `Born ${us(m.dob)} · covered from birth` }); }
        else { m.start = G.monthStart; m.events.push({ type: "add", text: `Added · covered from ${us(m.start)}` }); }
      } else if (m.prior.tier !== m.tier && m.rel === "E") {
        m.events.push({ type: "change", text: `${DATA.tiers[m.prior.tier]} to ${DATA.tiers[m.tier]}` });
      }
      const t = m.term || (ee && ee.term);
      if (t) { m.end = t; if (m.rel === "E") m.events.push({ type: "term", text: `Terminated ${us(t)} · reported ${days(t, G.received)} days later`, retro: t < G.monthStart }); }
      if (m.rel === "C" && age(m.dob, G.monthStart) >= G.childAge) {
        const birthday = `${+m.dob.slice(0, 4) + G.childAge}${m.dob.slice(4)}`;
        m.end = m.end && m.end < monthEnd(birthday) ? m.end : monthEnd(birthday);
        m.events.push({ type: "aged", text: `Turned ${G.childAge} on ${us(birthday)} · coverage ended ${us(m.end)}` });
      }
    }
    const missing = prior.filter(r => !seen.has(r.id));
    const flags = [
      ...members.filter(m => m.events.some(e => e.type === "aged")).map(m => ({ kind: "crit", type: "aged", m, title: `${m.first} ${m.last} is over ${G.childAge} and still on the file`,
        body: `${m.events.find(e => e.type === "aged").text}. Termed on ${us(m.end)}, and a COBRA election notice queued.` })),
      ...members.filter(m => m.events.some(e => e.type === "term" && e.retro)).map(m => ({ kind: "crit", type: "retro", m, title: `${m.first} ${m.last}'s termination arrived ${days(m.end, G.received)} days late`,
        body: `Ridgeway's August file still listed ${m.first} as active. Claims after ${us(m.end)} are checked on the claims tab.` })),
      ...missing.filter(r => r.rel === "E").map(r => ({ kind: "warn", type: "missing", m: r, title: `${r.first} ${r.last} dropped off with no term date`,
        body: `On August's file, not on September's, and no termination date given. Kept active until Ridgeway confirms, so nobody loses coverage over a missing row.` })),
    ];
    const byId = new Map([...members.map(m => [m.id, m]), ...missing.map(r => [r.id, { ...r, missing: true, events: [] }])]);
    return { members, missing, flags, byId,
      adds: members.filter(m => m.events.some(e => e.type === "add")), terms: members.filter(m => m.events.some(e => e.type === "term")),
      changes: members.filter(m => m.events.some(e => e.type === "change")), aged: members.filter(m => m.events.some(e => e.type === "aged")) };
  }

  /* every paid claim against the coverage dates the file produced */
  function claimCheck(C, R) {
    const flagged = [];
    for (const l of C.lines) {
      const m = R.byId.get(l.id);
      if (!m) { flagged.push({ l, why: "Not on the roster" }); continue; }
      if (m.end && l.dos > m.end) flagged.push({ l, m, why: m.events.some(e => e.type === "aged") ? `Service after coverage ended at ${DATA.group.childAge}` : "Service after termination" });
      else if (m.start && l.dos < m.start) flagged.push({ l, m, why: "Service before coverage started" });
    }
    const people = [...new Set(flagged.map(f => f.l.id))].map(id => {
      const fs = flagged.filter(f => f.l.id === id), m = fs[0].m;
      return { id, m, lines: fs.map(f => f.l), why: fs[0].why, total: cents(fs.reduce((s, f) => s + f.l.amount, 0)),
        before: C.lines.filter(l => l.id === id && !fs.some(f => f.l === l)) };
    });
    return { checked: C.lines.length, flagged, people, total: cents(flagged.reduce((s, f) => s + f.l.amount, 0)) };
  }

  /* each claimant against the specific deductible and the notice rules */
  function stopLoss(C, R, H, P, sent = {}) {
    const paidMonth = C.lines.reduce((a, l) => l.paid > a ? l.paid : a, "");
    const due = addDays(monthEnd(paidMonth), P.noticeDays);
    const ids = new Set([...Object.keys(H.claimants), ...C.lines.filter(l => l.dx && P.triggers.some(t => l.dx.toLowerCase().includes(t))).map(l => l.id)]);
    const totals = {}; C.lines.forEach(l => { totals[l.id] = (totals[l.id] || 0) + l.amount; });
    Object.entries(totals).forEach(([id, t]) => { if (t + ((H.claimants[id] || {}).paid || 0) >= P.specific * 0.25) ids.add(id); });
    const rows = [...ids].map(id => {
      const h = H.claimants[id] || { paid: 0, dx: [] }, month = C.lines.filter(l => l.id === id);
      const dx = [...new Set([...h.dx, ...month.map(l => l.dx)])].filter(x => x && x !== "Pharmacy");
      const ytd = cents(h.paid + month.reduce((s, l) => s + l.amount, 0)), pct = ytd / P.specific;
      const trigger = dx.find(x => P.triggers.some(t => x.toLowerCase().includes(t))) || null;
      const need = pct >= P.threshold || !!trigger, notified = H.notices[id] || sent[id] || null;
      const m = R.byId.get(id) || {};
      return { id, m, rel: { E: "Employee", S: "Spouse", C: "Child" }[m.rel] || "", before: h.paid, month: cents(ytd - h.paid), ytd, pct, dx, trigger, need, notified,
        due: need && !notified ? due : null, first: month.length ? month.reduce((a, l) => l.dos < a ? l.dos : a, month[0].dos) : null,
        toThreshold: cents(P.specific * P.threshold - ytd), status: need ? (notified ? "notified" : "due") : "watch" };
    }).sort((a, b) => b.ytd - a.ytd);
    return { rows, due, paidMonth, open: rows.filter(r => r.status === "due") };
  }

  /* the plan year against the aggregate attachment point */
  function aggregate(C, H, P) {
    const months = H.monthsBefore + 1, ytd = cents(H.paidBefore + C.total), prorated = cents(P.attachment * months / 12);
    return { months, ytd, prorated, pct: ytd / prorated, ofAnnual: ytd / P.attachment, expected: cents(P.attachment / 1.25 / 12) };
  }

  function report(R, C, H, P, SL) {
    const count = (list, get) => Object.fromEntries(Object.keys(DATA.tiers).map(t => [t, list.filter(x => get(x) === t).length]));
    const active = R.members.filter(m => m.rel === "E" && !(m.end && m.end < DATA.group.monthStart)).concat(R.missing.filter(r => r.rel === "E"));
    const priorEEs = H.roster.filter(r => r.rel === "E");
    const now = count(active, m => m.tier), before = count(priorEEs, r => r.tier);
    const covered = R.members.filter(m => !(m.end && m.end < DATA.group.monthStart)).length + R.missing.length;
    const cat = {}; C.lines.forEach(l => { const k = l.service === "Pharmacy" ? "Pharmacy" : l.service; cat[k] = (cat[k] || 0) + l.amount; });
    const rx = cents(cat.Pharmacy || 0), medical = cents(C.total - rx);
    return { now, before, employees: active.length, priorEmployees: priorEEs.length, covered, medical, rx, total: C.total,
      pepm: C.total / priorEEs.length, byService: Object.entries(cat).map(([k, v]) => [k, cents(v)]).sort((a, b) => b[1] - a[1]),
      agg: aggregate(C, H, P), large: SL.rows.filter(r => r.need || r.pct >= 0.4) };
  }

  return { roster, claimCheck, stopLoss, aggregate, report, us, days, monthEnd, addDays };
})();
