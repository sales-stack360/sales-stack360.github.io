/* Document readers for Life Desk: the brokerage's client intake, an attending physician statement and a carrier's
   term illustration. Real parsing of the files handed in, in each document's own layout. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;
  const inches = s => { const m = String(s || "").match(/(\d+)\s*ft\s*(\d+)\s*in/i); return m ? +m[1] * 12 + +m[2] : null; };

  function classify(text) {
    if (/attending physician statement/i.test(text)) return "aps";
    if (/illustration/i.test(text)) return "illustration";
    if (/client intake/i.test(text)) return "intake";
    return "unknown";
  }

  function intake(doc) {
    const kv = {}, conditions = [], priors = [], notes = []; let sect = "", fields = 0;
    for (const line of doc.lines) {
      if (/^medical conditions$/i.test(line)) { sect = "cond"; continue; }
      if (/^prior applications/i.test(line)) { sect = "prior"; continue; }
      if (/^notes$/i.test(line)) { sect = "notes"; continue; }
      if (/^sample document/i.test(line)) { sect = ""; continue; }
      if (sect === "notes") { notes.push(line); continue; }
      const c = split(line);
      if (sect === "cond" && c.length === 4 && /^\d{2}\/\d{4}$/.test(c[1])) { conditions.push({ name: c[0], since: c[1], treatment: c[2], status: c[3] }); fields += 4; continue; }
      if (sect === "prior" && c.length === 4 && /^\d{4}$/.test(c[1])) { priors.push({ carrier: c[0], year: +c[1], face: UI.parseMoney(c[2]), outcome: c[3] }); fields += 4; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    const h = inches(kv["Height"]), w = parseFloat(kv["Weight"]);
    return { name: kv["Proposed Insured"], dob: kv["Date of Birth"], gender: kv["Gender"], state: kv["State of Residence"], address: kv["Address"], phone: kv["Phone"],
      occupation: kv["Occupation"], income: UI.parseMoney(kv["Annual Income"]), face: UI.parseMoney(kv["Face Amount Requested"]), product: kv["Product"],
      beneficiary: kv["Primary Beneficiary"], height: kv["Height"], weight: kv["Weight"], bmi: h && w ? Math.round(703 * w / (h * h) * 10) / 10 : null,
      tobacco: kv["Tobacco or Nicotine Use"], agent: kv["Agent"], conditions, priors, note: notes.join(" ").replace(/\s+/g, " ").trim(), fields };
  }

  function aps(doc) {
    const kv = {}, diagnoses = [], labs = [], meds = [], comments = []; let sect = "", fields = 0;
    for (const line of doc.lines) {
      if (/^diagnoses$/i.test(line)) { sect = "dx"; continue; }
      if (/^laboratory results$/i.test(line)) { sect = "lab"; continue; }
      if (/^current medications$/i.test(line)) { sect = "med"; continue; }
      if (/^physician comments$/i.test(line)) { sect = "com"; continue; }
      if (/^sample document/i.test(line)) { sect = ""; continue; }
      if (sect === "com") { comments.push(line); continue; }
      const c = split(line);
      if (sect === "dx" && c.length === 3 && /^\d{2}\/\d{4}$/.test(c[1])) { diagnoses.push({ name: c[0], onset: c[1], complications: c[2] }); fields += 3; continue; }
      if (sect === "lab" && c.length === 4 && /^\d{2}\/\d{2}\/\d{4}$/.test(c[1])) { labs.push({ test: c[0], date: c[1], result: c[2], ref: c[3], value: parseFloat(c[2]) }); fields += 4; continue; }
      if (sect === "med" && c.length === 3 && /^\d{2}\/\d{4}$/.test(c[2])) { meds.push({ name: c[0], dose: c[1], since: c[2] }); fields += 3; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { practice: titleCase(doc.lines[0] || ""), patient: kv["Patient"], physician: kv["Attending Physician"], since: kv["Patient Since"], completed: kv["Date Completed"],
      diagnoses, labs, a1c: labs.filter(l => /a1c/i.test(l.test)), meds, comments: comments.join(" ").replace(/\s+/g, " ").trim(), fields };
  }

  function illustration(doc) {
    const kv = {}; let fields = 0;
    for (const line of doc.lines) { const c = split(line); if (c.length === 2) { kv[c[0]] = c[1]; fields++; } else if (c.length === 3 && /^\d/.test(c[0])) fields += 3; }
    const y21 = doc.lines.map(split).find(c => c.length === 3 && c[0] === "21");
    return { carrier: titleCase(doc.lines[0] || ""), insured: kv["Proposed Insured"], issueAge: +kv["Issue Age"], product: kv["Product"], face: UI.parseMoney(kv["Face Amount"]),
      rateClass: (kv["Rate Class Illustrated"] || "").replace(/ Non-Tobacco$/i, ""), annual: UI.parseMoney(kv["Annual Premium"]), monthly: UI.parseMoney(kv["Monthly Premium"]),
      level: kv["Level Premium Period"], prepared: kv["Prepared"], year21: y21 ? UI.parseMoney(y21[1]) : null, fields };
  }

  return { classify, intake, aps, illustration };
})();
