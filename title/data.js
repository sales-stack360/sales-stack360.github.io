/* Sample book for Title Desk. Every agency, buyer, seller, lender, property, instrument and figure is fictional. */
const DATA = {
  firm: "Cardinal Title & Escrow",
  state: "Indiana",
  users: [
    { name: "Rachel Kim", role: "Escrow officer", email: "rachel@cardinaltitle.example" },
    { name: "Owen Fisher", role: "Title examiner", email: "owen@cardinaltitle.example" },
    { name: "Luis Ortega", role: "Closer", email: "luis@cardinaltitle.example" },
  ],
  packet: ["Title search - 1418 Maple Ridge Dr.pdf", "Payoff letter - Heartland Bank - loan 4471.pdf", "Lender closing instructions - Prairie Home Mortgage.pdf"],

  /* what the order came in with, before the search */
  order: { id: "CT-26-4418", opened: "2026-09-10", type: "Purchase", disclosedLiens: ["Heartland Bank"], commissionPct: 5.5,
    buyerAgent: "Hamilton Realty", listingAgent: "Carmel Home Group" },

  /* charges on the settlement statement; in Indiana the seller pays for the owner's policy */
  fees: {
    ownersPolicy: 1902, loanPolicy: 250, endorsements: { "ALTA 9": 75, "ALTA 8.1": 25 },
    settlement: { buyer: 350, seller: 250 }, recording: { deed: 25, mortgage: 55 },
  },

  files: [
    { id: "maple-ridge", addr: "1418 Maple Ridge Dr", city: "Carmel", type: "Purchase", parties: "Novak from Hayes", amount: 415000, close: "2026-10-09", status: "Commitment ready", kind: "info" },
    { id: "stonegate", addr: "77 Stonegate Ln", city: "Fishers", type: "Refinance", parties: "Delgado", amount: 288000, close: "2026-09-18", status: "Payoff expired", kind: "crit" },
    { id: "harbor-way", addr: "910 Harbor Way", city: "Noblesville", type: "Purchase", parties: "Ellis from Park", amount: 372500, close: "2026-09-25", status: "Judgment found on seller", kind: "crit" },
    { id: "prairie-view", addr: "3340 Prairie View Rd", city: "Zionsville", type: "Refinance", parties: "Whitman", amount: 510000, close: "2026-09-30", status: "Waiting on lender package", kind: "warn" },
    { id: "orchard", addr: "15 Orchard Pl", city: "Fishers", type: "Purchase", parties: "Osei from Grant", amount: 298000, close: "2026-10-02", status: "Survey shows a fence over the line", kind: "warn" },
    { id: "juniper", addr: "2205 Juniper Ct", city: "Westfield", type: "Purchase", parties: "Lam from Byrne", amount: 449900, close: "2026-09-22", status: "Clear to close", kind: "ok" },
    { id: "cedar-bend", addr: "48 Cedar Bend", city: "Carmel", type: "Cash purchase", parties: "Rowe from Estate of Hill", amount: 610000, close: "2026-10-16", status: "Search ordered", kind: "info" },
    { id: "lakeshore", addr: "602 Lakeshore Dr", city: "Noblesville", type: "Purchase", parties: "Fry from Duncan", amount: 339000, close: "2026-09-11", status: "Closed · recording", kind: "ok" },
  ],

  activity: [
    { t: "7:46 AM", icon: "file", kind: "info", title: "Search back on 1418 Maple Ridge Dr", body: "Commitment drafted. The search found a home equity line the sellers didn't mention.", link: "#/files/maple-ridge/commitment" },
    { t: "7:30 AM", icon: "alert", kind: "crit", title: "Payoff on 77 Stonegate Ln has expired", body: "Good through September 15, closing September 18. An updated payoff was requested from the lender.", link: "#/board" },
    { t: "7:12 AM", icon: "dollar", kind: "ok", title: "4 payoffs read into their files", body: "Per diem added wherever the good-through date falls before closing.", link: "#/board" },
    { t: "6:58 AM", icon: "alert", kind: "warn", title: "Judgment found against a seller on 910 Harbor Way", body: "A $14,200 small claims judgment. Added as a requirement to pay from proceeds.", link: "#/board" },
    { t: "Yesterday", icon: "check", kind: "ok", title: "2205 Juniper Ct is clear to close", body: "Every requirement on the commitment is satisfied. Closing Tuesday.", link: "#/board" },
  ],
};
