/* Benefits Desk: screens. Depends on shared/core.js (UI), data.js (DATA) and parsers.js (Parsers). */
(() => {
  const { $, $$, esc, money, num, pct, fdate, daysUntil, icon, toast, modal, route, go, render } = UI;
  const S = { census: null, fi: { docs: [], plans: [] }, sf: { bids: [] }, eePct: 75, depPct: 50, planFilter: "all",
    recommend: null, sel: {}, done: new Set(), x: {} };
  const credit = (...a) => window.BD?.credit?.(...a);
  const G = id => DATA.groups.find(g => g.id === id);
  const view = () => $("#view");
  const TIER_NAMES = { EE: "Employee only", ES: "Employee + spouse", EC: "Employee + child(ren)", FAM: "Family" };
  const planLabel = p => p.name.split(" ")[0] === p.carrier.split(" ")[0] ? p.name : `${p.carrier}: ${p.name}`;
  const pctChip = v => `<span class="chip ${v > 10 ? "crit" : v > 6 ? "warn" : "ok"} plain">${pct(v)}</span>`;
  const daysChip = d => { const n = daysUntil(d); return `<span class="chip ${n <= 3 ? "crit" : n <= 14 ? "warn" : ""} plain">${n < 0 ? Math.abs(n) + " days ago" : n === 0 ? "Today" : n + " days"}</span>`; };

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;

  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}" data-guide="next"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const T = UI.tip, I = UI.info;

  /* ================= nav ================= */
  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/groups", "building", "Employer groups"], ["#/leads", "spark", "Website leads", () => 4 - Object.keys(S.x.leads || {}).length], ["#/inbox", "inbox", "Service inbox", () => DATA.inbox.filter(m => !S.done.has("mail" + m.id)).length]]],
    ["Placement", [["#/census", "table", "Census intake"], ["#/marketing", "columns", "Quotes & bids"], ["#/renewals", "refresh", "Renewals"]]],
    ["Cost savings", [["#/engagements", "file", "Engagements"], ["#/diagnostic", "chart", "Claims diagnostic"], ["#/models", "scale", "Savings models"], ["#/savings-proposal", "dollar", "Savings proposal"], ["#/tracker", "check", "Savings tracker"], ["#/board", "layers", "Board pack"]]],
    ["Operations", [["#/enrollment", "users", "Enrollment & eligibility"], ["#/comms", "mail", "Employee comms"], ["#/reconciliation", "scale", "Billing & payroll", () => DATA.recon.filter((r, i) => !S.done.has("rec" + i)).length, true], ["#/commissions", "dollar", "Commissions"], ["#/fees", "dollar", "Fees & invoices"]]],
    ["Compliance", [["#/compliance", "shield", "Compliance calendar"]]],
    ["Insights", [["#/time-saved", "clock", "Time & cost saved"]]],
  ];
  function drawNav(h) {
    $("#nav").innerHTML = NAV.map(([sec, items]) => `<div class="nav-h">${sec}</div>` + items.map(([href, ic, label, cnt, hot]) => {
      const c = cnt ? cnt() : 0; const on = h.startsWith(href.slice(1));
      return `<a href="${href}" class="${on ? "on" : ""}">${icon(ic)}<span>${label}</span>${c ? `<span class="cnt ${hot ? "hot" : ""}">${c}</span>` : ""}</a>`;
    }).join("")).join("");
  }
  UI.setOnNav(drawNav);

  /* ================= home ================= */
  route("/home", () => {
    const lives = DATA.groups.reduce((s, g) => s + g.enrolled, 0);
    const up = DATA.groups.filter(g => daysUntil(g.renewal) <= 120);
    const hours = [["Quote & bid comparisons", 38], ["Service emails", 34], ["Billing & payroll checks", 29], ["Census cleanup", 21], ["Compliance notices", 16], ["Commission checks", 8]];
    const maxH = Math.max(...hours.map(h => h[1]));
    setPage([["Home"]], `
      ${head("Good morning, Morgan", "Wednesday, September 16 · here's what the desk handled overnight and what needs you.",
        `<a class="btn" href="#/census">${icon("upload")}New census</a><a class="btn primary" href="#/marketing/trinity-oak">${icon("columns")}Open Trinity Oak quotes</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">${icon("building")} Employer groups</div><div class="v">${DATA.groups.length}</div><div class="d">${num(lives)} covered employees</div></div>
        <div class="card kpi"><div class="l">${icon("refresh")} Renewals in 120 days</div><div class="v">${up.length}</div><div class="d">${money(up.reduce((s, g) => s + g.annual, 0) / 1e6, 1)}M in annual premium</div></div>
        <div class="card kpi"><div class="l">${icon("alert")} Open exceptions</div><div class="v">${DATA.recon.length}</div><div class="d"><span class="dn">${money(DATA.recon.reduce((s, r) => s + r.monthly, 0))}/mo</span> billed or withheld wrong</div></div>
        <div class="card kpi"><div class="l">${icon("clock")} Manual work handled · Sep ${I("Estimated from how long each task takes by hand: 90 minutes per quote comparison, 40 per census, 6 per service email.")}</div><div class="v">146 hrs</div><div class="d"><span class="up">+38 hrs</span> vs August</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit">
            <div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""),
          { sub: "since 6:00 PM yesterday", tight: true, guide: "activity" })}
        ${card("Needs a decision", DATA.tasks.map(t => `<a class="list-item" href="${t.link}" style="text-decoration:none;color:inherit">
            <div class="li-b"><b>${t.title}</b><p>${t.why}</p><p class="muted" style="font-size:12px;margin-top:4px">${t.owner}</p></div>${daysChip(t.due)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>
      <div class="grid g-main-l">
        ${card("Renewal pipeline", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Group</th><th>Funding</th><th>Renewal</th><th class="num">Annual premium</th><th>Change</th><th>Stage</th></tr></thead><tbody>
          ${[...DATA.groups].sort((a, b) => a.renewal.localeCompare(b.renewal)).map(g => `<tr class="click" onclick="location.hash='#/groups/${g.id}'">
            <td><div class="cell-2"><b>${g.name}</b><small>${g.enrolled.toLocaleString()} enrolled · ${g.am}</small></div></td><td>${g.funding}</td>
            <td class="nowrap">${fdate(g.renewal)}</td><td class="num">${money(g.annual)}</td>
            <td>${g.renewalAnnual ? pctChip((g.renewalAnnual / g.annual - 1) * 100) : '<span class="muted">Pending</span>'}</td>
            <td><span class="chip ${g.stageKind}">${g.stage}</span></td></tr>`).join("")}</tbody></table></div>`, { tight: true, actions: `<a class="btn sm ghost" href="#/renewals">All renewals</a>` })}
        ${card("Where the manual work went", `<div class="bars">${hours.map(([l, v]) => `<div class="bar-row"><span>${l}</span><div class="track"><i style="width:${v / maxH * 100}%"></i></div><span class="num">${v} hrs</span></div>`).join("")}</div>
          <p class="muted" style="font-size:12.5px;margin:14px 0 0">Estimated from the time each task takes by hand: 90 minutes per quote comparison, 6 minutes per service email, 40 minutes per census.</p>`, { sub: "September" })}
      </div>`);
  });

  /* ================= groups ================= */
  route("/groups", () => {
    setPage([["Employer groups"]], `${head("Employer groups", `${DATA.groups.length} groups · ${num(DATA.groups.reduce((s, g) => s + g.enrolled, 0))} enrolled employees`)}
      ${card("Book of business", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Group</th><th>Industry</th><th>Funding</th><th>Carrier / vendors</th><th class="num">Enrolled</th><th class="num">Annual premium</th><th>Renewal</th><th>Account manager</th></tr></thead><tbody>
        ${DATA.groups.map(g => `<tr class="click" onclick="location.hash='#/groups/${g.id}'"><td><div class="cell-2"><b>${g.name}</b><small>${g.hq}${g.locations.length > 1 ? ` · ${g.locations.length} locations` : ""}</small></div></td>
          <td>${g.industry}</td><td><span class="chip plain ${g.funding === "Self-funded" ? "violet" : g.funding === "Fully insured" ? "info" : "accent"}">${g.funding}</span></td>
          <td class="ink2" style="max-width:240px">${g.carrier}</td><td class="num">${num(g.enrolled)}</td><td class="num">${money(g.annual)}</td><td class="nowrap">${fdate(g.renewal)}</td><td>${g.am}</td></tr>`).join("")}
      </tbody></table></div>`, { tight: true })}`);
  });

  route("/groups/:id", ({ id }) => {
    const g = G(id); if (!g) return go("#/groups");
    const rec = DATA.recon.filter(r => r.group === id), mail = DATA.inbox.filter(m => m.org === g.name), win = DATA.enrollment.windows.filter(w => w.group === id);
    const rn = DATA.renewals.find(r => r.group === id);
    const openItems = [...rec.map(r => ["scale", r.sev, `${r.issue}: ${r.who}`, `${r.detail} · ${money(r.monthly)}/mo`, "#/reconciliation"]),
      ...mail.map(m => ["mail", "info", m.subject, `${m.from} · ${m.intent}`, "#/inbox"]), ...win.map(w => ["users", "warn", `${w.event}: ${w.who}`, `Window closes ${fdate(w.deadline)}`, "#/enrollment"])];
    const caseLink = DATA.rfp[id] ? `<a class="btn primary" href="#/marketing/${id}">${icon("columns")}Open marketing case</a>` : "";
    setPage([["Employer groups", "#/groups"], [g.name]], `${head(g.name, `${g.industry} · ${g.hq}`, `<a class="btn" href="#/census">${icon("table")}Census</a>${caseLink}`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Enrolled / eligible</div><div class="v">${num(g.enrolled)}<span class="muted" style="font-size:16px"> / ${num(g.eligible)}</span></div><div class="d">${Math.round(g.enrolled / g.eligible * 100)}% participation</div></div>
        <div class="card kpi"><div class="l">Annual premium</div><div class="v">${money(g.annual)}</div><div class="d">${g.funding}</div></div>
        <div class="card kpi"><div class="l">Renewal</div><div class="v" style="font-size:20px">${fdate(g.renewal)}</div><div class="d">${daysUntil(g.renewal)} days away</div></div>
        <div class="card kpi"><div class="l">Renewal change</div><div class="v">${g.renewalAnnual ? pct((g.renewalAnnual / g.annual - 1) * 100) : "—"}</div><div class="d">${g.renewalAnnual ? money(g.renewalAnnual - g.annual) + " a year" : "Not received yet"}</div></div>
      </div>
      <div class="grid g-main-l">
        ${card("Open items", openItems.length ? openItems.map(([ic, k, t, b, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-ic ${k}">${icon(ic)}</div><div class="li-b"><b>${t}</b><p>${b}</p></div></a>`).join("") : `<div class="empty">Nothing open for this group.</div>`, { tight: true })}
        <div class="stack">
          ${card("Plan & carrier", `<dl class="kv"><dt>Funding</dt><dd>${g.funding}</dd><dt>Carrier / vendors</dt><dd>${g.carrier}</dd><dt>Plan</dt><dd>${g.plan}</dd><dt>Locations</dt><dd>${g.locations.join(", ")}</dd><dt>Account manager</dt><dd>${g.am}</dd></dl>`)}
          ${rn && rn.drivers.length ? card("What's driving the renewal", `<div class="bars">${rn.drivers.map(([l, v]) => `<div class="bar-row"><span>${l}</span><div class="track"><i style="width:${v / 10 * 100}%"></i></div><span class="num">${pct(v)}</span></div>`).join("")}</div>`, { sub: `decision due ${fdate(rn.deadline)}` }) : ""}
        </div>
      </div>`);
  });

  /* ================= census ================= */
  route("/census", () => {
    const r = S.census;
    setPage([["Census intake"]], `${head("Census intake", "Whatever HR sends, in any layout, becomes a clean census in each carrier's format.",
      r ? `<button class="btn" id="cReset">${icon("upload")}Load another file</button>` : "")}
      <div id="cBody"></div>`);
    if (!r) {
      $("#cBody").innerHTML = `${next("Step 1 of 3", "<b>Load the census HR sent.</b> Use the sample button or drop any CSV; the columns don't need to match anything.")}<div class="grid g-main">
        <div class="card"><div class="card-b">
          <div class="field" style="max-width:360px"><label>Employer group</label><select class="input"><option>Trinity Oak Dental Group</option><option>Red River HVAC Services</option><option>Harbor Point Hospitality</option></select></div>
          <div class="drop" id="cDrop"><div class="ic">${icon("upload")}</div><b>Drop the census file HR sent</b><div class="hint">CSV or Excel export, any column names, dependents on their own rows or not</div>
            <div style="margin-top:14px"><button class="btn" id="cSample">${icon("file")}Use the file Trinity Oak HR emailed</button></div></div>
          <div id="cRun" style="margin-top:16px"></div>
        </div></div>
        ${card("What gets checked", `<div class="steps">${["Columns matched to census fields", "Dates of birth in any format", "Coverage elections in plain words", "Dependents linked to employees", "Tier matches the dependents listed", "Children aged out at the effective date", "Zip codes and duplicates", "Export in each carrier's layout"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
      </div>`;
      const handle = async files => {
        const f = files[0]; const text = await f.text(); let res;
        await UI.runSteps($("#cRun"), [
          [`Reading ${esc(f.name)}`, async () => ({ detail: `${UI.parseCSV(text).length - 1} rows` })],
          ["Matching columns to census fields", async () => { res = Parsers.census(text, f.name); return { detail: `${res.map.filter(m => m.key).length} of ${res.map.length} columns` }; }],
          ["Normalizing dates and coverage wording", async () => ({ detail: `${res.dateFormats.length} date formats · ${res.tierWords.length} ways of writing coverage` })],
          ["Linking dependents to employees", async () => ({ detail: `${res.people.length} employees · ${res.dependents} dependents` })],
          ["Checking eligibility and data quality", async () => ({ detail: `${res.issues.length} issues · ${res.issues.filter(i => i.fixed).length} fixed` })],
          ["Building carrier census formats", async () => ({ detail: "Meridian · Keystone Blue" })],
        ], 420);
        if (!res || !res.people.length || !res.map.some(m => m.key === "name")) {
          $("#cRun").innerHTML = `<div class="alert warn">${icon("alert")}<div><b>${esc(f.name)} doesn't look like an employee list.</b> No column with people's names was found. Use a CSV with a row per person: name, date of birth, and their coverage choice.</div></div>`;
          return;
        }
        S.census = res; DATA.rfp["trinity-oak"].tiers = { EE: res.tiers.EE, ES: res.tiers.ES, EC: res.tiers.EC, FAM: res.tiers.FAM };
        credit("census"); toast(`Census ready: ${res.people.length} employees, ${res.issues.filter(i => !i.fixed).length} items need HR`); render();
      };
      UI.dropzone($("#cDrop"), handle, { accept: ".csv,.txt", multiple: false });
      $("#cSample").onclick = async e => { e.stopPropagation(); handle([await UI.fetchSample("samples/trinity-oak/TrinityOak_employee list FINAL (2).csv")]); };
      return;
    }
    $("#cReset").onclick = () => { S.census = null; render(); };
    const needs = r.issues.filter(i => !i.fixed), fixed = r.issues.filter(i => i.fixed);
    $("#cBody").innerHTML = `
      ${next("Step 3 of 3", "<b>Census is clean.</b> Download it in a carrier's layout, send HR the drafted questions, or use it to price the quotes.", `<a class="btn sm primary" href="#/marketing/trinity-oak">${icon("arrow")}Use for Trinity Oak quotes</a>`, true)}
      <div class="alert ${needs.length ? "warn" : "ok"}" style="margin-bottom:16px">${icon("check")}<div><b>${esc(r.filename)}</b> is cleaned and ready for carriers.
        ${needs.length ? `${needs.length} item${needs.length > 1 ? "s" : ""} need${needs.length > 1 ? "" : "s"} an answer from HR; the request is drafted.` : ""}</div></div>
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Rows in the file</div><div class="v">${r.rowsIn}</div><div class="d">${r.people.length} employees · ${r.dependents} dependents</div></div>
        <div class="card kpi"><div class="l">Enrolling in medical</div><div class="v">${r.enrolled}</div><div class="d">${r.tiers.W} waived</div></div>
        <div class="card kpi"><div class="l">Average employee age</div><div class="v">${r.avgAge.toFixed(1)}</div><div class="d">at 11/01/2026 effective date</div></div>
        <div class="card kpi"><div class="l">Issues found</div><div class="v">${r.issues.length}</div><div class="d"><span class="up">${fixed.length} fixed automatically</span> · ${needs.length} for HR</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Issues", `${r.issues.map(i => `<div class="list-item" data-issue="${esc(i.type)}"><div class="li-ic ${i.fixed ? "ok" : i.sev}">${icon(i.fixed ? "check" : "alert")}</div>
            <div class="li-b"><b>${esc(i.type)}</b> <span class="muted">· ${esc(i.who)} · line ${i.line}</span><p>${esc(i.detail)}</p></div>
            <span class="chip ${i.fixed ? "ok" : "warn"}">${i.fixed ? "Fixed" : "Ask HR"}</span></div>`).join("")}`,
          { tight: true, guide: "census-issues", actions: needs.length ? `<button class="btn sm primary" id="cAsk" data-tip="Opens an email to HR listing only what's missing">${icon("mail")}Draft request to HR</button>` : "" })}
        <div class="stack">
          ${card(`Coverage tiers ${I("Carriers price each tier differently, so these counts are what the quotes are multiplied by.")}`, `<table class="t"><tbody>${Object.entries(TIER_NAMES).map(([k, l]) => `<tr><td>${l}</td><td class="num strong">${r.tiers[k]}</td></tr>`).join("")}<tr><td class="muted">Waived</td><td class="num">${r.tiers.W}</td></tr></tbody></table>`, { tight: true })}
          ${card("By location", `<table class="t"><thead><tr><th>Office</th><th class="num">Employees</th><th class="num">Enrolled</th></tr></thead><tbody>${Object.entries(r.locations).map(([l, v]) => `<tr><td>${esc(l)}</td><td class="num">${v.employees}</td><td class="num">${v.enrolled}</td></tr>`).join("")}</tbody></table>`, { tight: true })}
        </div>
      </div>
      <div class="grid g-main-l">
        ${card("Clean census", `<div class="tbl-wrap" style="max-height:460px;overflow:auto"><table class="t"><thead><tr><th>Employee</th><th>Date of birth</th><th class="num">Age</th><th>Coverage</th><th>Dependents</th><th>Office</th><th>Zip</th></tr></thead><tbody>
          ${r.people.map(p => `<tr data-person="${esc(p.last)}, ${esc(p.first)}"><td><b>${esc(p.last)}, ${esc(p.first)}</b></td><td class="nowrap">${p.dob ? Parsers.mdy(p.dob) : '<span class="chip crit plain">Missing</span>'}${p.dob && p.dobRaw !== Parsers.mdy(p.dob) ? `<div class="muted" style="font-size:11.5px">was "${esc(p.dobRaw)}"</div>` : ""}</td>
            <td class="num">${p.age ?? "—"}</td><td>${p.tier ? Parsers.TIER_LABEL[p.tier] : "?"}${p.tierRaw && p.tierRaw !== p.tier ? `<div class="muted" style="font-size:11.5px">was "${esc(p.tierRaw)}"</div>` : ""}</td>
            <td>${p.deps.map(d => `<span class="tag">${d.rel === "Spouse" ? "Spouse" : "Child"} ${d.age ?? ""}</span>`).join(" ") || '<span class="muted">—</span>'}</td><td>${esc(p.location)}</td><td class="mono">${esc(p.zip)}</td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "census-clean" })}
        <div class="stack">
          ${card("Columns matched", `<table class="t"><thead><tr><th>Their column</th><th>Read as</th><th class="num">${T("Match", "How sure the reader is that this column holds that field. Anything under 90% is worth a glance.")}</th></tr></thead><tbody>${r.map.map(m => `<tr><td class="mono">${esc(m.col)}</td><td>${m.key ? m.label : '<span class="muted">Not needed</span>'}</td><td class="num"><span class="conf ${m.conf < .9 ? "lo" : ""}">${m.key ? Math.round(m.conf * 100) + "%" : ""}</span></td></tr>`).join("")}</tbody></table>`, { tight: true })}
          ${card("Carrier-ready files", `<div class="file-row"><div class="file-ic csv">CSV</div><div class="meta"><b>Meridian Health Plans census</b><small>Carrier layout · relationship codes EMP / SPS / CHD</small></div><button class="btn sm" data-exp="meridian">${icon("download")}Download</button></div>
            <div class="file-row"><div class="file-ic csv">CSV</div><div class="meta"><b>Keystone Blue census</b><small>One row per member · ISO dates · ages</small></div><button class="btn sm" data-exp="keystone">${icon("download")}Download</button></div>`,
            { tight: true, guide: "census-export", foot: `<a class="btn primary" href="#/marketing/trinity-oak">${icon("arrow")}Use for Trinity Oak quotes</a>` })}
        </div>
      </div>`;
    $$("[data-exp]").forEach(b => b.onclick = () => { UI.download(`TrinityOak_census_${b.dataset.exp}.csv`, UI.toCSV(Parsers.censusExport(r, b.dataset.exp))); toast("Census exported in " + (b.dataset.exp === "meridian" ? "Meridian" : "Keystone Blue") + " format"); });
    const ask = $("#cAsk"); if (ask) ask.onclick = () => modal({ title: "Request to Trinity Oak HR", actions: [{ label: "Cancel" }, { label: "Send", primary: true, onClick: () => toast("Sent to Angela Mercer · reminder set for Friday") }],
      body: `<div class="field"><label>To</label><input class="input" value="Angela Mercer <amercer@trinityoak.example>"></div><div class="field"><label>Subject</label><input class="input" value="Two quick census questions before we send to carriers"></div>
        <textarea class="input" style="min-height:220px">Hi Angela,\n\nThanks for the employee list. Before it goes to the carriers we need two things:\n\n${needs.map((i, n) => `${n + 1}. ${i.who}: ${i.type === "Missing date of birth" ? "date of birth is blank" : "confirm the medical election. The list shows Employee only, but a dependent is also listed"}`).join("\n")}\n\nEverything else is ready. We also removed one duplicate row and a dependent who is over 26.\n\nThanks,\nLuis</textarea>` });
  });

  /* ================= marketing ================= */
  route("/marketing", () => {
    const fi = DATA.rfp["trinity-oak"], sf = DATA.rfp["cedar-ridge"];
    setPage([["Quotes & bids"]], `${head("Quotes & bids", "Every carrier quote and specialist bid read into one comparison, whatever format it arrives in.", `<button class="btn primary" onclick="UI.toast('New marketing case created for Harbor Point Hospitality')">${icon("plus")}New marketing case</button>`)}
      <div class="grid g2">
        <a class="card" href="#/marketing/trinity-oak" style="text-decoration:none;color:inherit"><div class="card-b">
          <div class="row"><span class="chip info plain">Fully insured</span><span class="spacer"></span>${daysChip(fi.due)}</div>
          <h3 style="margin:12px 0 4px;font-size:16px">Trinity Oak Dental Group</h3><p class="ink2" style="margin:0">34 enrolled · effective ${fdate(fi.effective)} · Meridian renewal +14.8%</p>
          <div class="pipeline card" style="margin-top:14px;box-shadow:none"><div class="pipe"><div class="l">Invited</div><div class="v">5</div></div><div class="pipe"><div class="l">Quoted</div><div class="v">4</div></div><div class="pipe"><div class="l">Declined</div><div class="v">1</div></div><div class="pipe"><div class="l">Plans</div><div class="v">6</div></div></div>
        </div></a>
        <a class="card" href="#/marketing/cedar-ridge" style="text-decoration:none;color:inherit"><div class="card-b">
          <div class="row"><span class="chip violet plain">Self-funded</span><span class="spacer"></span>${daysChip(sf.due)}</div>
          <h3 style="margin:12px 0 4px;font-size:16px">Cedar Ridge Logistics</h3><p class="ink2" style="margin:0">2,140 employees · effective ${fdate(sf.effective)} · TPA, PBM and stop loss out to bid</p>
          <div class="pipeline card" style="margin-top:14px;box-shadow:none"><div class="pipe"><div class="l">TPA</div><div class="v">3</div></div><div class="pipe"><div class="l">PBM</div><div class="v">3</div></div><div class="pipe"><div class="l">Stop loss</div><div class="v">3</div></div><div class="pipe"><div class="l">Bids in</div><div class="v">9 / 9</div></div></div>
        </div></a>
      </div>`);
  });

  /* ---------- fully insured case ---------- */
  function planCost(p, tiers) { return Object.entries(tiers).reduce((s, [k, n]) => s + n * (p.rates[k] || 0), 0); }
  function employerCost(p, tiers) {
    const ee = p.rates.EE || 0;
    return Object.entries(tiers).reduce((s, [k, n]) => s + n * (S.eePct / 100 * ee + (k === "EE" ? 0 : S.depPct / 100 * ((p.rates[k] || 0) - ee))), 0);
  }
  const perCheck = (p, k) => { const ee = p.rates.EE || 0, r = p.rates[k] || 0; return (r - (S.eePct / 100 * ee + (k === "EE" ? 0 : S.depPct / 100 * (r - ee)))) * 12 / 26; };

  route("/marketing/trinity-oak", () => routeFI("docs"));
  route("/marketing/trinity-oak/:tab", ({ tab }) => routeFI(tab));
  function routeFI(tab) {
    const c = DATA.rfp["trinity-oak"]; const has = S.fi.plans.length > 0;
    const tabs = [["docs", "Carriers & documents"], ["compare", "Side-by-side"], ["contrib", "Employee cost"], ["proposal", "Client proposal"]];
    setPage([["Quotes & bids", "#/marketing"], ["Trinity Oak Dental Group"]], `${head("Trinity Oak Dental Group", `November 1, 2026 renewal · 34 enrolled · 3 offices · quotes due ${fdate(c.due)}`,
      `<span class="chip warn">Meridian renewal +14.8%</span><span class="chip">Decision by Oct 9</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/marketing/trinity-oak/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && has ? `<span class="cnt">${S.fi.docs.length}</span>` : ""}${k === "compare" && has ? `<span class="cnt">${S.fi.plans.length}</span>` : ""}</a>`).join("")}</div>
      ${({ docs: has ? next("Step 2 of 4", `<b>${S.fi.plans.length} plans read.</b> Open the side-by-side to see them on the same rows.`, `<a class="btn sm primary" href="#/marketing/trinity-oak/compare">${icon("columns")}Open side-by-side</a>`) : next("Step 1 of 4", "<b>Read the quotes.</b> Load the four PDFs the carriers sent; each one is laid out differently."),
         compare: next("Step 3 of 4", "<b>Pick a recommendation</b> with the button under a plan, then see what it costs employees.", `<a class="btn sm primary" href="#/marketing/trinity-oak/contrib">${icon("users")}Employee cost</a>`),
         contrib: next("Step 4 of 4", "<b>Drag the sliders</b> to try a contribution strategy. Carrier minimums are checked as you go.", `<a class="btn sm primary" href="#/marketing/trinity-oak/proposal">${icon("file")}Client proposal</a>`),
         proposal: next("Done", "<b>The proposal is ready.</b> Download it as a PDF or share it with the client.", "", true) }[tab] || "")}
      <div id="fiBody"></div>`);
    if (tab !== "docs" && !has) {
      $("#fiBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>No quotes read yet.</b></p><p>Load the carrier documents first and the comparison builds itself.</p><a class="btn primary" href="#/marketing/trinity-oak/docs">Go to documents</a></div></div>`; return;
    }
    ({ docs: fiDocs, compare: fiCompare, contrib: fiContrib, proposal: fiProposal }[tab] || fiDocs)(c);
  }

  function fiDocs(c) {
    const has = S.fi.docs.length;
    $("#fiBody").innerHTML = `<div class="grid g-main-l">
      <div class="stack">
        <div class="card"><div class="card-b">
          <div class="drop" id="qDrop"><div class="ic">${icon("upload")}</div><b>Drop carrier quotes and renewals</b><div class="hint">PDFs as the carriers send them. Each layout is different; no templates needed.</div>
            <div style="margin-top:14px"><button class="btn primary" id="qSample">${icon("file")}Load the 4 documents carriers sent</button></div></div>
          <div id="qRun" style="margin-top:14px"></div>
        </div></div>
        ${has ? card("Documents read", S.fi.docs.map((d, i) => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.filename)}</b>
            <small>${esc(d.carrier)} · ${d.pages} page${d.pages > 1 ? "s" : ""} · ${d.plans.length} plan${d.plans.length !== 1 ? "s" : ""} · ${d.fields} values read${d.isRenewal ? " · renewal" : ""}</small></div>
            ${d.plans.length ? '<span class="chip ok">Read</span>' : '<span class="chip warn" data-tip="No plan names with benefits and monthly rates were found in this file">No plans found</span>'}<button class="btn sm" data-view="${i}">${icon("eye")}What was read</button></div>`).join(""), { tight: true,
            foot: S.fi.plans.length ? `<a class="btn primary" href="#/marketing/trinity-oak/compare">${icon("columns")}Open side-by-side</a><span class="muted" style="font-size:12.5px">${S.fi.plans.length} plans compared on ${S.census ? "the cleaned census" : "34 enrolled employees"}</span>` : `<span class="muted" style="font-size:12.5px">Load carrier quotes or renewals to build the comparison.</span>` }) : ""}
      </div>
      ${card("Carriers invited", `<table class="t"><tbody>${c.invited.map(v => {
        const read = S.fi.docs.find(d => d.filename === v.file);
        return `<tr><td><b>${v.carrier}</b><div class="muted" style="font-size:12px">${v.file ? esc(v.file) : "Declined by email 9/12"}</div></td><td><span class="chip ${read ? "ok" : v.kind === "crit" ? "crit" : ""}">${read ? "Read" : v.status}</span></td></tr>`;
      }).join("")}</tbody></table>`, { tight: true, sub: `due ${fdate(c.due)}` })}
    </div>`;
    const handle = async files => {
      const pdfs = files.filter(f => UI.ext(f.name) === "pdf"); const steps = [];
      for (const f of pdfs) steps.push([`Reading ${esc(f.name)}`, async () => {
        const doc = await UI.pdfLines(f); const q = Parsers.quote(doc, f.name);
        S.fi.docs = S.fi.docs.filter(d => d.filename !== f.name).concat([{ ...q, lines: doc.lines }]);
        return { detail: `${q.plans.length} plan${q.plans.length > 1 ? "s" : ""} · ${q.fields} values` };
      }]);
      steps.push(["Lining up benefits and rates", async () => {
        S.fi.plans = S.fi.docs.flatMap(d => d.plans).sort((a, b) => (b.isRenewal - a.isRenewal));
        return { detail: `${S.fi.plans.length} plans` };
      }]);
      await UI.runSteps($("#qRun"), steps, 450);
      const empty = S.fi.docs.filter(d => !d.plans.length);
      if (empty.length) toast(`${empty.length} document${empty.length > 1 ? "s" : ""} had no plan designs or rates to read`, "warn");
      if (S.fi.plans.length) { credit("quotes"); toast(`${S.fi.plans.length} plans read from ${S.fi.docs.length - empty.length} documents`); } render();
    };
    UI.dropzone($("#qDrop"), handle, { accept: ".pdf" });
    $("#qSample").onclick = async e => {
      e.stopPropagation(); e.target.disabled = true;
      handle(await Promise.all(c.invited.filter(v => v.file).map(v => UI.fetchSample("samples/trinity-oak/" + encodeURIComponent(v.file)))));
    };
    $$("[data-view]").forEach(b => b.onclick = () => {
      const d = S.fi.docs[+b.dataset.view];
      const LABEL = { network: "Network", deductible: "Deductible", oop: "Out-of-pocket max", coins: "Coinsurance", pcp: "Primary care", spec: "Specialist", urgent: "Urgent care", er: "Emergency room", rx: "Prescriptions", specialty: "Specialty drugs", hsa: "HSA eligible" };
      modal({ title: `${esc(d.carrier)}: what was read`, wide: true, body: `<div class="grid g2">
        <div><div class="muted" style="font-size:12px;margin-bottom:6px">TEXT IN THE PDF</div><div class="doc" style="max-height:520px"><div class="sheet" style="font:12px/1.55 var(--mono);padding:18px">${d.lines.map(l => esc(l)).join("<br>")}</div></div></div>
        <div><div class="muted" style="font-size:12px;margin-bottom:6px">STRUCTURED RESULT</div>${d.plans.map(p => `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>${esc(p.name)}</h3></div><div class="card-b"><dl class="kv">
          ${Object.entries(LABEL).filter(([k]) => p.benefits[k]).map(([k, l]) => `<dt>${l}</dt><dd>${esc(p.benefits[k])}</dd>`).join("")}
          ${Object.entries(TIER_NAMES).map(([k, l]) => `<dt>${l}</dt><dd>${money(p.rates[k], 2)}${p.current[k] ? ` <span class="muted">(was ${money(p.current[k], 2)})</span>` : ""}</dd>`).join("")}
        </dl></div></div>`).join("")}
        ${d.composition.length ? `<div class="card"><div class="card-h"><h3>Renewal drivers</h3></div><div class="card-b"><dl class="kv">${d.composition.map(([l, v]) => `<dt>${esc(l)}</dt><dd>${pct(v)}</dd>`).join("")}</dl></div></div>` : ""}</div></div>` });
    });
  }

  function fiCompare(c) {
    const tiers = c.tiers; const plans = S.fi.plans.filter(p => S.planFilter === "all" || (S.planFilter === "hsa" ? p.hsa : !p.hsa));
    const ren = S.fi.plans.find(p => p.isRenewal) || S.fi.plans[0]; const renA = planCost(ren, tiers) * 12; const curA = (Object.entries(tiers).reduce((s, [k, n]) => s + n * (ren.current[k] || 0), 0) * 12) || renA;
    const annual = plans.map(p => planCost(p, tiers) * 12); const best = Math.min(...annual);
    const lfl = S.fi.plans.filter(p => !p.isRenewal && !p.hsa && p.type === "PPO" && (p.ded[0] || 0) <= 2000).sort((a, b) => planCost(a, tiers) - planCost(b, tiers))[0];
    if (!S.recommend && lfl) S.recommend = lfl.id;
    const row = (label, fn, cls = "") => `<tr class="${cls}"><td>${label}</td>${plans.map(p => `<td class="${p.isRenewal ? "cur" : ""}">${fn(p)}</td>`).join("")}</tr>`;
    const sect = t => `<tr class="sect"><td colspan="${plans.length + 1}">${t}</td></tr>`;
    const b = k => p => esc(p.benefits[k] || "—");
    $("#fiBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Current annual premium</div><div class="v">${money(curA)}</div><div class="d">Meridian Gold PPO 1500</div></div>
        <div class="card kpi"><div class="l">Meridian renewal</div><div class="v">${money(renA)}</div><div class="d"><span class="dn">${pct((renA / curA - 1) * 100)}</span> · ${money(renA - curA)} more a year</div></div>
        <div class="card kpi"><div class="l">Closest like-for-like</div><div class="v">${lfl ? money(planCost(lfl, tiers) * 12) : "—"}</div><div class="d">${lfl ? `${esc(lfl.carrier)} · <span class="up">saves ${money(renA - planCost(lfl, tiers) * 12)}</span>` : ""}</div></div>
        <div class="card kpi"><div class="l">Lowest cost option</div><div class="v">${money(Math.min(...S.fi.plans.map(p => planCost(p, tiers) * 12)))}</div><div class="d"><span class="up">saves ${money(renA - Math.min(...S.fi.plans.map(p => planCost(p, tiers) * 12)))}</span> vs renewal</div></div>
      </div>
      <div class="card" data-guide="cmp"><div class="card-h"><h3>Side-by-side</h3><span class="sub">rates applied to ${Object.entries(tiers).map(([k, n]) => `${n} ${k}`).join(" · ")}${S.census ? " from the cleaned census" : ""}</span>
        <div class="actions"><div class="seg" id="pf">${[["all", "All plans"], ["nohsa", "Copay plans"], ["hsa", "HSA plans"]].map(([k, l]) => `<button data-f="${k}" class="${S.planFilter === k ? "on" : ""}">${l}</button>`).join("")}</div>
        <button class="btn sm" id="cmpCsv">${icon("download")}Export</button></div></div>
        <div class="tbl-wrap"><table class="cmp"><thead><tr><th></th>${plans.map(p => `<th class="${p.isRenewal ? "cur" : ""}"><span class="car">${esc(p.carrier)}</span><span class="pl">${esc(p.name)}</span>
          <div style="margin-top:6px;display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap">${p.isRenewal ? '<span class="chip warn plain">Renewal</span>' : ""}${lfl && p.id === lfl.id ? '<span class="chip info plain" data-tip="Closest to the current plan: a copay PPO with a deductible of $2,000 or less, at the lowest premium">Like-for-like</span>' : ""}${p.hsa ? '<span class="chip violet plain" data-tip="High-deductible plan that qualifies for a Health Savings Account">HSA</span>' : ""}${S.recommend === p.id ? '<span class="chip ok" data-tip="Your pick. The client proposal is built around it">Recommended</span>' : ""}</div></th>`).join("")}</tr></thead>
        <tbody>
          ${sect("Plan design")}${row("Network", b("network"))}${row("Deductible (ind / fam)", b("deductible"))}${row("Out-of-pocket max", b("oop"))}${row("Coinsurance", b("coins"))}
          ${row("Primary care", b("pcp"))}${row("Specialist", b("spec"))}${row("Urgent care", b("urgent"))}${row("Emergency room", b("er"))}${row("Prescriptions", b("rx"))}${row("Specialty drugs", b("specialty"))}
          ${sect("Monthly rates")}${Object.entries(TIER_NAMES).map(([k, l]) => row(`${l} <span class="muted">× ${tiers[k]}</span>`, p => money(p.rates[k], 2))).join("")}
          ${sect("Cost for this group")}
          <tr class="total"><td>${T("Annual premium", "Each tier's monthly rate × enrolled employees in that tier × 12. Green is the lowest.")}</td>${plans.map((p, i) => `<td class="${annual[i] === best ? "best" : p.isRenewal ? "cur" : ""}">${money(annual[i])}</td>`).join("")}</tr>
          ${row("vs Meridian renewal", p => { const d = planCost(p, tiers) * 12 - renA; return p.isRenewal ? '<span class="muted">—</span>' : `<span style="color:${d < 0 ? "var(--ok)" : "var(--crit)"};font-weight:600">${money(d)}</span>`; })}
          ${row(T("vs today", "Change from what the group pays today, before the renewal increase"), p => pct((planCost(p, tiers) * 12 / curA - 1) * 100))}
          <tr><td></td>${plans.map(p => `<td class="${p.isRenewal ? "cur" : ""}"><button class="btn sm ${S.recommend === p.id ? "primary" : ""}" data-rec="${p.id}">${S.recommend === p.id ? "Recommended" : "Recommend"}</button></td>`).join("")}</tr>
        </tbody></table></div></div>`;
    UI.tagTable($("#fiBody .cmp"), plans.map(p => p.id));
    $$("#pf button").forEach(x => x.onclick = () => { S.planFilter = x.dataset.f; render(); });
    $$("[data-rec]").forEach(x => x.onclick = () => { S.recommend = x.dataset.rec; toast("Recommendation set. The proposal has been updated"); render(); });
    $("#cmpCsv").onclick = () => {
      const keys = [["Network", "network"], ["Deductible", "deductible"], ["Out-of-pocket max", "oop"], ["Coinsurance", "coins"], ["Primary care", "pcp"], ["Specialist", "spec"], ["Urgent care", "urgent"], ["Emergency room", "er"], ["Prescriptions", "rx"], ["Specialty", "specialty"]];
      const rows = [["", ...plans.map(p => `${p.carrier} ${p.name}`)], ...keys.map(([l, k]) => [l, ...plans.map(p => p.benefits[k] || "")]),
        ...Object.entries(TIER_NAMES).map(([k, l]) => [l, ...plans.map(p => p.rates[k])]), ["Annual premium", ...plans.map(p => Math.round(planCost(p, tiers) * 12))]];
      UI.download("TrinityOak_quote_comparison.csv", UI.toCSV(rows)); toast("Comparison exported");
    };
  }

  function fiContrib(c) {
    const tiers = c.tiers; const ren = S.fi.plans.find(p => p.isRenewal) || S.fi.plans[0];
    const draw = () => {
      const plans = S.fi.plans; const renEr = employerCost(ren, tiers) * 12;
      $("#ctTable").innerHTML = `<table class="cmp"><thead><tr><th></th>${plans.map(p => `<th class="${p.isRenewal ? "cur" : ""}"><span class="car">${esc(p.carrier)}</span><span class="pl">${esc(p.name)}</span></th>`).join("")}</tr></thead><tbody>
        <tr class="sect"><td colspan="${plans.length + 1}">Employer cost</td></tr>
        <tr class="total"><td>Employer pays per year</td>${plans.map(p => `<td class="${p.isRenewal ? "cur" : ""}">${money(employerCost(p, tiers) * 12)}</td>`).join("")}</tr>
        <tr><td>vs renewal</td>${plans.map(p => { const d = employerCost(p, tiers) * 12 - renEr; return `<td class="${p.isRenewal ? "cur" : ""}">${p.isRenewal ? "—" : `<span style="color:${d < 0 ? "var(--ok)" : "var(--crit)"};font-weight:600">${money(d)}</span>`}</td>`; }).join("")}</tr>
        <tr class="sect"><td colspan="${plans.length + 1}">Employee cost per paycheck (26 a year)</td></tr>
        ${Object.entries(TIER_NAMES).map(([k, l]) => `<tr><td>${l}</td>${plans.map(p => { const v = perCheck(p, k), r = perCheck(ren, k); return `<td class="${p.isRenewal ? "cur" : ""}">${money(v, 2)}${p.isRenewal ? "" : `<div style="font-size:11.5px;color:${v <= r ? "var(--ok)" : "var(--crit)"}">${v <= r ? "" : "+"}${money(v - r, 2)}</div>`}</td>`; }).join("")}</tr>`).join("")}
      </tbody></table>`;
      $("#eeV").textContent = S.eePct + "%"; $("#depV").textContent = S.depPct + "%";
      const rules = S.fi.docs.map(d => { const m = d.lines.join(" ").match(/minimum contribution (\d+)% of employee only/i); return m ? [d.carrier, +m[1]] : null; }).filter(Boolean);
      const broken = rules.filter(([, min]) => S.eePct < min);
      $("#rules").innerHTML = rules.map(([c, min]) => `<div class="row" style="margin-top:6px"><span class="chip ${S.eePct < min ? "crit" : "ok"}">${S.eePct < min ? "Below minimum" : "Meets minimum"}</span><span style="font-size:12.5px">${esc(c)}: at least ${min}% of employee-only</span></div>`).join("")
        + (broken.length ? `<div class="alert crit" style="margin-top:10px">${icon("alert")}<div>${broken.map(b => esc(b[0])).join(", ")} would decline at this contribution.</div></div>` : "");
    };
    $("#fiBody").innerHTML = `<div class="grid g-main" style="grid-template-columns:300px minmax(0,1fr)">
      ${card("Contribution strategy", `<div class="field"><label>Employer pays of employee-only cost · <b id="eeV"></b> ${I("Share of the employee-only rate the practice pays for every enrolled employee")}</label><input type="range" min="25" max="100" step="5" value="${S.eePct}" id="eeR"></div>
        <div class="field"><label>Employer pays of dependent cost · <b id="depV"></b> ${I("Share of the extra cost for a spouse or children the practice pays")}</label><input type="range" min="0" max="100" step="5" value="${S.depPct}" id="depR"></div>
        <div class="muted" style="font-size:12px;margin-top:10px">CARRIER CONTRIBUTION RULES · read from the quotes</div><div id="rules"></div>`)}
      <div class="card"><div class="card-h"><h3>What each option costs the practice and its people</h3></div><div class="tbl-wrap" id="ctTable"></div></div></div>`;
    draw();
    $("#eeR").oninput = e => { S.eePct = +e.target.value; draw(); save(); };
    $("#depR").oninput = e => { S.depPct = +e.target.value; draw(); save(); };
  }

  function fiProposal(c) {
    credit("proposal");
    const tiers = c.tiers; const ren = S.fi.plans.find(p => p.isRenewal) || S.fi.plans[0]; const renA = planCost(ren, tiers) * 12;
    const curA = (Object.entries(tiers).reduce((s, [k, n]) => s + n * (ren.current[k] || 0), 0) * 12) || renA;
    const rec = S.fi.plans.find(p => p.id === S.recommend) || S.fi.plans.find(p => !p.isRenewal);
    const alts = S.fi.plans.filter(p => !p.isRenewal).sort((a, b) => planCost(a, tiers) - planCost(b, tiers));
    const recA = planCost(rec, tiers) * 12; const drivers = S.fi.docs.find(d => d.isRenewal)?.composition || [];
    $("#fiBody").innerHTML = `<div class="row no-print" style="margin-bottom:14px"><span class="muted">Built from the documents read and the recommendation on the side-by-side. Change either and this updates.</span><span class="spacer"></span>
      <button class="btn" onclick="UI.toast('Shared with Angela Mercer and Dr. Patel')">${icon("send")}Share with client</button><button class="btn primary" onclick="UI.printOnly(document.querySelector('.report'))">${icon("printer")}Download PDF</button></div>
      <div class="report">
        <div class="rep-meta">${DATA.firm.toUpperCase()} · RENEWAL RECOMMENDATION</div>
        <h1 style="margin-top:8px">Trinity Oak Dental Group</h1><div class="rep-meta">Medical plan options for November 1, 2026 · prepared September 16, 2026</div>
        <h2>Where things stand</h2>
        <p>Meridian Health Plans has renewed the Gold PPO 1500 at <b>${pct((renA / curA - 1) * 100)}</b>, taking annual premium from ${money(curA)} to <b>${money(renA)}</b>. ${drivers.length ? `The increase is driven mostly by medical trend (${pct(drivers[0][1])}) and the group's own claims experience (${pct(drivers[1][1])}).` : ""} We asked five carriers to quote; four responded with ${alts.length} alternative plans.</p>
        <h2>Options</h2>
        <table class="t"><thead><tr><th>Plan</th><th>Deductible</th><th>Primary care</th><th class="num">Annual premium</th><th class="num">vs renewal</th></tr></thead><tbody>
          <tr><td><b>${esc(planLabel(ren))}</b><div class="muted" style="font-size:12px">Renewal as offered</div></td><td class="nowrap">${esc(ren.benefits.deductible)}</td><td>${esc(ren.benefits.pcp)}</td><td class="num">${money(renA)}</td><td class="num">—</td></tr>
          ${alts.map(p => `<tr class="${p.id === rec.id ? "sel" : ""}"><td><b>${esc(planLabel(p))}</b>${p.id === rec.id ? '<div style="font-size:12px;color:var(--ok);font-weight:600">Recommended</div>' : ""}</td><td class="nowrap">${esc(p.benefits.deductible)}</td><td>${esc(p.benefits.pcp)}</td><td class="num">${money(planCost(p, tiers) * 12)}</td><td class="num" style="color:var(--ok)">${money(planCost(p, tiers) * 12 - renA)}</td></tr>`).join("")}
        </tbody></table>
        <h2>Our recommendation</h2>
        <p>Move to <b>${esc(planLabel(rec))}</b>. It saves <b>${money(renA - recA)} a year</b> against the renewal (${pct((recA / renA - 1) * 100)}), keeps a ${esc(rec.benefits.network || "PPO")} network and a ${esc(rec.benefits.pcp)} primary care visit, and holds the deductible at ${esc(rec.benefits.deductible)}.</p>
        <p>At the practice paying ${S.eePct}% of employee-only cost and ${S.depPct}% of dependent cost, an employee on employee-only coverage pays <b>${money(perCheck(rec, "EE"), 2)} per paycheck</b>, compared with ${money(perCheck(ren, "EE"), 2)} under the renewal.</p>
        <h2>Next steps</h2>
        <table class="t"><tbody>
          <tr><td>Confirm Dr. Patel's preferred providers are in network</td><td class="nowrap">By Sep 25</td></tr>
          <tr><td>Decide on the plan and contribution</td><td class="nowrap">By Oct 2</td></tr>
          <tr><td>Signed application to ${esc(rec.carrier)}${rec.isRenewal ? "" : " and notice to Meridian"}</td><td class="nowrap">By Oct 9</td></tr>
          <tr><td>Open enrollment for employees (3 offices)</td><td class="nowrap">Oct 12 – Oct 23</td></tr>
        </tbody></table>
        <p class="muted" style="font-size:12px;margin-top:24px">Rates are as quoted by each carrier and subject to final underwriting. Sample document: all companies and figures are fictional.</p>
      </div>`;
  }

  /* ---------- self-funded case ---------- */
  function sfCalc(b, c) {
    if (b.type === "TPA") { const pepm = b.admin + b.network + b.care; const annual = pepm * c.employees * 12 - b.credit;
      const flags = []; if (/billed/i.test(b.runout)) flags.push("Claims run-out billed separately"); if (b.credit) flags.push(`${money(b.credit)} implementation credit`); if (/2 year/i.test(b.guarantee)) flags.push("Fees guaranteed 2 years");
      return { annual, risk: annual, pepm, flags }; }
    if (b.type === "PBM") {
      const shared = b.note.match(/shared (\d+)\/\d+/i); const noSpec = /exclud\w* specialty/i.test(b.note);
      const share = shared ? +shared[1] / 100 : noSpec ? 0.78 : 1;
      const cost = c.rx.brandAWP * (1 - b.brand) + c.rx.genericAWP * (1 - b.generic) + c.rx.specialtyAWP * (1 - b.specialty) - b.rebate * b.scripts * share + b.adminClaim * b.claims;
      const spread = /spread/i.test(b.model) ? 4.5 * b.claims : 0;
      const flags = []; if (spread) flags.push(`Spread pricing: ~${money(spread)} undisclosed margin (est. $4.50 a claim)`);
      if (shared) flags.push(`Rebates shared ${shared[1]}/${100 - shared[1]}`); if (noSpec) flags.push("Rebate guarantee excludes specialty drugs");
      if (/pass-through/i.test(b.model)) flags.push("100% rebate pass-through"); if (/market check/i.test(b.note)) flags.push("Annual market check");
      return { annual: cost, risk: cost + spread, flags };
    }
    if (b.type === "SL") {
      const annual = (b.single * c.singles + b.family * c.families + b.agg * c.employees) * 12;
      const lasers = (b.lasers.match(/\$[\d,]+/g) || []).map(UI.parseMoney); const laserExp = lasers.reduce((s, l) => s + (l - b.deductible), 0);
      const dedExp = Math.max(0, b.deductible - 250000) * c.claimantsOver250k; const flags = [];
      if (lasers.length) flags.push(`${lasers.length} laser${lasers.length > 1 ? "s" : ""}: ${money(laserExp)} more retained risk`);
      if (dedExp) flags.push(`Higher deductible: ~${money(dedExp)} more retained on ${c.claimantsOver250k} large claimants`);
      if (/12\/15/.test(b.basis)) flags.push("12/15 contract: claims paid late in the year still covered");
      return { annual, risk: annual + laserExp + dedExp, flags };
    }
  }
  route("/marketing/cedar-ridge", () => routeSF("bids"));
  route("/marketing/cedar-ridge/:tab", ({ tab }) => routeSF(tab));
  function routeSF(tab) {
    const c = DATA.rfp["cedar-ridge"]; const has = S.sf.bids.length > 0;
    const tabs = [["bids", "Bid documents"], ["compare", "Normalized comparison"], ["savings", "Savings report"]];
    setPage([["Quotes & bids", "#/marketing"], ["Cedar Ridge Logistics"]], `${head("Cedar Ridge Logistics", `Self-funded · 2,140 employees in 4 states · January 1, 2027 · bids due ${fdate(c.due)}`,
      `<span class="chip violet">TPA · PBM · Stop loss</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="#/marketing/cedar-ridge/${k}" class="${tab === k ? "on" : ""}">${l}${k === "bids" && has ? `<span class="cnt">${S.sf.bids.length}</span>` : ""}</a>`).join("")}</div>
      ${({ bids: has ? next("Step 2 of 3", `<b>${S.sf.bids.length} bids read.</b> See them priced on the same group, with the hidden costs added.`, `<a class="btn sm primary" href="#/marketing/cedar-ridge/compare">${icon("scale")}Normalized comparison</a>`) : next("Step 1 of 3", "<b>Read the bids.</b> Load the nine documents from administrators, PBMs and stop-loss markets."),
         compare: next("Step 3 of 3", "<b>Selections default to the lowest risk-adjusted cost.</b> Change any of them, then open the savings report.", `<a class="btn sm primary" href="#/marketing/cedar-ridge/savings">${icon("file")}Savings report</a>`),
         savings: next("Done", "<b>Savings documented,</b> with how every figure was calculated.", "", true) }[tab] || "")}
      <div id="sfBody"></div>`);
    if (tab !== "bids" && !has) { $("#sfBody").innerHTML = `<div class="card"><div class="empty"><p><b>No bids read yet.</b></p><a class="btn primary" href="#/marketing/cedar-ridge/bids">Go to bid documents</a></div></div>`; return; }
    ({ bids: sfBids, compare: sfCompare, savings: sfSavings }[tab] || sfBids)(c);
  }
  const TYPE = { TPA: ["Third-party administration", "users"], PBM: ["Pharmacy benefit manager", "pill"], SL: ["Stop loss", "shield"] };
  function sfBids(c) {
    const has = S.sf.bids.length;
    $("#sfBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="bDrop"><div class="ic">${icon("upload")}</div><b>Drop bids from administrators, PBMs and stop-loss markets</b><div class="hint">Renewals and proposals as sent. Fees, discounts, rebates, rates and lasers are pulled out of each one.</div>
        <div style="margin-top:14px"><button class="btn primary" id="bSample">${icon("file")}Load the 9 bids received</button></div></div><div id="bRun" style="margin-top:14px"></div></div></div>
      ${has ? Object.keys(TYPE).map((t, k) => card(TYPE[t][0], S.sf.bids.filter(b => b.type === t).map(b => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(b.company)}${b.incumbent ? ' <span class="chip plain">Incumbent</span>' : ""}</b><small>${esc(b.filename)} · ${b.fields} terms read</small></div><span class="chip ok">Read</span></div>`).join(""), { tight: true, guide: k === 0 ? "sf-read" : "" })).join("") : ""}
      ${has ? `<div><a class="btn primary" href="#/marketing/cedar-ridge/compare">${icon("scale")}Open normalized comparison</a></div>` : ""}
    </div>
    ${card("Assumptions used", `<dl class="kv"><dt>Enrolled employees</dt><dd>${num(c.employees)}</dd><dt>Single / family</dt><dd>${num(c.singles)} / ${num(c.families)}</dd>
      <dt>Brand drug spend (AWP)</dt><dd>${money(c.rx.brandAWP)}</dd><dt>Generic drug spend (AWP)</dt><dd>${money(c.rx.genericAWP)}</dd><dt>Specialty drug spend (AWP)</dt><dd>${money(c.rx.specialtyAWP)}</dd>
      <dt>Claimants over $250K / yr</dt><dd>${c.claimantsOver250k}</dd></dl><p class="muted" style="font-size:12.5px;margin:12px 0 0">From the 24-month claims and pharmacy utilization files the TPA and PBM provided. Selections default to the lowest risk-adjusted cost; you can override any of them.</p>`)}
    </div>`;
    const handle = async files => {
      let read = [...S.sf.bids];
      const steps = files.filter(f => UI.ext(f.name) === "pdf").map(f => [`Reading ${esc(f.name)}`, async () => {
        const doc = await UI.pdfLines(f); const b = Parsers.bid(doc, f.name);
        read = read.filter(x => x.filename !== f.name).concat([b]); return { detail: `${TYPE[b.type] ? TYPE[b.type][0] : b.type} · ${b.fields} terms` };
      }]);
      steps.push(["Converting every bid to annual cost on this group", async () => {
        const bad = read.filter(b => !TYPE[b.type]); read = read.filter(b => TYPE[b.type]);
        if (bad.length) setTimeout(() => toast(`${bad.length} file${bad.length > 1 ? "s weren't" : " wasn't"} recognized as a TPA, PBM or stop-loss bid and ${bad.length > 1 ? "were" : "was"} left out`, "warn"), 500);
        read.forEach(b => Object.assign(b, sfCalc(b, c))); S.sf.bids = read;
        Object.keys(TYPE).forEach(t => { const list = S.sf.bids.filter(b => b.type === t); if (list.length) S.sel[t] = [...list].sort((a, b) => a.risk - b.risk)[0].filename; });
        return { detail: "risk-adjusted" };
      }]);
      await UI.runSteps($("#bRun"), steps, 280); if (S.sf.bids.length) credit("bids"); toast(`${S.sf.bids.length} bids read and normalized`); render();
    };
    UI.dropzone($("#bDrop"), handle, { accept: ".pdf" });
    $("#bSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(c.files.map(f => UI.fetchSample("samples/cedar-ridge/" + encodeURIComponent(f))))); };
  }
  function sfCompare(c) {
    const sec = (t, rows) => { const list = S.sf.bids.filter(b => b.type === t); if (!list.length) return "";
      const inc = list.find(b => b.incumbent); const best = Math.min(...list.map(b => b.risk));
      return `<div class="card" data-guide="sf-${t}" style="margin-bottom:16px"><div class="card-h"><div class="li-ic violet" style="width:28px;height:28px;border-radius:7px;display:grid;place-items:center">${icon(TYPE[t][1])}</div><h3>${TYPE[t][0]}</h3></div>
        <div class="tbl-wrap"><table class="cmp"><thead><tr><th></th>${list.map(b => `<th class="${b.incumbent ? "cur" : ""}"><span class="car">${b.incumbent ? "Incumbent" : "Proposal"}</span><span class="pl">${esc(b.company)}</span></th>`).join("")}</tr></thead><tbody>
          ${rows.map(([l, f]) => `<tr><td>${l}</td>${list.map(b => `<td class="${b.incumbent ? "cur" : ""}">${f(b)}</td>`).join("")}</tr>`).join("")}
          <tr class="total"><td>Projected annual cost</td>${list.map(b => `<td class="${b.incumbent ? "cur" : ""}">${money(b.annual)}</td>`).join("")}</tr>
          <tr><td>${T("Risk-adjusted cost", "Projected cost plus exposure a low price can hide: laser amounts above the deductible, extra retained claims from a higher deductible, and estimated undisclosed PBM spread")}</td>${list.map(b => `<td class="${b.risk === best ? "best" : b.incumbent ? "cur" : ""}">${money(b.risk)}</td>`).join("")}</tr>
          <tr><td>vs incumbent</td>${list.map(b => `<td class="${b.incumbent ? "cur" : ""}">${b.incumbent ? "—" : `<span style="color:${b.annual < inc.annual ? "var(--ok)" : "var(--crit)"};font-weight:600">${money(b.annual - inc.annual)}</span>`}</td>`).join("")}</tr>
          <tr><td>Flags</td>${list.map(b => `<td class="${b.incumbent ? "cur" : ""}" style="white-space:normal;text-align:left;min-width:180px">${b.flags.map(f => `<div style="font-size:12px;margin:2px 0" class="${/laser|spread|retained|billed|exclud|shared/i.test(f) ? "" : "muted"}">${/laser|spread|retained|billed|exclud|shared/i.test(f) ? "⚠ " : "✓ "}${esc(f)}</div>`).join("")}</td>`).join("")}</tr>
          <tr><td></td>${list.map(b => `<td class="${b.incumbent ? "cur" : ""}"><button class="btn sm ${S.sel[t] === b.filename ? "primary" : ""}" data-sel="${t}|${esc(b.filename)}">${S.sel[t] === b.filename ? "Selected" : "Select"}</button></td>`).join("")}</tr>
        </tbody></table></div></div>`; };
    $("#sfBody").innerHTML = `<div class="alert" style="margin-bottom:16px">${icon("zap")}<div>Every bid is priced on the same group: ${num(c.employees)} employees, the same drug spend and the same large-claim history. <b>Risk-adjusted cost</b> adds what a low price can hide: lasers, a higher deductible and undisclosed PBM spread.</div></div>
      ${sec("TPA", [[T("Administration PEPM", "Per employee per month fee for claims administration"), b => money(b.admin, 2)], [T("Network access PEPM", "Per employee per month fee to use the PPO network discounts"), b => money(b.network, 2)], ["Care management PEPM", b => money(b.care, 2)], ["Implementation credit", b => money(b.credit)], ["Rate guarantee", b => esc(b.guarantee)], ["Claims run-out", b => esc(b.runout)]])}
      ${sec("PBM", [[T("Pricing model", "Spread: the PBM charges the plan more than it pays the pharmacy and keeps the difference. Pass-through: the plan pays what the pharmacy is paid"), b => esc(b.model)], [T("Brand discount", "Guaranteed discount off average wholesale price (AWP), the list price drugs are priced from"), b => (b.brand * 100).toFixed(1) + "%"], ["Generic discount", b => (b.generic * 100).toFixed(1) + "%"], ["Specialty discount", b => (b.specialty * 100).toFixed(1) + "%"], [T("Rebate per brand script", "Manufacturer rebate the PBM guarantees to pass back for each brand-name prescription"), b => money(b.rebate, 2)], ["Admin fee per claim", b => money(b.adminClaim, 2)]])}
      ${sec("SL", [[T("Specific deductible", "Claims above this amount for any one person are reimbursed by the stop-loss carrier"), b => money(b.deductible)], ["Single rate PEPM", b => money(b.single, 2)], ["Family rate PEPM", b => money(b.family, 2)], [T("Aggregate attachment / rate", "Total-claims level (as a % of expected) where aggregate stop loss starts paying, and its per employee per month rate"), b => `${esc(b.aggAttach)} · ${money(b.agg, 2)}`], [T("Contract basis", "Months of claims covered, incurred/paid. 12/15 covers claims incurred in the year and paid up to 3 months after it ends"), b => esc(b.basis)], [T("Lasers", "A higher deductible set on one named person with a known high claim. The plan pays everything up to the laser amount"), b => esc(b.lasers)]])}`;
    Object.keys(TYPE).forEach(t => UI.tagTable($(`[data-guide="sf-${t}"] .cmp`), S.sf.bids.filter(b => b.type === t).map(b => b.company)));
    $$("[data-sel]").forEach(x => x.onclick = () => { const [t, f] = x.dataset.sel.split("|"); S.sel[t] = f; render(); });
  }
  function sfSavings(c) {
    credit("proposal", "proposal:sf");
    const lines = Object.keys(TYPE).map(t => { const list = S.sf.bids.filter(b => b.type === t); const inc = list.find(b => b.incumbent); const sel = list.find(b => b.filename === S.sel[t]); return { t, inc, sel }; }).filter(l => l.inc && l.sel);
    const base = lines.reduce((s, l) => s + l.inc.annual, 0), next = lines.reduce((s, l) => s + l.sel.annual, 0);
    $("#sfBody").innerHTML = `<div class="row no-print" style="margin-bottom:14px"><span class="muted">Figures come from the bid documents and the selections on the comparison.</span><span class="spacer"></span><button class="btn primary" onclick="UI.printOnly(document.querySelector('.report'))">${icon("printer")}Download PDF</button></div>
      <div class="report">
        <div class="rep-meta">${DATA.firm.toUpperCase()} · DOCUMENTED SAVINGS</div><h1 style="margin-top:8px">Cedar Ridge Logistics</h1><div class="rep-meta">2027 self-funded plan · specialist bid results · September 16, 2026</div>
        <div class="grid g3" style="margin:22px 0 6px">
          <div class="card kpi"><div class="l">Current vendors, 2027 renewal</div><div class="v">${money(base)}</div></div>
          <div class="card kpi"><div class="l">Selected bids</div><div class="v">${money(next)}</div></div>
          <div class="card kpi" style="border-color:var(--ok)"><div class="l">Documented annual savings</div><div class="v" style="color:var(--ok)">${money(base - next)}</div><div class="d">${pct((next / base - 1) * 100)} on fixed costs and pharmacy</div></div>
        </div>
        <h2>By vendor</h2>
        <table class="t"><thead><tr><th>Service</th><th>Current</th><th>Selected</th><th class="num">Current cost</th><th class="num">Selected cost</th><th class="num">Savings</th></tr></thead><tbody>
          ${lines.map(l => `<tr><td>${TYPE[l.t][0]}</td><td>${esc(l.inc.company)}</td><td><b>${esc(l.sel.company)}</b></td><td class="num">${money(l.inc.annual)}</td><td class="num">${money(l.sel.annual)}</td><td class="num" style="color:var(--ok);font-weight:600">${money(l.inc.annual - l.sel.annual)}</td></tr>`).join("")}
        </tbody><tfoot><tr><td colspan="3">Total</td><td class="num">${money(base)}</td><td class="num">${money(next)}</td><td class="num" style="color:var(--ok)">${money(base - next)}</td></tr></tfoot></table>
        <h2>How each figure was calculated</h2>
        ${lines.map(l => `<p><b>${TYPE[l.t][0]}.</b> ${l.t === "TPA" ? `Per-employee-per-month fees (administration, network access, care management) × ${num(c.employees)} employees × 12, less any implementation credit.` : l.t === "PBM" ? `Brand, generic and specialty spend at each bid's AWP discount, less guaranteed rebates on ${num(l.sel.scripts)} brand scripts at each bid's pass-through share, plus per-claim admin fees on ${num(l.sel.claims)} claims.` : `Specific rates × ${num(c.singles)} single and ${num(c.families)} family employees plus the aggregate rate × ${num(c.employees)}, for 12 months.`} ${l.sel.flags.length ? "Terms noted: " + l.sel.flags.map(esc).join("; ") + "." : ""}</p>`).join("")}
        <h2>Risks we looked for</h2>
        <p>${S.sf.bids.filter(b => b.flags.some(f => /laser|spread|retained|exclud/i.test(f))).map(b => `<b>${esc(b.company)}</b>: ${b.flags.filter(f => /laser|spread|retained|exclud/i.test(f)).map(esc).join("; ")}`).join(". ")}.</p>
        <p class="muted" style="font-size:12px;margin-top:24px">Projections use the group's 24-month utilization. Sample document: all companies and figures are fictional.</p>
      </div>`;
  }

  /* ================= renewals ================= */
  route("/renewals", () => {
    setPage([["Renewals"]], `${head("Renewals", "Every renewal read when it arrives, broken down and tracked to its decision date.")}
      ${card("Renewal calendar", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Group</th><th>Effective</th><th>Received</th><th class="num">Current</th><th class="num">Renewal</th><th>${T("Change", "Renewal premium vs what the group pays today")}</th><th>Decision due</th><th>Stage</th></tr></thead><tbody>
        ${DATA.renewals.map(r => { const g = G(r.group); return `<tr class="click" data-g="${r.group}"><td><b>${g.name}</b><div class="muted" style="font-size:12px">${g.funding} · ${g.carrier}</div></td><td class="nowrap">${fdate(g.renewal)}</td>
          <td class="nowrap">${r.received ? fdate(r.received) : '<span class="muted">Not yet</span>'}</td><td class="num">${money(r.current)}</td><td class="num">${r.renewal ? money(r.renewal) : "—"}</td>
          <td>${r.renewal ? pctChip((r.renewal / r.current - 1) * 100) : ""}</td><td class="nowrap">${fdate(r.deadline)} ${daysChip(r.deadline)}</td><td><span class="chip">${r.stage}</span></td></tr>`; }).join("")}
      </tbody></table></div>`, { tight: true, guide: "renewals", sub: "click a received renewal for the analysis" })}`);
    $$("[data-g]").forEach(tr => tr.onclick = () => {
      const r = DATA.renewals.find(x => x.group === tr.dataset.g); const g = G(r.group);
      if (!r.renewal) return toast(`${g.name}: renewal not received yet. Reminder set with the carrier.`, "warn");
      const ch = (r.renewal / r.current - 1) * 100; const bench = g.funding === "Self-funded" ? 7.5 : 8.9;
      modal({ title: `${g.name}: renewal analysis`, body: `<div class="grid g3" style="margin-bottom:14px"><div class="card kpi"><div class="l">Renewal change</div><div class="v">${pct(ch)}</div></div><div class="card kpi"><div class="l">Extra cost a year</div><div class="v">${money(r.renewal - r.current)}</div></div><div class="card kpi"><div class="l">Market trend</div><div class="v">${pct(bench)}</div></div></div>
        <div class="bars" style="margin-bottom:14px">${r.drivers.map(([l, v]) => `<div class="bar-row"><span>${l}</span><div class="track"><i style="width:${v / 10 * 100}%"></i></div><span class="num">${pct(v)}</span></div>`).join("")}</div>
        <div class="alert ${ch > bench + 2 ? "warn" : ""}">${icon("spark")}<div><b>${ch > bench + 2 ? "Market it and negotiate." : "Negotiate before marketing."}</b> The increase is ${pct(ch - bench)} over trend${ch > bench + 2 ? `. Competing quotes are the strongest negotiating position, so marketing starts now while ${r.drivers[0][0].toLowerCase()} and experience are challenged with the carrier.` : ". A counter-offer to the incumbent is likely to land."}</div></div>`,
        actions: [{ label: "Close" }, DATA.rfp[r.group] ? { label: "Open marketing case", primary: true, onClick: () => go("#/marketing/" + r.group) } : { label: "Start marketing case", primary: true, onClick: () => toast(`Marketing case opened for ${g.name}; RFP sent to 5 carriers`) }] });
    });
  });

  /* ================= enrollment ================= */
  route("/enrollment", () => {
    const E = DATA.enrollment;
    setPage([["Enrollment & eligibility"]], `${head("Enrollment & eligibility", "Enrollment windows tracked from the day they open, and carrier rosters checked against what employees elected.")}
      <div class="grid g-main-l">
        ${card("Carrier roster check", E.sync.map((s, i) => { const g = G(s.group); const sent = S.done.has("sync" + i);
          return `<div class="list-item"><div class="li-ic ${s.fix ? (sent ? "ok" : "warn") : "ok"}">${icon(s.fix && !sent ? "alert" : "check")}</div><div class="li-b"><b>${s.who}</b> <span class="muted">· ${g.name} · ${s.carrier}</span>
            <p>Our records: <b>${s.ours}</b> · Carrier shows: <b>${s.theirs}</b></p>${s.fix ? `<p style="color:var(--ink)">${sent ? "Change sent to carrier" : "→ " + s.fix}</p>` : `<p>Matches</p>`}</div>
            ${s.fix ? `<button class="btn sm ${sent ? "" : "primary"}" data-sync="${i}" ${sent ? "disabled" : ""}>${sent ? "Sent" : "Send change"}</button>` : ""}</div>`; }).join(""), { tight: true, sub: "checked against September eligibility files" })}
        ${card("Enrollment windows", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Employee</th><th>Event</th><th>Closes</th><th>Status</th></tr></thead><tbody>${E.windows.map(w => `<tr><td><b>${w.who}</b><div class="muted" style="font-size:12px">${G(w.group).name}</div></td><td>${w.event}<div class="muted" style="font-size:12px">${fdate(w.date)}</div></td><td class="nowrap">${daysChip(w.deadline)}</td><td><span class="chip ${w.status === "Not started" ? "warn" : "info"}">${w.status}</span></td></tr>`).join("")}</tbody></table></div>`, { tight: true })}
      </div>`);
    $$("[data-sync]").forEach(b => b.onclick = () => {
      const s = DATA.enrollment.sync[+b.dataset.sync];
      modal({ title: `Eligibility change: ${s.carrier}`, body: `<dl class="kv" style="margin-bottom:14px"><dt>Group</dt><dd>${G(s.group).name}</dd><dt>Member</dt><dd>${s.who}</dd><dt>Change</dt><dd>${s.fix}</dd><dt>Sent via</dt><dd>${s.carrier} employer portal (change file)</dd></dl>
        <div class="alert">${icon("zap")}<div>The change is submitted in the carrier's format and the next eligibility file is checked to confirm it took.</div></div>`,
        actions: [{ label: "Cancel" }, { label: "Submit change", primary: true, onClick: () => { S.done.add("sync" + b.dataset.sync); toast(`Change sent to ${s.carrier} for ${s.who}`); render(); } }] });
    });
  });

  /* ================= reconciliation ================= */
  route("/reconciliation", () => {
    const open = DATA.recon.map((r, i) => ({ ...r, i })).filter(r => !S.done.has("rec" + r.i));
    const monthly = open.reduce((s, r) => s + r.monthly, 0);
    setPage([["Billing & payroll"]], `${head("Billing & payroll", "Every carrier invoice and payroll register checked against who is actually enrolled, every cycle.")}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Invoices checked · Sep</div><div class="v">8</div><div class="d">1,312 billed lives</div></div>
        <div class="card kpi"><div class="l">Payroll registers checked</div><div class="v">14</div><div class="d">3 payroll systems</div></div>
        <div class="card kpi"><div class="l">Open exceptions</div><div class="v">${open.length}</div><div class="d">${DATA.recon.length - open.length} resolved today</div></div>
        <div class="card kpi"><div class="l">Money at stake ${I("Monthly amount billed or withheld incorrectly across the open exceptions")}</div><div class="v">${money(monthly)}<span class="muted" style="font-size:14px">/mo</span></div><div class="d">${money(monthly * 12)} a year</div></div>
      </div>
      ${card("Exceptions", open.length ? `<div class="tbl-wrap"><table class="t"><thead><tr><th>Issue</th><th>Group</th><th>Who</th><th>Found in</th><th class="num">Monthly</th><th></th></tr></thead><tbody>
        ${open.map(r => `<tr data-who="${esc(r.who)}" class="${r.sev === "crit" ? "bad" : ""}"><td><span class="chip ${r.sev}">${r.issue}</span><div class="ink2" style="font-size:12.5px;margin-top:4px">${esc(r.detail)}</div></td><td>${G(r.group).name}</td><td><b>${esc(r.who)}</b></td><td class="muted">${r.source}</td><td class="num strong">${money(r.monthly)}</td>
          <td><button class="btn sm" data-fix="${r.i}">${/payroll/i.test(r.source) ? "Notify payroll" : "Dispute with carrier"}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">All exceptions resolved.</div>`, { tight: true, guide: "recon" })}`);
    $$("[data-fix]").forEach(b => b.onclick = () => {
      const r = DATA.recon[+b.dataset.fix]; const payroll = /payroll/i.test(r.source); const g = G(r.group);
      modal({ title: payroll ? `Payroll correction: ${g.name}` : `Billing dispute: ${g.name}`, actions: [{ label: "Cancel" }, { label: "Send", primary: true, onClick: () => { S.done.add("rec" + b.dataset.fix); credit("recon", "rec" + b.dataset.fix); toast(payroll ? "Payroll notified; next register will be checked" : "Dispute filed; credit tracked on next invoice"); render(); } }],
        body: `<textarea class="input" style="min-height:200px">${payroll ? `Hi,\n\n${r.who}'s deductions don't match their benefit election.\n\n${r.detail}.\n\nPlease correct this on the next payroll. The difference is about ${money(r.monthly)} a month.\n\nThank you,\nPriya Shah` : `Hello ${g.carrier} billing,\n\nGroup: ${g.name}\nInvoice: ${r.source.replace(/.*invoice /i, "")}\nMember: ${r.who}\n\nIssue: ${r.issue}. ${r.detail}.\n\nPlease issue a credit of ${money(r.monthly, 2)} and correct the member record.\n\nThank you,\nPriya Shah`}</textarea>` });
    });
  });

  /* ================= commissions ================= */
  route("/commissions", () => {
    const rows = DATA.commissions; const exp = rows.reduce((s, r) => s + r.expected, 0), paid = rows.reduce((s, r) => s + r.paid, 0);
    setPage([["Commissions"]], `${head("Commissions", "Carrier statements read and matched to enrollment, so short payments and chargebacks get caught.")}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Expected · Aug and Sep</div><div class="v">${money(exp)}</div></div>
        <div class="card kpi"><div class="l">Received</div><div class="v">${money(paid)}</div></div>
        <div class="card kpi"><div class="l">Short</div><div class="v" style="color:var(--crit)">${money(exp - paid)}</div><div class="d">${rows.filter(r => r.paid < r.expected).length} statements</div></div>
        <div class="card kpi"><div class="l">Statements read</div><div class="v">7</div><div class="d">4 carriers · PDF and CSV</div></div>
      </div>
      ${card("Statement lines", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Carrier</th><th>Group</th><th>Month</th><th>Basis</th><th class="num">Expected</th><th class="num">Paid</th><th class="num">Difference</th><th></th></tr></thead><tbody>
        ${rows.map((r, i) => { const d = r.paid - r.expected; return `<tr class="${d < 0 ? "bad" : ""}"><td>${r.carrier}</td><td><b>${G(r.group).name}</b>${r.note ? `<div class="muted" style="font-size:12px">${r.note}</div>` : ""}</td><td>${r.month}</td><td class="muted">${r.basis}</td>
          <td class="num">${money(r.expected, 2)}</td><td class="num">${money(r.paid, 2)}</td><td class="num">${d < 0 ? `<span class="chip crit plain">${money(d, 2)}</span>` : '<span class="chip ok plain">Matched</span>'}</td>
          <td>${d < 0 ? `<button class="btn sm" data-disp="${i}" ${S.done.has("com" + i) ? "disabled" : ""}>${S.done.has("com" + i) ? "Disputed" : "Dispute"}</button>` : ""}</td></tr>`; }).join("")}
      </tbody></table></div>`, { tight: true })}`);
    $$("[data-disp]").forEach(b => b.onclick = () => { S.done.add("com" + b.dataset.disp); toast("Dispute sent with enrollment backup attached"); render(); });
  });

  /* ================= compliance ================= */
  route("/compliance", () => {
    const rows = [...DATA.compliance].sort((a, b) => a.due.localeCompare(b.due));
    setPage([["Compliance calendar"]], `${head("Compliance calendar", "Federal deadlines for every group, with the notices and filings prepared ahead of time.")}
      ${card("Upcoming deadlines", rows.map((r, i) => { const done = S.done.has("cmp" + r.item);
        return `<div class="list-item"><div class="li-ic ${done ? "ok" : daysUntil(r.due) < 30 ? "warn" : "info"}">${icon(done ? "check" : "calendar")}</div>
          <div class="li-b"><b>${r.item}</b> <span class="muted">· ${r.kind}</span><p>${r.auto}</p>
            <div class="row" style="margin-top:8px;max-width:420px"><div class="progress ${done ? "ok" : ""}" style="flex:1"><i style="width:${(done ? r.groups : r.drafted) / r.groups * 100}%"></i></div><span class="muted" style="font-size:12px">${done ? r.groups : r.drafted} of ${r.groups} groups ${done ? "complete" : "prepared"}</span></div></div>
          <div style="text-align:right"><div class="nowrap" style="font-weight:600">${fdate(r.due)}</div>${daysChip(r.due)}${r.drafted && !done ? `<div style="margin-top:8px"><button class="btn sm primary" data-cmp="${esc(r.item)}">Review ${r.drafted}</button></div>` : ""}</div></div>`; }).join(""), { tight: true, guide: "compliance" })}`);
    $$("[data-cmp]").forEach(b => b.onclick = () => {
      const r = DATA.compliance.find(x => x.item === b.dataset.cmp);
      modal({ title: r.item, wide: true, body: `<div class="grid g2"><div>${DATA.groups.slice(0, r.drafted).map(g => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${g.name}</b><small>${g.funding} · ${g.enrolled.toLocaleString()} employees · ${/Part D/.test(r.item) ? "Creditable" : "Ready"}</small></div><span class="chip ok">Ready</span></div>`).join("")}</div>
        <div class="doc"><div class="sheet"><b>${/Part D/.test(r.item) ? "Important Notice About Your Prescription Drug Coverage and Medicare" : r.item}</b><p>${/Part D/.test(r.item) ? "Please read this notice carefully and keep it where you can find it. This notice has information about your current prescription drug coverage with Trinity Oak Dental Group and about your options under Medicare's prescription drug coverage..." : "Prepared from plan documents, enrollment and carrier data."}</p>
        <p>${/Part D/.test(r.item) ? "Trinity Oak Dental Group has determined that the prescription drug coverage offered by the Meridian Gold PPO 1500 is, on average for all plan participants, expected to pay out as much as standard Medicare prescription drug coverage pays and is therefore considered Creditable Coverage." : ""}</p></div></div></div>`,
        actions: [{ label: "Close" }, { label: `Approve and distribute to ${r.drafted} groups`, primary: true, onClick: () => { S.done.add("cmp" + r.item); credit("compliance", "cmp" + r.item); toast(`${r.item}: sent to HR contacts at ${r.drafted} groups`); render(); } }] });
    });
  });

  /* ================= inbox ================= */
  route("/inbox", () => routeInbox(DATA.inbox[0].id));
  route("/inbox/:id", ({ id }) => routeInbox(+id));
  function routeInbox(id) {
    const m = DATA.inbox.find(x => x.id === id) || DATA.inbox[0]; const done = S.done.has("mail" + m.id);
    setPage([["Service inbox"]], `${head("Service inbox", "Emails from HR contacts and employees read, sorted by what they need, with the reply and the carrier work drafted.")}
      <div class="grid" style="grid-template-columns:minmax(250px,340px) minmax(0,1fr)">
        <div class="card" style="align-self:start">${DATA.inbox.map(x => `<a class="list-item" href="#/inbox/${x.id}" style="text-decoration:none;color:inherit;${x.id === m.id ? "background:var(--accent-w)" : ""}">
          <div class="avatar s" style="background:${S.done.has("mail" + x.id) ? "var(--ok)" : "var(--accent)"}">${UI.initials(x.from)}</div>
          <div class="li-b"><b>${x.from}</b> <span class="muted" style="font-size:12px">· ${x.org}</span><p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.subject}</p>
            <div style="margin-top:5px">${S.done.has("mail" + x.id) ? '<span class="chip ok">Replied</span>' : `<span class="chip accent plain">${x.intent}</span>`}</div></div><div class="li-t">${x.time}</div></a>`).join("")}</div>
        <div class="stack" data-guide="inbox-main">
          <div class="card"><div class="card-h"><div class="avatar">${UI.initials(m.from)}</div><div><h3>${m.subject}</h3><div class="sub">${m.from} &lt;${m.email}&gt; · ${m.org}</div></div><div class="actions"><span class="muted" style="font-size:12.5px">${m.time}</span></div></div>
            <div class="card-b" data-guide="inbox-body" style="white-space:pre-wrap">${esc(m.body)}</div></div>
          <div class="grid g2w">
            ${card(`${icon("spark")} Read as`, `<div class="row" style="margin-bottom:12px"><span class="chip accent">${m.intent}</span><span class="conf">${Math.round(m.conf * 100)}% confident</span></div>
              <dl class="kv">${m.fields.map(([k, v]) => `<dt>${k}</dt><dd data-field="${esc(k)}">${esc(v)}</dd>`).join("")}</dl>
              <div class="alert ok" style="margin-top:14px">${icon("zap")}<div>${m.action}</div></div>`, { guide: "inbox-read" })}
            ${card("Drafted reply", `<textarea class="input" id="draft" style="min-height:260px">${esc(m.draft)}</textarea>`,
              { guide: "inbox-draft", foot: done ? `<span class="chip ok">Sent</span>` : `<button class="btn primary" id="send">${icon("send")}Approve and send</button><button class="btn ghost" id="skip">Assign to Priya</button>` })}
          </div>
        </div>
      </div>`);
    const send = $("#send"); if (send) send.onclick = () => { S.done.add("mail" + m.id); credit("inbox", "mail" + m.id); toast(`Reply sent to ${m.from}`); const next = DATA.inbox.find(x => !S.done.has("mail" + x.id)); go(next ? "#/inbox/" + next.id : "#/inbox/" + m.id); };
    const skip = $("#skip"); if (skip) skip.onclick = () => toast("Assigned to Priya Shah");
  }

  /* shared with ops.js (leads, engagements, diagnostic, savings models, proposal, tracker, fees, comms, board pack, time saved) */
  window.BD = { S, G, setPage, head, card, next, save: () => save(), planCost };

  /* ================= session: a refresh mid-demo keeps you signed in with everything loaded ================= */
  const SK = "bd:state";
  let saveT = null, frozen = false;
  function save() {
    if (!S.who || frozen) return;
    const payload = snapshot();
    try { sessionStorage.setItem(SK, JSON.stringify(payload)); } catch (e) { }
    clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/benefits", payload), 400);
  }
  function snapshot() {
    return (JSON.parse(JSON.stringify({ who: S.who, census: !!S.census, fi: S.fi.plans.length > 0, sf: S.sf.bids.length > 0, recommend: S.recommend,
      eePct: S.eePct, depPct: S.depPct, planFilter: S.planFilter, sel: S.sel, done: [...S.done], x: S.x })));
  }
  async function restore(st) {
    Object.assign(S, { recommend: st.recommend || null, eePct: st.eePct ?? 75, depPct: st.depPct ?? 50, planFilter: st.planFilter || "all", done: new Set(st.done || []), x: st.x || {} });
    if (st.census) { const f = await UI.fetchSample("samples/trinity-oak/TrinityOak_employee list FINAL (2).csv"); const r = S.census = Parsers.census(await f.text(), f.name);
      DATA.rfp["trinity-oak"].tiers = { EE: r.tiers.EE, ES: r.tiers.ES, EC: r.tiers.EC, FAM: r.tiers.FAM }; }
    if (st.fi) { for (const v of DATA.rfp["trinity-oak"].invited.filter(v => v.file)) { const f = await UI.fetchSample("samples/trinity-oak/" + encodeURIComponent(v.file)); const doc = await UI.pdfLines(f); S.fi.docs.push({ ...Parsers.quote(doc, f.name), lines: doc.lines }); }
      S.fi.plans = S.fi.docs.flatMap(d => d.plans).sort((a, b) => b.isRenewal - a.isRenewal); }
    if (st.sf) { const c = DATA.rfp["cedar-ridge"]; for (const fn of c.files) { const f = await UI.fetchSample("samples/cedar-ridge/" + encodeURIComponent(fn)); S.sf.bids.push(Parsers.bid(await UI.pdfLines(f), f.name)); }
      S.sf.bids.forEach(b => Object.assign(b, sfCalc(b, c))); S.sel = st.sel || {}; }
  }
  UI.setOnNav(h => { drawNav(h); window.BD?.afterNav?.(h); save(); });
  UI.setPalette(() => [
    ...NAV.flatMap(([sec, items]) => items.map(([href, ic, label]) => ({ label, sub: sec, href, icon: ic, kind: "Page", top: true }))),
    { label: "Trinity Oak Dental: quote comparison", sub: "Fully insured marketing case", href: "#/marketing/trinity-oak/compare", icon: "columns", kind: "Case", top: true },
    { label: "Cedar Ridge Logistics: self-funded bids", sub: "TPA, PBM and stop loss", href: "#/marketing/cedar-ridge/compare", icon: "scale", kind: "Case", top: true },
    { label: "Trinity Oak: ICHRA model", sub: "Allowances and affordability on the census", href: "#/models/ichra", icon: "scale", kind: "Model", top: true },
    { label: "Trinity Oak: first-dollar care model", sub: "Section 125 payroll tax savings", href: "#/models/first-dollar", icon: "scale", kind: "Model" },
    { label: "Northfield: claims diagnostic", sub: "Cost drivers and savings levers", href: "#/diagnostic", icon: "chart", kind: "Model" },
    ...DATA.groups.map(g => ({ label: g.name, sub: `${g.industry} · ${g.funding} · renews ${fdate(g.renewal)}`, href: "#/groups/" + g.id, icon: "building", kind: "Group" })),
    ...DATA.inbox.map(m => ({ label: m.from, sub: `${m.subject} · ${m.org}`, href: "#/inbox/" + m.id, icon: "mail", kind: "Email" })),
    ...DATA.recon.map(r => ({ label: `${r.who}: ${r.issue}`, sub: G(r.group).name, href: "#/reconciliation", icon: "alert", kind: "Exception" })),
  ]);

  /* ================= guided demo ================= */
  const CENSUS_URL = "samples/trinity-oak/" + encodeURIComponent("TrinityOak_employee list FINAL (2).csv");
  Guide.init({
    app: "benefits", minutes: 8,
    intro: "A walkthrough of what gets automated in a benefits practice. Each step highlights one thing; where there's something to click, the tour waits for you. Jump to any chapter.",
    chapterNotes: { "Morning view": "What was handled overnight", "Census": "Messy HR file to carrier-ready census", "Fully insured quotes": "4 carrier PDFs to a client proposal",
      "Self-funded bids": "9 vendor bids to documented savings", "Cost savings": "Leads, fees, diagnostic, ICHRA, proposal, tracking", "Day to day": "Service emails, billing checks, compliance", "Results": "Hours and cost saved" },
    welcomeTitle: "Welcome to Benefits Desk",
    welcomeBody: `<p style="margin-top:0">This is a working sample of a benefits practice where the repetitive work is automated: census cleanup, quote and bid comparisons, proposals, billing checks, service emails and compliance.</p><p>Everything runs on real sample documents: PDFs and spreadsheets in the layouts carriers and HR actually send. All companies and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">You've seen a census cleaned, four carrier quotes turned into a proposal, nine self-funded bids turned into documented savings, and the day-to-day work handled.</p><p>Everything stays clickable. Open <b>Guided demo</b> at the bottom left to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/benefits", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:benefits:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What the desk handled overnight",
        body: "Quotes read, bids normalized, invoice errors caught, notices drafted. Each line opens the finished work.", why: "The team starts the day reviewing results instead of typing." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "Anything that needs judgment lands here with its deadline, like picking a plan before the carrier's cutoff." },

      { chapter: "Census", route: "#/census", target: "#cDrop", dropzone: "#cDrop", dropButton: "#cSample", doneWhen: '[data-guide="census-issues"]',
        files: [{ name: "TrinityOak_employee list FINAL (2).csv", url: CENSUS_URL, note: "Emailed by Trinity Oak HR" }],
        title: "Start with the file HR sent", body: "This is the spreadsheet Trinity Oak's office manager emailed. <b>Drag it onto the drop area</b>, the same way you'd drop a file from your inbox." },
      { chapter: "Census", route: "#/census", target: '[data-guide="census-issues"]', place: "right",
        marks: ['[data-issue="Missing date of birth"]', '[data-issue="Dependent over age 26"]', '[data-issue="Invalid zip code"]', '[data-issue="Duplicate row"]'],
        source: { type: "csv", url: CENSUS_URL, caption: "TrinityOak_employee list FINAL (2).csv", legend: "<i></i> caught",
          mark: (i, h, v, row) => (h === "D.O.B." && !v && row[1] === "Employee") ? "bad" : (h === "D.O.B." && v === "1/19/1999") ? "bad" : (h === "Home Zip" && v.length === 4) ? "fix" : (i === 73) ? "dup" : "" },
        title: "Every problem traced to its row", body: "In HR's file above: a blank date of birth, a child who turns 27, a four-digit zip and a row pasted twice. The same problems are highlighted in the issues list, each with the fix or the question for HR." ,
        why: "A bad census is the number one reason quotes come back late or wrong." },
      { chapter: "Census", route: "#/census", target: '[data-guide="census-clean"]', block: "start",
        marks: ['[data-person="Alvarez, Maria"]', '[data-person="Brooks, James"]', '[data-person="Carter, Ashley"]'],
        source: { type: "csv", url: CENSUS_URL, caption: "The same three people in HR's file", legend: "<i></i> as HR wrote it",
          mark: (i, h, v, row) => (["Alvarez, Maria", "Brooks, James", "Carter, Ashley"].includes(row[0]) && (h === "D.O.B." || h === "Medical Cov")) ? "fix" : "" },
        title: "Three date formats, a dozen ways to say \"family\"", body: "9/4/1994, 1967-11-07 and 10-07-00 in one column. \"Employee Only\", \"declined\" and \"Emp + Child(ren)\" for coverage. Each is converted to one standard, and the original is kept underneath so anyone can check it." },
      { chapter: "Census", route: "#/census", target: '[data-guide="census-export"]', place: "left", pointer: '[data-exp="meridian"]',
        title: "Carrier-ready in each carrier's layout", body: "One click downloads the census exactly how each carrier wants it. The cleaned tier counts also flow straight into the quote comparison." },

      { chapter: "Fully insured quotes", route: "#/marketing/trinity-oak/docs", target: "#qDrop", dropzone: "#qDrop", dropButton: "#qSample", doneWhen: '[data-view="0"]',
        files: DATA.rfp["trinity-oak"].invited.filter(v => v.file).map((v, k) => ({ name: v.carrier, url: "samples/trinity-oak/" + encodeURIComponent(v.file), note: ["Renewal notice", "Two plans in a grid", "One page per plan", "Plain letter"][k] })),
        title: "Four carriers, four different layouts", body: "A renewal, a two-plan grid, one page per plan, and a plain letter. <b>Drag the PDFs onto the drop area</b> and each one is read." },
      { chapter: "Fully insured quotes", route: "#/marketing/trinity-oak/compare", target: '[data-guide="cmp"]', block: "start",
        marks: ['th[data-col="keystone-blue-blue-advantage-ppo-2000"]', 'tr[data-row^="deductible"] td[data-col="keystone-blue-blue-advantage-ppo-2000"]', 'tr[data-row^="employee-only"] td[data-col="keystone-blue-blue-advantage-ppo-2000"]'],
        source: { type: "pdf", url: "samples/trinity-oak/KeystoneBlue_Quote_KB-Q-2026-77831.pdf", find: ["Blue Advantage PPO 2000", "$2,000 / $4,000", "$668.00"], caption: "KeystoneBlue_Quote_KB-Q-2026-77831.pdf", legend: "<i></i> read into the comparison" },
        title: "From the carrier's PDF to the comparison", body: "The plan name, deductible and employee-only rate highlighted in Keystone Blue's PDF are the same values highlighted in the side-by-side. Every cell traces back to a document." },
      { chapter: "Fully insured quotes", route: "#/marketing/trinity-oak/compare", target: '[data-guide="cmp"]', block: "start",
        marks: ['tr[data-row^="deductible"] td[data-col="pioneer-health-pioneer-value-ppo-3000"]', 'tr[data-row="prescriptions"] td[data-col="pioneer-health-pioneer-value-ppo-3000"]', 'tr[data-row^="annual-premium"]'],
        source: { type: "pdf", url: "samples/trinity-oak/" + encodeURIComponent("Pioneer Health quote PH-10-2291.pdf"), find: ["Deductible: $3,000 individual / $6,000 family", "Prescription drugs:"], caption: "Pioneer Health quote PH-10-2291.pdf", legend: "<i></i> written as a letter" },
        title: "A plain letter, put in the same format", body: "Pioneer wrote \"$3,000 individual / $6,000 family\" in a sentence. It lands in the same row as everyone else's grid. The annual premium row then prices every plan on this group's actual enrollment." },
      { chapter: "Fully insured quotes", route: "#/marketing/trinity-oak/contrib", target: "#eeR", pointer: "#eeR",
        title: "Try a contribution strategy", body: "<b>Drag the slider.</b> Employer cost and every employee's paycheck update live. Go below 50% and Pioneer's minimum contribution rule, read from its quote, is flagged." },
      { chapter: "Fully insured quotes", route: "#/marketing/trinity-oak/proposal", target: ".report", block: "start",
        title: "The client proposal writes itself", body: "The situation, the options, the recommendation and employee cost, built from the comparison. Change the recommendation and this updates. Download as a PDF." },

      { chapter: "Self-funded bids", route: "#/marketing/cedar-ridge/bids", target: "#bDrop", dropzone: "#bDrop", dropButton: "#bSample", doneWhen: '[data-guide="sf-read"]',
        files: DATA.rfp["cedar-ridge"].files.map(f => ({ name: f.replace(/\.pdf$/, "").replace(/ - .*$| proposal| bid| renewal| quote| stop loss| PBM/gi, "").trim(), url: "samples/cedar-ridge/" + encodeURIComponent(f), note: /Rx|Pharmacy/i.test(f) ? "PBM" : /Re |Stop|Atlas|Harborstone/i.test(f) ? "Stop loss" : "TPA" })),
        title: "Nine bids for a 2,140-employee group", body: "Three administrators, three PBMs and three stop-loss markets, each quoting fees, discounts and rates its own way. <b>Drag them onto the drop area.</b>" },
      { chapter: "Self-funded bids", route: "#/marketing/cedar-ridge/compare", target: '[data-guide="sf-PBM"]', block: "start",
        marks: ['tr[data-row="pricing-model"] td[data-col="Vantage Pharmacy Solutions"]', 'tr[data-row="admin-fee-per-claim"] td[data-col="Vantage Pharmacy Solutions"]', 'tr[data-row="flags"] td[data-col="Vantage Pharmacy Solutions"]', 'tr[data-row="risk-adjusted-cost"] td[data-col="Vantage Pharmacy Solutions"]'],
        source: { type: "pdf", url: "samples/cedar-ridge/Vantage%20Pharmacy%20Solutions.pdf", find: ["Traditional (spread)", "$0.00", "Rebate guarantee excludes specialty drugs"], caption: "Vantage Pharmacy Solutions.pdf", legend: "<i></i> the fine print" },
        title: "A $0 admin fee, and what's behind it", body: "Vantage looks cheapest. Its own PDF says spread pricing and rebates that exclude specialty drugs. Both are priced into the risk-adjusted cost, so it doesn't win on looks.", why: "This is where self-funded plans lose the most money without seeing it." },
      { chapter: "Self-funded bids", route: "#/marketing/cedar-ridge/compare", target: '[data-guide="sf-SL"]', block: "start",
        marks: ['tr[data-row="lasers"] td[data-col="Atlas Stop Loss"]', 'tr[data-row="specific-deductible"] td[data-col="Atlas Stop Loss"]', 'tr[data-row="risk-adjusted-cost"] td[data-col="Atlas Stop Loss"]', 'tr[data-row="risk-adjusted-cost"] td[data-col="Harborstone Specialty"]'],
        source: { type: "pdf", url: "samples/cedar-ridge/Atlas%20Stop%20Loss%20proposal.pdf", find: ["2 at $750,000 and $500,000", "$300,000", "$71.90"], caption: "Atlas Stop Loss proposal.pdf", legend: "<i></i> lasers and deductible" },
        title: "Lasers and deductibles, priced in", body: "Atlas has the lowest rates, but two lasers and a $300,000 deductible add about $950,000 of retained risk. Risk-adjusted, Harborstone wins." },
      { chapter: "Self-funded bids", route: "#/marketing/cedar-ridge/savings", target: ".report", block: "start",
        title: "Savings, documented", body: "Current vendors against the selected bids, line by line, with how every figure was calculated and the risks that were checked. Ready to put in front of a CFO." },

      { chapter: "Cost savings", route: "#/leads/brazos-bank", target: '[data-guide="lead-summary"]', block: "start", marks: ['[data-guide="lead-route"]'],
        title: "A website conversation becomes a qualified lead", body: "A bank CFO asked the website assistant three questions. Size, spend and pain are pulled out, the lead is scored and routed, and a follow-up answering each question is drafted." },
      { chapter: "Cost savings", route: "#/engagements/cedar-ridge", target: '[data-guide="fee-terms"]', place: "below", marks: ['tr[data-eng="cedar-ridge"] td:nth-child(4)', 'tr[data-eng="alder-finch"] td:nth-child(4)'],
        title: "Fee terms, applied to every client", body: "Set the retainer percentage, minimum, maximum and performance fee once. Every engagement letter, invoice and proposal uses them, with the cap or the minimum applied where it should be." },
      { chapter: "Cost savings", route: "#/diagnostic", target: '[data-guide="dx-drivers"]', wait: 15000, block: "start", marks: ['[data-cat="outpatient-facility"]', '[data-lever="outpatient-facility-pricing"]'],
        title: "Where the money goes, in dollars", body: "Twenty-four months of medical claims, pharmacy claims and contracts, grouped into six cost drivers that add up to the full plan cost. Outpatient facilities paid at 262% of Medicare are the biggest lever." },
      { chapter: "Cost savings", route: "#/models/ichra", target: "#ichFix", wait: 15000, advance: "click", hint: "Click Apply fix",
        title: "ICHRA, tested on every employee", body: "The allowance design runs against the real Trinity Oak employee list: each person's age, rating area and pay. One employee fails the affordability test. <b>Click Apply fix.</b>" },
      { chapter: "Cost savings", route: "#/models/ichra", target: '[data-guide="ich-afford"]', block: "start", marks: ["tr[data-fixed]"],
        title: "Fixed, and the savings still hold", body: "The 50-and-over allowance goes up just enough, the highlighted employee now passes, and every number on the page updates." },
      { chapter: "Cost savings", route: "#/savings-proposal", target: '[data-guide="receipt"]', wait: 15000, place: "left",
        title: "Savings in writing", body: "First-dollar care plus the better of ICHRA or the market bid, net of the retainer and performance fee, with the refund terms. It downloads as the client proposal." },
      { chapter: "Cost savings", route: "#/tracker", target: '[data-guide="tracker"]', block: "start",
        title: "Every month, documented", body: "After go-live, each month's reimbursements and payroll are matched against the trended baseline. The performance fee is invoiced from that ledger." },
      { chapter: "Cost savings", route: "#/board", target: '[data-guide="board"]', block: "start",
        title: "Built for the committee and the board", body: "The savings documented from the nine vendor bids become a board pack: executive summary, three-year view, timeline and decision log." },
      { chapter: "Day to day", route: "#/inbox/1", target: '[data-guide="inbox-main"]', block: "start",
        markText: [{ in: '[data-guide="inbox-body"]', find: ["Marcus Bell", "start date 9/8", "himself and his wife"] }],
        marks: ['dd[data-field="Employee"]', 'dd[data-field="Hire date"]', 'dd[data-field="Coverage"]', 'dd[data-field="Coverage starts"]', 'dd[data-field="Enrollment deadline"]'],
        title: "Every service email, read", body: "The highlighted words in Dana's email become the highlighted fields: who, when they started, what coverage. The dates that matter, when coverage starts and when the window closes, are worked out from Harbor Point's waiting period." },
      { chapter: "Day to day", route: "#/inbox/1", target: '[data-guide="inbox-draft"]', place: "left", pointer: "#send",
        title: "The reply is drafted", body: "Review, edit if needed, approve. Terminations, new babies, ID cards and renewal questions work the same way." },
      { chapter: "Day to day", route: "#/reconciliation", target: '[data-guide="recon"]', block: "start", marks: ['tr[data-who="Derek Keller"]', 'tr[data-who="(not on roster)"]'],
        title: "Billing and payroll, checked every cycle", body: "Carrier invoices against enrollment and payroll deductions against elections. Derek Keller left in August and is still being billed; someone nobody's heard of is on Trinity Oak's invoice. Both caught this month, not at year end." },
      { chapter: "Day to day", route: "#/compliance", target: '[data-guide="compliance"]', block: "start",
        title: "Deadlines prepared ahead", body: "Part D notices, SBCs, gag clause attestations, 5500s, PCORI and RxDC, tracked for every group with the documents drafted before they're due." },
      { chapter: "Results", route: "#/time-saved", target: '[data-guide="time-saved"]', block: "start",
        title: "What it's worth each month", body: "Minutes by hand against minutes with the desk, times how often each task happens. Change the counts and hourly cost to match the practice; the top bar shows what this session saved." },
    ],
  });

  /* ================= sign in ================= */
  function enter(who) {
    S.who = who; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(who.name)}</div><div>${who.name}<small>${who.role}</small></div><button id="out" data-tip="Sign out and clear this demo session">Sign out</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/benefits"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
  let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
  const remote = await UI.api("GET", "/api/state/benefits"); UI.setBackend(!!remote);
  if (!saved && remote && remote.who) saved = remote;
  if (saved && saved.who) {
    enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
    restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
  }
  })();
})();
