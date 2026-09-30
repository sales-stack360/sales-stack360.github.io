/* Sample book for Wealth Desk. Every firm, household, custodian, security, account number and figure is fictional. */
const DATA = {
  firm: "Larkspur Wealth Partners",
  users: [
    { name: "Nadia Brooks", role: "Lead advisor", email: "nadia@larkspurwealth.example" },
    { name: "Priscilla Yang", role: "Paraplanner", email: "priscilla@larkspurwealth.example" },
    { name: "Ethan Cole", role: "Client service associate", email: "ethan@larkspurwealth.example" },
  ],
  packet: ["Keel Harbor Securities - joint account - Aug 2026.pdf", "Northgate Retirement - Robert rollover IRA - Aug 2026.pdf",
    "Blue Ridge Components 401k - Robert - Q2 2026.pdf", "2025 tax return summary - Harrow.pdf"],

  /* what the advisor already knows from the discovery meeting */
  household: { id: "harrow", name: "Robert & Elaine Harrow", city: "Asheville, NC", employer: "Blue Ridge Components", ticker: "BRCX", retire: "2026-12-31",
    notes: "Discovery meeting, September 10: Robert (61) retires from Blue Ridge Components on December 31. Elaine (59) works part time. They want everything managed by Larkspur and income from January." },

  /* how each holding counts toward stocks, bonds and cash */
  classes: { BRCX: { stock: 1 }, TMIX: { stock: 1 }, INTX: { stock: 1 }, AGBX: { bond: 1 }, TCHX: { stock: 1 }, DGRX: { stock: 1 }, CASH: { cash: 1 },
    "Northgate Target Retirement 2030 Fund": { stock: 0.55, bond: 0.45 }, "Blue Ridge Components Stock Fund": { stock: 1 }, "Stable Value Fund": { cash: 1 }, "Large Cap Index Trust": { stock: 1 } },
  brackets: { year: 2025, status: "Married filing jointly", rows: [[23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]] },

  households: [
    { id: "harrow", name: "Robert & Elaine Harrow", city: "Asheville, NC", assets: "$1.8M", stage: "Discovery", status: "Documents in · not read", kind: "info" },
    { id: "fuentes", name: "Maria & Luis Fuentes", city: "Hendersonville, NC", assets: "$2.4M", stage: "Transfers", status: "Transfer rejected: name mismatch", kind: "crit" },
    { id: "prentiss", name: "Gail Prentiss", city: "Black Mountain, NC", assets: "$940K", stage: "Discovery", status: "Waiting on the 2025 tax return", kind: "warn" },
    { id: "delacroix", name: "Susan & Mark Delacroix", city: "Asheville, NC", assets: "$1.2M", stage: "Transfers", status: "IRA beneficiary form unsigned 3 weeks", kind: "warn" },
    { id: "ferreira", name: "Kevin & Joy Ferreira", city: "Brevard, NC", assets: "$3.1M", stage: "Transfers", status: "2 of 4 accounts received", kind: "info" },
    { id: "benson", name: "Harold Benson", city: "Weaverville, NC", assets: "$610K", stage: "Plan delivered", status: "First review in December", kind: "ok" },
    { id: "vasquez", name: "Theo Vasquez", city: "Marshall, NC", assets: "$780K", stage: "Plan delivered", status: "First review in November", kind: "ok" },
  ],

  activity: [
    { t: "7:50 AM", icon: "file", kind: "info", title: "The Harrows' documents came in", body: "Two custodians, a 401(k) statement and the 2025 tax return. Ready to read before Thursday's follow-up.", link: "#/households/harrow/docs" },
    { t: "7:22 AM", icon: "alert", kind: "crit", title: "A transfer was rejected for the Fuentes household", body: "The name on the old account doesn't match the new one. A corrected form is drafted for signature.", link: "#/board" },
    { t: "6:55 AM", icon: "upload", kind: "ok", title: "Holdings and cost basis loaded for 3 households", body: "Into the planning software, with basis on every lot that had one.", link: "#/board" },
    { t: "6:30 AM", icon: "chart", kind: "ok", title: "Quarterly reviews prepared for 11 households", body: "Performance, drift from target and what changed since last quarter.", link: "#/board" },
    { t: "Yesterday", icon: "check", kind: "ok", title: "Required distributions checked", body: "Every client 73 and over is on schedule for 2026.", link: "#/board" },
  ],
};
