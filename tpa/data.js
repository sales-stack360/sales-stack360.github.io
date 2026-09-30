/* Sample book for TPA Desk. Every administrator, employer, employee, provider, carrier and figure is fictional. */
const DATA = {
  firm: "Lakeshore Benefit Administrators",
  users: [
    { name: "Priya Shah", role: "Eligibility specialist", email: "priya@lakeshoreba.example" },
    { name: "Tom Becker", role: "Account manager", email: "tom@lakeshoreba.example" },
    { name: "Alicia Grant", role: "Claims supervisor", email: "alicia@lakeshoreba.example" },
  ],
  packet: ["Ridgeway eligibility - September 2026.csv", "Paid claims register - August 2026.csv", "Stop-loss policy summary - Granite Re.pdf"],

  /* the group the walkthrough follows, as set up in the administrator's system */
  group: {
    id: "ridgeway", name: "Ridgeway Manufacturing", plan: "Ridgeway Manufacturing Employee Health Plan", hr: "Dana Whitfield, HR manager",
    received: "2026-09-15", monthStart: "2026-09-01", childAge: 26,
    plans: { PPO: "PPO 2000", HSA: "HSA 3500" },
  },
  tiers: { EE: "Employee only", ES: "Employee + spouse", EC: "Employee + children", FAM: "Family" },

  groups: [
    { id: "ridgeway", name: "Ridgeway Manufacturing", city: "Kokomo, IN", ees: 144, funding: "Self-funded", file: "Received Sep 15", status: "Ready to load", kind: "info" },
    { id: "brightwater", name: "Brightwater School District", city: "Lafayette, IN", ees: 412, funding: "Self-funded", file: "Due Sep 12 · not received", status: "File 4 days late", kind: "crit" },
    { id: "kessler", name: "Kessler Tool & Die", city: "Elkhart, IN", ees: 88, funding: "Self-funded", file: "Loaded Sep 9", status: "Stop-loss notice due Sep 22", kind: "crit" },
    { id: "sunrise", name: "Sunrise Senior Living", city: "Muncie, IN", ees: 238, funding: "Level-funded", file: "Loaded Sep 11", status: "2 dependents over 26 · asked HR", kind: "warn" },
    { id: "pinecrest", name: "Pinecrest Dental Group", city: "Carmel, IN", ees: 42, funding: "Level-funded", file: "Received Sep 16", status: "New layout · mapped", kind: "info" },
    { id: "harlan", name: "Harlan County Government", city: "Anderson, IN", ees: 356, funding: "Self-funded", file: "Loaded Sep 16", status: "Loaded · 14 changes", kind: "ok" },
    { id: "tristate", name: "Tri-State Logistics", city: "Evansville, IN", ees: 197, funding: "Self-funded", file: "Loaded Sep 10", status: "Loaded · 9 changes", kind: "ok" },
    { id: "meadowbrook", name: "Meadowbrook Credit Union", city: "Fishers, IN", ees: 61, funding: "Level-funded", file: "Loaded Sep 8", status: "Loaded · no changes", kind: "ok" },
  ],

  activity: [
    { t: "7:42 AM", icon: "file", kind: "info", title: "Ridgeway Manufacturing's September file came in", body: "320 rows in Ridgeway's own layout and codes. Ready to load and check against August's claims.", link: "#/groups/ridgeway/docs" },
    { t: "7:15 AM", icon: "layers", kind: "info", title: "Pinecrest Dental Group changed their file layout", body: "Two columns renamed and a new coverage code. Mapped to the standard layout without a ticket.", link: "#/board" },
    { t: "6:51 AM", icon: "check", kind: "ok", title: "Harlan County Government loaded · 14 changes", body: "11 adds and terms, 3 tier changes. Every claim checked against the new dates.", link: "#/board" },
    { t: "6:30 AM", icon: "alert", kind: "crit", title: "Stop-loss notice drafted for Kessler Tool & Die", body: "A claimant crossed 50% of the specific deductible. Due to the carrier September 22.", link: "#/board" },
    { t: "Yesterday", icon: "send", kind: "ok", title: "Monthly reports sent to 5 employers", body: "Enrollment, claims paid and the plan year against the aggregate attachment point.", link: "#/board" },
  ],
};
