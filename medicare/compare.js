/* Plan comparison for Medicare Desk: prices the client's own drugs against each plan's formulary, checks her doctors
   against each network, and totals a year. An estimate for comparing plans side by side, not a quote. */
const Compare = (() => {
  // the drug name on the pharmacy printout, matched to the formulary entry ("Eliquis 5 mg" and "Eliquis" are the same drug)
  const drugKey = (plan, drug) => Object.keys(plan.formulary).find(k => drug.toLowerCase().startsWith(k.toLowerCase())) || null;

  function drugs(plan, meds) {
    const rows = meds.map(m => {
      const key = drugKey(plan, m.drug); const tier = key ? plan.formulary[key] : null;
      const fills = Math.round(365 / (m.days || 30)); const each = tier == null ? null : plan.copay[tier];
      return { ...m, tier, fills, each, year: each == null ? null : each * fills, inDed: tier != null && plan.dedTiers.includes(tier) };
    });
    const ded = rows.some(r => r.inDed) ? plan.drugDed : 0;
    const raw = ded + rows.reduce((s, r) => s + (r.year || 0), 0);
    const total = Math.min(raw, DATA.drugCap);
    return { rows, ded, raw, total, capped: raw > DATA.drugCap, notCovered: rows.filter(r => r.tier == null) };
  }

  function doctors(plan, docs) {
    const rows = docs.map(d => ({ ...d, inNetwork: plan.medigap ? true : plan.network[d.practice] !== false }));
    return { rows, inCount: rows.filter(r => r.inNetwork).length, out: rows.filter(r => !r.inNetwork) };
  }

  function plan(p, profile) {
    const d = drugs(p, profile.meds), doc = doctors(p, profile.doctors);
    const premium = p.premium * 12;
    const medical = p.medigap ? p.partBDed : p.pcp * DATA.visits.pcp + p.spec * DATA.visits.spec;
    const total = premium + d.total + medical;
    const flags = [];
    doc.out.forEach(x => flags.push(["crit", `${x.name} (${x.specialty.toLowerCase()}) is out of network`]));
    if (profile.travel && !p.travel) flags.push(["crit", `No routine cover in ${profile.travel.place} for ${profile.travel.months}`]);
    d.rows.filter(r => r.tier >= 4).forEach(r => flags.push(["warn", `${r.drug} is tier ${r.tier}`]));
    if (d.capped) flags.push(["info", `Drug costs reach the ${UI.money(DATA.drugCap)} yearly cap`]);
    if (p.underwriting) flags.push(["warn", "Needs medical underwriting to switch from Medicare Advantage"]);
    return { plan: p, premium, drug: d, doctors: doc, medical, total, flags };
  }

  // every plan, best first by total cost; a plan that drops a doctor she wants to keep can't be the pick
  function all(profile) {
    const rows = DATA.plans.map(p => plan(p, profile)).sort((a, b) => a.total - b.total);
    const eligible = rows.filter(r => !r.doctors.out.length && (!profile.travel || r.plan.travel) && !r.plan.underwriting);
    const best = eligible[0] || rows[0];
    const cheapestPremium = [...rows].sort((a, b) => a.plan.premium - b.plan.premium || a.total - b.total)[0];
    const current = rows.find(r => r.plan.current);
    return { rows, best, cheapestPremium, current };
  }

  return { all, plan, drugs, doctors };
})();
