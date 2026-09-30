/* Title Desk: drafts the commitment from the search and the lender's instructions, and builds the settlement
   statement with the payoff carried to the closing date and taxes prorated. A draft for the examiner to check. */
const Closing = (() => {
  const toDate = s => { const [m, d, y] = String(s).split("/").map(Number); return new Date(y, m - 1, d); };
  const days = (a, b) => Math.round((b - a) / 864e5);
  const cents = n => Math.round(n * 100) / 100;

  // a payoff good through a date before closing is short by the interest for the days between
  function payoffAt(P, closing) {
    const gap = Math.max(0, days(toDate(P.goodThrough), toDate(closing)));
    const extra = cents(gap * (P.perDiem || 0));
    return { gap, extra, total: cents(P.total + extra), stale: gap > 0 };
  }

  function commitment(S, L) {
    const sellers = S.owner.replace(/, husband and wife$/i, ""), buyers = L.borrowers;
    const undisclosed = S.liens.filter(l => !DATA.order.disclosedLiens.some(h => l.holder.startsWith(h)));
    const req = [
      { id: "deed", text: `Warranty deed from ${sellers} to ${buyers}, to be recorded.` },
      { id: "mortgage", text: `Mortgage from ${buyers} to ${L.lender} securing ${UI.money(L.amount)}, to be recorded.` },
      ...S.liens.map(l => ({ id: "lien-" + l.instrument, lien: l, found: undisclosed.includes(l),
        text: `Payoff and release of the ${l.type.toLowerCase()} to ${l.holder}, Instrument ${l.instrument}, recorded ${l.recorded}${/line of credit/i.test(l.type) ? ", together with the owners' written authorization to close the line" : ""}.` })),
      { id: "taxes", text: "Payment of all taxes and assessments now due and payable." },
      { id: "affidavit", text: "Owners' affidavit as to possession, improvements and unrecorded liens." },
    ];
    const exc = [
      ...S.easements.map(e => ({ text: `${e.item}, Instrument ${e.instrument}, recorded ${e.recorded}.` })),
      ...S.taxes.filter(t => /not yet due/i.test(t.status)).map(t => ({ text: `Real estate taxes for ${t.year}, a lien not yet due and payable.` })),
    ];
    return { effective: S.effective, vested: S.owner, legal: S.legal, estate: "Fee simple",
      owners: { amount: L.price, insured: buyers }, loan: { amount: L.policyAmount, insured: L.insured, endorsements: L.endorsements },
      req, exc, undisclosed };
  }

  function settlement(S, P, L, helocAmount = null) {
    const f = DATA.fees, close = toDate(L.closing);
    const tax = S.taxes.find(t => /not yet due/i.test(t.status));
    const taxDays = days(new Date(close.getFullYear(), 0, 1), close);            // January 1 through the day before closing
    const proration = tax ? cents(tax.amount / 365 * taxDays) : 0;
    const po = payoffAt(P, L.closing);
    const heloc = S.liens.find(l => /line of credit/i.test(l.type));
    const commission = cents(L.price * DATA.order.commissionPct / 100);
    const endorse = L.endorsements.reduce((s, e) => s + (f.endorsements[e] || 0), 0);
    const lc = n => (L.charges.find(c => new RegExp(n, "i").test(c.label)) || {}).amount || 0;
    // [label, buyer debit, buyer credit, seller debit, seller credit, source, key]
    const lines = [
      ["Contract sales price", L.price, 0, 0, L.price, "lender instructions", "price"],
      ["Earnest money deposit", 0, L.earnest, 0, 0, "lender instructions", "earnest"],
      [`New loan from ${L.lender}`, 0, L.amount, 0, 0, "lender instructions", "loan"],
      [`${tax ? tax.year.split(" ")[0] : ""} taxes, Jan 1 to closing (${taxDays} days)`, 0, proration, proration, 0, "title search", "proration"],
      [`Payoff to ${P.lender}, loan ${P.loan}`, 0, 0, po.total, 0, "payoff letter", "payoff"],
      [`Payoff to ${heloc ? heloc.holder : "second lien"}, home equity line`, 0, 0, helocAmount, 0, helocAmount == null ? "requested" : "credit union payoff", "heloc"],
      [`Real estate commission ${DATA.order.commissionPct}%`, 0, 0, commission, 0, "order", "commission"],
      ["Owner's title policy", 0, 0, f.ownersPolicy, 0, "rate card", "owners"],
      ["Loan title policy", f.loanPolicy, 0, 0, 0, "rate card", "loanpol"],
      [`Endorsements, ${L.endorsements.join(" and ")}`, endorse, 0, 0, 0, "lender instructions", "endorse"],
      ["Settlement fee", f.settlement.buyer, 0, f.settlement.seller, 0, "rate card", "settle"],
      ["Recording, deed and mortgage", f.recording.deed + f.recording.mortgage, 0, 0, 0, "county", "record"],
      ["Origination fee", lc("origination"), 0, 0, 0, "lender instructions", "orig"],
      ["Credit report", lc("credit report"), 0, 0, 0, "lender instructions", "credit"],
      ["Initial escrow deposit, property taxes", lc("escrow"), 0, 0, 0, "lender instructions", "escrow"],
    ];
    const sum = k => cents(lines.reduce((s, l) => s + (l[k] || 0), 0));
    const bD = sum(1), bC = sum(2), sD = sum(3), sC = sum(4);
    return { lines, po, proration, taxDays, commission, heloc, helocPending: helocAmount == null,
      buyer: { debits: bD, credits: bC, cash: cents(bD - bC) }, seller: { debits: sD, credits: sC, net: cents(sC - sD) } };
  }

  return { commitment, settlement, payoffAt, toDate, days };
})();
