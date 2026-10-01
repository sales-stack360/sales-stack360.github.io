/* Medicare Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA),
   parsers.js (Parsers) and compare.js (Compare). */
(() => {
  const { $, $$, esc, money, fdate, daysUntil, icon, toast, route, go, render } = UI;
  const S = { docs: [], intake: null, rx: null, anoc: null, recommend: null, soa: null, queued: false, asked: {}, who: null };
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const MC = "margaret-collins", BASE = "#/clients/" + MC;
  const F = name => "samples/margaret-collins/" + encodeURIComponent(name);
  const C = id => DATA.clients.find(c => c.id === id);
  const plan = id => DATA.plans.find(p => p.id === id);

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const daysChip = d => { if (!d) return ""; const n = daysUntil(d); return `<span class="chip ${n <= 7 ? "crit" : n <= 21 ? "warn" : ""} plain">${n} days</span>`; };
  const stars = n => `<span class="stars" data-tip="Medicare star rating, 1 to 5">${"★".repeat(Math.floor(n))}${n % 1 ? "½" : ""}</span> ${n}`;

  /* ---------- what we know about Margaret, once her documents are read ---------- */
  const profile = () => S.intake && S.rx ? { ...S.intake, meds: S.rx.meds } : null;
  const compared = () => profile() ? Compare.all(profile()) : null;
  const picked = () => { const c = compared(); if (!c) return null; return c.rows.find(r => r.plan.id === (S.recommend || c.best.plan.id)); };
  const prescribes = practice => { const d = (S.intake?.doctors || []).find(x => x.practice === practice); return d ? (S.rx?.meds || []).filter(m => m.prescriber === d.name) : []; };

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/aep", "calendar", "AEP board", () => DATA.withChanges, true], ["#/clients", "users", "Clients"]]],
    ["Margaret Collins", [[BASE + "/docs", "file", "Documents"], [BASE + "/profile", "user", "Client profile"], [BASE + "/changes", "alert", "Plan changes"],
      [BASE + "/compare", "columns", "Compare plans"], [BASE + "/soa", "shield", "Scope of appointment"], [BASE + "/enroll", "send", "Enrollment"]]],
    ["Insights", [["#/savings", "chart", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const aep = daysUntil(DATA.aepOpens);
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), `Wednesday, September 16 · Annual Enrollment opens in ${aep} days. What the desk handled overnight and what needs you.`,
      `<a class="btn" href="#/aep">${icon("calendar")}AEP board</a><a class="btn primary" href="${BASE}/docs">${icon("user")}Open Margaret Collins</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">${icon("calendar")} AEP opens ${I("Annual Enrollment Period, October 15 to December 7. Plan changes made then take effect January 1.")}</div><div class="v">${aep} days</div><div class="d">Oct 15 to Dec 7 · marketing from Oct 1</div></div>
        <div class="card kpi"><div class="l">${icon("alert")} Clients whose plan changes</div><div class="v">${DATA.withChanges}</div><div class="d">of ${DATA.bookSize} in the book · from their notices</div></div>
        <div class="card kpi"><div class="l">${icon("shield")} Scope of appointment forms</div><div class="v">12</div><div class="d">out for signature · 1 overdue</div></div>
        <div class="card kpi"><div class="l">${icon("clock")} Prep handled · September ${I("Estimated from how long it takes by hand: about 20 minutes to read a notice of change and 45 to build a comparison with the client's drugs and doctors.")}</div><div class="v">41 hrs</div><div class="d"><span class="up">+26 hrs</span> vs August</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["Review Margaret Collins' comparison before her appointment", "Three changes to her plan, and she wants to keep all three doctors", "2026-10-16", BASE + "/compare"],
          ["Dorothy Kim hasn't signed her scope of appointment", "Needs 48 hours before the October 17 appointment", "2026-10-15", "#/aep"],
          ["Harold Jensen's Medigap rate rises 14%", "Shop Plan G, or keep it: switching needs health questions", "2026-10-20", "#/aep"],
          ["Walter Price may qualify for Extra Help", "His income on file is under the limit. Confirm before AEP", "2026-10-22", "#/aep"],
          ["Ruth Delgado's Lantus moves to tier 4", "Priced on the three plans that cover it", "2026-10-17", "#/aep"],
        ].map(([t, w, d, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${t}</b><p>${w}</p></div>${daysChip(d)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= AEP board ================= */
  const board = rows => `<div class="tbl-wrap"><table class="t"><thead><tr><th>Client</th><th>Current plan</th><th>What changes in 2027</th><th class="num">${T("Cost to her", "Extra she'd pay next year by staying put, from the notice of change and her own drugs and visits")}</th><th>Appointment</th><th>Stage</th></tr></thead><tbody>
    ${[...rows].sort((a, b) => b.impact - a.impact).map(c => `<tr class="click" data-client="${c.id}" onclick="location.hash='#/clients/${c.id}'"><td><div class="cell-2"><b>${esc(c.name)}</b><small>${c.age} · ${c.city}</small></div></td>
      <td>${esc(c.plan)}</td><td>${c.changes.map(x => `<span class="chip ${/nothing/i.test(x) ? "ok" : "warn"} plain" style="margin:2px 4px 2px 0">${esc(x)}</span>`).join("")}</td>
      <td class="num strong">${c.impact ? money(c.impact) : "—"}</td><td class="nowrap">${c.appt ? `${fdate(c.appt)} ${daysChip(c.appt)}` : '<span class="muted">none needed</span>'}</td><td><span class="chip ${c.kind}">${c.stage}</span></td></tr>`).join("")}</tbody></table></div>`;
  route("/aep", () => setPage([["AEP board"]], `${head("AEP board", `${DATA.withChanges} of ${DATA.bookSize} clients have a change in 2027 that affects them. Ranked by what staying put would cost them.`)}
    <div class="grid g4" style="margin-bottom:16px">
      <div class="card kpi"><div class="l">Notices read</div><div class="v">${DATA.bookSize}</div><div class="d">every client's plan checked</div></div>
      <div class="card kpi"><div class="l">A change that affects them</div><div class="v">${DATA.withChanges}</div><div class="d">premium, drug tier, doctor or pharmacy</div></div>
      <div class="card kpi"><div class="l">Nothing that affects them</div><div class="v">${DATA.bookSize - DATA.withChanges}</div><div class="d">a short letter, no appointment</div></div>
      <div class="card kpi"><div class="l">Appointments booked</div><div class="v">${DATA.clients.filter(c => c.appt).length}</div><div class="d">October 16 to 28</div></div>
    </div>${card("Ranked by cost to the client", board(DATA.clients), { tight: true, guide: "board", sub: "top 10 of 31" })}`));

  route("/clients", () => setPage([["Clients"]], `${head("Clients", `${DATA.bookSize} clients · ${DATA.county}`)}${card("Book of business", board(DATA.clients), { tight: true })}`));

  route("/clients/:id", ({ id }) => id === MC ? go(BASE + "/" + (S.intake ? "profile" : "docs")) : other(id));
  route("/clients/" + MC + "/:tab", ({ tab }) => client(tab));
  function other(id) {
    const c = C(id); if (!c) return go("#/clients");
    setPage([["Clients", "#/clients"], [c.name]], `${head(esc(c.name), `${c.age} · ${c.city} · ${esc(c.plan)}`)}
      <div class="card"><div class="empty">${icon("user")}<p>The full AEP workflow is set up on <b>Margaret Collins</b> for this walkthrough.</p><a class="btn primary" href="${BASE}/docs">Open Margaret Collins</a></div></div>`);
  }

  /* ================= Margaret's workflow ================= */
  function client(tab) {
    const has = !!(S.intake && S.rx);
    const tabs = [["docs", "Documents"], ["profile", "Client profile"], ["changes", "Plan changes"], ["compare", "Compare plans"], ["soa", "Scope of appointment"], ["enroll", "Enrollment"]];
    const p = picked();
    setPage([["AEP board", "#/aep"], ["Margaret Collins"]], `${head("Margaret Collins", `71 · Tampa, Hillsborough County · Suncoast Advantage Plus (HMO) · appointment ${fdate("2026-10-16")}`,
      `${daysChip("2026-10-16")}<span class="chip">Her plan changes in 2027</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BASE}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}</a>`).join("")}</div>
      ${!has ? next("Start", "<b>Load what Margaret gave you.</b> The intake form from her call, her pharmacy's printout and the notice of change her plan sent.") : ({
        docs: next("Step 1 of 6", "<b>Everything read.</b> Check her drugs and doctors, then see what her plan changes.", `<a class="btn sm primary" href="${BASE}/profile">${icon("arrow")}Client profile</a>`),
        profile: next("Step 2 of 6", "<b>Her drugs, doctors and pharmacy, with where each came from.</b> Next, what her plan changes next year.", `<a class="btn sm primary" href="${BASE}/changes">${icon("alert")}Plan changes</a>`),
        changes: next("Step 3 of 6", "<b>What staying put would cost her.</b> Now every 2027 plan in her county.", `<a class="btn sm primary" href="${BASE}/compare">${icon("columns")}Compare plans</a>`),
        compare: next("Step 4 of 6", "<b>Pick the plan to recommend.</b> The enrollment form is built from it.", `<a class="btn sm primary" href="${BASE}/soa">${icon("shield")}Scope of appointment</a>`),
        soa: next("Step 5 of 6", "<b>Scope of appointment, signed 48 hours ahead.</b> Then the enrollment application.", `<a class="btn sm primary" href="${BASE}/enroll">${icon("send")}Enrollment</a>`),
        enroll: next("Step 6 of 6", `<b>${S.queued ? "Queued. It submits the morning enrollment opens." : "Filled and ready to hold until October 15."}</b>`, "", S.queued) }[tab] || "")}
      <div id="cBody"></div>`);
    if (tab !== "docs" && !has) { $("#cBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing read yet.</b></p><p>Drop her documents and every other tab fills itself.</p><a class="btn primary" href="${BASE}/docs">Go to documents</a></div></div>`; return; }
    ({ docs, profile: prof, changes, compare, soa, enroll }[tab] || docs)();
  }

  /* ---------- 1. documents ---------- */
  function docs() {
    const KIND = { intake: "Intake form", rx: "Pharmacy prescription history", anoc: "Annual Notice of Change" };
    $("#cBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="dDrop"><div class="ic">${icon("upload")}</div><b>Drop the client's documents</b><div class="hint">Intake forms, pharmacy printouts, notices of change, plan summaries. PDF, any carrier's or pharmacy's layout.</div>
        <div style="margin-top:14px"><button class="btn primary" id="dSample">${icon("file")}Load Margaret Collins' documents</button></div></div><div id="dRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Documents read", S.docs.map(d => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${d.fields} values read · ${d.pages} page${d.pages > 1 ? "s" : ""}` : "This demo reads intake forms, pharmacy printouts and notices of change"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: S.intake && S.rx ? `<a class="btn primary" href="${BASE}/profile">${icon("arrow")}Review her profile</a>` : `<span class="muted" style="font-size:12.5px">Add the intake form and the prescription history to build the comparison.</span>` }) : ""}
    </div>
    ${card("What gets pulled out", `<div class="steps">${["Name, date of birth, Medicare number and Part A and B dates", "Every medication with strength, quantity, days supply and prescriber", "Every doctor she wants to keep, with specialty and practice", "Her preferred pharmacy", "Anything in the notes that changes the recommendation, like months spent out of state", "Every premium, copay, drug tier and network change in her plan's notice"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
    </div>`;
    const handle = async files => {
      const B = { intake: S.intake, rx: S.rx, anoc: S.anoc, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", fields = 0, pages = 0;
        if (UI.ext(f.name) === "pdf") {
          const doc = await UI.pdfLines(f); pages = doc.numPages; kind = Parsers.classify(doc.lines.join("\n"));
          if (kind === "intake") { const r = Parsers.intake(doc); if (r.name) { B.intake = r; fields = r.fields; } else kind = "unknown"; }
          if (kind === "rx") { const r = Parsers.rx(doc); if (r.meds.length) { B.rx = r; fields = r.fields; } else kind = "unknown"; }
          if (kind === "anoc") { const r = Parsers.anoc(doc); if (r.costs.length || r.tiers.length) { B.anoc = r; fields = r.fields; } else kind = "unknown"; }
        }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, fields, pages }]);
        return { detail: `${{ intake: "intake form", rx: "prescription history", anoc: "notice of change" }[kind] || "unrecognized"} · ${fields} values` };
      }]);
      steps.push(["Matching each drug to its prescriber", async () => { Object.assign(S, B); return { detail: S.rx && S.intake ? `${S.rx.meds.length} drugs · ${S.intake.doctors.length} doctors` : "" }; }]);
      steps.push(["Pricing her drugs on every 2027 plan in the county", async () => ({ detail: `${DATA.plans.length} plans` })]);
      await UI.runSteps($("#dRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Intake forms, pharmacy printouts and notices of change are read.`, "warn");
      if (S.intake && S.rx) toast("Documents read · her comparison is ready"); else if (!unk) toast("Add the intake form and prescription history to compare plans", "warn");
      render();
    };
    UI.dropzone($("#dDrop"), handle, { accept: ".pdf" });
    $("#dSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.intake.map(fn => UI.fetchSample(F(fn))))); };
  }

  /* ---------- 2. client profile ---------- */
  function prof() {
    const P = profile(); const travel = P.travel;
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Medications</div><div class="v">${P.meds.length}</div><div class="d">${P.meds.filter(m => /eliquis|jardiance/i.test(m.drug)).length} brand, ${P.meds.length - 2} generic</div></div>
        <div class="card kpi"><div class="l">Doctors to keep</div><div class="v">${P.doctors.length}</div><div class="d">${P.keepDoctors ? "she wants all of them" : ""}</div></div>
        <div class="card kpi"><div class="l">Out of state</div><div class="v" style="font-size:20px">${travel ? esc(travel.months) : "—"}</div><div class="d">${travel ? "in " + esc(travel.place) : ""}</div></div>
        <div class="card kpi"><div class="l">Pharmacy</div><div class="v" style="font-size:18px">Palmetto Drug</div><div class="d">${P.keepPharmacy ? "won't change pharmacy" : ""}</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Medications", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Drug</th><th>Strength</th><th class="num">${T("Qty / days", "How many tablets per fill and how many days they last. Drug cost is priced per fill.")}</th><th>Prescriber</th><th>Last filled</th><th>${T("Source", "Where each value came from, so it can be checked")}</th></tr></thead><tbody>
          ${P.meds.map(m => `<tr data-drug="${esc(m.drug)}"><td><b>${esc(m.drug)}</b></td><td>${esc(m.strength)}</td><td class="num">${m.qty} / ${m.days}</td><td>${esc(m.prescriber)}</td><td>${esc(m.last)}</td><td><span class="src">pharmacy printout</span></td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "meds" })}
        ${card("Medicare details", `<dl class="kv"><dt>Name</dt><dd>${esc(P.name)}</dd><dt>Date of birth</dt><dd>${esc(P.dob)} · age ${esc(P.age)}</dd><dt>${T("Medicare number", "The MBI on her red, white and blue card. Needed on the enrollment application.")}</dt><dd class="mono">${esc(P.mbi)}</dd><dt>Part A / Part B</dt><dd>${esc(P.partA)} / ${esc(P.partB)}</dd><dt>Address</dt><dd>${esc(P.address)}</dd><dt>County</dt><dd>${esc(P.county)}</dd><dt>Phone</dt><dd>${esc(P.phone)}</dd></dl>`, { guide: "details" })}
      </div>
      <div class="grid g-main-l">
        ${card("Doctors she wants to keep", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Doctor</th><th>Specialty</th><th>Practice</th><th>Prescribes</th></tr></thead><tbody>
          ${P.doctors.map(d => `<tr data-doctor="${esc(d.name)}"><td><b>${esc(d.name)}</b></td><td>${esc(d.specialty)}</td><td>${esc(d.practice)}</td><td>${P.meds.filter(m => m.prescriber === d.name).map(m => esc(m.drug)).join(", ") || '<span class="muted">—</span>'}</td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "doctors" })}
        ${card("From the interview notes", `<div class="list-item" data-note="travel"><div class="li-ic crit">${icon("alert")}</div><div class="li-b"><b>Out of Florida ${travel ? esc(travel.months) : ""}</b><p>Two months a year in ${travel ? esc(travel.place) : "another state"}. An HMO only covers emergencies there, so this rules HMOs out.</p></div></div>
          <div class="list-item"><div class="li-ic warn">${icon("users")}</div><div class="li-b"><b>Keep all three doctors</b><p>Any plan that drops one of them is out.</p></div></div>
          <div class="list-item"><div class="li-ic info">${icon("pill")}</div><div class="li-b"><b>Worried about Eliquis</b><p>Her most expensive drug. Its tier on each plan decides most of the drug cost.</p></div></div>`, { tight: true, guide: "notes", sub: "what changes the recommendation" })}
      </div>`;
  }

  /* ---------- 3. plan changes (her notice of change) ---------- */
  function changes() {
    const A = S.anoc, P = profile(), cur = plan("suncoast");
    if (!A) { $("#cBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>No notice of change read.</b></p><p>Add her plan's 2027 notice to see what it changes.</p><a class="btn primary" href="${BASE}/docs">Go to documents</a></div></div>`; return; }
    const cost = c => {
      const d = (UI.parseMoney(c.now) || 0) - (UI.parseMoney(c.was) || 0);
      if (/premium/i.test(c.label)) return [d * 12, "a year, every month"];
      if (/specialist/i.test(c.label)) return [d * DATA.visits.spec, `at ${DATA.visits.spec} specialist visits a year`];
      if (/primary care/i.test(c.label)) return [d * DATA.visits.pcp, `at ${DATA.visits.pcp} visits a year`];
      if (/deductible/i.test(c.label)) return [d, "Eliquis is in the deductible tiers"];
      if (/maximum/i.test(c.label)) return [null, "only matters in a year with a big hospital stay"];
      return [null, ""];
    };
    const tierCost = t => { const m = P.meds.find(x => t.drug.toLowerCase().startsWith(x.drug.toLowerCase())); return t.changed && m ? (cur.copay[t.to] - cur.copay[t.from]) * Math.round(365 / m.days) : 0; };
    const known = A.costs.reduce((s, c) => s + (c.changed ? cost(c)[0] || 0 : 0), 0) + A.tiers.reduce((s, t) => s + tierCost(t), 0);
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Extra she'd pay by staying ${I("Premium, copays, deductible and drug tier changes, priced on her own drugs and visits")}</div><div class="v" style="color:var(--crit)">${money(known)}</div><div class="d">a year, from the notice</div></div>
        <div class="card kpi"><div class="l">Doctor leaving</div><div class="v" style="font-size:20px">${A.network.length ? "Dr. Osei" : "—"}</div><div class="d">${A.network.length ? "prescribes 3 of her drugs" : ""}</div></div>
        <div class="card kpi"><div class="l">Drug moving up a tier</div><div class="v" style="font-size:20px">${A.tiers.filter(t => t.changed).map(t => esc(t.drug.split(" ")[0])).join(", ") || "—"}</div><div class="d">tier 3 to tier 4</div></div>
        <div class="card kpi"><div class="l">Notice from</div><div class="v" style="font-size:18px">${esc(A.carrier)}</div><div class="d">${esc(A.planId)}</div></div>
      </div>
      <div class="grid g-main-l">
        ${card("Costs, this year against next", `<div class="tbl-wrap"><table class="t"><thead><tr><th>What</th><th class="num">2026</th><th class="num">2027</th><th class="num">${T("Cost to her", "What the change adds to her year, priced on her own drugs and visits")}</th><th></th></tr></thead><tbody>
          ${A.costs.map(c => { const [v, why] = cost(c); return `<tr class="${c.changed && v ? "bad" : ""}" data-cost="${UI.slug(c.label)}"><td><b>${esc(c.label)}</b></td><td class="num muted">${esc(c.was)}</td><td class="num ${c.changed ? "strong" : ""}">${esc(c.now)}</td><td class="num strong">${c.changed && v ? "+" + money(v) : '<span class="muted">—</span>'}</td><td class="muted" style="font-size:12.5px">${c.changed ? esc(why) : "no change"}</td></tr>`; }).join("")}
          ${A.tiers.map(t => `<tr class="${t.changed ? "bad" : ""}" data-tier="${esc(t.drug.split(" ")[0])}"><td><b>${esc(t.drug)}</b> tier</td><td class="num muted">Tier ${t.from}</td><td class="num ${t.changed ? "strong" : ""}">Tier ${t.to}</td><td class="num strong">${t.changed ? "+" + money(tierCost(t)) : '<span class="muted">—</span>'}</td><td class="muted" style="font-size:12.5px">${t.changed ? `${money(cur.copay[t.from])} to ${money(cur.copay[t.to])} a fill, 12 fills` : "no change"}</td></tr>`).join("")}
        </tbody><tfoot><tr><td>Extra next year by staying</td><td></td><td></td><td class="num">+${money(known)}</td><td></td></tr></tfoot></table></div>`, { tight: true, guide: "costs", sub: "priced on her drugs and visits" })}
        ${card("Doctors", A.network.map(n => { const meds = prescribes(n.provider); const d = P.doctors.find(x => x.practice === n.provider);
          return `<div class="list-item" data-network="${UI.slug(n.provider)}"><div class="li-ic crit">${icon("alert")}</div><div class="li-b"><b>${d ? esc(d.name) + ", " : ""}${esc(n.provider)}</b><p>${esc(n.status)} on January 1. ${meds.length ? `He prescribes her ${meds.map(m => esc(m.drug)).join(", ")}.` : ""} On an HMO, seeing him after that isn't covered.</p></div></div>`; }).join("")
          + `<div class="list-item"><div class="li-ic ok">${icon("check")}</div><div class="li-b"><b>Dr. Reyes and Dr. Park stay in network</b><p>Primary care and cardiology.</p></div></div>`, { tight: true, guide: "network" })}
      </div>`;
  }

  /* ---------- 4. compare plans ---------- */
  function compare() {
    const cmp = compared(), P = profile(), rows = cmp.rows, pick = S.recommend || cmp.best.plan.id;
    const low = Math.min(...rows.map(r => r.total));
    const row = (label, fn, cls = "", attr = "") => `<tr class="${cls}" ${attr}><td>${label}</td>${rows.map(r => `<td class="${r.plan.id === pick ? "pick" : r.plan.current ? "cur" : ""}">${fn(r)}</td>`).join("")}</tr>`;
    const sect = t => `<tr class="sect"><td colspan="${rows.length + 1}">${t}</td></tr>`;
    const yn = v => `<span class="yn ${v ? "y" : "n"}">${v ? "Yes" : "No"}</span>`;
    const cb = cmp.cheapestPremium, best = cmp.best;
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Best fit for her</div><div class="v" style="font-size:20px">${esc(best.plan.name)}</div><div class="d">${best.plan.type} · keeps all 3 doctors</div></div>
        <div class="card kpi"><div class="l">Her year on it ${I("Premium, her drugs at 12 fills each, and her usual visits. Part B premium is the same on every plan so it's left out.")}</div><div class="v">${money(best.total)}</div><div class="d">all in</div></div>
        <div class="card kpi"><div class="l">vs staying on her plan</div><div class="v" style="color:var(--ok)">${money(cmp.current.total - best.total)}</div><div class="d">less a year, and Dr. Osei stays</div></div>
        <div class="card kpi"><div class="l">vs the $0 premium plan</div><div class="v" style="color:var(--ok)">${money(cb.total - best.total)}</div><div class="d">less a year, once her drugs count</div></div>
      </div>
      <div class="card" data-guide="catch" style="margin-bottom:16px;border-color:#f3d6a4;background:#fffbf2"><div class="card-b" style="display:flex;gap:14px;align-items:flex-start">
        <div class="li-ic warn" style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--warn-w);color:var(--warn)">${icon("alert")}</div>
        <div><b style="font-size:14.5px">The $0 plan is the expensive one</b><p style="margin:4px 0 0;color:var(--ink-2)">${esc(cb.plan.name)} has no premium and the lowest out-of-pocket maximum, so it's what she'd see first on a comparison site. On her own drugs it costs <b>${money(cb.total - best.total)} more</b> a year than ${esc(best.plan.name)}, it drops Dr. Park, her cardiologist, and as an HMO it only covers emergencies during her two months in ${esc(P.travel?.place || "Atlanta")}.</p></div></div></div>
      <div class="card" data-guide="compare"><div class="card-h"><h3>Every 2027 plan in her county</h3><span class="sub">priced on her ${P.meds.length} drugs and ${P.doctors.length} doctors</span></div>
        <div class="tbl-wrap"><table class="cmp"><thead><tr><th></th>${rows.map(r => `<th class="${r.plan.id === pick ? "pick" : r.plan.current ? "cur" : ""}" data-plan="${r.plan.id}"><span class="car">${esc(r.plan.carrier)}</span><span class="pl">${esc(r.plan.name)}</span>
          <div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap"><span class="chip plain">${r.plan.type}</span>${r.plan.current ? '<span class="chip warn plain" data-tip="Her plan today, with its 2027 changes">Her plan</span>' : ""}${r.plan.id === pick ? '<span class="chip ok" data-tip="Your pick. The enrollment form is built from it">Recommended</span>' : ""}</div></th>`).join("")}</tr></thead>
        <tbody>
          ${sect("The plan")}${row("Star rating", r => stars(r.plan.stars))}${row("Monthly premium", r => money(r.plan.premium))}${row(T("Out-of-pocket maximum", "The most she'd pay in a year for covered medical care. A Medigap plan has none."), r => r.plan.moop ? money(r.plan.moop) : "None")}
          ${row("Primary care / specialist", r => r.plan.medigap ? "$0 after deductible" : `${money(r.plan.pcp)} / ${money(r.plan.spec)}`)}
          ${sect("Her doctors")}${P.doctors.map(d => row(`${esc(d.name)} <span class="muted">${esc(d.specialty.toLowerCase())}</span>`, r => yn(r.doctors.rows.find(x => x.name === d.name).inNetwork), "", `data-doctor="${esc(d.name)}"`)).join("")}
          ${row(`Covered in ${esc(P.travel?.place || "Atlanta")} <span class="muted">${esc(P.travel?.months?.toLowerCase() || "")}</span>`, r => yn(r.plan.travel), "", 'data-row="travel"')}
          ${sect("Her drugs")}${P.meds.filter(m => /eliquis|jardiance/i.test(m.drug)).map(m => row(`${esc(m.drug)} <span class="muted">${esc(m.strength)}</span>`, r => { const x = r.drug.rows.find(y => y.drug === m.drug); return `Tier ${x.tier} · ${money(x.each)}`; }, "", `data-drug="${esc(m.drug)}"`)).join("")}
          ${row("4 generics", r => { const g = r.drug.rows.filter(x => x.tier === 1); return `Tier 1 · ${money(g.reduce((s, x) => s + x.each, 0))}`; })}
          ${row(T("Drug deductible", "Paid before copays start, only if she takes a drug in a deductible tier"), r => r.drug.ded ? money(r.drug.ded) : "$0")}
          ${sect("Her year")}${row("Premium", r => money(r.premium))}${row(T("Drugs", `Deductible plus 12 fills of each drug at her pharmacy, capped at ${money(DATA.drugCap)}`), r => money(r.drug.total) + (r.drug.capped ? ` <span class="muted" data-tip="Reaches the yearly cap">cap</span>` : ""))}${row(T("Visits", `${DATA.visits.pcp} primary care and ${DATA.visits.spec} specialist visits`), r => money(r.medical))}
          <tr class="total" data-row="total"><td>Her year, all in</td>${rows.map(r => `<td class="${r.total === low ? "best" : r.plan.id === pick ? "pick" : r.plan.current ? "cur" : ""}">${money(r.total)}</td>`).join("")}</tr>
          ${sect("What to know")}<tr data-row="flags"><td></td>${rows.map(r => `<td class="${r.plan.id === pick ? "pick" : r.plan.current ? "cur" : ""}" style="vertical-align:top">${r.flags.length ? r.flags.map(f => `<span class="flag ${f[0]}">${esc(f[1])}</span>`).join("") : '<span class="flag" style="color:var(--ok)">Nothing she\'d mind</span>'}</td>`).join("")}</tr>
          <tr><td></td>${rows.map(r => `<td class="${r.plan.id === pick ? "pick" : r.plan.current ? "cur" : ""}"><button class="btn sm ${r.plan.id === pick ? "primary" : ""}" data-rec="${r.plan.id}">${r.plan.id === pick ? "Recommended" : "Recommend"}</button></td>`).join("")}</tr>
        </tbody></table></div></div>`;
    $$("[data-rec]").forEach(x => x.onclick = () => { S.recommend = x.dataset.rec; toast(`${plan(x.dataset.rec).name} recommended · the enrollment form now uses it`); render(); });
  }

  /* ---------- 5. scope of appointment ---------- */
  function soa() {
    const P = profile(), agent = DATA.users[0];
    const appt = "10/16/2026 10:00 AM", hrs = S.soa ? Math.round((new Date("2026-10-16T10:00:00") - new Date("2026-09-16T09:41:00")) / 36e5) : null;
    const box = on => `<span class="soa-box">${on ? "✓" : ""}</span>`;
    const cell = (label, val, span = 1, rev = false) => `<div class="fs-cell" style="grid-column:span ${span}" data-field="${UI.slug(label)}"><label>${label}</label><div class="val ${rev ? "rev" : ""}">${val == null || val === "" ? "&nbsp;" : esc(val)}</div></div>`;
    $("#cBody").innerHTML = `<div class="grid g-main-l">
      <div class="card" data-guide="soa"><div class="card-b">
        <div class="form-sheet"><div class="fs-top"><div class="fs-logo" style="font-size:13px">SOA</div><div class="fs-title">Scope of Sales Appointment Confirmation</div><div class="fs-date">APPOINTMENT<b>${appt}</b></div></div>
          <div class="fs-sec">Beneficiary</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Beneficiary name", P.name, 2)}${cell("Phone", P.phone)}${cell("Medicare number", P.mbi)}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Address", P.address, 4)}</div>
          <div class="fs-sec">Products the beneficiary agrees to discuss</div>
          <div style="padding:8px 8px 6px;font-size:11.5px;line-height:1.9" data-field="products">
            <div>${box(true)}Stand-alone Medicare Prescription Drug Plans (Part D)</div>
            <div>${box(true)}Medicare Advantage Plans (Part C) and Cost Plans</div>
            <div>${box(true)}Dental, Vision and Hearing Products</div>
            <div>${box(false)}Hospital Indemnity Products</div>
            <div>${box(true)}Medicare Supplement (Medigap) Products</div></div>
          <div class="fs-sec">Appointment</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Date and time", appt)}${cell("Method", "In person, agency office")}${cell("Initial contact", "Client called the agency")}${cell("Signed", S.soa ? "09/16/2026 9:41 AM" : "")}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Agent", agent.name, 2)}${cell("Agent NPN", agent.npn)}${cell("Beneficiary signature", S.soa ? "Signed electronically" : "", 1, !S.soa)}</div>
          <div class="fs-foot"><span>Sample form for demonstration only</span><span>Silver Oak Medicare Advisors</span></div></div>
      </div></div>
      <div class="stack">
        ${card("Checks", [
          [true, "Products match what she'll be shown", "Advantage, Part D and Medigap are all on the comparison, so all are ticked."],
          [!!S.soa, "Signed at least 48 hours ahead", S.soa ? `Signed ${Math.round(hrs / 24)} days before the appointment, well clear of the 48 hours required.` : "Not signed yet. Send it now and it's comfortably ahead."],
          [true, "Appointment is after marketing opens", "2027 plans can be marketed from October 1. The appointment is October 16."],
          [true, "Kept for the record", "Stored against her file for ten years, with the call notes."],
        ].map(([ok, t, d]) => `<div class="list-item"><div class="li-ic ${ok ? "ok" : "warn"}">${icon(ok ? "check" : "clock")}</div><div class="li-b"><b>${t}</b><p>${d}</p></div></div>`).join(""), { tight: true, guide: "soa-checks" })}
        <div class="card"><div class="card-b">${S.soa ? `<div style="display:flex;gap:10px;align-items:center"><span class="chip ok">Signed</span><span class="muted" style="font-size:13px">Margaret signed at 9:41 AM, ${Math.round(hrs / 24)} days before the appointment.</span></div>`
          : `<p style="margin:0 0 10px;color:var(--ink-2);font-size:13.5px">Sent by text and email. She signs on her phone; nothing to print or mail.</p><button class="btn primary" id="soaSend">${icon("send")}Send for signature</button>`}</div></div>
      </div></div>`;
    $("#soaSend") && ($("#soaSend").onclick = async e => { e.target.disabled = true; e.target.innerHTML = `${icon("clock")}Waiting for her signature…`; await UI.sleep(1300); S.soa = { at: "2026-09-16T09:41:00" }; toast("Margaret signed the scope of appointment"); render(); });
  }

  /* ---------- 6. enrollment application ---------- */
  function enroll() {
    const P = profile(), r = picked(), p = r.plan, agent = DATA.users[0], hmo = p.type === "HMO";
    const ASK = [["email", "Email address", "Not on any document"], ["emergency", "Emergency contact", "Not on any document"], ["payment", "Premium payment method", p.premium ? "Needed: this plan has a premium" : null]].filter(a => a[2]);
    const cell = (label, val, span = 1, rev = false) => `<div class="fs-cell" style="grid-column:span ${span}" data-field="${UI.slug(label)}"><label>${label}</label><div class="val ${rev ? "rev" : ""}">${val == null || val === "" ? "&nbsp;" : esc(val)}</div></div>`;
    const a = k => S.asked[k];
    $("#cBody").innerHTML = `<div class="grid g-main-l">
      <div class="card" data-guide="enroll"><div class="card-b">
        <div class="form-sheet"><div class="fs-top"><div class="fs-logo" style="font-size:12px">${esc(p.carrier.split(" ")[0].toUpperCase())}</div><div class="fs-title">${esc(p.name)} ${p.medigap ? "" : "(" + p.type + ")"} · Enrollment Request</div><div class="fs-date">PLAN ID<b>${esc(p.planId)}</b></div></div>
          <div class="fs-sec">Your information</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Last name", "Collins")}${cell("First name", "Margaret")}${cell("Middle initial", "A")}${cell("Date of birth", P.dob)}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Medicare number", P.mbi, 2)}${cell("Part A effective", P.partA)}${cell("Part B effective", P.partB)}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Permanent residence address", P.address, 3)}${cell("County", P.county)}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Phone", P.phone)}${cell("Email address", a("email") || "", 2, !a("email"))}${cell("Preferred language", "English")}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Emergency contact", a("emergency") || "", 4, !a("emergency"))}</div>
          <div class="fs-sec">Plan and enrollment period</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Plan", p.name + (p.medigap ? "" : " (" + p.type + ")"), 2)}${cell("Enrollment period", "Annual Enrollment (AEP)")}${cell("Effective date", "01/01/2027")}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell(hmo ? "Primary care physician (required)" : "Primary care physician", hmo ? "Dr. Alan Reyes · Westshore Family Medicine" : "Not required on a PPO", 2)}${cell("Current plan", P.currentPlan + " · " + P.currentPlanId, 2)}</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Premium payment", p.premium ? (a("payment") || "") : "No premium", 2, p.premium && !a("payment"))}${cell("Monthly premium", money(p.premium))}${cell("Other drug coverage", "None")}</div>
          <div class="fs-sec">Agent</div>
          <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Agent name", agent.name, 2)}${cell("Agent NPN", agent.npn)}${cell("Signature", "At the appointment", 1)}</div>
          <div class="fs-foot"><span>Sample form for demonstration only</span><span>${esc(p.carrier)}</span></div></div>
      </div></div>
      <div class="stack">
        ${card("Needs from Margaret", ASK.map(([k, l, why]) => `<div class="list-item" data-ask="${k}"><div class="li-ic ${a(k) ? "ok" : "warn"}">${icon(a(k) ? "check" : "user")}</div><div class="li-b"><b>${l}</b><p>${a(k) ? esc(a(k)) : why}</p></div>${a(k) ? "" : `<button class="btn sm" data-askbtn="${k}">Add</button>`}</div>`).join(""),
          { tight: true, guide: "asks", sub: "yellow on the form" })}
        ${card("Filled from her documents", `<div class="steps">${[`Name, date of birth and Medicare number from the intake form`, `Part A and B dates from the intake form`, `Address and county, which set the plans she can pick`, hmo ? "Primary care doctor, required on an HMO" : "No primary care doctor needed on a PPO", `Her current plan, so it ends when the new one starts`].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
        <div class="card" data-guide="queue"><div class="card-b">${S.queued ? `<div style="display:flex;gap:10px;align-items:center"><span class="chip ok">Queued</span><span class="muted" style="font-size:13px">Submits to ${esc(p.carrier)} on October 15 at 8:00 AM, the morning enrollment opens.</span></div>`
          : `<p style="margin:0 0 10px;color:var(--ink-2);font-size:13.5px">2027 enrollments can't be submitted before October 15. It's held until then and goes in first thing that morning.</p><button class="btn primary" id="queue">${icon("clock")}Queue for October 15</button>`}</div></div>
      </div></div>`;
    const SAMPLE = { email: "mcollins55@example.com", emergency: "Laura Bennett (daughter) · (404) 555-0119", payment: "Monthly deduction from Social Security" };
    $$("[data-askbtn]").forEach(b => b.onclick = () => { S.asked[b.dataset.askbtn] = SAMPLE[b.dataset.askbtn]; toast("Added to the application"); render(); });
    $("#queue") && ($("#queue").onclick = () => { S.queued = true; toast(`Queued · submits to ${p.carrier} on October 15`); render(); });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [
      ["Read a notice of change and work out what it means for the client", 20, 1, DATA.bookSize],
      ["Build a comparison with the client's own drugs and doctors", 45, 3, 120],
      ["Fill a carrier's enrollment application", 20, 2, 90],
      ["Prepare, send and track a scope of appointment", 8, 1, 120],
      ["Chase a missing detail after the appointment", 15, 2, 60],
    ];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this AEP", `Minutes by hand against minutes with the desk, times how often it happens across ${DATA.bookSize} clients.`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Hours saved this AEP</div><div class="v">${Math.round(saved)}</div><div class="d">about ${Math.round(saved / 40)} working weeks</div></div>
        <div class="card kpi"><div class="l">Appointments it frees up ${I("Hours saved divided by an hour per appointment")}</div><div class="v">${Math.round(saved)}</div><div class="d">at an hour each</div></div>
        <div class="card kpi"><div class="l">Comparisons</div><div class="v">${tasks[1][3]}</div><div class="d">3 minutes each, not 45</div></div>
        <div class="card kpi"><div class="l">Notices read</div><div class="v">${tasks[0][3]}</div><div class="d">every client checked</div></div>
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times this AEP</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for a two-agent agency" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "md:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, recommend: S.recommend, soa: S.soa, queued: S.queued, asked: S.asked })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/medicare", p), 400); }
  async function restore(st) {
    Object.assign(S, { recommend: st.recommend || null, soa: st.soa || null, queued: !!st.queued, asked: st.asked || {} });
    if (st.docs) for (const fn of DATA.intake) {
      const doc = await UI.pdfLines(await UI.fetchSample(F(fn))); const kind = Parsers.classify(doc.lines.join("\n")); const r = Parsers[kind] ? Parsers[kind](doc) : null;
      if (r) S[kind] = r; S.docs.push({ name: fn, kind, fields: r ? r.fields : 0, pages: doc.numPages });
    }
  }
  UI.setOnNav(h => {
    $("#nav").innerHTML = NAV.map(([sec, items]) => `<div class="nav-h">${sec}</div>` + items.map(([href, ic, label, cnt, hot]) => {
      const c = cnt ? cnt() : 0; const on = h === href.slice(1) || (href === "#/clients" && h === "/clients");
      return `<a href="${href}" class="${on ? "on" : ""}">${icon(ic)}<span>${label}</span>${c ? `<span class="cnt ${hot ? "hot" : ""}">${c}</span>` : ""}</a>`;
    }).join("")).join(""); save();
  });
  UI.setPalette(() => [
    ...NAV.flatMap(([sec, items]) => items.map(([href, ic, label]) => ({ label, sub: sec, href, icon: ic, kind: "Page", top: true }))),
    ...DATA.clients.map(c => ({ label: c.name, sub: `${c.age} · ${c.city} · ${c.plan}`, href: "#/clients/" + c.id, icon: "user", kind: "Client" })),
    ...DATA.plans.map(p => ({ label: p.name, sub: `${p.type} · ${p.carrier} · ${money(p.premium)} a month`, href: BASE + "/compare", icon: "columns", kind: "Plan" })),
    ...["Eliquis", "Jardiance", "Metformin ER", "Atorvastatin", "Lisinopril", "Levothyroxine"].map(d => ({ label: d, sub: "Margaret Collins · priced on every plan", href: BASE + "/compare", icon: "pill", kind: "Drug" })),
  ]);

  /* ================= guided demo ================= */
  Guide.init({
    app: "medicare", minutes: 7,
    intro: "A walkthrough of one client's Annual Enrollment prep, from the documents she handed over to a queued enrollment, then the whole book on one board. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What was handled overnight", "Her documents": "Intake, pharmacy printout, notice of change", "Plan changes": "What staying put would cost her", "Compare plans": "Her drugs and doctors on every plan",
      "Scope of appointment": "Signed 48 hours ahead", "Enrollment": "Filled, held for October 15", "The whole book": "Every client ranked, hours saved" },
    welcomeTitle: "Welcome to Medicare Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of a Medicare agency where AEP prep is automated: notices of change read, plan comparisons built with each client's own drugs and doctors, scope of appointment forms signed, and enrollments filled and held until the window opens.</p><p>It runs on real sample documents: an intake form, a pharmacy printout and a plan's notice of change. All people, plans and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">Three documents became a comparison priced on her own drugs, a signed scope of appointment and an enrollment waiting for October 15, without anyone typing her Medicare number twice.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/medicare", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:medicare:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What the desk handled overnight",
        body: "Thirty-eight notices of change read, comparisons built for nine clients, and twelve scope of appointment forms sent, all before anyone logged in.", why: "In September the job is prep. This does it so AEP is spent in appointments." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "What needs judgment surfaces with its deadline: an unsigned scope of appointment, a Medigap rate rise, a client who may qualify for Extra Help." },

      { chapter: "Her documents", route: BASE + "/docs", target: "#dDrop", dropzone: "#dDrop", dropButton: "#dSample", doneWhen: '[data-guide="docs-read"]',
        files: [{ name: "Intake form", url: F(DATA.intake[0]), note: "From her call on September 14" }, { name: "Pharmacy printout", url: F(DATA.intake[1]), note: "12 months of fills" }, { name: "Notice of change", url: F(DATA.intake[2]), note: "Her plan, for 2027" }],
        title: "Margaret Collins, 71, Tampa", body: "She called about her plan. What she handed over: the intake form from that call, her pharmacy's printout and the notice her plan sent for next year. <b>Drag the files onto the drop area.</b>" },
      { chapter: "Her documents", route: BASE + "/profile", target: '[data-guide="meds"]', block: "start",
        marks: ['tr[data-drug="Eliquis"]', 'tr[data-drug="Jardiance"]'],
        source: { type: "pdf", url: F(DATA.intake[1]), find: ["Eliquis", "Jardiance", "Dr. Susan Park", "Dr. Kevin Osei"], caption: "Palmetto Drug prescription history", legend: "<i></i> brand drugs, and who prescribes them" },
        title: "Six drugs, straight off the printout", body: "Strength, quantity, days supply and prescriber for each. Eliquis and Jardiance are the two brand drugs, and they decide most of what a plan costs her." },
      { chapter: "Her documents", route: BASE + "/profile", target: '[data-guide="notes"]', block: "center",
        marks: ['[data-note="travel"]'],
        source: { type: "pdf", url: F(DATA.intake[0]), find: ["Spends June and July", "Atlanta", "keep all three doctors"], caption: "Intake form · notes from the interview", legend: "<i></i> read from the notes" },
        title: "The line in the notes that changes the answer", body: "Two months a year in Atlanta. An HMO only covers emergencies out of its area, so that one sentence in the notes rules HMOs out. It's picked up, not left for someone to remember.",
        why: "The detail that decides a recommendation is usually in the notes, not a form field." },

      { chapter: "Plan changes", route: BASE + "/changes", target: '[data-guide="costs"]', block: "start",
        marks: ['tr[data-cost="monthly-plan-premium"]', 'tr[data-tier="Eliquis"]'],
        source: { type: "pdf", url: F(DATA.intake[2]), find: ["$29", "Tier 4", "$45 copay", "$400"], caption: "2027 notice of change · Suncoast Advantage Plus", legend: "<i></i> what changes next year" },
        title: "What staying put would cost her", body: "The notice lists changes. The desk prices them on her: $29 a month in premium, a higher specialist copay at six visits, and Eliquis going to tier 4 at twelve fills. That's the number she understands." },
      { chapter: "Plan changes", route: BASE + "/changes", target: '[data-guide="network"]', block: "center",
        marks: ['[data-network="tampa-diabetes-thyroid-center"]'],
        source: { type: "pdf", url: F(DATA.intake[2]), find: ["Tampa Diabetes & Thyroid Center", "Leaving network"], caption: "2027 notice of change · provider network", legend: "<i></i> leaving the network" },
        title: "A practice leaving, matched to her doctor", body: "The notice names a practice, not a person. The desk matches it to Dr. Osei from her intake, and to the three drugs he prescribes from her pharmacy printout." },

      { chapter: "Compare plans", route: BASE + "/compare", target: '[data-guide="compare"]', block: "start",
        marks: ['tr[data-doctor="Dr. Susan Park"]', 'tr[data-row="travel"]', 'tr[data-row="total"]'],
        title: "Her drugs and doctors on every plan", body: "Every 2027 plan in Hillsborough County, priced on her six drugs at her pharmacy, with her three doctors checked against each network and her Atlanta months against each plan's travel cover." },
      { chapter: "Compare plans", route: BASE + "/compare", target: '[data-guide="catch"]', block: "start",
        title: "The $0 plan is the expensive one", body: "Bayshore Complete has no premium and the lowest out-of-pocket maximum. On her drugs it costs more, it drops her cardiologist, and it leaves her uncovered in Atlanta. A comparison site would have led with it.",
        why: "Premium is what clients compare. It's rarely what they end up paying." },
      { chapter: "Compare plans", route: BASE + "/compare", target: '[data-rec="gulfstream"]', advance: "click", hint: "Click Recommend on Gulfstream Choice",
        title: "Recommend Gulfstream Choice", body: "A PPO at $18 a month. All three doctors, cover in Atlanta, Eliquis on tier 3, and the lowest year all in. <b>Recommend it</b> and the enrollment form is built from it." },

      { chapter: "Scope of appointment", route: BASE + "/soa", target: '[data-guide="soa"]', block: "start",
        marks: ['[data-field="products"]', '[data-field="medicare-number"] .val'],
        title: "The scope of appointment, filled", body: "Every product on the comparison is ticked, since she'll be shown all of them. Her Medicare number and contact details come from the intake form." },
      { chapter: "Scope of appointment", route: BASE + "/soa", target: "#soaSend", advance: "click", hint: "Click Send for signature",
        title: "Signed on her phone, 48 hours ahead", body: "It goes out by text and email. <b>Send it</b>, and the check that it was signed at least 48 hours before the appointment is done for you." },

      { chapter: "Enrollment", route: BASE + "/enroll", target: '[data-guide="enroll"]', block: "start",
        marks: ['[data-field="medicare-number"] .val', '[data-field="part-a-effective"] .val', '[data-field="email-address"] .val', '[data-field="emergency-contact"] .val'],
        source: { type: "pdf", url: F(DATA.intake[0]), find: ["4TN7-QA2-RB19", "04/01/2020"], caption: "Intake form", legend: "<i></i> filled into the application" },
        title: "The application fills itself", body: "Gulfstream's enrollment form, from her intake. Yellow is what no document had: her email and an emergency contact, asked at the appointment rather than guessed.",
        why: "On a PPO no primary care doctor is needed. Pick an HMO and that field turns required and fills with Dr. Reyes." },
      { chapter: "Enrollment", route: BASE + "/enroll", target: "#queue", advance: "click", hint: "Click Queue for October 15",
        title: "Held until the window opens", body: "2027 enrollments can't go in before October 15. <b>Queue it</b> and it submits the morning the window opens, instead of joining a pile." },

      { chapter: "The whole book", route: "#/aep", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-client="margaret-collins"]'],
        title: "Every client, ranked by what staying costs them", body: "Margaret was one of 31. Everyone whose plan changes in a way that matters is on the board, with the cost to them, so the October calendar books itself in the right order." },
      { chapter: "The whole book", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth over one AEP", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your book." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Clear this demo session and start again">Restart</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/medicare"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/medicare"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    } else {                     // no sign-in page: open straight on the dashboard as the first sample user
      enter(DATA.users[0]); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin();
    }
  })();
})();
