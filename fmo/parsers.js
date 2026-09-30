/* Document readers for FMO Desk: an agent's contracting packet (intake form, producer license summary, E&O certificate,
   training transcript) and carrier commission statements, as a CSV export or a PDF. Real parsing of the files handed in. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];
  const iso = s => { const m = String(s || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : ""; };
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;

  function classify(name, text) {
    if (/\.csv$/i.test(name)) { const head = (text.split(/\r?\n/)[0] || "").toLowerCase(); return /comm|commission/.test(head) && /agent/.test(head) ? "statement" : "unknown"; }
    if (/contracting intake/i.test(text)) return "intake";
    if (/producer license summary/i.test(text)) return "license";
    if (/errors and omissions/i.test(text)) return "eo";
    if (/training transcript/i.test(text)) return "training";
    if (/commission statement/i.test(text)) return "statement";
    return "unknown";
  }

  // walk a document's lines by section heading
  function sections(lines, heads) {
    const out = { _: [] }; let cur = "_";
    for (const l of lines) { const h = heads.find(h => h.test(l)); if (h) { cur = String(h); out[cur] = []; continue; } out[cur].push(l); }
    return k => out[String(k)] || [];
  }

  function intake(doc) {
    const H = [/^carriers requested$/i, /^states to sell$/i, /^background questions$/i], sec = sections(doc.lines, H);
    const kv = {}; sec("_").forEach(l => { const c = split(l); if (c.length === 2) kv[c[0]] = c[1]; });
    const carriers = sec(H[0]).map(split).filter(c => c.length === 2 && c[0] !== "Carrier").map(c => ({ name: c[0], product: c[1] }));
    const states = sec(H[1]).map(split).filter(c => c.length === 2 && /^[A-Z]{2}$/.test(c[0])).map(c => ({ st: c[0], why: c[1] }));
    const background = sec(H[2]).map(split).filter(c => c.length === 2 && c[0] !== "Question").map(c => ({ q: c[0], a: c[1] }));
    return { name: kv["Agent Name"], npn: kv["NPN"], resident: kv["Resident State"], agency: kv["Agency"], address: kv["Business Address"], email: kv["Email"], phone: kv["Phone"],
      deposit: kv["Direct Deposit"], signed: kv["Signed"], carriers, states, background, fields: Object.keys(kv).length + carriers.length * 2 + states.length + background.length };
  }

  function license(doc) {
    const rows = doc.lines.map(split).filter(c => c.length === 6 && /^[A-Z]{2}$/.test(c[0]))
      .map(c => ({ st: c[0], type: c[1], no: c[2], lines: c[3], status: c[4], expires: /applied/i.test(c[5]) ? "" : iso(c[5]), applied: /applied/i.test(c[5]) ? iso(c[5]) : "" }));
    const appts = doc.lines.some(l => /none on record/i.test(l)) ? [] : null;
    return { rows, appts, fields: rows.length * 6 };
  }

  function eo(doc) {
    const kv = {}; doc.lines.forEach(l => { const c = split(l); if (c.length === 2) kv[c[0]] = c[1]; });
    const [from, to] = (kv["Policy Period"] || "").split(/\s+to\s+/);
    return { insurer: titleCase(doc.lines[0] || ""), insured: kv["Named Insured"], policy: kv["Policy Number"], coverage: kv["Coverage"],
      limit: UI.parseMoney(kv["Limit Each Claim"]), aggregate: UI.parseMoney(kv["Aggregate Limit"]), from: iso(from), to: iso(to), fields: Object.keys(kv).length };
  }

  function training(doc) {
    const rows = doc.lines.map(split).filter(c => c.length === 4 && /\d{2}\/\d{2}\/\d{4}/.test(c[1]))
      .map(c => ({ course: c[0], done: iso(c[1]), valid: c[2], result: c[3], year: +((c[2].match(/plan year (\d{4})/i) || [])[1] || 0) || null }));
    const find = re => rows.find(r => re.test(r.course)) || null;
    return { rows, ahip: find(/ahip|medicare \+ fraud/i), aml: find(/money laundering|\baml\b/i), annuity: find(/annuity/i), fields: rows.length * 4 };
  }

  /* a commission statement, whichever carrier and format: one line per policy paid or charged back */
  function statementCSV(text, name = "") {
    const rows = UI.parseCSV(text), head = rows[0].map(h => h.toLowerCase()), c = re => head.findIndex(h => re.test(h));
    const K = { npn: c(/npn/), agent: c(/writing agent$|^agent/), id: c(/member id|policy/), member: c(/member name|insured/), plan: c(/plan/), eff: c(/eff/), type: c(/type/), amount: c(/amount|commission/), note: c(/note/) };
    const lines = rows.slice(1).map((r, i) => ({ row: i, policy: r[K.id], member: titleCase(r[K.member] || "").replace(/^(\w[\w' -]*), (.*)$/, "$2 $1"), npn: r[K.npn], agent: titleCase(r[K.agent] || ""),
      plan: r[K.plan], eff: iso(r[K.eff]), type: (r[K.type] || "").toLowerCase(), amount: parseFloat(r[K.amount]) || 0, note: r[K.note] || "" }));
    return { carrier: Object.keys(DATA.carriers).find(k => name.toLowerCase().includes(k)) || "unknown", format: "CSV", period: rows[1] ? rows[1][0] : "", lines, total: Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100, fields: lines.length * 10 };
  }
  function statementPDF(doc) {
    const kv = {}, lines = [];
    doc.lines.forEach(l => { const c = split(l);
      if (c.length === 7 && /^[A-Z]{2}-\d+/.test(c[0])) { const m = c[2].match(/^(.*?)\s*\((\d+)\)$/) || [];
        lines.push({ row: lines.length, policy: c[0], member: c[1], agent: m[1] || c[2], npn: m[2] || "", eff: iso(c[3]), premium: UI.parseMoney(c[4]), rate: parseFloat(c[5]) / 100, amount: UI.parseMoney(c[6]), type: parseFloat(c[5]) >= 20 ? "new" : "renewal", note: "" }); }
      else if (c.length === 2) kv[c[0]] = c[1]; });
    const first = (doc.lines[0] || "").toLowerCase();
    return { carrier: Object.keys(DATA.carriers).find(k => first.includes(k)) || "unknown", format: "PDF", period: kv["Commission Period"], date: kv["Statement Date"], payee: kv["Payee"],
      lines, total: Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100, fields: lines.length * 7 + Object.keys(kv).length };
  }

  return { classify, intake, license, eo, training, statementCSV, statementPDF, iso };
})();
