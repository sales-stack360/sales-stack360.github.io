/* Document readers for Medicare Desk: the agency's intake form, a pharmacy prescription history and a plan's
   Annual Notice of Change. Real parsing of the files handed in, in each document's own layout. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
  const ageOn = (dob, on) => { const [m, d, y] = dob.split("/").map(Number); let a = on.getFullYear() - y; if (on < new Date(on.getFullYear(), m - 1, d)) a--; return a; };

  function classify(text) {
    if (/annual notice of change/i.test(text)) return "anoc";
    if (/prescription history/i.test(text)) return "rx";
    if (/client intake/i.test(text)) return "intake";
    return "unknown";
  }

  function intake(doc) {
    const kv = {}, doctors = [], notes = []; let inNotes = false, fields = 0;
    for (const line of doc.lines) {
      if (/^notes from the interview/i.test(line)) { inNotes = true; continue; }
      if (/^sample document/i.test(line)) { inNotes = false; continue; }
      if (inNotes) { notes.push(line); continue; }
      const c = split(line);
      if (c.length === 4 && /^Dr\.? /.test(c[0])) { doctors.push({ name: c[0], specialty: c[1], practice: c[2], phone: c[3] }); fields += 4; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    const note = notes.join(" ").replace(/\s+/g, " ").trim();
    const tr = note.match(/Spends ([A-Z][a-z]+(?: and [A-Z][a-z]+)?) with [\w ]+? in ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/);
    return { name: kv["Client Name"], dob: kv["Date of Birth"], age: kv["Date of Birth"] ? ageOn(kv["Date of Birth"], UI.TODAY) : null,
      address: kv["Address"], county: kv["County"], phone: kv["Phone"], mbi: kv["Medicare Number (MBI)"],
      partA: kv["Part A Effective"], partB: kv["Part B Effective"], currentPlan: kv["Current Plan"], currentPlanId: kv["Current Plan ID"],
      pharmacy: kv["Preferred Pharmacy"], interview: kv["Interview Date"], agent: kv["Agent"], doctors, note,
      travel: tr ? { months: tr[1], place: tr[2] } : null, keepDoctors: /keep all/i.test(note), keepPharmacy: /not want to change pharmacy/i.test(note),
      fields: fields + (tr ? 2 : 0) };
  }

  function rx(doc) {
    const kv = {}, meds = []; let fields = 0;
    for (const line of doc.lines) {
      const c = split(line);
      if (c.length === 7 && /^\d+$/.test(c[3]) && /^\d+$/.test(c[4]) && /^\d{2}\/\d{2}\/\d{4}$/.test(c[6])) {
        meds.push({ drug: c[0], strength: c[1], form: c[2], qty: +c[3], days: +c[4], prescriber: c[5], last: c[6] }); fields += 7; continue;
      }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { patient: kv["Patient"], pharmacy: kv["Pharmacy"], period: kv["Report Period"], meds, fields };
  }

  function anoc(doc) {
    const kv = {}, costs = [], tiers = [], network = []; let fields = 0;
    for (const line of doc.lines) {
      const c = split(line);
      if (c.length === 3 && /^Tier \d$/.test(c[1]) && /^Tier \d$/.test(c[2])) { tiers.push({ drug: c[0], from: +c[1].slice(5), to: +c[2].slice(5) }); fields += 3; continue; }
      if (c.length === 3 && /(leaving|joining) network/i.test(c[2])) { network.push({ provider: c[0], specialty: c[1], status: c[2] }); fields += 3; continue; }
      if (c.length === 3 && /\$/.test(c[1] + c[2])) { costs.push({ label: c[0], was: c[1], now: c[2], changed: c[1] !== c[2] }); fields += 3; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { carrier: titleCase(doc.lines[0] || ""), member: kv["Member"], plan: kv["Plan"], planId: kv["Contract and Plan ID"], year: kv["Plan Year"],
      costs, tiers: tiers.map(t => ({ ...t, changed: t.from !== t.to })), network, fields };
  }

  return { classify, intake, rx, anoc, ageOn };
})();
