/* Sample book for FMO Desk. Every agency, agent, NPN, carrier, member and figure is fictional. */
const DATA = {
  firm: "Harborline Insurance Marketing",
  users: [
    { name: "Tessa Monroe", role: "Contracting specialist", email: "tessa@harborline.example" },
    { name: "Grant Whitaker", role: "Commissions analyst", email: "grant@harborline.example" },
    { name: "Lena Ortiz", role: "Agent success manager", email: "lena@harborline.example" },
  ],
  packet: ["Agent intake - Renee Castillo.pdf", "Producer license summary - Castillo.pdf", "E&O certificate - Castillo.pdf", "Training transcript - Castillo.pdf"],
  statements: ["Crestline Health - commission statement - 2026-09.csv", "Bluewater Senior - commission statement - September 2026.pdf"],

  /* Harborline's contracting rules, carrier by carrier */
  eoMinDays: 30,
  carriers: {
    crestline: { name: "Crestline Health", product: "Medicare Advantage", line: "Health", ahip: 2027, eo: 1000000, turnaround: "5 to 7 business days",
      schedule: "$57.50 a month in the first year, $28.75 a month at renewal. An enrollment that ends within three months is charged back in full." },
    bluewater: { name: "Bluewater Senior", product: "Medicare supplement", line: "Health", eo: 1000000, turnaround: "3 to 5 business days",
      schedule: "20% of premium in the first policy year, 10% at renewal." },
    harvest: { name: "Harvest Life", product: "Final expense", line: "Life", aml: 24, turnaround: "2 to 3 business days" },
    keystone: { name: "Keystone Annuity", product: "Fixed annuities", line: "Life", aml: 12, annuity: true, eo: 1000000, turnaround: "5 business days" },
    clearview: { name: "Clearview Dental & Vision", product: "Dental and vision", line: "Health", turnaround: "2 business days" },
  },

  pipeline: [
    { id: "castillo", name: "Renee Castillo", city: "Knoxville, TN", stage: "New agent", carriers: "0 of 5", status: "Packet received · not checked", kind: "info" },
    { id: "price", name: "Darnell Price", city: "Memphis, TN", stage: "Contracting", carriers: "2 of 4", status: "Crestline sent the packet back: 2026 AHIP", kind: "crit" },
    { id: "ruiz", name: "Carlos Ruiz", city: "Clarksville, TN", stage: "Contracting", carriers: "1 of 3", status: "E&O expired September 1", kind: "crit" },
    { id: "vance", name: "Holly Vance", city: "Jackson, TN", stage: "Contracting", carriers: "3 of 4", status: "Bluewater appointment pending 12 days", kind: "warn" },
    { id: "okafor", name: "Samuel Okafor", city: "Cookeville, TN", stage: "Contracting", carriers: "3 of 5", status: "AML refresher assigned", kind: "warn" },
    { id: "lindqvist", name: "Amy Lindqvist", city: "Johnson City, TN", stage: "Ready for AEP", carriers: "5 of 5", status: "Appointed with every carrier", kind: "ok" },
    { id: "hart", name: "Diane Hart", city: "Bristol, TN", stage: "Ready for AEP", carriers: "4 of 4", status: "Appointed with every carrier", kind: "ok" },
  ],

  activity: [
    { t: "7:38 AM", icon: "file", kind: "info", title: "Renee Castillo's contracting packet came in", body: "Intake, license summary, E&O certificate and training transcript. Ready to check against five carriers.", link: "#/agents/castillo/docs" },
    { t: "7:10 AM", icon: "alert", kind: "crit", title: "Crestline sent back Darnell Price's packet", body: "The AHIP certificate is for plan year 2026. The 2027 course is assigned and Darnell has been told.", link: "#/board" },
    { t: "6:45 AM", icon: "dollar", kind: "info", title: "Crestline and Bluewater September statements arrived", body: "A CSV and a PDF. Ready to check against the book, agent by agent.", link: "#/commissions/2026-09/statements" },
    { t: "6:20 AM", icon: "check", kind: "ok", title: "14 appointments confirmed overnight", body: "Across five agents. Each one was told which carriers they can sell for AEP.", link: "#/board" },
    { t: "Yesterday", icon: "send", kind: "ok", title: "August payouts sent to 6 agents", body: "Chargebacks taken from the agent who wrote the business. Overrides kept.", link: "#/commissions/2026-09/payouts" },
  ],
};
