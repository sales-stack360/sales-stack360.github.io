/* Document readers for TPA Desk: an employer's eligibility file in whatever layout the employer uses, the claims
   system's paid claims register and a stop-loss policy summary. Real parsing of the files handed in. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];

  // any common date spelling to YYYY-MM-DD
  function isoDate(s) {
    s = String(s || "").trim(); if (!s) return "";
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/); if (!m) return "";
    const y = m[3].length === 2 ? (+m[3] > 30 ? "19" : "20") + m[3] : m[3];
    return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }

  /* the administrator's standard eligibility layout, and how each field shows up in employers' files */
  const FIELDS = [
    { key: "emp", label: "Employee ID", head: /emp(loyee)?\s*(id|no|num|#)|payroll|badge|clock/i },
    { key: "last", label: "Last name", head: /last|surname/i },
    { key: "first", label: "First name", head: /first|given/i },
    { key: "ssn", label: "SSN, last four", head: /ssn|social/i },
    { key: "dob", label: "Date of birth", head: /birth|dob/i, date: true },
    { key: "rel", label: "Relationship", head: /relation|^rel$|dep(endent)?\s*(code|type)|member\s*type/i },
    { key: "hire", label: "Hire date", head: /hire|doh|start/i, date: true },
    { key: "term", label: "Termination date", head: /term|separat|end\s*date/i, date: true },
    { key: "plan", label: "Plan", head: /plan/i },
    { key: "tier", label: "Coverage tier", head: /coverage|tier|level/i },
  ];
  const REL = { EE: "E", E: "E", EMP: "E", EMPLOYEE: "E", SELF: "E", SUB: "E", SUBSCRIBER: "E",
    SP: "S", S: "S", SPOUSE: "S", SPS: "S", DP: "S", "DOMESTIC PARTNER": "S", WIFE: "S", HUSBAND: "S",
    CH: "C", C: "C", CHILD: "C", DEP: "C", DEPENDENT: "C", SON: "C", DAUGHTER: "C", STEPCHILD: "C" };
  const tierOf = v => { const s = String(v || "").toUpperCase();
    if (/FAM/.test(s)) return "FAM"; if (/SP|\+ ?S\b|ES\b/.test(s)) return "ES"; if (/CH|\+ ?C\b|EC\b|KID/.test(s)) return "EC";
    if (/ONLY|SINGLE|^EE$|^EMP$|EMPLOYEE/.test(s)) return "EE"; return ""; };

  function classify(name, text) {
    const head = (text.split(/\r?\n/)[0] || "").toLowerCase();
    if (/\.csv$/i.test(name) && /claim/.test(head) && /paid/.test(head)) return "claims";
    if (/\.csv$/i.test(name) && /(birth|dob)/.test(head) && /(last|first|name)/.test(head)) return "elig";
    if (/stop.?loss policy summary/i.test(text) || /specific deductible/i.test(text)) return "stoploss";
    return "unknown";
  }

  /* map an employer's columns onto the standard layout: by the header first, then by what's in the column */
  function mapColumns(head, rows) {
    const used = new Set(), map = [];
    const sample = k => (rows.find(r => (r[k] || "").trim()) || [])[k] || "";
    head.forEach((h, k) => {
      let f = FIELDS.find(f => !used.has(f.key) && f.head.test(h)), how = "column name";
      if (!f) {                                                                       // look at the values instead
        const vals = rows.slice(0, 40).map(r => (r[k] || "").trim()).filter(Boolean);
        if (vals.length && vals.every(v => REL[v.toUpperCase()]) && !used.has("rel")) { f = FIELDS.find(x => x.key === "rel"); how = "values"; }
        else if (vals.length && vals.every(v => tierOf(v)) && !used.has("tier")) { f = FIELDS.find(x => x.key === "tier"); how = "values"; }
      }
      if (f) used.add(f.key);
      const seen = how === "values" ? [...new Set(rows.map(r => (r[k] || "").trim()).filter(Boolean))] : [];
      map.push({ col: h, k, field: f ? f.key : null, label: f ? f.label : null, how: f ? how : null, sample: sample(k), seen });
    });
    const missing = FIELDS.filter(f => !used.has(f.key) && f.key !== "term" && f.key !== "ssn").map(f => f.label);
    return { map, missing };
  }

  function eligibility(text, G) {
    const rows = UI.parseCSV(text), head = rows[0], body = rows.slice(1);
    const { map, missing } = mapColumns(head, body);
    const col = key => (map.find(m => m.field === key) || {}).k;
    const K = Object.fromEntries(FIELDS.map(f => [f.key, col(f.key)]));
    const get = (r, key) => K[key] == null ? "" : (r[K[key]] || "").trim();
    const codes = { rel: {}, tier: {}, plan: {} }, problems = [];
    const people = body.map((r, i) => {
      const rawRel = get(r, "rel"), rawTier = get(r, "tier"), rawPlan = get(r, "plan");
      const p = { row: i, emp: get(r, "emp"), last: get(r, "last"), first: get(r, "first"), ssn: get(r, "ssn"),
        dob: isoDate(get(r, "dob")), rel: REL[rawRel.toUpperCase()] || "", hire: isoDate(get(r, "hire")), term: isoDate(get(r, "term")),
        tier: tierOf(rawTier), plan: G.plans[rawPlan] || rawPlan, raw: { dob: get(r, "dob"), rel: rawRel, tier: rawTier, plan: rawPlan } };
      codes.rel[rawRel] = p.rel; codes.tier[rawTier] = p.tier; codes.plan[rawPlan] = p.plan;
      if (!p.rel || !p.tier || !p.dob) problems.push({ row: i, what: !p.rel ? "relationship" : !p.tier ? "coverage tier" : "date of birth" });
      return p;
    });
    return { head, map, missing, people, codes, problems, fields: people.length * map.filter(m => m.field).length };
  }

  function claims(text) {
    const rows = UI.parseCSV(text), head = rows[0].map(h => h.toLowerCase());
    const c = re => head.findIndex(h => re.test(h));
    const K = { claim: c(/claim/), id: c(/member/), patient: c(/patient|name/), rel: c(/^rel/), dos: c(/service date|dos|incurred/), paid: c(/paid date|check date/),
      provider: c(/provider/), service: c(/^service$|category|type of service/), dx: c(/diagnosis|dx/), billed: c(/billed|charge/), amount: head.lastIndexOf("paid") };
    const lines = rows.slice(1).map((r, i) => ({ row: i, claim: r[K.claim], id: r[K.id], patient: r[K.patient], rel: r[K.rel], dos: isoDate(r[K.dos]), paid: isoDate(r[K.paid]),
      provider: r[K.provider], service: r[K.service], dx: r[K.dx], billed: parseFloat(r[K.billed]) || 0, amount: parseFloat(r[K.amount]) || 0 }));
    return { lines, total: Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100, fields: lines.length * 11 };
  }

  function stoploss(doc) {
    const kv = {}; let fields = 0;
    for (const line of doc.lines) { const c = split(line); if (c.length === 2 && c[0] !== "Requirement") { kv[c[0]] = c[1]; fields++; } }
    const pct = s => { const m = String(s || "").match(/(\d+(?:\.\d+)?)\s*%/); return m ? +m[1] / 100 : null; };
    const days = (String(kv["Notice Deadline"] || "").match(/(\d+)\s*days/) || [])[1];
    return { carrier: (doc.lines[0] || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()), policy: kv["Policy Number"], period: kv["Policy Period"], basis: kv["Contract Basis"],
      specific: UI.parseMoney(kv["Specific Deductible"]), attachment: UI.parseMoney(kv["Aggregate Attachment Point"]),
      threshold: pct(kv["Notice Threshold"]), triggers: (kv["Trigger Diagnoses"] || "").split(/,\s*/).map(s => s.trim().toLowerCase()).filter(Boolean),
      noticeDays: days ? +days : 30, deadlineText: kv["Notice Deadline"], fields };
  }

  return { classify, eligibility, claims, stoploss, isoDate, FIELDS };
})();
