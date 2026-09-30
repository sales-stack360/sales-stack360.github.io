/* Document readers for Wealth Desk: a brokerage statement with lot detail, an IRA statement, a 401(k) participant
   statement and a tax return summary. Real parsing of the files handed in, in each custodian's own layout. */
const Parsers = (() => {
  const split = line => line.includes(" | ") ? line.split(" | ").map(s => s.trim()) : [line];
  // "$1,234.56" or "($1,234.56)" to a number; anything else to null
  const num = s => { const t = String(s || "").trim(); const m = t.match(/^\(?-?\$?([\d,]+(?:\.\d+)?)\)?$/); if (!m) return null; const v = parseFloat(m[1].replace(/,/g, "")); return /^\(|^-/.test(t) ? -v : v; };
  const kvOf = lines => { const kv = {}; lines.forEach(l => { const c = split(l); if (c.length === 2) kv[c[0]] = c[1]; }); return kv; };
  const titleCase = s => s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : s;

  function classify(text) {
    if (/income tax return/i.test(text)) return "tax";
    if (/401\(k\)|participant statement/i.test(text)) return "k401";
    if (/individual retirement account/i.test(text)) return "ira";
    if (/account statement/i.test(text) && /holdings/i.test(text)) return "brokerage";
    return "unknown";
  }

  function brokerage(doc) {
    const kv = kvOf(doc.lines), holdings = [], lots = [];
    for (const l of doc.lines) {
      const c = split(l);
      if (c.length === 7 && /^[A-Z]{3,5}$/.test(c[0])) holdings.push({ symbol: c[0], name: c[1], qty: num(c[2]), price: num(c[3]), value: num(c[4]), basis: num(c[5]), gl: num(c[6]) });
      else if (c.length === 7 && /^\d{2}\/\d{2}\/\d{4}$/.test(c[0])) lots.push({ acquired: c[0], qty: num(c[1]), cps: num(c[2]), basis: num(c[3]), value: num(c[4]), gl: num(c[5]), term: c[6], covered: num(c[3]) != null });
    }
    const lotOf = (doc.lines.find(l => /^lot detail:/i.test(l)) || "").replace(/^lot detail:\s*/i, "").split(" ")[0];
    return { custodian: titleCase(doc.lines[0] || ""), name: kv["Account Name"], number: kv["Account Number"], type: kv["Account Type"], period: kv["Statement Period"],
      total: num(kv["Total Account Value"]), cash: num(kv["Bank Deposit Sweep"]), cashRate: kv["Sweep Rate"], holdings, lots, lotSymbol: lotOf,
      fields: Object.keys(kv).length + holdings.length * 7 + lots.length * 7 };
  }

  function ira(doc) {
    const kv = kvOf(doc.lines);
    const funds = doc.lines.map(split).filter(c => c.length === 4 && num(c[3]) != null && c[0] !== "Total Value").map(c => ({ name: c[0], qty: num(c[1]), price: num(c[2]), value: num(c[3]) }));
    return { custodian: titleCase(doc.lines[0] || ""), owner: kv["Account Owner"], number: kv["Account Number"], type: kv["Account Type"], date: kv["Statement Date"],
      beneficiary: kv["Primary Beneficiary"], contingent: kv["Contingent Beneficiary"], funds, total: num(kv["Total Value"]), fields: Object.keys(kv).length + funds.length * 4 };
  }

  function k401(doc) {
    const kv = kvOf(doc.lines);
    const funds = doc.lines.map(split).filter(c => c.length === 4 && num(c[3]) != null && !/^total/i.test(c[0])).map(c => ({ name: c[0], qty: num(c[1]), price: num(c[2]), value: num(c[3]) }));
    return { plan: titleCase(doc.lines[0] || "").replace(/\(K\)/, "(k)"), participant: kv["Participant"], id: kv["Participant ID"], period: kv["Statement Period"], vested: kv["Vested"],
      funds, total: num(kv["Total Balance"]), stockBasis: num(kv["Employer Stock Cost Basis"]), stockShares: num(kv["Employer Stock Shares"]),
      stock: funds.find(f => /stock fund/i.test(f.name)) || null, fields: Object.keys(kv).length + funds.length * 4 };
  }

  function tax(doc) {
    const kv = kvOf(doc.lines), n = k => num(kv[k]);
    const year = +((doc.lines.find(l => /\b20\d{2}\b.*return/i.test(l)) || "").match(/\b(20\d{2})\b/) || [])[1] || null;
    return { year, preparer: titleCase(doc.lines[0] || ""), taxpayers: kv["Taxpayers"], status: kv["Filing Status"], wages: n("Wages, salaries, tips"), interest: n("Taxable interest"),
      dividends: n("Ordinary dividends"), qualified: n("Qualified dividends"), capital: n("Capital gain or (loss)"), agi: n("Adjusted gross income"),
      deductions: n("Itemized deductions") ?? n("Standard deduction"), taxable: n("Taxable income"), totalTax: n("Total tax"),
      carryover: n(Object.keys(kv).find(k => /capital loss carryover/i.test(k)) || ""), fields: Object.keys(kv).length };
  }

  return { classify, brokerage, ira, k401, tax, num };
})();
