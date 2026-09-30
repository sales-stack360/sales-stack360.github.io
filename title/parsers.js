/* Document readers for Title Desk: an abstractor's title search, a lender's payoff statement and the buyer's
   lender's closing instructions. Real parsing of the files handed in, in each document's own layout. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;

  function classify(text) {
    if (/title search report/i.test(text)) return "search";
    if (/payoff statement/i.test(text)) return "payoff";
    if (/closing instructions/i.test(text)) return "lender";
    return "unknown";
  }

  function search(doc) {
    const kv = {}, liens = [], easements = [], taxes = [], legal = []; let sect = "", fields = 0, judgments = null;
    for (const line of doc.lines) {
      if (/^legal description$/i.test(line)) { sect = "legal"; continue; }
      if (/^vesting$/i.test(line)) { sect = "vest"; continue; }
      if (/^open mortgages and liens$/i.test(line)) { sect = "liens"; continue; }
      if (/^easements and restrictions$/i.test(line)) { sect = "ease"; continue; }
      if (/^real estate taxes$/i.test(line)) { sect = "tax"; continue; }
      if (/^judgments against/i.test(line)) { judgments = line.replace(/^.*?:\s*/, ""); sect = ""; fields++; continue; }
      if (/^sample document/i.test(line)) { sect = ""; continue; }
      if (sect === "legal") { legal.push(line); continue; }
      const c = split(line);
      if (sect === "liens" && c.length === 5 && /^\d{10}$/.test(c[2])) { liens.push({ holder: c[0], type: c[1], instrument: c[2], recorded: c[3], amount: UI.parseMoney(c[4]) }); fields += 5; continue; }
      if (sect === "ease" && c.length === 3 && /^\d{10}$/.test(c[1])) { easements.push({ item: c[0], instrument: c[1], recorded: c[2] }); fields += 3; continue; }
      if (sect === "tax" && c.length === 3 && /\$/.test(c[1])) { taxes.push({ year: c[0], amount: UI.parseMoney(c[1]), status: c[2] }); fields += 3; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { abstractor: titleCase(doc.lines[0] || ""), address: kv["Property Address"], county: kv["County"], parcel: kv["Parcel Number"], effective: kv["Search Effective Date"],
      legal: legal.join(" ").replace(/\s+/g, " ").trim(), owner: kv["Owner of Record"], deed: kv["Vesting Deed"], deedRecorded: kv["Deed Recorded"],
      liens, easements, taxes, judgments, fields: fields + (legal.length ? 1 : 0) };
  }

  function payoff(doc) {
    const kv = {}, items = []; let fields = 0, total = null, perDiem = null;
    for (const line of doc.lines) {
      const c = split(line);
      if (c.length === 2 && /per diem/i.test(c[0])) { perDiem = UI.parseMoney(c[1]); fields++; continue; }
      if (c.length === 2 && /^total/i.test(c[0])) { total = UI.parseMoney(c[1]); fields++; continue; }
      if (c.length === 2 && /^\$[\d,]+\.\d{2}$/.test(c[1])) { items.push({ label: c[0], amount: UI.parseMoney(c[1]) }); fields++; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { lender: titleCase(doc.lines[0] || ""), borrowers: kv["Borrowers"], loan: kv["Loan Number"], statement: kv["Statement Date"], goodThrough: kv["Good Through"],
      rate: parseFloat(kv["Interest Rate"]), items, total, perDiem, reference: kv["Reference"], fields };
  }

  function lender(doc) {
    const kv = {}, reqs = {}, charges = []; let sect = "", fields = 0, earnest = null;
    for (const line of doc.lines) {
      if (/^title insurance requirements$/i.test(line)) { sect = "req"; continue; }
      if (/^charges to the borrower$/i.test(line)) { sect = "chg"; continue; }
      const m = line.match(/earnest money held by the settlement agent:\s*(\$[\d,]+\.\d{2})/i); if (m) { earnest = UI.parseMoney(m[1]); fields++; continue; }
      const c = split(line);
      if (sect === "req" && c.length === 2 && c[0] !== "Requirement") { reqs[c[0]] = c[1]; fields++; continue; }
      if (sect === "chg" && c.length === 2 && /\$/.test(c[1])) { charges.push({ label: c[0], amount: UI.parseMoney(c[1]) }); fields++; continue; }
      if (c.length === 2) { kv[c[0]] = c[1]; fields++; }
    }
    return { lender: titleCase(doc.lines[0] || ""), borrowers: kv["Borrowers"], loan: kv["Loan Number"], price: UI.parseMoney(kv["Sales Price"]), amount: UI.parseMoney(kv["Loan Amount"]),
      closing: kv["Closing Date"], agent: kv["Settlement Agent"], policyAmount: UI.parseMoney(reqs["Loan policy amount"]), endorsements: (reqs["Endorsements"] || "").split(/ and |, /).filter(Boolean),
      insured: reqs["Insured lender"], priority: reqs["Priority"], charges, earnest, fields };
  }

  return { classify, search, payoff, lender };
})();
