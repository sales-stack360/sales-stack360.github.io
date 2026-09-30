/* Wealth Desk: one household from every statement. Accounts, positions with basis, allocation, what the documents
   say that nobody asked about, and a tax-aware way out of the concentrated stock. Figures for the advisor to check. */
const Plan = (() => {
  const cents = n => Math.round(n * 100) / 100;
  const HH = () => DATA.household;

  function accounts(B, I, K) {
    return [
      { id: "joint", name: "Joint brokerage", custodian: B.custodian, number: B.number, owner: "Robert & Elaine", tax: "Taxable", value: B.total, asOf: B.period.split(" to ")[1] },
      { id: "ira", name: "Rollover IRA", custodian: I.custodian, number: I.number, owner: "Robert", tax: "Pre-tax", value: I.total, asOf: I.date },
      { id: "k401", name: "401(k)", custodian: K.plan, number: K.id, owner: "Robert", tax: "Pre-tax", value: K.total, asOf: K.period.split(" to ")[1] },
    ];
  }

  function positions(B, I, K) {
    const p = [];
    B.holdings.forEach(h => {
      const lots = h.symbol === B.lotSymbol ? B.lots : null;
      const basis = lots ? cents(lots.filter(l => l.covered).reduce((s, l) => s + l.basis, 0)) : h.basis;
      p.push({ account: "joint", key: h.symbol, symbol: h.symbol, name: h.name, qty: h.qty, price: h.price, value: h.value, basis, gl: lots ? null : h.gl, lots, missing: lots ? lots.filter(l => !l.covered).reduce((s, l) => s + l.qty, 0) : 0 });
    });
    p.push({ account: "joint", key: "CASH", symbol: "Cash", name: `Bank deposit sweep, ${B.cashRate}`, value: B.cash, basis: B.cash, gl: 0 });
    I.funds.forEach(f => p.push({ account: "ira", key: f.name, symbol: "—", name: f.name, qty: f.qty, price: f.price, value: f.value, pretax: true }));
    K.funds.forEach(f => p.push({ account: "k401", key: f.name, symbol: "—", name: f.name, qty: f.qty, price: f.price, value: f.value, pretax: true,
      basis: f === K.stock ? K.stockBasis : null }));
    return p;
  }

  function allocation(P) {
    const a = { stock: 0, bond: 0, cash: 0 };
    P.forEach(x => { const c = DATA.classes[x.key] || { stock: 1 }; Object.entries(c).forEach(([k, w]) => a[k] += x.value * w); });
    const total = a.stock + a.bond + a.cash;
    return { ...a, total, pct: k => a[k] / total };
  }

  function taxSnap(X) {
    const rows = DATA.brackets.rows; let lo = 0;
    for (const [top, rate] of rows) { if (X.taxable <= top) return { rate, top, room: cents(top - X.taxable), from: lo }; lo = top; }
  }

  /* sell every position at a loss, add the carryforward, then sell the concentrated stock's highest-basis lots up to that amount */
  function transition(B, X) {
    const lossFunds = B.holdings.filter(h => h.gl != null && h.gl < 0).map(h => ({ kind: "fund", symbol: h.symbol, name: h.name, qty: h.qty, value: h.value, gl: h.gl }));
    const lossLots = B.lots.filter(l => l.covered && l.gl < 0).map(l => ({ kind: "lot", symbol: B.lotSymbol, name: `${B.lotSymbol} lot bought ${l.acquired}`, acquired: l.acquired, qty: l.qty, value: l.value, gl: l.gl }));
    const losses = cents([...lossFunds, ...lossLots].reduce((s, x) => s + x.gl, 0));
    const offset = cents(-losses + (X.carryover || 0));
    const gainLots = B.lots.filter(l => l.covered && l.gl > 0).map(l => ({ ...l, per: (l.value - l.basis) / l.qty })).sort((a, b) => a.per - b.per);
    let left = offset; const sells = [];
    for (const l of gainLots) {
      if (left <= 0) break;
      const qty = Math.min(l.qty, Math.floor(left / l.per));
      if (qty <= 0) break;
      const gain = cents(qty * l.per); left = cents(left - gain);
      sells.push({ kind: "lot", symbol: B.lotSymbol, name: `${B.lotSymbol} lot bought ${l.acquired}`, acquired: l.acquired, qty, of: l.qty, value: cents(qty * (l.value / l.qty)), gl: gain });
    }
    const all = [...lossFunds, ...lossLots, ...sells];
    const brcx = B.holdings.find(h => h.symbol === B.lotSymbol);
    const soldShares = [...lossLots, ...sells].reduce((s, x) => s + x.qty, 0);
    const gains = cents(sells.reduce((s, x) => s + x.gl, 0));
    const proceeds = cents(all.reduce((s, x) => s + x.value, 0));
    const beforeCarry = cents(gains + losses), carryUsed = cents(Math.min(X.carryover || 0, Math.max(0, beforeCarry)));
    return { all, lossFunds, lossLots, sells, losses, offset, gains, beforeCarry, carryUsed, carryLeft: cents((X.carryover || 0) - carryUsed), taxable: cents(Math.max(0, beforeCarry - carryUsed)),
      soldShares, proceeds, toInvest: cents(proceeds + B.cash),
      before: brcx.value / B.total, after: (brcx.value - soldShares * brcx.price) / B.total, keptShares: brcx.qty - soldShares };
  }

  function review(B, I, K, X) {
    const A = accounts(B, I, K), P = positions(B, I, K), total = cents(A.reduce((s, a) => s + a.value, 0));
    const brcx = B.holdings.find(h => h.symbol === B.lotSymbol), stockFund = K.stock;
    const employer = cents(brcx.value + (stockFund ? stockFund.value : 0));
    const nua = stockFund && K.stockBasis != null ? cents(stockFund.value - K.stockBasis) : null;
    const noncovered = B.lots.filter(l => !l.covered);
    const T = taxSnap(X), TR = transition(B, X);
    const flags = [
      { id: "concentration", kind: "crit", title: `${Math.round(employer / total * 100)}% of everything is ${HH().employer} stock`, body: `${UI.money(brcx.value)} in the joint account and ${UI.money(stockFund.value)} in the 401(k), ${UI.money(employer)} in all, with Robert retiring from the same company on December 31.` },
      { id: "nua", kind: "crit", title: `${UI.money(nua)} of company stock growth in the 401(k)`, body: `The stock fund is worth ${UI.money(stockFund.value)} against a cost basis of ${UI.money(K.stockBasis)}. Rolled into an IRA, all of it is taxed as ordinary income when it comes out. Taken in kind as net unrealized appreciation, the growth can be taxed at capital gains rates. Decide before the rollover form is signed.` },
      { id: "basis", kind: "warn", title: `${noncovered.reduce((s, l) => s + l.qty, 0).toLocaleString()} ${B.lotSymbol} shares have no cost basis on file`, body: `Bought ${noncovered.map(l => l.acquired.slice(-4)).join(" and ")}, before brokers had to report basis. Worth ${UI.money(noncovered.reduce((s, l) => s + l.value, 0))}. Without Robert's purchase records they could be taxed as if the basis were zero, so they stay out of any sale until the records turn up.` },
      { id: "cash", kind: "warn", title: `${UI.money(B.cash)} in cash earning ${B.cashRate.replace(/ APY/, "")}`, body: `The Keel Harbor sweep. Every 1% of yield on it is about ${UI.money(B.cash / 100)} a year.` },
      { id: "beneficiary", kind: "warn", title: "No beneficiary on the rollover IRA", body: `Northgate shows none on file, primary or contingent, on ${UI.money(I.total)}. A beneficiary form goes in the transfer packet.` },
      { id: "tax", kind: "info", title: `${UI.money(X.carryover)} capital loss carryover, and ${UI.money(T.room)} left in the ${Math.round(T.rate * 100)}% bracket`, body: `From the ${X.year} return. The carryover offsets gains when the joint account is repositioned. The bracket room is worth a Roth conversion conversation, and there's more of it from 2027 when wages stop.` },
    ];
    return { A, P, total, alloc: allocation(P), employer, nua, noncovered, T, TR, flags };
  }

  /* one import file for the planning software */
  function importRows(R, B, I, K, X) {
    const out = [["Record", "Account", "Owner", "Tax treatment", "Symbol", "Description", "Quantity", "Price", "Value", "Cost basis", "Acquired"]];
    R.A.forEach(a => out.push(["Account", a.name, a.owner, a.tax, "", `${a.custodian} ${a.number}`, "", "", a.value, "", ""]));
    R.P.forEach(p => {
      const acct = R.A.find(a => a.id === p.account);
      if (p.lots) p.lots.forEach(l => out.push(["Holding lot", acct.name, acct.owner, acct.tax, p.symbol, p.name, l.qty, p.price, l.value, l.covered ? l.basis : "", l.acquired]));
      else out.push(["Holding", acct.name, acct.owner, acct.tax, p.symbol === "—" ? "" : p.symbol, p.name, p.qty ?? "", p.price ?? "", p.value, p.basis ?? "", ""]);
    });
    [["Wages", X.wages], ["Taxable interest", X.interest], ["Ordinary dividends", X.dividends], ["Qualified dividends", X.qualified], ["Adjusted gross income", X.agi],
     ["Taxable income", X.taxable], ["Total tax", X.totalTax], ["Capital loss carryover", X.carryover]].forEach(([k, v]) => out.push([`Tax ${X.year}`, "", "Household", "", "", k, "", "", v, "", ""]));
    out.push(["Goal", "", "Robert", "", "", `Retire ${HH().retire}`, "", "", "", "", ""]);
    return out;
  }

  return { review, importRows, transition };
})();
