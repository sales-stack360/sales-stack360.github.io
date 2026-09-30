/* Document readers for Benefits Desk: messy census files, carrier quote PDFs in different layouts,
   and self-funded bids (TPA, PBM, stop loss). All real parsing of the files handed in. */
const Parsers = (() => {
  const EFFECTIVE = new Date("2026-11-01T12:00:00");

  /* ================= census ================= */
  const FIELDS = [
    ["rel", /^rel|relationship|member type|dependent type/i, "Relationship"],
    ["dob", /d\.?o\.?b|birth/i, "Date of birth"],
    ["sex", /^sex$|gender/i, "Gender"],
    ["zip", /zip|postal/i, "Home zip"],
    ["location", /office|location|site|branch/i, "Work location"],
    ["hire", /hire/i, "Hire date"],
    ["dental", /dental/i, "Dental election"],
    ["tier", /cov|tier|medical|election/i, "Medical coverage tier"],
    ["title", /title|position|job/i, "Job title"],
    ["salary", /salary|comp|wage|pay/i, "Annual salary"],
    ["name", /name|member|employee/i, "Full name"],
  ];

  function mapColumns(header) {
    const used = new Set();
    return header.map((h, i) => {
      const f = FIELDS.find(([k, re]) => !used.has(k) && re.test(h));
      if (!f) return { col: h, i, key: null, label: "Not used", conf: 0 };
      used.add(f[0]);
      const exact = h.toLowerCase().replace(/[^a-z]/g, "") === f[2].toLowerCase().replace(/[^a-z]/g, "");
      const conf = exact ? 0.99 : ({ dob: 0.93, tier: 0.88, rel: 0.9, location: 0.86, hire: 0.91 }[f[0]] || 0.95);
      return { col: h, i, key: f[0], label: f[2], conf };
    });
  }

  function parseDate(s) {
    s = (s || "").trim(); let m;
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return new Date(+m[3], +m[1] - 1, +m[2], 12);
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return new Date(+m[1], +m[2] - 1, +m[3], 12);
    if ((m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/))) { const yy = +m[3]; return new Date(yy > 26 ? 1900 + yy : 2000 + yy, +m[1] - 1, +m[2], 12); }
    return null;
  }
  const age = d => { if (!d) return null; let a = EFFECTIVE.getFullYear() - d.getFullYear(); if (EFFECTIVE < new Date(EFFECTIVE.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  const mdy = d => d ? `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}` : "";
  function tierOf(s) {
    s = (s || "").toLowerCase();
    if (/waiv|declin|none/.test(s)) return "W";
    if (/fam/.test(s)) return "FAM";
    if (/sp/.test(s)) return "ES";
    if (/ch|kid/.test(s)) return "EC";
    if (/ee|emp/.test(s)) return "EE";
    return null;
  }
  const TIER_LABEL = { EE: "Employee only", ES: "Employee + spouse", EC: "Employee + child(ren)", FAM: "Family", W: "Waived" };

  function census(text, filename) {
    const rows = UI.parseCSV(text); const header = rows[0]; const map = mapColumns(header);
    const idx = Object.fromEntries(map.filter(m => m.key).map(m => [m.key, m.i]));
    const get = (r, k) => idx[k] == null ? "" : (r[idx[k]] || "").trim();
    const people = [], issues = []; let cur = null; const seen = new Map();
    rows.slice(1).forEach((r, n) => {
      const line = n + 2; const full = get(r, "name"); const [last, first] = full.includes(",") ? full.split(",").map(s => s.trim()) : [full.split(" ").slice(-1)[0], full.split(" ").slice(0, -1).join(" ")];
      const rel = /spouse|partner/i.test(get(r, "rel")) ? "Spouse" : /child|son|daughter|dep/i.test(get(r, "rel")) ? "Child" : "Employee";
      const d = parseDate(get(r, "dob"));
      const p = { line, first, last, rel, dobRaw: get(r, "dob"), dob: d, age: age(d), sex: get(r, "sex"), zip: get(r, "zip"),
        location: get(r, "location"), hire: get(r, "hire"), tierRaw: get(r, "tier"), tier: tierOf(get(r, "tier")), title: get(r, "title"), deps: [] };
      if (rel === "Employee") {
        const key = `${last}|${first}|${p.dobRaw}`.toLowerCase();
        if (seen.has(key)) { issues.push({ sev: "ok", type: "Duplicate row", who: `${first} ${last}`, line, detail: `Same employee as line ${seen.get(key)}. Duplicate removed.`, fixed: true }); cur = null; return; }
        seen.set(key, line); people.push(p); cur = p;
      } else if (cur) { p.location = cur.location; cur.deps.push(p); }
    });
    const zipByLoc = {};
    people.forEach(p => { if (/^\d{5}$/.test(p.zip) && p.location) zipByLoc[p.location] = p.zip; });
    people.forEach(p => {
      const nm = `${p.first} ${p.last}`;
      if (!p.dob) issues.push({ sev: "crit", type: "Missing date of birth", who: nm, line: p.line, detail: "Carriers rate by age. Request from HR before the census goes out.", fixed: false, ask: true });
      if (!/^\d{5}$/.test(p.zip)) {
        const fix = zipByLoc[p.location];
        issues.push({ sev: "warn", type: "Invalid zip code", who: nm, line: p.line, detail: `"${p.zip}" is not a valid zip.${fix ? ` Other ${p.location} employees use ${fix}; corrected to ${fix}.` : ""}`, fixed: !!fix });
        if (fix) p.zip = fix;
      }
      const sp = p.deps.filter(d => d.rel === "Spouse").length, ch = p.deps.filter(d => d.rel === "Child");
      const want = { EE: [0, 0], ES: [1, 0], EC: [0, 1], FAM: [1, 1] }[p.tier];
      if (want && ((want[0] && !sp) || (want[1] && !ch.length) || (!want[0] && sp) || (!want[1] && ch.length))) {
        issues.push({ sev: "warn", type: "Tier does not match dependents", who: nm, line: p.line,
          detail: `Elected ${TIER_LABEL[p.tier]} but ${sp || ch.length ? `${sp ? "a spouse" : ""}${sp && ch.length ? " and " : ""}${ch.length ? ch.length + " child" + (ch.length > 1 ? "ren" : "") : ""} listed` : "no dependents are listed"}. Confirm the election with the employee.`, fixed: false, ask: true });
      }
      ch.forEach(c => { if (c.age != null && c.age >= 26) issues.push({ sev: "crit", type: "Dependent over age 26", who: `${c.first} ${c.last}`, line: c.line, detail: `Age ${c.age} on the 11/01/2026 effective date. Not eligible as a dependent child; removed from the carrier census.`, fixed: true, drop: c }); });
      if (p.tier == null) issues.push({ sev: "warn", type: "Unreadable coverage election", who: nm, line: p.line, detail: `"${p.tierRaw}"`, fixed: false });
    });
    issues.filter(i => i.drop).forEach(i => people.forEach(p => (p.deps = p.deps.filter(d => d !== i.drop))));
    const enrolled = people.filter(p => p.tier && p.tier !== "W");
    const tiers = { EE: 0, ES: 0, EC: 0, FAM: 0, W: 0 }; people.forEach(p => p.tier && tiers[p.tier]++);
    const ages = people.map(p => p.age).filter(a => a != null);
    const locs = {}; people.forEach(p => { const L = p.location || "Unassigned"; locs[L] = locs[L] || { employees: 0, enrolled: 0 }; locs[L].employees++; if (p.tier && p.tier !== "W") locs[L].enrolled++; });
    const tierWords = [...new Set(rows.slice(1).map(r => get(r, "tier")).filter(Boolean))];
    const dateFormats = new Set(people.map(p => /^\d{4}-/.test(p.dobRaw) ? "YYYY-MM-DD" : /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(p.dobRaw) ? "M/D/YYYY" : /^\d{2}-\d{2}-\d{2}$/.test(p.dobRaw) ? "MM-DD-YY" : null).filter(Boolean));
    return { filename, rowsIn: rows.length - 1, map, people, issues, tiers, enrolled: enrolled.length,
      dependents: people.reduce((s, p) => s + p.deps.length, 0), avgAge: ages.reduce((a, b) => a + b, 0) / (ages.length || 1),
      locations: locs, tierWords, dateFormats: [...dateFormats] };
  }

  function censusExport(res, format) {
    const out = [];
    if (format === "meridian") {
      out.push(["Last Name", "First Name", "Relationship", "Date of Birth", "Gender", "Home Zip", "Coverage Tier", "Work Location"]);
      res.people.forEach(p => {
        const code = { EE: "EE", ES: "ES", EC: "EC", FAM: "FAM", W: "WAIVE" }[p.tier] || "";
        out.push([p.last, p.first, "EMP", mdy(p.dob), p.sex, p.zip, code, p.location]);
        p.deps.forEach(d => out.push([d.last, d.first, d.rel === "Spouse" ? "SPS" : "CHD", mdy(d.dob), d.sex, p.zip, code, p.location]));
      });
    } else {
      out.push(["Employee ID", "Member Type", "Name", "Birth Date", "Sex", "Zip", "Medical", "Age"]);
      res.people.forEach((p, i) => {
        const id = "TOD" + String(i + 1).padStart(3, "0"); const tier = TIER_LABEL[p.tier] || "";
        out.push([id, "Subscriber", `${p.first} ${p.last}`, p.dob ? p.dob.toISOString().slice(0, 10) : "", p.sex, p.zip, tier, p.age ?? ""]);
        p.deps.forEach(d => out.push([id, d.rel === "Spouse" ? "Spouse" : "Child", `${d.first} ${d.last}`, d.dob ? d.dob.toISOString().slice(0, 10) : "", d.sex, p.zip, tier, d.age ?? ""]));
      });
    }
    return out;
  }

  /* ================= carrier quotes ================= */
  const KEYS = [["hsa", /hsa/i], ["specialty", /specialty/i], ["rx", /\brx\b|prescription/i], ["oop", /out.?of.?pocket/i],
    ["deductible", /deductible/i], ["coins", /coinsurance/i], ["pcp", /primary care|\bpcp\b/i], ["spec", /specialist/i],
    ["urgent", /urgent/i], ["er", /emergency/i], ["network", /^network$/i]];
  const TIERS = [["FAM", /family/i], ["ES", /spouse/i], ["EC", /child/i], ["EE", /employee/i]];
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
  function split(line) {
    if (line.includes(" | ")) return line.split(" | ").map(s => s.trim());
    const m = line.match(/^([^:$]{3,70}):\s*(.+)$/); return m ? [m[1].trim(), m[2].trim()] : [line];
  }

  function quote(doc, filename) {
    const L = doc.lines; const carrier = titleCase(L[0]);
    const isRenewal = /renewal/i.test(L.slice(0, 4).join(" "));
    const meta = {}; const plans = []; let cols = null; let plan = null; let rateCols = null; let fields = 0; const composition = [];
    const newPlan = name => (plan = { carrier, name, benefits: {}, rates: {}, current: {}, isRenewal, filename }, plans.push(plan), plan);
    for (const line of L) {
      const cells = split(line); const label = cells[0]; const vals = cells.slice(1);
      let m;
      if ((m = line.match(/^Plan(?: Name)?:\s*(.+)$/i)) && !line.includes(" | ")) { newPlan(m[1].trim()); cols = null; continue; }
      if (/^benefit$/i.test(label) && vals.length >= 2 && !vals.some(v => /network/i.test(v))) { cols = vals.map(v => newPlan(v)); continue; }
      if (/current.*rate/i.test(line) && /renewal.*rate/i.test(line)) { rateCols = { current: vals.findIndex(v => /current/i.test(v)), renewal: vals.findIndex(v => /renewal/i.test(v)) }; continue; }
      if (/quote id|quote reference|group number/i.test(label) && vals[0]) meta.ref = vals[0];
      if ((m = line.match(/quote reference ([\w-]+)/i))) meta.ref = m[1];
      if (/effective date/i.test(label) && vals[0]) meta.effective = vals[0];
      if (/rates guaranteed/i.test(label)) meta.guarantee = vals[0];
      if ((m = line.match(/by (\d{2}\/\d{2}\/\d{4})/))) meta.deadline = m[1];
      if (/trend|experience|demographic|regulatory|total renewal/i.test(label) && /%/.test(vals[0] || "")) { composition.push([label, parseFloat(vals[0])]); continue; }
      if (!vals.length) continue;
      const tier = TIERS.find(([, re]) => re.test(label));
      const moneyVals = vals.filter(v => /\$\s*[\d,]+\.\d{2}/.test(v));
      if (tier && moneyVals.length && !KEYS.some(([, re]) => re.test(label))) {
        const targets = cols || [plan];
        if (cols) cols.forEach((p, i) => { p.rates[tier[0]] = UI.parseMoney(vals[i]); fields++; });
        else if (plan) {
          if (rateCols) { plan.current[tier[0]] = UI.parseMoney(vals[rateCols.current]); plan.rates[tier[0]] = UI.parseMoney(vals[rateCols.renewal]); fields += 2; }
          else { plan.rates[tier[0]] = UI.parseMoney(moneyVals[0]); fields++; }
        }
        continue;
      }
      const key = KEYS.find(([, re]) => re.test(label));
      if (!key) continue;
      if (cols) cols.forEach((p, i) => { if (vals[i] != null) { p.benefits[key[0]] = vals[i]; fields++; } });
      else if (plan) { plan.benefits[key[0]] = vals[0]; fields++; }
    }
    plans.forEach(p => {
      const b = p.benefits;
      p.hsa = /^(yes|y)$/i.test(b.hsa || "");
      p.raw = { ...b };
      // normalize wording so every carrier reads the same way in the comparison
      for (const k of ["deductible", "oop", "rx"]) {
        const amts = (b[k] || "").match(/\$[\d,]+/g);
        if (amts && amts.length >= 2 && !/ded then/i.test(b[k])) b[k] = amts.join(" / ");
      }
      for (const k of ["pcp", "spec", "urgent", "er"]) if (/^\$[\d,]+$/.test(b[k] || "")) b[k] += " copay";
      if (b.er) b.er = b.er.replace(/ then deductible$/i, " + deductible");
      if (b.coins) b.coins = b.coins.replace(/ after deductible$/i, "");
      const nums = s => (s || "").match(/\$[\d,]+/g)?.map(UI.parseMoney) || [];
      p.ded = nums(b.deductible); p.oopv = nums(b.oop);
      p.type = /hsa/i.test(p.name) ? "HSA" : /hmo/i.test(p.name + (b.network || "")) ? "HMO" : /epo/i.test(p.name + (b.network || "")) ? "EPO" : "PPO";
      p.id = (p.carrier + " " + p.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    });
    return { carrier, filename, isRenewal, meta, composition, plans: plans.filter(p => Object.keys(p.rates).length), fields, pages: doc.numPages };
  }

  /* ================= self-funded bids ================= */
  function bid(doc, filename) {
    const kv = {}; doc.lines.forEach(l => { const c = split(l); if (c.length >= 2) kv[c[0].toLowerCase()] = c[1]; });
    const g = k => kv[k.toLowerCase()]; const n = k => UI.parseMoney(g(k)); const p = k => parseFloat(g(k));
    const type = (g("Bid Type") || "").toUpperCase().replace("STOP LOSS", "SL");
    const out = { company: doc.lines[0], filename, type, incumbent: /yes/i.test(g("Incumbent") || ""), fields: Object.keys(kv).length, raw: kv };
    if (type === "TPA") Object.assign(out, { admin: n("Administration Fee PEPM"), network: n("Network Access Fee PEPM"), care: n("Care Management Fee PEPM"),
      credit: n("Implementation Credit") || 0, guarantee: g("Rate Guarantee"), runout: g("Claims Run-Out") });
    if (type === "PBM") Object.assign(out, { model: g("Pricing Model"), brand: p("Brand Retail Discount (AWP)") / 100, generic: p("Generic Retail Discount (AWP)") / 100,
      specialty: p("Specialty Discount (AWP)") / 100, rebate: n("Rebate Guarantee per Brand Script"), adminClaim: n("Administration Fee per Claim"),
      scripts: n("Annual Brand Scripts (projected)"), claims: n("Annual Claims (projected)") });
    if (type === "SL") Object.assign(out, { deductible: n("Specific Deductible"), single: n("Specific Rate Single PEPM"), family: n("Specific Rate Family PEPM"),
      basis: g("Contract Basis"), aggAttach: g("Aggregate Attachment"), agg: n("Aggregate Rate PEPM"), lasers: g("Lasers"),
      singles: n("Single Employees"), families: n("Family Employees") });
    const note = doc.lines.find(l => /\.$/.test(l) && !l.includes(" | ") && l.length > 30); out.note = note || "";
    return out;
  }

  return { census, censusExport, quote, bid, TIER_LABEL, mdy };
})();
