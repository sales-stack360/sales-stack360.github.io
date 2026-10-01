/* Sample book for Medicare Desk. Every agency, person, doctor, pharmacy, carrier, plan and figure is fictional.
   Drug names are real medications, used for illustration. Plan figures are illustrative, not a quote. */
const DATA = {
  firm: "Silver Oak Medicare Advisors",
  county: "Hillsborough County, FL",
  aepOpens: "2026-10-15", aepCloses: "2026-12-07", marketingOpens: "2026-10-01",
  drugCap: 2100,          // annual Part D out-of-pocket cap used in this sample
  visits: { pcp: 4, spec: 6 },
  users: [
    { name: "Renee Alvarez", role: "Principal agent", email: "renee@silveroak.example", npn: "20418853" },
    { name: "Tom Whitfield", role: "Licensed agent", email: "tom@silveroak.example", npn: "19772614" },
    { name: "Janelle Brooks", role: "Enrollment coordinator", email: "janelle@silveroak.example", npn: "" },
  ],
  intake: ["Intake form - Margaret Collins.pdf", "Palmetto Drug prescription history - M Collins.pdf", "2027 ANOC - Suncoast Advantage Plus HMO.pdf"],

  /* 2027 plans available in the client's county */
  plans: [
    { id: "suncoast", name: "Suncoast Advantage Plus", type: "HMO", carrier: "Suncoast Health Plans", planId: "H5521-014", stars: 3.5, current: true,
      premium: 29, moop: 5900, pcp: 0, spec: 45, drugDed: 400, dedTiers: [3, 4, 5], copay: { 1: 0, 2: 8, 3: 47, 4: 90, 5: 0 },
      formulary: { "Eliquis": 4, "Jardiance": 3, "Metformin ER": 1, "Atorvastatin": 1, "Lisinopril": 1, "Levothyroxine": 1 },
      network: { "Westshore Family Medicine": true, "Bay Heart Associates": true, "Tampa Diabetes & Thyroid Center": false },
      travel: false, travelNote: "Emergency and urgent care only outside the Tampa Bay service area", extras: "Dental $1,000 a year · over-the-counter $50 a quarter" },
    { id: "gulfstream", name: "Gulfstream Choice", type: "PPO", carrier: "Gulfstream Health", planId: "H7712-003", stars: 4.5,
      premium: 18, moop: 6700, pcp: 5, spec: 35, drugDed: 0, dedTiers: [], copay: { 1: 0, 2: 5, 3: 42, 4: 95, 5: 0 },
      formulary: { "Eliquis": 3, "Jardiance": 3, "Metformin ER": 1, "Atorvastatin": 1, "Lisinopril": 1, "Levothyroxine": 1 },
      network: { "Westshore Family Medicine": true, "Bay Heart Associates": true, "Tampa Diabetes & Thyroid Center": true },
      travel: true, travelNote: "Out-of-network doctors covered anywhere in the US at 30% coinsurance", extras: "Dental $1,500 a year · vision $200 a year" },
    { id: "bayshore", name: "Bayshore Complete", type: "HMO", carrier: "Bayshore Health", planId: "H3390-021", stars: 4.0,
      premium: 0, moop: 4500, pcp: 0, spec: 25, drugDed: 300, dedTiers: [3, 4, 5], copay: { 1: 0, 2: 4, 3: 45, 4: 90, 5: 0 },
      formulary: { "Eliquis": 4, "Jardiance": 4, "Metformin ER": 1, "Atorvastatin": 1, "Lisinopril": 1, "Levothyroxine": 1 },
      network: { "Westshore Family Medicine": true, "Bay Heart Associates": false, "Tampa Diabetes & Thyroid Center": true },
      travel: false, travelNote: "Emergency and urgent care only outside the Tampa Bay service area", extras: "Dental $2,000 a year · over-the-counter $75 a quarter · gym" },
    { id: "medigap", name: "Medigap Plan G + Heritage Rx", type: "Medigap + PDP", carrier: "Fairhaven Life · Heritage Rx", planId: "Plan G · S4102-008", stars: 4.0, medigap: true,
      premium: 206, moop: null, pcp: 0, spec: 0, partBDed: 283, drugDed: 0, dedTiers: [], copay: { 1: 1, 2: 6, 3: 45, 4: 95, 5: 0 },
      formulary: { "Eliquis": 3, "Jardiance": 3, "Metformin ER": 1, "Atorvastatin": 1, "Lisinopril": 1, "Levothyroxine": 1 },
      network: { "Westshore Family Medicine": true, "Bay Heart Associates": true, "Tampa Diabetes & Thyroid Center": true },
      travel: true, travelNote: "Any doctor in the US who accepts Medicare", extras: "No extras: medical cover only", underwriting: true },
  ],

  /* the book, sorted onto the AEP board by what changes for them in 2027 */
  clients: [
    { id: "margaret-collins", name: "Margaret Collins", age: 71, city: "Tampa", plan: "Suncoast Advantage Plus (HMO)", changes: ["Premium $0 → $29", "Eliquis tier 3 → 4", "Endocrinologist leaving network"], impact: 1208, stage: "Comparison ready", kind: "warn", appt: "2026-10-16" },
    { id: "ruth-delgado", name: "Ruth Delgado", age: 70, city: "Tampa", plan: "Gulfstream Choice (PPO)", changes: ["Lantus moves to tier 4"], impact: 660, stage: "Comparison ready", kind: "warn", appt: "2026-10-17" },
    { id: "harold-jensen", name: "Harold Jensen", age: 76, city: "Clearwater", plan: "Medigap Plan G · Fairhaven Life", changes: ["Rate up 14% at renewal"], impact: 340, stage: "Shop Medigap", kind: "warn", appt: "2026-10-20" },
    { id: "frank-oduya", name: "Frank Oduya", age: 74, city: "Lutz", plan: "Suncoast Advantage Plus (HMO)", changes: ["Premium $0 → $29", "Specialist $30 → $45"], impact: 438, stage: "Comparison ready", kind: "warn", appt: "2026-10-21" },
    { id: "walter-price", name: "Walter Price", age: 73, city: "Riverview", plan: "Suncoast Rx Basic (PDP)", changes: ["Premium $12 → $31", "May qualify for Extra Help"], impact: 228, stage: "Check Extra Help", kind: "info", appt: "2026-10-22" },
    { id: "barbara-singh", name: "Barbara Singh", age: 69, city: "Plant City", plan: "Heritage Rx Select (PDP)", changes: ["Deductible $0 → $250"], impact: 250, stage: "Comparison ready", kind: "warn", appt: "2026-10-23" },
    { id: "dorothy-kim", name: "Dorothy Kim", age: 68, city: "Brandon", plan: "Bayshore Complete (HMO)", changes: ["Specialist $25 → $40"], impact: 90, stage: "Scope of appointment unsigned", kind: "crit", appt: "2026-10-17" },
    { id: "linda-moreau", name: "Linda Moreau", age: 64, city: "Tampa", plan: "New to Medicare · Part B starts Dec 1", changes: ["Initial enrollment"], impact: 0, stage: "First enrollment", kind: "info", appt: "2026-10-28" },
    { id: "george-albright", name: "George Albright", age: 80, city: "Temple Terrace", plan: "Bayshore Complete (HMO)", changes: ["Nothing that affects him"], impact: 0, stage: "Keep plan", kind: "ok", appt: "" },
    { id: "eileen-walsh", name: "Eileen Walsh", age: 78, city: "Apollo Beach", plan: "Gulfstream Choice (PPO)", changes: ["Nothing that affects her"], impact: 0, stage: "Keep plan", kind: "ok", appt: "" },
  ],
  bookSize: 184, withChanges: 31,

  activity: [
    { t: "7:52 AM", icon: "file", kind: "info", title: "38 Annual Notices of Change read", body: "Every client whose 2027 premium, drug tiers or doctors change is on the AEP board, ranked by what it costs them.", link: "#/aep" },
    { t: "7:40 AM", icon: "alert", kind: "warn", title: "Three changes to Margaret Collins' plan for 2027", body: "Premium $0 to $29, Eliquis up to tier 4, and her endocrinologist leaves the network.", link: "#/clients/margaret-collins" },
    { t: "7:18 AM", icon: "send", kind: "ok", title: "12 Scope of Appointment forms sent for signature", body: "For October appointments. Each goes out more than 48 hours ahead.", link: "#/aep" },
    { t: "6:55 AM", icon: "columns", kind: "ok", title: "Plan comparisons built for 9 clients", body: "Drugs priced against every 2027 plan in the county, doctors checked against each network.", link: "#/aep" },
    { t: "Yesterday", icon: "pill", kind: "info", title: "Pharmacy status changed for 4 clients", body: "Their pharmacy moves from preferred to standard on their current plan next year.", link: "#/aep" },
  ],
};
