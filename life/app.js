/* Life Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA),
   parsers.js (Parsers) and uw.js (UW). */
(() => {
  const { $, $$, esc, money, fdate, icon, toast, route, go, render } = UI;
  const S = { docs: [], intake: null, aps: null, ill: null, recommend: null, asked: {}, submitted: false, who: null };
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const SM = "steven-mercer", BASE = "#/cases/" + SM;
  const F = name => "samples/steven-mercer/" + encodeURIComponent(name);
  const CASE = id => DATA.cases.find(c => c.id === id);
  const CAR = id => DATA.carriers.find(c => c.id === id);

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const ready = () => !!(S.intake && S.aps);
  const result = () => ready() ? UW.all(S.intake, S.aps, S.ill) : null;
  const pickRow = () => { const r = result(); if (!r) return null; return r.rows.find(x => x.carrier.id === (S.recommend || r.best.carrier.id)); };
  const face = n => n >= 1e6 ? "$" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M" : money(n);

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/board", "layers", "Case board", () => DATA.cases.filter(c => c.kind === "crit").length, true]]],
    ["Steven Mercer", [[BASE + "/docs", "file", "Documents"], [BASE + "/profile", "user", "Health summary"], [BASE + "/uw", "eye", "Underwriting"],
      [BASE + "/quotes", "columns", "Carriers"], [BASE + "/app", "send", "Application"]]],
    ["Insights", [["#/savings", "chart", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const open = DATA.cases.filter(c => !/issued/i.test(c.status));
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), "Wednesday, September 16 · what the desk checked overnight and what needs you.",
      `<a class="btn" href="#/board">${icon("layers")}Case board</a><a class="btn primary" href="${BASE}/docs">${icon("user")}Open Steven Mercer</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">${icon("layers")} Open cases</div><div class="v">${open.length}</div><div class="d">${face(open.reduce((s, c) => s + c.face, 0))} face amount</div></div>
        <div class="card kpi"><div class="l">${icon("alert")} Requirements over 30 days ${I("Outstanding requirements a carrier is waiting on, like a physician statement or a signed form. Old ones are what stall a case.")}</div><div class="v">2</div><div class="d">George Tran, Linda Okonkwo</div></div>
        <div class="card kpi"><div class="l">${icon("refresh")} Carrier portals checked</div><div class="v">4</div><div class="d">at 6:04 AM · nobody logged in</div></div>
        <div class="card kpi"><div class="l">${icon("clock")} Re-keying handled · September ${I("Estimated from how long it takes by hand: about 40 minutes to read a physician statement and 30 to fill a carrier application from the file.")}</div><div class="v">37 hrs</div><div class="d"><span class="up">+14 hrs</span> vs August</div></div>
      </div>
      <div class="grid g-main-l">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["Steven Mercer: which carrier, before the illustration he has turns into a surprise", "Diabetic, controlled 18 months, declined by Beacon in 2023", BASE + "/quotes"],
          ["Walter Gibbs was offered Table 2", "Accept, or try the two carriers that may do better", "#/board"],
          ["George Tran's financial questionnaire is 32 days out", "A $3M case sitting on one missing form", "#/board"],
          ["Maria Esposito's application is incomplete", "An unsigned authorization and a missing date of birth", "#/board"],
        ].map(([t, w, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${t}</b><p>${w}</p></div>${icon("arrow")}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= case board ================= */
  const board = () => {
    const rows = DATA.cases.map(c => c.id === SM && S.submitted ? { ...c, status: "Submitted", kind: "info", reqs: ["Paramedical exam to schedule", "Crestpoint orders its own physician statement"], days: 0 } : c);
    const order = { crit: 0, warn: 1, info: 2, ok: 3 };
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Client</th><th class="num">Face</th><th>Carrier</th><th>Status</th><th>What's outstanding</th><th class="num">${T("Days in", "Days since the application went to the carrier")}</th><th>${T("From", "Which carrier's portal this status was read from")}</th></tr></thead><tbody>
      ${rows.sort((a, b) => order[a.kind] - order[b.kind] || b.days - a.days).map(c => `<tr class="click ${c.kind === "crit" ? "bad" : ""}" data-case="${c.id}" onclick="location.hash='#/cases/${c.id}'"><td><div class="cell-2"><b>${esc(c.name)}</b><small>${esc(c.product)}</small></div></td>
        <td class="num">${face(c.face)}</td><td>${esc(c.carrier)}</td><td><span class="chip ${c.kind}">${esc(c.status)}</span></td>
        <td>${c.reqs.map(r => `<div style="font-size:13px">${esc(r)}</div>`).join("")}</td><td class="num">${c.days || "—"}</td><td><span class="src">${esc(c.portal)}</span></td></tr>`).join("")}</tbody></table></div>`;
  };
  route("/board", () => setPage([["Case board"]], `${head("Case board", "Every open case, read from each carrier's portal at 6:04 AM. The ones that need someone sit at the top.")}
    <div class="grid g4" style="margin-bottom:16px">
      ${DATA.carriers.map(c => { const n = DATA.cases.filter(x => x.carrier === c.name).length; return `<div class="card kpi"><div class="l">${esc(c.portal)}</div><div class="v">${n}</div><div class="d">${esc(c.name)} · ${n === 1 ? "case" : "cases"}</div></div>`; }).join("")}
    </div>${card("All open cases", board(), { tight: true, guide: "board", sub: "4 portals, 1 view" })}`));

  route("/cases/:id", ({ id }) => id === SM ? go(BASE + "/" + (ready() ? "profile" : "docs")) : other(id));
  route("/cases/" + SM + "/:tab", ({ tab }) => caseView(tab));
  function other(id) {
    const c = CASE(id); if (!c) return go("#/board");
    setPage([["Case board", "#/board"], [c.name]], `${head(esc(c.name), `${esc(c.product)} · ${face(c.face)} · ${esc(c.carrier)}`)}
      <div class="card"><div class="empty">${icon("layers")}<p>The full case workflow is set up on <b>Steven Mercer</b> for this walkthrough.</p><a class="btn primary" href="${BASE}/docs">Open Steven Mercer</a></div></div>`);
  }

  /* ================= Steven's case ================= */
  function caseView(tab) {
    const tabs = [["docs", "Documents"], ["profile", "Health summary"], ["uw", "Underwriting"], ["quotes", "Carriers"], ["app", "Application"]];
    setPage([["Case board", "#/board"], ["Steven Mercer"]], `${head("Steven Mercer", "54 · Lancaster, PA · $1.5M, 20-year term · owner, Mercer HVAC Services",
      `<span class="chip warn plain">Type 2 diabetes</span><span class="chip crit plain">Declined 2023</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BASE}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}</a>`).join("")}</div>
      ${!ready() ? next("Start", "<b>Load his file.</b> The intake from his first call, his doctor's physician statement and the illustration another agent showed him.") : ({
        docs: next("Step 1 of 5", "<b>Everything read.</b> Check his health summary, then see what each carrier will really give him.", `<a class="btn sm primary" href="${BASE}/profile">${icon("arrow")}Health summary</a>`),
        profile: next("Step 2 of 5", "<b>His history in one place, with where each fact came from.</b> Next, underwriting.", `<a class="btn sm primary" href="${BASE}/uw">${icon("eye")}Underwriting</a>`),
        uw: next("Step 3 of 5", "<b>Each carrier's own guideline applied.</b> Now the premiums at the class each will give.", `<a class="btn sm primary" href="${BASE}/quotes">${icon("columns")}Carriers</a>`),
        quotes: next("Step 4 of 5", "<b>Pick the carrier.</b> The application and the underwriter letter are built for it.", `<a class="btn sm primary" href="${BASE}/app">${icon("send")}Application</a>`),
        app: next("Step 5 of 5", `<b>${S.submitted ? "Submitted. It's on the case board now." : "Filled, with a letter for the underwriter."}</b>`, "", S.submitted) }[tab] || "")}
      <div id="cBody"></div>`);
    if (tab !== "docs" && !ready()) { $("#cBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing read yet.</b></p><p>Drop his file and every other tab fills itself.</p><a class="btn primary" href="${BASE}/docs">Go to documents</a></div></div>`; return; }
    ({ docs, profile: prof, uw, quotes, app }[tab] || docs)();
  }

  /* ---------- 1. documents ---------- */
  function docs() {
    const KIND = { intake: "Client intake", aps: "Attending physician statement", illustration: "Carrier illustration" };
    $("#cBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="dDrop"><div class="ic">${icon("upload")}</div><b>Drop the case file</b><div class="hint">Intakes, physician statements, lab reports, illustrations, prior applications. PDF, any carrier's or clinic's layout.</div>
        <div style="margin-top:14px"><button class="btn primary" id="dSample">${icon("file")}Load Steven Mercer's file</button></div></div><div id="dRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Documents read", S.docs.map(d => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${d.fields} values read · ${d.pages} page${d.pages > 1 ? "s" : ""}` : "This demo reads intakes, physician statements and illustrations"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: ready() ? `<a class="btn primary" href="${BASE}/profile">${icon("arrow")}Review his health summary</a>` : `<span class="muted" style="font-size:12.5px">Add the intake and the physician statement to underwrite the case.</span>` }) : ""}
    </div>
    ${card("What gets pulled out", `<div class="steps">${["Face amount, product, beneficiary and income for the application", "Height and weight, turned into build", "Every condition with its diagnosis date and treatment", "Every lab result with its date, so the trend shows", "Complications the physician names, or confirms there are none", "Any prior decline, matched to the lab result from that time", "The rate class and premium on the illustration the client was shown"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
    </div>`;
    const handle = async files => {
      const B = { intake: S.intake, aps: S.aps, ill: S.ill, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", fields = 0, pages = 0;
        if (UI.ext(f.name) === "pdf") {
          const doc = await UI.pdfLines(f); pages = doc.numPages; kind = Parsers.classify(doc.lines.join("\n"));
          if (kind === "intake") { const r = Parsers.intake(doc); if (r.name) { B.intake = r; fields = r.fields; } else kind = "unknown"; }
          if (kind === "aps") { const r = Parsers.aps(doc); if (r.labs.length || r.diagnoses.length) { B.aps = r; fields = r.fields; } else kind = "unknown"; }
          if (kind === "illustration") { const r = Parsers.illustration(doc); if (r.annual) { B.ill = r; fields = r.fields; } else kind = "unknown"; }
        }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, fields, pages }]);
        return { detail: `${{ intake: "client intake", aps: "physician statement", illustration: "illustration" }[kind] || "unrecognized"} · ${fields} values` };
      }]);
      steps.push(["Lining up the lab results by date", async () => { Object.assign(S, B); return { detail: S.aps ? `${S.aps.a1c.length} A1C results` : "" }; }]);
      steps.push(["Applying each carrier's diabetes guideline", async () => ({ detail: `${DATA.carriers.length} carriers` })]);
      await UI.runSteps($("#dRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Intakes, physician statements and illustrations are read.`, "warn");
      if (ready()) toast("File read · the case is underwritten"); else if (!unk) toast("Add the intake and the physician statement to underwrite it", "warn");
      render();
    };
    UI.dropzone($("#dDrop"), handle, { accept: ".pdf" });
    $("#dSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.packet.map(fn => UI.fetchSample(F(fn))))); };
  }

  /* ---------- 2. health summary ---------- */
  function prof() {
    const I0 = S.intake, A = S.aps, R = result(), Fx = R.F;
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Face amount</div><div class="v">${face(I0.face)}</div><div class="d">${esc(I0.product)}</div></div>
        <div class="card kpi"><div class="l">${T("Build", "Height and weight. Carriers rate on BMI and on their own build charts.")}</div><div class="v">${Fx.bmi}</div><div class="d">BMI · ${esc(I0.height)}, ${esc(I0.weight)}</div></div>
        <div class="card kpi"><div class="l">Latest A1C</div><div class="v">${Fx.latest.value}%</div><div class="d">under 7.0 for ${Fx.controlledMonths} months</div></div>
        <div class="card kpi"><div class="l">Tobacco</div><div class="v" style="font-size:20px">None</div><div class="d">${esc(I0.tobacco.replace(/^none\s*/i, ""))}</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Conditions", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Condition</th><th>Diagnosed</th><th>Treatment</th><th>${T("Complications", "From the physician statement. None is what earns a better class.")}</th><th>Source</th></tr></thead><tbody>
          ${I0.conditions.map(c => { const dx = A.diagnoses.find(d => d.name.toLowerCase().includes(c.name.split(" ").slice(-1)[0].toLowerCase()) || (/pressure/i.test(c.name) && /hypertension/i.test(d.name))); return `<tr data-cond="${UI.slug(c.name)}"><td><b>${esc(c.name)}</b></td><td>${esc(c.since)}</td><td>${esc(c.treatment)}</td><td>${dx ? esc(dx.complications) : "—"}</td><td><span class="src">intake + physician</span></td></tr>`; }).join("")}
        </tbody></table></div>`, { tight: true, guide: "conditions" })}
        ${card("For the application", `<dl class="kv"><dt>Proposed insured</dt><dd>${esc(I0.name)}</dd><dt>Date of birth</dt><dd>${esc(I0.dob)} · age ${Fx.age}</dd><dt>Occupation</dt><dd>${esc(I0.occupation)}</dd><dt>${T("Income", "Carriers cap cover at a multiple of income. $1.5M is well inside that at $240,000.")}</dt><dd>${money(I0.income)}</dd><dt>Beneficiary</dt><dd>${esc(I0.beneficiary)}</dd><dt>Address</dt><dd>${esc(I0.address)}</dd></dl>`)}
      </div>
      <div class="grid g-main-l">
        ${card("Prior applications", I0.priors.map(p => `<div class="list-item" data-prior="${UI.slug(p.carrier)}"><div class="li-ic crit">${icon("alert")}</div><div class="li-b"><b>${esc(p.carrier)} ${esc(p.outcome.toLowerCase())} him in ${p.year}</b><p>${Fx.declineReading ? `That matches his ${Fx.declineReading.value}% A1C on ${esc(Fx.declineReading.date)} in Dr. Linden's statement. It has been under 7.0 since ${esc(Fx.since.date)}.` : ""} Every application asks about this, so it's answered up front, with the lab trend behind it.</p></div></div>`).join(""), { tight: true, guide: "prior" })}
        ${card("Medications", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Medication</th><th>Dose</th><th>Since</th></tr></thead><tbody>${A.meds.map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.dose)}</td><td>${esc(m.since)}</td></tr>`).join("")}</tbody></table></div>`, { tight: true, sub: "from the physician statement" })}
      </div>`;
  }

  /* ---------- 3. underwriting ---------- */
  function uw() {
    const R = result(), Fx = R.F, max = 9;
    $("#cBody").innerHTML = `
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("A1C over time", `<div class="a1c">${Fx.a1c.map(x => `<div class="col"><span class="v">${x.value}%</span><div class="bar ${x.value >= 7 ? "hi" : ""}" style="height:${Math.round(x.value / max * 100)}%"></div></div>`).join("")}</div>
          <div class="a1c-x">${Fx.a1c.map(x => `<span>${esc(x.date)}</span>`).join("")}</div>
          <p style="margin:12px 0 0;color:var(--ink-2);font-size:13.5px">Red is 7.0 or over. He came down from ${Fx.a1c[0].value}% to ${Fx.latest.value}% and has held under 7.0 since ${esc(Fx.since.date)}. That trend is the whole case.</p>`, { guide: "a1c", sub: "from Dr. Linden's statement" })}
        ${card("What decides the class", `<dl class="kv"><dt>Latest A1C</dt><dd>${Fx.latest.value}%</dd><dt>Under 7.0 for</dt><dd>${Fx.controlledMonths} months</dd><dt>Age at diagnosis</dt><dd>${Fx.onsetAge}</dd><dt>Complications</dt><dd>${Fx.complications.length ? "Yes" : "None"}</dd><dt>BMI</dt><dd>${Fx.bmi}</dd><dt>Prior decline</dt><dd>${Fx.decline ? `${esc(Fx.decline.carrier)}, ${Fx.declineMonths} months ago` : "None"}</dd></dl>`, { guide: "facts" })}
      </div>
      <div class="grid g2" data-guide="carriers">${R.rows.map(r => `<div class="card" data-carrier="${r.carrier.id}"><div class="card-h"><h3>${esc(r.carrier.name)}</h3><span class="sub">${esc(r.carrier.product)} · ${esc(r.carrier.rating)}</span><div class="actions"><span class="chip ${r.cls === "Standard Plus" ? "ok" : /table/i.test(r.cls || "") ? "crit" : "info"}">${r.cls ? esc(r.cls) : "Not eligible"}</span></div></div>
        <div class="card-b"><p style="margin:0 0 ${r.checks.length ? 10 : 0}px;color:var(--ink-2);font-size:13px">${esc(r.carrier.rule.text)}</p>
          ${r.checks.map(([ok, t]) => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:13px;margin:4px 0"><span style="color:${ok ? "var(--ok)" : "var(--crit)"};flex:none">${icon(ok ? "check" : "x")}</span><span>${esc(t)}</span></div>`).join("")}
          ${r.extra ? `<p style="margin:10px 0 0;font-size:12.5px;color:var(--warn)">${esc(r.extra)}</p>` : ""}</div></div>`).join("")}</div>`;
  }

  /* ---------- 4. carriers ---------- */
  function quotes() {
    const R = result(), IL = S.ill, pick = S.recommend || R.best.carrier.id, rows = R.rows;
    const low = Math.min(...R.quoted.map(r => r.premium));
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Best carrier for him</div><div class="v" style="font-size:20px">${esc(R.best.carrier.name)}</div><div class="d">${esc(R.best.cls)}</div></div>
        <div class="card kpi"><div class="l">Annual premium</div><div class="v">${money(R.best.premium)}</div><div class="d">${money(R.best.term)} over ${DATA.termYears} years</div></div>
        <div class="card kpi"><div class="l">What he's been shown</div><div class="v">${IL ? money(IL.annual) : "—"}</div><div class="d">${IL ? esc(IL.carrier) + ", " + esc(IL.rateClass) : ""}</div></div>
        <div class="card kpi"><div class="l">What Summit will likely charge</div><div class="v" style="color:var(--crit)">${money(R.illustrated.premium)}</div><div class="d">${esc(R.illustrated.cls)} · ${money(R.gap)} a year more</div></div>
      </div>
      ${IL ? `<div class="card" data-guide="catch" style="margin-bottom:16px;border-color:#f3d6a4;background:#fffbf2"><div class="card-b" style="display:flex;gap:14px;align-items:flex-start">
        <div style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--warn-w);color:var(--warn)">${icon("alert")}</div>
        <div><b style="font-size:14.5px">The illustration he's holding won't happen</b><p style="margin:4px 0 0;color:var(--ink-2)">It shows ${esc(IL.rateClass)} at ${money(IL.annual)}. Summit's own guideline caps a diabetic on medication at ${esc(R.illustrated.cls)}, so the offer will come back at ${money(R.illustrated.premium)}: <b>${money(R.gap * DATA.termYears)} more over ${DATA.termYears} years</b> than he was told. ${esc(R.best.carrier.name)} gives ${esc(R.best.cls)} to a controlled diabetic like him, at ${money(R.best.premium)}, which saves ${money(R.saving * DATA.termYears)} against what Summit will really charge.</p></div></div></div>` : ""}
      <div class="card" data-guide="compare"><div class="card-h"><h3>What each carrier will really give him</h3><span class="sub">$1.5M, 20-year level term</span></div>
        <div class="tbl-wrap"><table class="t"><thead><tr><th>Carrier</th><th>Class shown to him</th><th>${T("Likely class", "From each carrier's written guideline, applied to his labs and history")}</th><th class="num">Annual</th><th class="num">Over ${DATA.termYears} years</th><th>${T("Turnaround", "Typical time from application to decision")}</th><th></th></tr></thead><tbody>
          ${rows.map(r => `<tr class="${r.carrier.id === pick ? "sel" : ""}" data-carrier="${r.carrier.id}"><td><div class="cell-2"><b>${esc(r.carrier.name)}</b><small>${esc(r.carrier.product)} · ${esc(r.carrier.rating)}</small></div></td>
            <td>${r.carrier.illustrated && IL ? `<span class="chip warn plain">${esc(IL.rateClass)} · ${money(IL.annual)}</span>` : '<span class="muted">—</span>'}</td>
            <td><span class="chip ${r.cls === "Standard Plus" ? "ok" : /table/i.test(r.cls || "") ? "crit" : "info"}">${r.cls ? esc(r.cls) : "Not eligible"}</span></td>
            <td class="num strong" style="${r.premium === low ? "color:var(--ok)" : ""}">${r.premium != null ? money(r.premium) : "—"}</td><td class="num">${r.term != null ? money(r.term) : "—"}</td>
            <td>${esc(r.carrier.turnaround)}${r.extra ? ` ${I(r.extra)}` : ""}</td>
            <td><button class="btn sm ${r.carrier.id === pick ? "primary" : ""}" data-rec="${r.carrier.id}">${r.carrier.id === pick ? "Recommended" : "Recommend"}</button></td></tr>`).join("")}
        </tbody></table></div></div>`;
    $$("[data-rec]").forEach(x => x.onclick = () => { S.recommend = x.dataset.rec; toast(`${CAR(x.dataset.rec).name} recommended · the application and letter now use it`); render(); });
  }

  /* ---------- 5. application + underwriter letter ---------- */
  function letter(r) {
    const Fx = result().F, I0 = S.intake, A = S.aps;
    return `To the underwriter, ${r.carrier.name}

Re: Steven R. Mercer, DOB ${I0.dob}. ${r.carrier.product}, ${money(I0.face)}. Requesting ${r.cls}.

Mr. Mercer has type 2 diabetes, diagnosed ${A.diagnoses.find(d => /diabetes/i.test(d.name))?.onset} at age ${Fx.onsetAge}, treated with ${A.meds.find(m => /metformin/i.test(m.name))?.name} alone. His A1C has come down from ${Fx.a1c[0].value}% in ${Fx.a1c[0].date.slice(-4)} to ${Fx.latest.value}% on ${Fx.latest.date}, and has been under 7.0 for ${Fx.controlledMonths} months.

${A.physician} reports no retinopathy, neuropathy or kidney involvement. Blood pressure is ${A.labs.find(l => /pressure/i.test(l.test))?.result} on ${A.meds.find(m => /lisinopril/i.test(m.name))?.name}. BMI is ${Fx.bmi}. No tobacco in ten years.

${Fx.decline ? `He was declined by ${Fx.decline.carrier} in ${Fx.decline.year}, when his A1C was ${Fx.declineReading?.value}%. The lab history enclosed shows the change since.` : ""}

The attending physician statement is enclosed.

${S.who.name}
${DATA.firm}`;
  }
  function app() {
    const r = pickRow(), I0 = S.intake, A = S.aps, agent = DATA.users[0];
    const ASK = [["license", "Driver's license number", "Not on any document"], ["bdob", "Beneficiary's date of birth", "Karen's age isn't in the file"]];
    const SAMPLE = { license: "PA 28 461 903", bdob: "07/22/1974" };
    const a = k => S.asked[k];
    const cell = (label, val, span = 1, rev = false) => `<div class="fs-cell" style="grid-column:span ${span}" data-field="${UI.slug(label)}"><label>${label}</label><div class="val ${rev ? "rev" : ""}">${val == null || val === "" ? "&nbsp;" : esc(val)}</div></div>`;
    const [last, first] = [I0.name.split(" ").slice(-1)[0], I0.name.split(" ")[0]];
    $("#cBody").innerHTML = `<div class="grid g-main-l">
      <div class="stack">
        <div class="card" data-guide="app"><div class="card-b">
          <div class="form-sheet"><div class="fs-top"><div class="fs-logo" style="font-size:12px">${esc(r.carrier.name.split(" ")[0].toUpperCase())}</div><div class="fs-title">Application for life insurance · Part A</div><div class="fs-date">PRODUCT<b>${esc(r.carrier.product)}</b></div></div>
            <div class="fs-sec">Proposed insured</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Last name", last)}${cell("First name", first)}${cell("Date of birth", I0.dob)}${cell("Gender", I0.gender)}</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Address", I0.address, 3)}${cell("Phone", I0.phone)}</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Occupation", I0.occupation, 2)}${cell("Annual income", money(I0.income))}${cell("Driver's license", a("license") || "", 1, !a("license"))}</div>
            <div class="fs-sec">Coverage</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Face amount", money(I0.face))}${cell("Plan", r.carrier.product)}${cell("Class requested", r.cls)}${cell("Annual premium", money(r.premium))}</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Primary beneficiary", I0.beneficiary, 2)}${cell("Relationship", "Spouse")}${cell("Beneficiary DOB", a("bdob") || "", 1, !a("bdob"))}</div>
            <div class="fs-sec">Health</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Height / weight", `${I0.height} / ${I0.weight}`)}${cell("Tobacco in 5 years", "No")}${cell("Diabetes", `Yes · ${A.diagnoses.find(d => /diabetes/i.test(d.name))?.onset}`)}${cell("High blood pressure", "Yes · treated")}</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Ever declined or rated", `Yes · ${result().F.decline?.carrier}, ${result().F.decline?.year}`, 2)}${cell("Attending physician", A.physician, 2)}</div>
            <div class="fs-sec">Agent</div>
            <div class="fs-row" style="grid-template-columns:repeat(4,1fr)">${cell("Agent", agent.name, 2)}${cell("NPN", agent.npn)}${cell("Signature", "E-signature at submission")}</div>
            <div class="fs-foot"><span>Sample form for demonstration only</span><span>${esc(r.carrier.name)}</span></div></div>
        </div></div>
        ${card("Letter to the underwriter", `<div class="letter">${esc(letter(r))}</div>`, { guide: "letter", sub: "drafted from the physician statement" })}
      </div>
      <div class="stack">
        ${card("Needs from Steven", ASK.map(([k, l, why]) => `<div class="list-item" data-ask="${k}"><div class="li-ic ${a(k) ? "ok" : "warn"}">${icon(a(k) ? "check" : "user")}</div><div class="li-b"><b>${l}</b><p>${a(k) ? esc(a(k)) : why}</p></div>${a(k) ? "" : `<button class="btn sm" data-askbtn="${k}">Add</button>`}</div>`).join(""), { tight: true, guide: "asks", sub: "yellow on the form" })}
        ${card("Carried over, not retyped", `<div class="steps">${["Name, date of birth, address and occupation from the intake", "Face amount, plan and beneficiary from the intake", "Height, weight and tobacco from the intake", "Diagnosis dates and the physician from the statement", "The prior decline, answered with its year"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
        <div class="card" data-guide="submit"><div class="card-b">${S.submitted ? `<div style="display:flex;gap:10px;align-items:center"><span class="chip ok">Submitted</span><span class="muted" style="font-size:13px">Sent to ${esc(r.carrier.name)} with the letter and the physician statement. It's on the case board.</span></div>`
          : `<p style="margin:0 0 10px;color:var(--ink-2);font-size:13.5px">The application, the letter and Dr. Linden's statement go to ${esc(r.carrier.name)} together, so the underwriter reads the trend before the numbers.</p><button class="btn primary" id="submit">${icon("send")}Submit to ${esc(r.carrier.name)}</button>`}</div></div>
      </div></div>`;
    $$("[data-askbtn]").forEach(b => b.onclick = () => { S.asked[b.dataset.askbtn] = SAMPLE[b.dataset.askbtn]; toast("Added to the application"); render(); });
    $("#submit") && ($("#submit").onclick = () => { S.submitted = true; toast(`Submitted to ${r.carrier.name} · added to the case board`); render(); });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [
      ["Read a physician statement and pull out what matters", 40, 2, 30],
      ["Work out the class each carrier will really give", 45, 3, 30],
      ["Fill a carrier application from the file", 30, 3, 30],
      ["Write the letter to the underwriter", 25, 2, 12],
      ["Log in to each portal and check every open case", 60, 0, 20],
      ["Chase an outstanding requirement", 15, 3, 40],
    ];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this month", "Minutes by hand against minutes with the desk, times how often it happens.")}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Hours saved a month</div><div class="v">${Math.round(saved)}</div><div class="d">about ${(saved / 160).toFixed(1)} of a full-time case manager</div></div>
        <div class="card kpi"><div class="l">Portal checks</div><div class="v">0</div><div class="d">minutes a morning, from 60</div></div>
        <div class="card kpi"><div class="l">Applications</div><div class="v">${tasks[2][3]}</div><div class="d">3 minutes each, not 30</div></div>
        <div class="card kpi"><div class="l">Cases watched</div><div class="v">${DATA.cases.length}</div><div class="d">across ${DATA.carriers.length} carriers</div></div>
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times a month</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for a brokerage placing 30 cases a month" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "ld:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, recommend: S.recommend, asked: S.asked, submitted: S.submitted })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/life", p), 400); }
  async function restore(st) {
    Object.assign(S, { recommend: st.recommend || null, asked: st.asked || {}, submitted: !!st.submitted });
    if (st.docs) for (const fn of DATA.packet) {
      const doc = await UI.pdfLines(await UI.fetchSample(F(fn))); const kind = Parsers.classify(doc.lines.join("\n")); const r = Parsers[kind] ? Parsers[kind](doc) : null;
      if (r) S[{ intake: "intake", aps: "aps", illustration: "ill" }[kind]] = r; S.docs.push({ name: fn, kind, fields: r ? r.fields : 0, pages: doc.numPages });
    }
  }
  UI.setOnNav(h => {
    $("#nav").innerHTML = NAV.map(([sec, items]) => `<div class="nav-h">${sec}</div>` + items.map(([href, ic, label, cnt, hot]) => {
      const c = cnt ? cnt() : 0; const on = h === href.slice(1);
      return `<a href="${href}" class="${on ? "on" : ""}">${icon(ic)}<span>${label}</span>${c ? `<span class="cnt ${hot ? "hot" : ""}">${c}</span>` : ""}</a>`;
    }).join("")).join(""); save();
  });
  UI.setPalette(() => [
    ...NAV.flatMap(([sec, items]) => items.map(([href, ic, label]) => ({ label, sub: sec, href, icon: ic, kind: "Page", top: true }))),
    ...DATA.cases.map(c => ({ label: c.name, sub: `${c.product} · ${face(c.face)} · ${c.carrier} · ${c.status}`, href: "#/cases/" + c.id, icon: "user", kind: "Case" })),
    ...DATA.carriers.map(c => ({ label: c.name, sub: `${c.product} · ${c.rule.text}`, href: BASE + "/uw", icon: "building", kind: "Carrier" })),
  ]);

  /* ================= guided demo ================= */
  Guide.init({
    app: "life", minutes: 7,
    intro: "A walkthrough of one impaired-risk case, from the file the client handed over to a submitted application, then every open case pulled out of the carrier portals. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What was checked overnight", "Case board": "Four portals, one view", "His file": "Intake, physician statement, illustration", "Underwriting": "Each carrier's own guideline",
      "Carriers": "The illustration that won't happen", "Application": "Filled, with a letter for the underwriter", "Results": "Hours saved" },
    welcomeTitle: "Welcome to Life Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of a life brokerage where the case work is automated: files read, each carrier's underwriting guideline applied before the carrier does it, applications filled and every open case's status pulled from the carriers' portals.</p><p>It runs on real sample documents: a client intake, an attending physician statement and a carrier illustration. All people, carriers and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">Three documents became a likely class at four carriers, a recommendation that saves him ${money(870 * 20)} over the term, a filled application and a letter for the underwriter, without retyping his lab history.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/life", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:life:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What was checked overnight",
        body: "Every carrier portal was read at 6:04 AM. One case approved, one rated down, one physician statement late, all before anyone logged in.", why: "Checking four portals by hand is the first hour of a case manager's day." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "A rated offer to take to the client, a $3M case stalled on one form, an incomplete application. Each with what to do next." },

      { chapter: "Case board", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-case="george-tran"]', 'tr[data-case="maria-esposito"]'],
        title: "Four portals, one view", body: "Every open case, with what the carrier is still waiting on and which portal it came from. The two that need someone today sit at the top." },

      { chapter: "His file", route: BASE + "/docs", target: "#dDrop", dropzone: "#dDrop", dropButton: "#dSample", doneWhen: '[data-guide="docs-read"]',
        files: [{ name: "Client intake", url: F(DATA.packet[0]), note: "From his first call" }, { name: "Physician statement", url: F(DATA.packet[1]), note: "Dr. Linden · 4 A1C results" }, { name: "Summit illustration", url: F(DATA.packet[2]), note: "What another agent showed him" }],
        title: "Steven Mercer, 54, wants $1.5M", body: "A business owner with type 2 diabetes, declined by one carrier three years ago. His file is an intake, his doctor's statement and an illustration another agent gave him. <b>Drag the files onto the drop area.</b>" },
      { chapter: "His file", route: BASE + "/profile", target: '[data-guide="prior"]', block: "center",
        marks: ['[data-prior="beacon-national-life"]'],
        source: { type: "pdf", url: F(DATA.packet[1]), find: ["04/12/2023", "8.4%"], caption: "Dr. Linden's physician statement · 2023", legend: "<i></i> the reading from the time of the decline" },
        title: "A decline, matched to the lab result behind it", body: "The intake says Beacon declined him in 2023. The physician statement has an 8.4% A1C that April. Put together, the decline has an explanation, and it's in the past.",
        why: "Every application asks about prior declines. Answering with the reason is what keeps it from sinking the case." },

      { chapter: "Underwriting", route: BASE + "/uw", target: '[data-guide="a1c"]', block: "start",
        source: { type: "pdf", url: F(DATA.packet[1]), find: ["8.4%", "7.4%", "6.9%", "6.8%"], caption: "Dr. Linden's physician statement · laboratory results", legend: "<i></i> charted" },
        title: "The trend is the whole case", body: "Four A1C results, lined up by date: down from 8.4% to 6.8%, under 7.0 for 18 months. An underwriter looks for exactly this." },
      { chapter: "Underwriting", route: BASE + "/uw", target: '[data-carrier="crestpoint"]', block: "center",
        title: "Each carrier's own guideline, applied", body: "Crestpoint gives Standard Plus to a type 2 diabetic who meets five conditions. He meets all five, and each is shown with the fact that settles it. Summit caps him at Standard however good his labs are." },

      { chapter: "Carriers", route: BASE + "/quotes", target: '[data-guide="catch"]', block: "start",
        source: { type: "pdf", url: F(DATA.packet[2]), find: ["Standard Plus Non-Tobacco", "$4,860.00"], caption: "Summit Life illustration he was shown", legend: "<i></i> a class he won't get" },
        title: "The illustration he's holding won't happen", body: "It shows Standard Plus. Summit's own guideline won't give a diabetic on medication better than Standard, so the real offer is $1,080 a year higher, $21,600 over the term. He'd find out after the exam.",
        why: "A rate-down after the exam is where most impaired-risk cases are lost." },
      { chapter: "Carriers", route: BASE + "/quotes", target: '[data-rec="crestpoint"]', advance: "click", hint: "Click Recommend on Crestpoint Mutual",
        title: "Recommend Crestpoint Mutual", body: "Standard Plus at $5,070 a year, against $5,940 from Summit at the class Summit will really give. <b>Recommend it</b> and the application and letter are built for it." },

      { chapter: "Application", route: BASE + "/app", target: '[data-guide="app"]', block: "start",
        marks: ['[data-field="date-of-birth"] .val', '[data-field="face-amount"] .val', '[data-field="ever-declined-or-rated"] .val', '[data-field="driver-s-license"] .val'],
        source: { type: "pdf", url: F(DATA.packet[0]), find: ["02/09/1972", "$1,500,000", "Beacon National Life"], caption: "Client intake", legend: "<i></i> carried into the application" },
        title: "The application fills itself", body: "Crestpoint's application, from his intake and physician statement. Yellow is what no document had: his license number and his wife's date of birth." },
      { chapter: "Application", route: BASE + "/app", target: '[data-guide="letter"]', block: "start",
        source: { type: "pdf", url: F(DATA.packet[1]), find: ["No retinopathy, neuropathy or kidney", "8.4%", "6.8%"], caption: "Dr. Linden's physician statement", legend: "<i></i> quoted in the letter" },
        title: "A letter for the underwriter, drafted", body: "The case for Standard Plus in plain words: the trend, no complications, and the decline explained before the underwriter finds it. Drafted from the physician statement, ready to edit." },
      { chapter: "Application", route: BASE + "/app", target: "#submit", advance: "click", hint: "Click Submit to Crestpoint Mutual",
        title: "Submit it", body: "The application, the letter and the statement go together. <b>Submit</b> and the case joins the board, watched from then on." },

      { chapter: "Results", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-case="steven-mercer"]'],
        title: "On the board with everything else", body: "Steven's case is now submitted, with the next requirements listed. From here it's checked every morning with the rest." },
      { chapter: "Results", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth in a month", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your book." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Clear this demo session and start again">Restart</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/life"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/life"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    } else {                     // no sign-in page: open straight on the dashboard as the first sample user
      enter(DATA.users[0]); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin();
    }
  })();
})();
