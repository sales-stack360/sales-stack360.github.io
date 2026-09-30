/* Sample book for Life Desk. Every brokerage, person, physician, carrier, rate class and premium is fictional.
   Drug names are real medications, used for illustration. Premiums are illustrative, not a quote. */
const DATA = {
  firm: "Northfield Life Brokerage",
  users: [
    { name: "Nora Blake", role: "Principal broker", email: "nora@northfieldlife.example", npn: "18830472" },
    { name: "Ethan Cole", role: "Case manager", email: "ethan@northfieldlife.example", npn: "" },
    { name: "Ivy Tran", role: "New business", email: "ivy@northfieldlife.example", npn: "" },
  ],
  packet: ["Client intake - Steven Mercer.pdf", "APS - Dr Linden - S Mercer.pdf", "Summit Life illustration - Term 20 - S Mercer.pdf"],
  termYears: 20,

  /* each carrier's written diabetes guideline decides the best class it will give him */
  carriers: [
    { id: "summit", name: "Summit Life", product: "Summit Term 20", rating: "A+", illustrated: true,
      rule: { kind: "cap", best: "Standard", text: "Type 2 diabetes on oral medication is Standard at best, whatever the A1C." },
      rates: { "Standard Plus": 4860, "Standard": 5940 }, portal: "Summit agent portal", turnaround: "3 to 4 weeks" },
    { id: "crestpoint", name: "Crestpoint Mutual", product: "Crestpoint Level 20", rating: "A",
      rule: { kind: "credit", best: "Standard Plus", fallback: "Standard", a1c: 7.0, onsetAge: 40, bmi: 31, controlledMonths: 12,
        text: "Standard Plus for type 2 diabetes with A1C under 7.0 for 12 months, diagnosed after 40, no complications, BMI under 31." },
      rates: { "Standard Plus": 5070, "Standard": 6120 }, portal: "Crestpoint Connect", turnaround: "3 weeks" },
    { id: "beacon", name: "Beacon National Life", product: "Beacon Term 20", rating: "A",
      rule: { kind: "decline", best: "Standard", waitMonths: 24, controlledMonths: 12,
        text: "Standard at best. A client Beacon declined can reapply after 24 months with 12 months of controlled A1C, with a full exam." },
      rates: { "Standard": 5760 }, portal: "Beacon producer site", turnaround: "5 to 6 weeks" },
    { id: "evergreen", name: "Evergreen Life", product: "Evergreen Term 20", rating: "A-",
      rule: { kind: "table", best: "Table 2", text: "Every diabetic on medication is rated Table 2." },
      rates: { "Table 2": 8700 }, portal: "Evergreen e-App", turnaround: "2 to 3 weeks" },
  ],

  /* case status from every carrier's portal, pulled into one view */
  cases: [
    { id: "steven-mercer", name: "Steven Mercer", face: 1500000, product: "Term 20", carrier: "Crestpoint Mutual", status: "Application ready", kind: "info", days: 0, reqs: ["Ready to submit"], portal: "Crestpoint Connect" },
    { id: "george-tran", name: "George Tran", face: 3000000, product: "Indexed UL", carrier: "Crestpoint Mutual", status: "Underwriting", kind: "crit", days: 47, reqs: ["Financial questionnaire outstanding 32 days", "Inspection report pending"], portal: "Crestpoint Connect" },
    { id: "maria-esposito", name: "Maria Esposito", face: 600000, product: "Term 20", carrier: "Beacon National Life", status: "Incomplete", kind: "crit", days: 9, reqs: ["HIPAA authorization unsigned", "Beneficiary date of birth missing"], portal: "Beacon producer site" },
    { id: "linda-okonkwo", name: "Linda Okonkwo", face: 750000, product: "Term 30", carrier: "Summit Life", status: "Underwriting", kind: "warn", days: 18, reqs: ["Physician statement ordered 18 days ago, no reply from the office"], portal: "Summit agent portal" },
    { id: "walter-gibbs", name: "Walter Gibbs", face: 1000000, product: "Term 20", carrier: "Evergreen Life", status: "Approved other than applied", kind: "warn", days: 41, reqs: ["Offered Table 2 against Standard applied for · client must accept"], portal: "Evergreen e-App" },
    { id: "priya-raman", name: "Priya Raman", face: 500000, product: "Term 20", carrier: "Beacon National Life", status: "Exam scheduled", kind: "info", days: 6, reqs: ["Paramedical exam Sep 18, 8:00 AM"], portal: "Beacon producer site" },
    { id: "frank-deluca", name: "Frank DeLuca", face: 2000000, product: "Guaranteed UL", carrier: "Crestpoint Mutual", status: "Approved as applied", kind: "ok", days: 34, reqs: ["Signed amendment for delivery"], portal: "Crestpoint Connect" },
    { id: "hannah-cole", name: "Hannah Cole", face: 400000, product: "Term 15", carrier: "Summit Life", status: "Issued", kind: "ok", days: 52, reqs: ["Deliver policy and collect first premium"], portal: "Summit agent portal" },
  ],

  activity: [
    { t: "6:04 AM", icon: "refresh", kind: "ok", title: "Case status pulled from 4 carrier portals", body: "11 open cases checked. 3 changed overnight, 2 have requirements over 30 days old.", link: "#/board" },
    { t: "6:04 AM", icon: "check", kind: "ok", title: "Frank DeLuca approved as applied", body: "Crestpoint Mutual, $2M guaranteed UL. Amendment drafted for his signature.", link: "#/board" },
    { t: "6:04 AM", icon: "alert", kind: "warn", title: "Walter Gibbs approved at Table 2, not Standard", body: "Evergreen rated him down. The difference is priced, and two carriers that might do better are named.", link: "#/board" },
    { t: "Yesterday", icon: "file", kind: "info", title: "Steven Mercer's physician statement arrived", body: "Four A1C results back to 2023. His diabetes has been under 7.0 for 18 months.", link: "#/cases/steven-mercer/uw" },
    { t: "Yesterday", icon: "clock", kind: "warn", title: "Linda Okonkwo's physician statement is 18 days late", body: "The office was chased by fax and phone. Summit's own deadline is in 12 days.", link: "#/board" },
  ],
};
