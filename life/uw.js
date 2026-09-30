/* Field underwriting for Life Desk: reads the facts that decide a rate class out of the intake and the physician
   statement, then applies each carrier's written guideline. A likely class to quote against, not an offer. */
const UW = (() => {
  const toDate = s => { const p = String(s).split("/").map(Number); return p.length === 3 ? new Date(p[2], p[0] - 1, p[1]) : new Date(p[1], p[0] - 1, 1); };
  const months = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) - (b.getDate() < a.getDate() ? 1 : 0);

  function facts(intake, aps) {
    const a1c = [...aps.a1c].sort((x, y) => toDate(x.date) - toDate(y.date));
    const latest = a1c[a1c.length - 1];
    let since = null; for (let i = a1c.length - 1; i >= 0; i--) { if (a1c[i].value < 7.0) since = a1c[i]; else break; }
    const dm = aps.diagnoses.find(x => /diabetes/i.test(x.name)), dob = toDate(intake.dob);
    const onsetAge = dm ? toDate(dm.onset).getFullYear() - dob.getFullYear() - (toDate(dm.onset).getMonth() < dob.getMonth() ? 1 : 0) : null;
    const decline = intake.priors.find(p => /declin/i.test(p.outcome)) || null;
    // the reading that was over 8 in the year of the decline is when it happened; otherwise assume the last day of that year
    const declineReading = decline ? a1c.find(x => toDate(x.date).getFullYear() === decline.year && x.value >= 8) : null;
    const declineDate = decline ? (declineReading ? toDate(declineReading.date) : new Date(decline.year, 11, 31)) : null;
    const age = UI.TODAY.getFullYear() - dob.getFullYear() - (UI.TODAY < new Date(UI.TODAY.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    return { a1c, latest, since, controlledMonths: since ? months(toDate(since.date), UI.TODAY) : 0, onsetAge, age,
      complications: aps.diagnoses.filter(x => !/^none$/i.test(x.complications)), bmi: intake.bmi,
      decline, declineReading, declineMonths: declineDate ? months(declineDate, UI.TODAY) : null };
  }

  function carrier(c, F) {
    const r = c.rule, checks = []; let cls = r.best, ok = true, extra = null;
    if (r.kind === "credit") {
      checks.push([F.latest.value < r.a1c, `Latest A1C ${F.latest.value}% is under ${r.a1c.toFixed(1)}`]);
      checks.push([F.controlledMonths >= r.controlledMonths, `Under 7.0 for ${F.controlledMonths} months; ${r.controlledMonths} needed`]);
      checks.push([F.onsetAge > r.onsetAge, `Diagnosed at ${F.onsetAge}, after ${r.onsetAge}`]);
      checks.push([!F.complications.length, "No complications in the physician statement"]);
      checks.push([F.bmi < r.bmi, `BMI ${F.bmi} is under ${r.bmi}`]);
      cls = checks.every(x => x[0]) ? r.best : r.fallback;
    }
    if (r.kind === "decline" && F.decline && F.decline.carrier.toLowerCase().startsWith(c.name.split(" ")[0].toLowerCase())) {
      const w = F.declineMonths >= r.waitMonths, k = F.controlledMonths >= r.controlledMonths;
      checks.push([w, `Declined him in ${F.decline.year}; ${F.declineMonths} months since, ${r.waitMonths} required`]);
      checks.push([k, `Under 7.0 for ${F.controlledMonths} months; ${r.controlledMonths} required`]);
      if (!w || !k) { ok = false; cls = null; }
      extra = "Reapplying after a decline means a full paramedical exam and Beacon ordering its own physician statement: 3 to 4 weeks longer.";
    }
    const premium = cls ? c.rates[cls] : null;
    return { carrier: c, cls, premium, term: premium != null ? premium * DATA.termYears : null, checks, ok, extra };
  }

  function all(intake, aps, ill) {
    const F = facts(intake, aps);
    const rows = DATA.carriers.map(c => carrier(c, F));
    const quoted = rows.filter(r => r.premium != null).sort((a, b) => a.premium - b.premium);
    const illustrated = rows.find(r => r.carrier.illustrated);
    return { F, rows, quoted, best: quoted[0], illustrated, ill,
      gap: ill && illustrated ? illustrated.premium - ill.annual : 0,
      saving: illustrated && quoted[0] ? illustrated.premium - quoted[0].premium : 0 };
  }

  return { all, facts, carrier, toDate };
})();
