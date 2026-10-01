/* TPA Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA), history.js (HISTORY),
   parsers.js (Parsers) and recon.js (Recon). */
(() => {
  const { $, $$, esc, money, fdate, daysUntil, icon, toast, route, go, render } = UI;
  const S = { docs: [], elig: null, claims: null, policy: null, sent: {}, sending: false, refunds: false, reportSent: false, who: null };
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const G = DATA.group, RG = "ridgeway", BASE = "#/groups/" + RG;
  const F = name => "samples/ridgeway/" + encodeURIComponent(name);
  const GROUP = id => DATA.groups.find(g => g.id === id);
  const m2 = n => n == null ? "—" : money(n, 2);
  const us = Recon.us, pc = n => Math.round(n * 100) + "%";
  const REL = { E: "Employee", S: "Spouse", C: "Child" };
  const FILED_ON = "09/16/2026";
  const ready = () => !!(S.elig && S.claims && S.policy);
  let memo = null;
  const calc = () => {
    if (!ready()) return null;
    const k = [S.elig, S.claims, S.policy, JSON.stringify(S.sent)];
    if (memo && memo.k.every((x, i) => x === k[i])) return memo.v;
    const R = Recon.roster(S.elig, HISTORY, G), K = Recon.claimCheck(S.claims, R), SL = Recon.stopLoss(S.claims, R, HISTORY, S.policy, S.sent);
    memo = { k, v: { R, K, SL, RP: Recon.report(R, S.claims, HISTORY, S.policy, SL) } }; return memo.v;
  };

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const dueChip = d => { const n = daysUntil(d); return `<span class="chip ${n <= 3 ? "crit" : n <= 10 ? "warn" : ""} plain">${n < 0 ? -n + " days late" : n === 0 ? "today" : n + " days"}</span>`; };
  const kpi = (l, v, d, small = false) => `<div class="card kpi"><div class="l">${l}</div><div class="v" ${small ? 'style="font-size:20px"' : ""}>${v}</div><div class="d">${d}</div></div>`;
  const catchBox = (title, body, guide = "catch") => `<div class="card" data-guide="${guide}" style="margin-bottom:16px;border-color:#f3d6a4;background:#fffbf2"><div class="card-b" style="display:flex;gap:14px;align-items:flex-start">
    <div style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--warn-w);color:var(--warn)">${icon("alert")}</div>
    <div><b style="font-size:14.5px">${title}</b><p style="margin:4px 0 0;color:var(--ink-2)">${body}</p></div></div></div>`;

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/board", "layers", "Employer groups", () => DATA.groups.filter(g => g.kind === "crit").length, true]]],
    ["Ridgeway Manufacturing", [[BASE + "/docs", "upload", "Files"], [BASE + "/elig", "users", "Eligibility"], [BASE + "/claims", "search", "Claims check"],
      [BASE + "/stoploss", "shield", "Stop-loss"], [BASE + "/report", "chart", "Monthly report"]]],
    ["Insights", [["#/savings", "clock", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const c = calc(), ees = DATA.groups.reduce((s, g) => s + g.ees, 0);
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), "Wednesday, September 16 · what came in overnight and what needs you.",
      `<a class="btn" href="#/board">${icon("layers")}Employer groups</a><a class="btn primary" href="${BASE}/docs">${icon("upload")}Open Ridgeway Manufacturing</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi(`${icon("building")} Employer groups`, DATA.groups.length, `${ees.toLocaleString()} employees on self-funded and level-funded plans`)}
        ${kpi(`${icon("file")} September files loaded`, `${c ? 7 : 6} of 8`, c ? "Brightwater School District is late" : "Brightwater late · Ridgeway just in")}
        ${kpi(`${icon("shield")} Stop-loss notices open`, 1 + (c ? c.SL.open.length : 0), c && c.SL.open.length ? "Kessler Sep 22 · Ridgeway Sep 30" : "Kessler Tool &amp; Die, due September 22")}
        ${kpi(`${icon("clock")} Work handled · September ${I("Estimated from how long it takes by hand: about 50 minutes to map and load an employer's file, an hour to check a month of claims against eligibility and 75 minutes to build a monthly report.")}`, "58 hrs", `<span class="up">+12 hrs</span> vs August`)}
      </div>
      <div class="grid g-main-l">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["Ridgeway Manufacturing: September file to load", "Load it and check August's claims before Friday's claims run.", "2026-09-18", BASE + "/docs"],
          ["Brightwater School District: no September file", "Due September 12. Claims are paying against August's roster.", "2026-09-12", "#/board"],
          ["Kessler Tool & Die: stop-loss notice", "Drafted. A claimant crossed 50% of the specific deductible.", "2026-09-22", "#/board"],
          ["Sunrise Senior Living: two dependents over 26", "Asked HR on September 11. No answer yet.", "2026-09-25", "#/board"],
        ].map(([t, w, d, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${esc(t)}</b><p>${w}</p></div>${dueChip(d)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= employer groups ================= */
  const board = () => {
    const c = calc();
    const rows = DATA.groups.map(g => g.id === RG && c ? { ...g, file: "Loaded Sep 16", status: c.SL.open.length ? "Stop-loss notice due Sep 30" : "Loaded · 1 question for HR", kind: c.SL.open.length ? "warn" : "ok" } : g);
    const ord = { crit: 0, warn: 1, info: 2, ok: 3 };
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Employer</th><th class="num">Employees</th><th>Funding</th><th>September file</th><th>Status</th></tr></thead><tbody>
      ${rows.sort((a, b) => ord[a.kind] - ord[b.kind] || a.name.localeCompare(b.name)).map(g => `<tr class="click ${g.kind === "crit" ? "bad" : ""}" data-group="${g.id}" onclick="location.hash='#/groups/${g.id}'"><td><div class="cell-2"><b>${esc(g.name)}</b><small>${esc(g.city)}</small></div></td>
        <td class="num">${g.ees}</td><td>${esc(g.funding)}</td><td class="nowrap">${esc(g.file)}</td><td><span class="chip ${g.kind}">${esc(g.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
  };
  route("/board", () => setPage([["Employer groups"]], `${head("Employer groups", "Every employer this month. A late file or a stop-loss deadline sits at the top.")}${card("Groups", board(), { tight: true, guide: "board", sub: `${DATA.groups.length} employers` })}`));

  route("/groups/:id", ({ id }) => id === RG ? go(BASE + "/" + (ready() ? "elig" : "docs")) : other(id));
  route("/groups/" + RG + "/:tab", ({ tab }) => groupView(tab));
  function other(id) {
    const g = GROUP(id); if (!g) return go("#/board");
    setPage([["Employer groups", "#/board"], [g.name]], `${head(esc(g.name), `${esc(g.funding)} · ${g.ees} employees · ${esc(g.city)}`)}
      <div class="card"><div class="empty">${icon("building")}<p>The full monthly workflow is set up on <b>Ridgeway Manufacturing</b> for this walkthrough.</p><a class="btn primary" href="${BASE}/docs">Open Ridgeway Manufacturing</a></div></div>`);
  }

  /* ================= Ridgeway Manufacturing ================= */
  function groupView(tab) {
    const c = calc();
    const tabs = [["docs", "Files"], ["elig", "Eligibility"], ["claims", "Claims check"], ["stoploss", "Stop-loss"], ["report", "Monthly report"]];
    const noticeOpen = c && c.SL.open.length;
    setPage([["Employer groups", "#/board"], ["Ridgeway Manufacturing"]], `${head("Ridgeway Manufacturing", `Self-funded · ${esc(G.plan)} · 144 employees · Kokomo, IN · HR: ${esc(G.hr)}`,
      c ? `<span class="chip ${noticeOpen ? "warn" : "ok"}">${noticeOpen ? "Stop-loss notice due Sep 30" : "September loaded"}</span>` : `<span class="chip plain">September file received Sep 15</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BASE}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}${k === "stoploss" && noticeOpen ? `<span class="cnt hot">${noticeOpen}</span>` : ""}</a>`).join("")}</div>
      ${!c ? next("Start", "<b>Load what came in.</b> Ridgeway's September eligibility file, August's paid claims register and the stop-loss contract.") : ({
        docs: next("Step 1 of 5", "<b>Everything read.</b> Next, what changed in Ridgeway's file.", `<a class="btn sm primary" href="${BASE}/elig">${icon("arrow")}Eligibility</a>`),
        elig: next("Step 2 of 5", "<b>Mapped, matched and checked.</b> Next, August's claims against the new dates.", `<a class="btn sm primary" href="${BASE}/claims">${icon("search")}Claims check</a>`),
        claims: next("Step 3 of 5", "<b>Every August claim against coverage.</b> Next, the stop-loss contract.", `<a class="btn sm primary" href="${BASE}/stoploss">${icon("shield")}Stop-loss</a>`),
        stoploss: next("Step 4 of 5", noticeOpen ? `<b>One notice to file before ${fdate(c.SL.due)}.</b>` : "<b>Notice filed.</b> Then Ridgeway's monthly report.", `<a class="btn sm primary" href="${BASE}/report">${icon("chart")}Monthly report</a>`),
        report: next("Step 5 of 5", `<b>${S.reportSent ? "Sent to Ridgeway's HR manager." : "Ridgeway's report, built from the same numbers."}</b>`, "", S.reportSent) }[tab] || "")}
      <div id="gBody"></div>`);
    if (tab !== "docs" && !c) { $("#gBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing loaded yet.</b></p><p>Drop Ridgeway's files and every other tab fills itself.</p><a class="btn primary" href="${BASE}/docs">Go to files</a></div></div>`; return; }
    ({ docs, elig, claims, stoploss, report }[tab] || docs)();
  }

  /* ---------- 1. files ---------- */
  function docs() {
    const KIND = { elig: "Eligibility file", claims: "Paid claims register", stoploss: "Stop-loss policy" };
    $("#gBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="dDrop"><div class="ic">${icon("upload")}</div><b>Drop what came in for Ridgeway</b><div class="hint">Eligibility files in any employer's layout (CSV), claims registers, stop-loss contracts (PDF).</div>
        <div style="margin-top:14px"><button class="btn primary" id="dSample">${icon("file")}Load Ridgeway's September files</button></div></div><div id="dRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Files read", S.docs.map(d => `<div class="file-row"><div class="file-ic ${UI.ext(d.name) === "pdf" ? "pdf" : "csv"}">${UI.ext(d.name).toUpperCase()}</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${esc(d.info)}` : "This demo reads eligibility files, paid claims registers and stop-loss policy summaries"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: ready() ? `<a class="btn primary" href="${BASE}/elig">${icon("arrow")}See what changed</a>` : `<span class="muted" style="font-size:12.5px">Add the eligibility file, the claims register and the stop-loss policy to run the month.</span>` }) : ""}
    </div>
    ${card("What gets pulled out", `<div class="steps">${["Each column of the employer's layout, matched to the standard one", "Relationship, coverage and plan codes, translated", "Every person matched to last month's member ID", "Every paid claim with its member and service date", "The specific deductible, attachment point and notice rules"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
    </div>`;
    const handle = async files => {
      const B = { elig: S.elig, claims: S.claims, policy: S.policy, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", info = "";
        if (UI.ext(f.name) === "csv") {
          const text = await f.text(); kind = Parsers.classify(f.name, text);
          if (kind === "elig") { const E = Parsers.eligibility(text, G); if (E.people.length && !E.missing.length) { B.elig = E; info = `${E.people.length} rows · ${E.map.filter(m => m.field).length} of ${E.map.length} columns mapped`; } else kind = "unknown"; }
          else if (kind === "claims") { B.claims = Parsers.claims(text); info = `${B.claims.lines.length} claims · ${m2(B.claims.total)} paid`; }
        } else if (UI.ext(f.name) === "pdf") {
          const doc = await UI.pdfLines(f); kind = Parsers.classify(f.name, doc.lines.join("\n"));
          const P = kind === "stoploss" ? Parsers.stoploss(doc) : null;
          if (P && P.specific) { B.policy = P; info = `${P.fields} terms read · ${doc.numPages} page${doc.numPages > 1 ? "s" : ""}`; } else kind = "unknown";
        }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, info }]);
        return { detail: kind === "unknown" ? "not recognized" : info };
      }]);
      steps.push(["Matching every person to last month's member IDs", async () => { Object.assign(S, B); memo = null; const c = calc(); return { detail: c ? `${c.R.adds.length} new · ${c.R.terms.length + c.R.aged.length} coverage ended · ${c.R.changes.length} changed · ${c.R.missing.length} missing` : "" }; }]);
      steps.push(["Checking every paid claim against coverage dates", async () => { const c = calc(); return { detail: c ? `${c.K.flagged.length} paid after coverage ended` : "" }; }]);
      steps.push(["Measuring claimants against the stop-loss contract", async () => { const c = calc(); return { detail: c ? `${c.SL.open.length} notice due ${us(c.SL.due)}` : "" }; }]);
      await UI.runSteps($("#dRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Eligibility files, claims registers and stop-loss policies are read.`, "warn");
      if (ready()) toast("Ridgeway's month is loaded · eligibility, claims and stop-loss checked"); else if (!unk) toast("Add the eligibility file, the claims register and the stop-loss policy", "warn");
      render();
    };
    UI.dropzone($("#dDrop"), handle, { accept: ".csv,.pdf" });
    $("#dSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.packet.map(fn => UI.fetchSample(F(fn))))); };
  }

  /* ---------- 2. eligibility ---------- */
  const change = m => {
    const e = m.events.find(x => x.type === "aged") || m.events.find(x => x.type === "term") || m.events.find(x => x.type === "change") || m.events.find(x => x.type === "add");
    return e ? { add: ["Added", "info"], term: ["Termed", "crit"], change: ["Tier change", "info"], aged: ["Aged out", "crit"] }[e.type].concat(e.text) : null;
  };
  function elig() {
    const { R } = calc(), E = S.elig;
    const matched = R.members.filter(m => m.prior).length, rows = [...R.adds, ...R.terms, ...R.changes, ...R.aged];
    const codes = [...Object.entries(E.codes.rel).map(([a, b]) => `${a} → ${REL[b]}`), ...Object.entries(E.codes.tier).map(([a, b]) => `${a} → ${DATA.tiers[b]}`), ...Object.entries(E.codes.plan).map(([a, b]) => `${a} → ${b}`)];
    $("#gBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Rows in Ridgeway's file", E.people.length, `${E.map.filter(m => m.field).length} of ${E.map.length} columns used`)}
        ${kpi("Matched to member IDs", matched, `${R.adds.length} new members given IDs`)}
        ${kpi("Changes this month", rows.length, `${R.adds.length} added · ${R.terms.length + R.aged.length} ended · ${R.changes.length} tier change`)}
        ${kpi("Need a person", R.flags.length, `${R.flags.filter(f => f.kind === "crit").length} fixed here · ${R.flags.filter(f => f.kind === "warn").length} question for HR`)}
      </div>
      <div class="grid g-main-l"><div class="stack">
        ${card("Ridgeway's layout, mapped", `<div class="tbl-wrap"><table class="t mapt"><thead><tr><th>Their column</th><th>Example</th><th>Standard field</th><th>Matched by</th></tr></thead><tbody>
          ${E.map.map(m => `<tr class="${m.field ? "" : "skip"}" data-col="${UI.slug(m.col)}"><td><b>${esc(m.col)}</b></td><td class="code">${esc(m.sample)}</td>${m.field ? `<td class="to"><b>${esc(m.label)}</b></td><td>${m.how === "values" ? `what's in it: ${esc(m.seen.slice(0, 4).join(", "))}` : "column name"}</td>` : `<td colspan="2">Not needed for eligibility · kept for reporting</td>`}</tr>`).join("")}
          </tbody></table></div><div style="padding:12px 16px 14px"><div class="muted" style="font-size:12.5px">Codes translated · dates like ${esc(E.people[0].raw.dob)} read as month, day, year</div><div class="codes">${codes.map(x => `<span>${esc(x)}</span>`).join("")}</div></div>`,
          { tight: true, guide: "map", sub: "matched by column name, or by what's in the column" })}
        ${card("Changes this month", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Member</th><th>Name</th><th>Relationship</th><th>Change</th><th>Detail</th></tr></thead><tbody>
          ${rows.map(m => { const [l, k, t] = change(m); return `<tr data-mem="${m.id}" class="${k === "crit" ? "bad" : ""}"><td class="mono">${m.id}${m.prior ? "" : ' <span class="chip info plain">new</span>'}</td><td><b>${esc(m.first)} ${esc(m.last)}</b></td><td>${REL[m.rel]}</td><td><span class="chip ${k} plain">${l}</span></td><td>${esc(t)}</td></tr>`; }).join("")}
          ${R.missing.map(r => `<tr data-mem="${r.id}"><td class="mono">${r.id}</td><td><b>${esc(r.first)} ${esc(r.last)}</b></td><td>${REL[r.rel]}</td><td><span class="chip warn plain">Missing</span></td><td>Not on the file, no term date · kept active, asked Ridgeway</td></tr>`).join("")}
          </tbody></table></div>`, { tight: true, guide: "changes", sub: `against ${esc(HISTORY.month)}'s roster`, foot: `<button class="btn" id="dlStd">${icon("download")}Download in the standard layout</button><span class="muted" style="font-size:12.5px;margin-left:10px">${R.members.length + R.missing.length} members, ready for the claims system</span>` })}
      </div>
      <div class="stack">${card("Need a person", R.flags.map(f => `<div class="list-item" data-flag="${f.type}"><div class="li-ic ${f.kind}">${icon(f.kind === "crit" ? "alert" : "mail")}</div><div class="li-b"><b>${esc(f.title)}</b><p>${esc(f.body)}</p></div></div>`).join(""), { tight: true, guide: "flags" })}</div>
      </div>`;
    $("#dlStd").onclick = () => {
      const out = [["Member ID", "Employee ID", "Last Name", "First Name", "Date of Birth", "Relationship", "Plan", "Tier", "Coverage Start", "Coverage End", "Change"]];
      R.members.forEach(m => { const c = change(m); out.push([m.id, m.emp, m.last, m.first, m.dob, m.rel, m.plan, m.tier, m.start || "", m.end || "", c ? c[0] : ""]); });
      R.missing.forEach(r => out.push([r.id, r.emp, r.last, r.first, r.dob, r.rel, r.plan, r.tier, "", "", "Missing from file"]));
      UI.download("Ridgeway Manufacturing - eligibility 2026-09 - standard layout.csv", UI.toCSV(out)); toast("Downloaded in the standard layout");
    };
  }

  /* ---------- 3. claims check ---------- */
  function claims() {
    const { K } = calc(), C = S.claims;
    const provs = [...new Set(K.flagged.map(f => f.l.provider))];
    $("#gBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Claims paid in August", C.lines.length, `${m2(C.total)} paid`)}
        ${kpi("Checked against coverage", K.checked, "every claim, every service date")}
        ${kpi("Paid after coverage ended", K.flagged.length, `${K.people.length} people · ${provs.length} providers`)}
        ${kpi("To recover", m2(K.total), S.refunds ? "refund requests drafted" : "from the providers paid")}
      </div>
      ${catchBox(`${m2(K.total)} paid for people who weren't covered`, `Ridgeway's September file ends ${K.people.map(p => `${esc(p.m.first)} ${esc(p.m.last)}'s coverage on ${us(p.m.end)}`).join(" and ")}. ${K.flagged.length} claims paid in August had service dates after that. The claims system paid them because the roster it paid against still showed both as covered.`)}
      ${card("Paid after coverage ended", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Claim</th><th>Patient</th><th>Service date</th><th>Provider</th><th>Service</th><th class="num">Paid</th><th>Why</th></tr></thead><tbody>
        ${K.people.map(p => [...p.before.map(l => `<tr class="okrow" data-claim="${l.claim}"><td class="mono">${l.claim}</td><td>${esc(p.m.first)} ${esc(p.m.last)}</td><td>${us(l.dos)}</td><td>${esc(l.provider)}</td><td>${esc(l.service)}</td><td class="num">${m2(l.amount)}</td><td><span class="chip ok plain">Covered · before ${us(p.m.end)}</span></td></tr>`),
          ...p.lines.map(l => `<tr class="bad" data-claim="${l.claim}"><td class="mono">${l.claim}</td><td><b>${esc(p.m.first)} ${esc(p.m.last)}</b></td><td>${us(l.dos)}</td><td>${esc(l.provider)}</td><td>${esc(l.service)}</td><td class="num">${m2(l.amount)}</td><td><span class="chip crit plain">${esc(p.why)}</span></td></tr>`)].join("")).join("")}
        <tr class="sub"><td colspan="5"><b>To recover</b></td><td class="num"><b>${m2(K.total)}</b></td><td></td></tr>
        </tbody></table></div>`, { tight: true, guide: "recover", sub: `${K.flagged.length} of ${K.checked} claims`,
        foot: S.refunds ? `<span class="chip ok">Drafted</span><span class="muted" style="font-size:12.5px;margin-left:10px">Refund requests to ${provs.map(esc).join(", ")}, each with the claim number and the coverage end date.</span>`
          : `<button class="btn primary" id="refunds">${icon("send")}Draft refund requests</button><span class="muted" style="font-size:12.5px;margin-left:10px">One per provider, with the claim numbers and the coverage end date</span>` })}`;
    $("#refunds") && ($("#refunds").onclick = () => { S.refunds = true; toast(`${provs.length} refund requests drafted`); render(); });
  }

  /* ---------- 4. stop-loss ---------- */
  function notice(r) {
    const P = S.policy, fl = S.claims.lines.filter(l => l.id === r.id && l.dx === r.trigger).sort((a, b) => a.dos.localeCompare(b.dos))[0];
    return `To: ${P.carrier}, claims notification
Policy ${P.policy} · ${G.plan}

Notice of a potential specific claim

Claimant: member ${r.id}, ${r.rel.toLowerCase()} of an employee
Diagnosis group: ${r.trigger || r.dx[0]}${r.trigger ? ", a trigger diagnosis under the policy" : ""}
${fl ? `First claim for this diagnosis: service ${us(fl.dos)}, paid ${us(fl.paid)}\n` : ""}Paid in the plan year to date: ${m2(r.ytd)}, ${pc(r.pct)} of the ${money(P.specific)} specific deductible
Paid in ${new Date(r.paidMonth + "T12:00:00").toLocaleString("en-US", { month: "long", year: "numeric" })}: ${m2(r.month)}

Filed within ${P.noticeDays} days after the end of the month the claims were paid (due ${us(r.due)}). Claims detail and case management notes are available on request.

${S.who.name}
${DATA.firm}, plan administrator`;
  }
  function stoploss() {
    const { SL } = calc(), P = S.policy, r = SL.open[0] && { ...SL.open[0], paidMonth: SL.paidMonth }, done = SL.rows.find(x => S.sent[x.id]);
    const status = x => x.status === "due" ? `<span class="chip crit plain">Notice due ${fdate(x.due)}</span>` : x.status === "notified" ? `<span class="chip ok plain">Notified ${x.notified}</span>` : `<span class="chip plain">Watch · ${money(x.toThreshold)} to notice</span>`;
    $("#gBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Specific deductible", money(P.specific), `per covered person · ${esc(P.carrier.replace(" Stop Loss", ""))}`)}
        ${kpi(T("Notice threshold", P.deadlineText ? "Notice is due " + P.deadlineText + "." : ""), money(P.specific * P.threshold), `${pc(P.threshold)} of the deductible, or any trigger diagnosis`)}
        ${kpi("Claimants tracked", SL.rows.length, "over 25% of the deductible or on a trigger diagnosis")}
        ${kpi("Notices open", SL.open.length, SL.open.length ? `due ${fdate(SL.due)} · ${daysUntil(SL.due)} days` : `filed ${FILED_ON}`)}
      </div>
      <div class="stack">
        ${card("Claimants against the contract", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Member</th><th>Relationship</th><th>Diagnosis group</th><th class="num">Before August</th><th class="num">August</th><th class="num">Plan year</th><th>${T("Of the deductible", "The line marks the 50% notice threshold")}</th><th>Stop-loss</th></tr></thead><tbody>
          ${SL.rows.map(x => `<tr data-sl="${x.id}" class="${x.status === "due" ? "bad" : ""}"><td><div class="cell-2"><b>${esc(x.m.first || "")} ${esc(x.m.last || "")}</b><small class="mono">${x.id}</small></div></td><td>${x.rel}</td><td>${esc(x.trigger || x.dx[0] || "")}${x.trigger ? ' <span class="chip warn plain">trigger diagnosis</span>' : ""}</td>
            <td class="num">${m2(x.before)}</td><td class="num">${m2(x.month)}</td><td class="num strong">${m2(x.ytd)}</td>
            <td><div style="display:flex;align-items:center;gap:8px"><div class="pctbar"><i class="${x.pct >= P.threshold ? "crit" : x.pct >= P.threshold * 0.8 ? "warn" : ""}" style="width:${Math.min(100, x.pct * 100)}%"></i><b></b></div><span class="nowrap" style="font-size:12.5px">${pc(x.pct)}</span></div></td><td>${status(x)}</td></tr>`).join("")}
          </tbody></table></div>`, { tight: true, guide: "claimants", sub: `${esc(P.carrier)} · policy ${esc(P.policy)}` })}
        <div class="grid g-main-l">
          ${r && !S.sending ? card("Notice to file", `<div class="letter">${esc(notice(r))}</div>`, { guide: "notice", sub: `due ${fdate(r.due)}`,
            foot: `<button class="btn primary" id="sendNotice">${icon("send")}File notice with ${esc(P.carrier.replace(" Stop Loss", ""))}</button>` }) : ""}
          ${r && S.sending ? card("Notice to file", `<div style="display:flex;gap:10px;align-items:center"><span class="g-spin"></span><span class="muted" style="font-size:13px">Filing with ${esc(P.carrier)}…</span></div>`, { guide: "notice" }) : ""}
          ${!r ? `<div class="card" data-guide="notice"><div class="card-b" data-guide="sl-ok"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ok">Filed</span><span class="muted" style="font-size:13px">${done ? `Notice for member ${done.id} filed with ${esc(P.carrier)} on ${FILED_ON}, ${daysUntil(SL.due)} days before the deadline. Confirmation GR-26-${done.id.slice(3)}.` : "Every claimant who needs a notice has one on file."}</span></div></div></div>` : ""}
          ${card("Read from the contract", `<dl class="kv"><dt>Specific deductible</dt><dd>${money(P.specific)}</dd><dt>Notice threshold</dt><dd>${pc(P.threshold)} of the specific deductible</dd><dt>Trigger diagnoses</dt><dd>${P.triggers.map(t => t[0].toUpperCase() + t.slice(1)).join(", ")}</dd><dt>Notice deadline</dt><dd>${esc(P.deadlineText)}</dd><dt>Aggregate attachment</dt><dd>${money(P.attachment)}</dd><dt>Contract</dt><dd>${esc(P.basis)}</dd></dl>`, { guide: "contract" })}
        </div>
      </div>`;
    $("#sendNotice") && ($("#sendNotice").onclick = async () => { const id = r.id; S.sending = true; render(); await UI.sleep(1400); S.sending = false; S.sent = { ...S.sent, [id]: FILED_ON }; memo = null; toast(`Notice filed with ${P.carrier}`); render(); });
  }

  /* ---------- 5. monthly report ---------- */
  function report() {
    const { RP, K, R } = calc(), P = S.policy;
    const tiers = Object.keys(DATA.tiers);
    const d = (a, b) => a === b ? "" : `<span class="delta ${a > b ? "up" : "dn"}">${a > b ? "+" : ""}${a - b}</span>`;
    const large = RP.large.map((x, i) => ({ ...x, label: "Claimant " + (i + 1) }));
    $("#gBody").innerHTML = `<div class="grid g-main-l">
      ${card("Monthly plan report", `<div class="rpt">
        <div><h4>Enrollment · September</h4><div class="tbl-wrap"><table class="t"><thead><tr><th>Tier</th><th class="num">August</th><th class="num">September</th></tr></thead><tbody>
          ${tiers.map(t => `<tr><td>${DATA.tiers[t]}</td><td class="num">${RP.before[t]}</td><td class="num">${RP.now[t]}${d(RP.now[t], RP.before[t])}</td></tr>`).join("")}
          <tr class="sub"><td><b>Employees</b></td><td class="num"><b>${RP.priorEmployees}</b></td><td class="num"><b>${RP.employees}</b>${d(RP.employees, RP.priorEmployees)}</td></tr></tbody></table></div>
          <p class="muted" style="font-size:12.5px;margin:6px 0 0">${RP.covered} people covered, employees and dependents.</p></div>
        <div><h4>Claims paid · August</h4><dl class="kv"><dt>Medical</dt><dd>${m2(RP.medical)}</dd><dt>Pharmacy</dt><dd>${m2(RP.rx)}</dd><dt>Total</dt><dd><b>${m2(RP.total)}</b></dd>
          <dt>${T("Per employee per month", "August's claims over August's enrolled employees")}</dt><dd>${m2(RP.pepm)} on ${RP.priorEmployees} employees</dd><dt>${T("Expected a month", "The aggregate attachment point is set at 125% of expected claims")}</dt><dd>${money(RP.agg.expected)}</dd></dl></div>
        <div data-guide="agg"><h4>Plan year against the aggregate attachment point</h4>
          <div class="agg"><i style="width:${Math.min(100, RP.agg.pct * 100)}%"></i></div>
          <div class="agg-x"><span>${m2(RP.agg.ytd)} paid, January through August</span><span>${money(RP.agg.prorated)} attachment for ${RP.agg.months} months</span></div>
          <p style="margin:8px 0 0;font-size:13.5px;color:var(--ink-2)">Running at <b>${pc(RP.agg.pct)}</b> of the attachment point to date, ${pc(RP.agg.ofAnnual)} of the ${money(P.attachment)} for the year.</p></div>
        <div><h4>Large claimants</h4><div class="tbl-wrap"><table class="t"><thead><tr><th>Claimant</th><th>Relationship</th><th>Diagnosis group</th><th class="num">Plan year</th><th>Stop-loss</th></tr></thead><tbody>
          ${large.map(x => `<tr><td>${x.label}</td><td>${x.rel}</td><td>${esc(x.trigger || x.dx[0] || "")}</td><td class="num">${m2(x.ytd)}</td><td>${x.status === "notified" ? `Notice filed ${x.notified}` : x.status === "due" ? `Notice due ${us(x.due)}` : `${pc(x.pct)} of the deductible`}</td></tr>`).join("")}</tbody></table></div>
          <p class="muted" style="font-size:12.5px;margin:6px 0 0">Names and member IDs stay with the administrator.</p></div>
        <div><h4>Changes and recoveries</h4><ul style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.7">
          <li>${R.adds.length} people added, ${R.terms.length} employee termed, ${R.changes.length} tier change, ${R.aged.length} dependent aged out at ${G.childAge}.</li>
          <li>${m2(K.total)} paid in August for ${K.people.length} people after their coverage ended. ${S.refunds ? "Refund requests sent to the providers." : "Refunds to be requested from the providers."}</li>
          <li>${R.missing.map(r => `${esc(r.first)} ${esc(r.last)} is missing from September's file with no term date. Please confirm.`).join(" ")}</li></ul></div>
      </div>`, { guide: "report", sub: "Ridgeway Manufacturing · August claims, September enrollment",
        foot: S.reportSent ? `<span class="chip ok">Sent</span><span class="muted" style="font-size:12.5px;margin-left:10px">To ${esc(G.hr)}, September 16.</span>` : `<button class="btn primary" id="sendRpt">${icon("send")}Send to ${esc(G.hr.split(",")[0])}</button><button class="btn" id="dlRpt" style="margin-left:8px">${icon("download")}Download CSV</button>` })}
      <div class="stack">${card("Built from", `<div class="steps">${["Enrollment from the loaded September file", "Claims paid from August's register", "The plan year from Lakeshore's claims history", "Stop-loss status from the contract and the notices filed", "Refunds from the claims check"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}</div>
    </div>`;
    $("#sendRpt") && ($("#sendRpt").onclick = () => { S.reportSent = true; toast(`Report sent to ${G.hr.split(",")[0]}`); render(); });
    $("#dlRpt") && ($("#dlRpt").onclick = () => {
      const out = [["Section", "Item", "August", "September"], ...tiers.map(t => ["Enrollment", DATA.tiers[t], RP.before[t], RP.now[t]]), ["Enrollment", "Employees", RP.priorEmployees, RP.employees],
        ["Claims paid", "Medical", RP.medical, ""], ["Claims paid", "Pharmacy", RP.rx, ""], ["Claims paid", "Total", RP.total, ""], ["Claims paid", "Per employee per month", RP.pepm.toFixed(2), ""],
        ["Plan year", "Paid to date", RP.agg.ytd, ""], ["Plan year", "Attachment to date", RP.agg.prorated, ""], ...large.map(x => ["Large claimant", `${x.label} · ${x.rel} · ${x.trigger || x.dx[0] || ""}`, x.ytd, ""])];
      UI.download("Ridgeway Manufacturing - monthly report - 2026-08.csv", UI.toCSV(out)); toast("Downloaded");
    });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [["Map and load an employer's eligibility file", 50, 4, 40], ["Find adds, terms and changes against last month", 35, 3, 40], ["Check a month of paid claims against coverage dates", 60, 3, 40],
      ["Track claimants against stop-loss rules and draft notices", 30, 3, 40], ["Build the monthly employer report", 75, 5, 40], ["Chase refunds on claims paid in error", 20, 4, 25]];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this month", "Minutes by hand against minutes with the desk, times how often it happens.")}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Hours saved a month", Math.round(saved), `about ${(saved / 160).toFixed(1)} of a full-time specialist`)}
        ${kpi("Files loaded", tasks[0][3], "4 minutes each, not 50")}
        ${kpi("Claims checked", (tasks[2][3] * 350).toLocaleString(), "every one against coverage dates, about 350 a group")}
        ${kpi("Stop-loss notices", "0 late", "every deadline tracked from the contract")}
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times a month</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for an administrator with 40 employer groups" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "tp:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, sent: S.sent, refunds: S.refunds, reportSent: S.reportSent })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/tpa", p), 400); }
  async function restore(st) {
    Object.assign(S, { sent: st.sent || {}, refunds: !!st.refunds, reportSent: !!st.reportSent });
    if (st.docs) for (const fn of DATA.packet) {
      const f = await UI.fetchSample(F(fn));
      if (UI.ext(fn) === "csv") { const text = await f.text(), kind = Parsers.classify(fn, text);
        if (kind === "elig") { S.elig = Parsers.eligibility(text, G); S.docs.push({ name: fn, kind, info: `${S.elig.people.length} rows · ${S.elig.map.filter(m => m.field).length} of ${S.elig.map.length} columns mapped` }); }
        if (kind === "claims") { S.claims = Parsers.claims(text); S.docs.push({ name: fn, kind, info: `${S.claims.lines.length} claims · ${m2(S.claims.total)} paid` }); }
      } else { const doc = await UI.pdfLines(f); S.policy = Parsers.stoploss(doc); S.docs.push({ name: fn, kind: "stoploss", info: `${S.policy.fields} terms read · ${doc.numPages} page` }); }
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
    ...DATA.groups.map(g => ({ label: g.name, sub: `${g.city} · ${g.ees} employees · ${g.status}`, href: "#/groups/" + g.id, icon: "building", kind: "Employer" })),
  ]);

  /* ================= guided demo ================= */
  const ELIG = F(DATA.packet[0]), CLAIMS = F(DATA.packet[1]), POLICY = F(DATA.packet[2]);
  Guide.init({
    app: "tpa", minutes: 7,
    intro: "A walkthrough of one employer's month, from the files that came in to the report that goes back, then every group on one board. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What came in overnight", "Employer groups": "Late files and deadlines first", "The files": "Eligibility, claims, stop-loss", "Eligibility": "Their layout, mapped and checked",
      "Claims": "Paid after coverage ended", "Stop-loss": "A notice due in 14 days", "Results": "The report and the hours" },
    welcomeTitle: "Welcome to TPA Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of a third-party administrator where the monthly grind is automated: employer eligibility files loaded in whatever layout they arrive in, every paid claim checked against coverage dates, stop-loss deadlines tracked and each employer's report built.</p><p>It runs on real sample files: an employer's eligibility file, a month of paid claims and a stop-loss contract. All people, employers and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">An employer's file in its own layout became a clean roster, $3,690.85 paid for people who weren't covered was found, a stop-loss notice went in 14 days early and the employer's report built itself.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/tpa", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:tpa:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What came in overnight",
        body: "Employer files arrive in their own layouts, a stop-loss notice is drafted and monthly reports go out, before anyone opens a spreadsheet.", why: "Loading files and reconciling them is most of an eligibility team's month." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "A file to load before the claims run, a school district that hasn't sent one, a stop-loss deadline and HR that hasn't answered. Each with its date." },

      { chapter: "Employer groups", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-group="brightwater"]', 'tr[data-group="kessler"]'],
        title: "Late files and deadlines first", body: "Every employer this month, sorted by what could cost money. A missing file means claims paying against last month's roster. A stop-loss deadline means reimbursement at risk." },

      { chapter: "The files", route: BASE + "/docs", target: "#dDrop", dropzone: "#dDrop", dropButton: "#dSample", doneWhen: '[data-guide="docs-read"]',
        files: [{ name: "Eligibility file", url: ELIG, note: "Ridgeway's own layout · 302 rows" }, { name: "Paid claims register", url: CLAIMS, note: "Every claim paid in August" }, { name: "Stop-loss policy", url: POLICY, note: "Granite Re · 2026" }],
        title: "Ridgeway Manufacturing's month", body: "A self-funded manufacturer with 144 employees. In: Ridgeway's September eligibility file, August's paid claims and the stop-loss contract. <b>Drag the files onto the drop area.</b>" },

      { chapter: "Eligibility", route: BASE + "/elig", target: '[data-guide="map"]', block: "start",
        source: { type: "csv", url: ELIG, caption: "Ridgeway eligibility - September 2026.csv", legend: "<i></i> Ridgeway's own codes",
          mark: (i, h) => (h === "Type" || h === "Cov Lvl") && i < 60 ? "fmt" : "" },
        title: "Their layout, their codes", body: "A column called Type holding EE, SP and CH. One called Cov Lvl holding EMP+SPOUSE and FAMILY. Dates without leading zeros. Each column is matched to the standard layout by its name, or by what's in it when the name says nothing, and every code is translated." },
      { chapter: "Eligibility", route: BASE + "/elig", target: '[data-guide="changes"]', block: "start",
        marks: ['tr[data-mem="RM-10403"]', 'tr[data-mem="RM-10162"]', 'tr[data-mem="RM-10402"]'],
        title: "Everyone matched to last month", body: "298 people matched to their member IDs. Two new hires covered from September 1, a baby born August 9 covered from birth, and Donna Sanders moved from employee + spouse to family." },
      { chapter: "Eligibility", route: BASE + "/elig", target: '[data-guide="flags"]', place: "left",
        marks: ['[data-flag="aged"]'],
        source: { type: "csv", url: ELIG, caption: "The Nguyen family in Ridgeway's file", legend: "<i></i> still on family coverage",
          mark: (i, h, v, row) => row[1] === "Nguyen" && row[2] === "Kyle" && (h === "Birth Date" || h === "Type" || h === "Cov Lvl") ? "bad" : "" },
        title: "Still on the file at 26", body: "Kyle Nguyen turned 26 on May 2. Ridgeway's file still lists Kyle as a child on family coverage. The plan covers children through the end of the month they turn 26, so coverage ended May 31. Termed, and a COBRA notice queued.",
        why: "Nobody catches this by eye in a 302-row file." },
      { chapter: "Eligibility", route: BASE + "/elig", target: '[data-guide="flags"]', place: "left",
        marks: ['[data-flag="retro"]', '[data-flag="missing"]'],
        title: "A late termination, and a row that vanished", body: "Dale Porter left July 31, and August's file still listed Dale as active. Wesley Tate is simply gone, with no term date. That one goes to Ridgeway as a question, not a termination, so nobody loses coverage over a missing row." },

      { chapter: "Claims", route: BASE + "/claims", target: '[data-guide="catch"]', block: "start",
        source: { type: "csv", url: CLAIMS, caption: "Paid claims register - August 2026.csv", legend: "<i></i> paid after coverage ended",
          mark: (i, h, v, row) => ["C2608-00237", "C2608-00338", "C2608-00136", "C2608-00257"].includes(row[0]) && (h === "Service Date" || h === "Paid" || h === "Patient") ? "bad" : "" },
        title: "$3,690.85 paid for people who weren't covered", body: "All 348 claims paid in August, checked against the coverage dates the new file produced. Four had service dates after coverage ended. The claims system paid them because its roster was a month behind." },
      { chapter: "Claims", route: BASE + "/claims", target: '[data-guide="recover"]', block: "start",
        marks: ['tr[data-claim="C2608-00237"]', 'tr[data-claim="C2608-00338"]'],
        title: "To the day", body: "Dale's surgery on August 12 and imaging on August 21 came after July 31. The July 28 office visit didn't, so it stays paid. Each refund request goes to its provider with the claim number and the coverage end date.",
        why: "Found this month, it's a refund request. Found at the audit, it's a write-off." },

      { chapter: "Stop-loss", route: BASE + "/stoploss", target: '[data-guide="claimants"]', block: "start",
        marks: ['tr[data-sl="RM-10154"]'],
        source: { type: "pdf", url: POLICY, find: ["50% of the specific deductible", "Oncology, transplant, dialysis, neonatal intensive care", "30 days after the end of the month the claim is paid"], caption: "Stop-loss policy summary · Granite Re", legend: "<i></i> the notice rules" },
        title: "Three claimants against the contract", body: "Granite Re wants notice at 50% of the $75,000 specific deductible, or on a trigger diagnosis at any amount. Elena Ramos's oncology claims crossed both in August: $43,650, 58%. The newborn in intensive care was reported in April. The knee replacement is at 43% and watched." },
      { chapter: "Stop-loss", route: BASE + "/stoploss", target: "#sendNotice", advance: "click", hint: "Click File notice with Granite Re",
        title: "Notice due September 30", body: "Drafted from the claims and the contract: claimant, diagnosis, paid to date and the first claim date. <b>File it.</b>",
        why: "Late notice can reduce or bar reimbursement on a claim that could reach six figures." },
      { chapter: "Stop-loss", route: BASE + "/stoploss", target: '[data-guide="sl-ok"]', block: "center", wait: 8000,
        title: "Filed, 14 days early", body: "The notice is on file with Granite Re, and the claimant shows as notified from here on." },

      { chapter: "Results", route: BASE + "/report", target: '[data-guide="report"]', block: "start",
        title: "Ridgeway's report, already built", body: "Enrollment against August, claims paid, cost per employee, the plan year against the aggregate attachment point, and large claimants without names or IDs. Nothing retyped from four systems." },
      { chapter: "Results", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-group="ridgeway"]'],
        title: "Back on the board", body: "Ridgeway is loaded for September with one question out to HR, two days before the claims run." },
      { chapter: "Results", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth in a month", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your book." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Sign out and clear this demo session">Sign out</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/tpa"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/tpa"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    }
  })();
})();
