/* FMO Desk: checks an agent's packet against every carrier's contracting rules before anything is submitted, and
   reconciles carrier commission statements against the book, agent by agent. */
const Contract = (() => {
  const D = s => new Date(s + "T12:00:00");
  const days = (a, b) => Math.round((D(b) - D(a)) / 864e5);
  const months = (a, b) => { const x = D(a), y = D(b); return (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth() - (y.getDate() < x.getDate() ? 1 : 0); };
  const us = s => s ? `${s.slice(5, 7)}/${s.slice(8, 10)}/${s.slice(0, 4)}` : "";

  function evaluate(I, L, E, T, today) {
    const key = name => Object.keys(DATA.carriers).find(k => DATA.carriers[k].name.toLowerCase() === name.toLowerCase());
    const eoLeft = days(today, E.to);
    const rows = I.carriers.map(({ name }) => {
      const k = key(name), c = DATA.carriers[k] || { name, line: "Health" };
      const reqs = [];
      if (c.ahip) { const y = T.ahip && T.ahip.year; reqs.push({ id: "ahip", label: `AHIP, plan year ${c.ahip}`, ok: !!y && y >= c.ahip,
        detail: !y ? "No AHIP certificate in the packet" : y >= c.ahip ? `Plan year ${y}` : `Certificate is for plan year ${y}` }); }
      if (c.eo) { const ok = E.limit >= c.eo && eoLeft >= DATA.eoMinDays;
        reqs.push({ id: "eo", label: `E&O ${UI.money(c.eo)}`, ok, detail: E.limit < c.eo ? `Limit ${UI.money(E.limit)}` : ok ? `Through ${us(E.to)}` : `Expires ${us(E.to)}, in ${eoLeft} days` }); }
      if (c.aml) { const age = T.aml ? months(T.aml.done, today) : null;
        reqs.push({ id: "aml", label: `AML within ${c.aml} months`, ok: age != null && age <= c.aml, detail: age == null ? "No AML course in the packet" : `Taken ${us(T.aml.done)}, ${age} months ago` }); }
      if (c.annuity) reqs.push({ id: "annuity", label: "Annuity best-interest training", ok: !!T.annuity, detail: T.annuity ? `Taken ${us(T.annuity.done)}` : "Not in the packet" });
      const states = I.states.map(({ st }) => {
        const lic = L.rows.find(r => r.st === st), line = new RegExp(c.line, "i");
        if (!lic) return { st, ok: false, why: `No ${st} license` };
        if (!/active/i.test(lic.status)) return { st, ok: false, why: `${st} license ${lic.status.toLowerCase()}${lic.applied ? `, applied ${us(lic.applied)}` : ""}`, pending: true };
        if (!line.test(lic.lines)) return { st, ok: false, why: `No ${c.line.toLowerCase()} authority in ${st}` };
        return { st, ok: true, why: `License ${lic.no}` };
      });
      const blocked = reqs.filter(r => !r.ok), okStates = states.filter(s => s.ok);
      const status = blocked.length ? "blocked" : okStates.length === states.length ? "ready" : okStates.length ? "partial" : "blocked";
      return { key: k, c, reqs, states, blocked, okStates, status };
    });
    const fixes = [];
    const add = (id, text, who) => { const f = fixes.find(x => x.id === id); if (f) f.carriers.push(who); else fixes.push({ id, text, carriers: [who] }); };
    rows.forEach(r => r.blocked.forEach(b => add(b.id, {
      ahip: `Complete AHIP for plan year ${r.c.ahip} and upload the certificate`,
      eo: `Send the renewed E&O certificate (the current one ends ${us(E.to)})`,
      aml: "Retake the AML course (the one on file is too old for some carriers)",
      annuity: "Complete annuity best-interest training",
    }[b.id], r.c.name)));
    const pendingStates = [...new Set(rows.flatMap(r => r.states.filter(s => s.pending).map(s => s.st)))];
    return { rows, fixes, pendingStates, eoLeft, ready: rows.filter(r => r.status !== "blocked"), appointments: rows.filter(r => r.status !== "blocked").reduce((s, r) => s + r.okStates.length, 0) };
  }

  return { evaluate, days, months, us };
})();

const Comm = (() => {
  const cents = n => Math.round(n * 100) / 100;
  const agentOf = npn => BOOK.agents.find(a => a.npn === npn);

  function reconcile(stmts) {
    const carriers = [...new Set(stmts.map(s => s.carrier))];
    const lines = stmts.flatMap(s => s.lines.map(l => ({ ...l, carrier: s.carrier })));
    const byPolicy = new Map(lines.map(l => [l.policy, l]));
    const rows = BOOK.policies.filter(p => carriers.includes(p.carrier)).map(p => {
      const l = byPolicy.get(p.policy || p.id), agent = BOOK.agents.find(a => a.id === p.agent);
      const r = { p, l, agent, expected: p.expected, paid: l ? l.amount : 0, diff: cents((l ? l.amount : 0) - p.expected) };
      if (!l) r.status = "missing";
      else if (l.npn !== agent.npn) { r.status = "agent"; r.paidTo = agentOf(l.npn); }
      else if (Math.abs(r.diff) < 0.01) r.status = p.expected < 0 ? "chargeback" : "ok";
      else r.status = r.diff < 0 ? "short" : "over";
      if (r.status === "short" && p.carrier === "crestline" && l.type === "renewal" && p.kind === "initial") r.why = "Paid at the renewal rate in the first year";
      return r;
    });
    const known = new Set(rows.map(r => r.p.id));
    const unknown = lines.filter(l => !known.has(l.policy));
    const by = k => rows.filter(r => r.p.carrier === k);
    const summary = carriers.map(k => ({ key: k, name: DATA.carriers[k].name, format: stmts.find(s => s.carrier === k).format, lines: stmts.find(s => s.carrier === k).lines.length,
      expected: cents(by(k).reduce((s, r) => s + r.expected, 0)), paid: cents(stmts.find(s => s.carrier === k).total),
      issues: by(k).filter(r => ["missing", "short", "over", "agent"].includes(r.status)).length }));
    const issues = rows.filter(r => ["missing", "short", "over", "agent"].includes(r.status));
    const owed = cents(issues.filter(r => r.status !== "agent").reduce((s, r) => s - r.diff, 0));
    return { rows, unknown, summary, issues, owed, chargebacks: rows.filter(r => r.status === "chargeback") };
  }

  /* each agent's share of what came in, credited to the agent who wrote the business */
  function payouts(R) {
    return BOOK.agents.map(a => {
      const mine = R.rows.filter(r => r.agent.id === a.id && r.l);
      const received = cents(mine.reduce((s, r) => s + r.paid, 0));
      const charge = cents(mine.filter(r => r.status === "chargeback").reduce((s, r) => s + r.paid, 0));
      const share = cents(received * a.level);
      const pending = R.rows.filter(r => r.agent.id === a.id && (r.status === "missing" || r.status === "short"));
      const moved = mine.filter(r => r.status === "agent");
      return { a, lines: mine.length, received, charge, share, keep: cents(received - share), pending, pendingAmt: cents(pending.reduce((s, r) => s - r.diff, 0)), moved };
    });
  }

  return { reconcile, payouts };
})();
