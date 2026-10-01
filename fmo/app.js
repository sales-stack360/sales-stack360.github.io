/* FMO Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA), book.js (BOOK),
   parsers.js (Parsers) and checks.js (Contract, Comm). */
(() => {
  const { $, $$, esc, money, fdate, daysUntil, icon, toast, route, go, render } = UI;
  const S = { docs: [], intake: null, license: null, eo: null, training: null, submitted: false,
    sdocs: [], stmts: {}, disputed: false, approved: false, who: null };
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const TODAY = "2026-09-16";
  const AG = "castillo", BA = "#/agents/" + AG, BC = "#/commissions/2026-09";
  const FA = name => "samples/castillo/" + encodeURIComponent(name), FC = name => "samples/september/" + encodeURIComponent(name);
  const m2 = n => n == null ? "—" : money(n, 2);
  const us = Contract.us;
  const readyA = () => !!(S.intake && S.license && S.eo && S.training);
  const readyC = () => !!(S.stmts.ashford && S.stmts.bluewater);
  const calcA = () => readyA() ? Contract.evaluate(S.intake, S.license, S.eo, S.training, TODAY) : null;
  let memoC = null;
  const calcC = () => { if (!readyC()) return null; if (memoC && memoC.a === S.stmts.ashford && memoC.b === S.stmts.bluewater) return memoC.v;
    const R = Comm.reconcile([S.stmts.ashford, S.stmts.bluewater]); memoC = { a: S.stmts.ashford, b: S.stmts.bluewater, v: { R, P: Comm.payouts(R) } }; return memoC.v; };

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const dueChip = d => { const n = daysUntil(d); return `<span class="chip ${n <= 3 ? "crit" : n <= 10 ? "warn" : ""} plain">${n < 0 ? -n + " days ago" : n === 0 ? "today" : n + " days"}</span>`; };
  const kpi = (l, v, d, small = false) => `<div class="card kpi"><div class="l">${l}</div><div class="v" ${small ? 'style="font-size:20px"' : ""}>${v}</div><div class="d">${d}</div></div>`;
  const listOf = a => a.length < 3 ? a.join(" and ") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/board", "users", "Contracting", () => DATA.pipeline.filter(p => p.kind === "crit").length, true]]],
    ["Renee Castillo", [[BA + "/docs", "upload", "Packet"], [BA + "/profile", "user", "Agent profile"], [BA + "/carriers", "shield", "Carrier contracting"]]],
    ["September commissions", [[BC + "/statements", "file", "Statements"], [BC + "/recon", "scale", "Reconciliation"], [BC + "/payouts", "dollar", "Agent payouts"]]],
    ["Insights", [["#/savings", "clock", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const c = calcC();
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), "Wednesday, September 16 · two weeks to AEP marketing · what came in overnight and what needs you.",
      `<a class="btn" href="${BC}/statements">${icon("dollar")}September commissions</a><a class="btn primary" href="${BA}/docs">${icon("user")}Open Renee Castillo</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi(`${icon("users")} Agents contracting`, DATA.pipeline.filter(p => p.stage !== "Ready for AEP").length, `${DATA.pipeline.filter(p => p.kind === "crit").length} blocked before AEP`)}
        ${kpi(`${icon("check")} Ready to sell for AEP`, "41 of 48", "agents appointed with every carrier they asked for")}
        ${kpi(`${icon("dollar")} September statements`, c ? "Reconciled" : "2 in", c ? `${m2(c.R.owed)} owed by carriers` : "Ashford (CSV) and Bluewater (PDF)", !!c)}
        ${kpi(`${icon("clock")} Work handled · September ${I("Estimated from how long it takes by hand: about 90 minutes to check a contracting packet against five carriers, and three hours to reconcile a carrier statement against the book.")}`, "71 hrs", `<span class="up">+22 hrs</span> vs August`)}
      </div>
      <div class="grid g-main-l">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["Renee Castillo: new agent packet", "Five carriers requested. AEP marketing starts October 1.", "2026-10-01", BA + "/docs"],
          ["Carlos Ruiz: E&O expired", "Can't be submitted anywhere until the renewal arrives.", "2026-09-01", "#/board"],
          ["September commissions: payouts due Friday", "Two statements in. Reconcile before agents are paid.", "2026-09-18", BC + "/statements"],
          ["Holly Vance: Bluewater appointment", "Pending 12 days. Their usual is 3 to 5.", "2026-09-22", "#/board"],
        ].map(([t, w, d, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${esc(t)}</b><p>${w}</p></div>${dueChip(d)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= contracting board ================= */
  const board = () => {
    const a = calcA();
    const rows = DATA.pipeline.map(p => p.id === AG && a ? { ...p, stage: "Contracting", carriers: S.submitted ? `${a.ready.length} of 5 submitted` : "0 of 5",
      status: S.submitted ? `Submitted where ready · ${a.fixes.length} fixes asked` : `${a.ready.length} ready · ${a.fixes.length} fixes needed`, kind: S.submitted ? "info" : "warn" } : p);
    const ord = { crit: 0, warn: 1, info: 2, ok: 3 };
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Agent</th><th>Stage</th><th>Carriers</th><th>Status</th></tr></thead><tbody>
      ${rows.sort((x, y) => ord[x.kind] - ord[y.kind] || x.name.localeCompare(y.name)).map(p => `<tr class="click ${p.kind === "crit" ? "bad" : ""}" data-agent="${p.id}" onclick="location.hash='#/agents/${p.id}'"><td><div class="cell-2"><b>${esc(p.name)}</b><small>${esc(p.city)}</small></div></td>
        <td>${esc(p.stage)}</td><td class="nowrap">${esc(p.carriers)}</td><td><span class="chip ${p.kind}">${esc(p.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
  };
  route("/board", () => setPage([["Contracting"]], `${head("Contracting", "Every agent in contracting, sorted by what stops them selling this AEP.")}${card("Agents", board(), { tight: true, guide: "board", sub: `${DATA.pipeline.length} agents` })}`));

  route("/agents/:id", ({ id }) => id === AG ? go(BA + "/" + (readyA() ? "carriers" : "docs")) : other(id));
  route("/agents/" + AG + "/:tab", ({ tab }) => agentView(tab));
  function other(id) {
    const p = DATA.pipeline.find(x => x.id === id); if (!p) return go("#/board");
    setPage([["Contracting", "#/board"], [p.name]], `${head(esc(p.name), `${esc(p.city)} · ${esc(p.stage)} · ${esc(p.carriers)}`)}
      <div class="card"><div class="empty">${icon("user")}<p>The full contracting workflow is set up on <b>Renee Castillo</b> for this walkthrough.</p><a class="btn primary" href="${BA}/docs">Open Renee Castillo</a></div></div>`);
  }

  /* ================= Renee Castillo ================= */
  function agentView(tab) {
    const a = calcA();
    const tabs = [["docs", "Packet"], ["profile", "Agent profile"], ["carriers", "Carrier contracting"]];
    setPage([["Contracting", "#/board"], ["Renee Castillo"]], `${head("Renee Castillo", "Independent agent · Knoxville, TN · Castillo Insurance Services LLC · packet received September 15",
      a ? `<span class="chip ${S.submitted ? "info" : "warn"}">${S.submitted ? `Submitted to ${a.ready.length} carriers` : `${a.ready.length} of 5 carriers ready`}</span>` : `<span class="chip plain">Packet received</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BA}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}</a>`).join("")}</div>
      ${!a ? next("Start", "<b>Load the packet.</b> Intake form, license summary, E&O certificate and training transcript.") : ({
        docs: next("Step 1 of 3", "<b>Everything read.</b> Check the agent profile, then every carrier's rules.", `<a class="btn sm primary" href="${BA}/profile">${icon("arrow")}Agent profile</a>`),
        profile: next("Step 2 of 3", "<b>One packet, read once.</b> Next, each carrier's requirements against it.", `<a class="btn sm primary" href="${BA}/carriers">${icon("shield")}Carrier contracting</a>`),
        carriers: next("Step 3 of 3", S.submitted ? "<b>Submitted where it's ready. The rest is with Renee.</b>" : "<b>Submit what's ready, and ask for the rest in one message.</b>", "", S.submitted) }[tab] || "")}
      <div id="aBody"></div>`);
    if (tab !== "docs" && !a) { $("#aBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing read yet.</b></p><p>Drop the packet and every other tab fills itself.</p><a class="btn primary" href="${BA}/docs">Go to the packet</a></div></div>`; return; }
    ({ docs: aDocs, profile, carriers }[tab] || aDocs)();
  }

  function aDocs() {
    const KIND = { intake: "Contracting intake", license: "Producer license summary", eo: "E&O certificate", training: "Training transcript" };
    $("#aBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="aDrop"><div class="ic">${icon("upload")}</div><b>Drop the agent's contracting packet</b><div class="hint">Intake forms, license summaries, E&O certificates, AHIP and training certificates. PDF.</div>
        <div style="margin-top:14px"><button class="btn primary" id="aSample">${icon("file")}Load Renee Castillo's packet</button></div></div><div id="aRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Documents read", S.docs.map(d => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${d.fields} values read` : "This demo reads intake forms, license summaries, E&O certificates and training transcripts"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: readyA() ? `<a class="btn primary" href="${BA}/carriers">${icon("arrow")}Check every carrier</a>` : `<span class="muted" style="font-size:12.5px">Add the intake, license summary, E&O certificate and training transcript.</span>` }) : ""}
    </div>
    <div class="stack">${card("What gets pulled out", `<div class="steps">${["Name, NPN, agency and the carriers and states requested", "Every state license, its lines of authority and status", "E&O limits and the policy period", "AHIP plan year, AML date and annuity training", "Background answers, for every carrier's questionnaire"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}</div>
    </div>`;
    const handle = async files => {
      const B = { intake: S.intake, license: S.license, eo: S.eo, training: S.training, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", fields = 0;
        if (UI.ext(f.name) === "pdf") { const doc = await UI.pdfLines(f); kind = Parsers.classify(f.name, doc.lines.join("\n"));
          const r = Parsers[kind] && ["intake", "license", "eo", "training"].includes(kind) ? Parsers[kind](doc) : null;
          if (r && r.fields) { B[kind] = r; fields = r.fields; } else kind = "unknown"; }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, fields }]);
        return { detail: kind === "unknown" ? "not recognized" : `${fields} values` };
      }]);
      steps.push(["Checking five carriers' rules, state by state", async () => { Object.assign(S, B); const a = calcA(); return { detail: a ? `${a.ready.length} ready · ${a.fixes.length} fixes needed` : "" }; }]);
      await UI.runSteps($("#aRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Intake forms, license summaries, E&O certificates and training transcripts are read.`, "warn");
      if (readyA()) toast("Packet read · every carrier checked"); else if (!unk) toast("Add the rest of the packet to check the carriers", "warn");
      render();
    };
    UI.dropzone($("#aDrop"), handle, { accept: ".pdf" });
    $("#aSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.packet.map(fn => UI.fetchSample(FA(fn))))); };
  }

  function profile() {
    const In = S.intake, L = S.license, E = S.eo, Tr = S.training, eoLeft = Contract.days(TODAY, E.to);
    $("#aBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("NPN", esc(In.npn), `${esc(In.resident)} resident`)}
        ${kpi("Licenses", `${L.rows.filter(r => /active/i.test(r.status)).length} active`, L.rows.filter(r => !/active/i.test(r.status)).map(r => `${r.st} ${r.status.toLowerCase()}`).join(" · ") || "all active")}
        ${kpi("E&O", money(E.limit), `through ${us(E.to)} · ${eoLeft} days left`)}
        ${kpi("AHIP", Tr.ahip ? "Plan year " + Tr.ahip.year : "None", Tr.ahip ? `passed ${us(Tr.ahip.done)}` : "not in the packet")}
      </div>
      <div class="grid g-main-l"><div class="stack">
        ${card("Agent", `<dl class="kv"><dt>Name</dt><dd>${esc(In.name)}</dd><dt>NPN</dt><dd class="mono">${esc(In.npn)}</dd><dt>Agency</dt><dd>${esc(In.agency)}</dd><dt>Address</dt><dd>${esc(In.address)}</dd>
          <dt>Email</dt><dd>${esc(In.email)}</dd><dt>Phone</dt><dd>${esc(In.phone)}</dd><dt>Direct deposit</dt><dd>${esc(In.deposit)}</dd>
          <dt>Carriers requested</dt><dd>${In.carriers.map(c => esc(c.name)).join(", ")}</dd><dt>States</dt><dd>${In.states.map(s => s.st).join(", ")}</dd></dl>`, { guide: "profile" })}
        ${card("State licenses", `<div class="tbl-wrap"><table class="t"><thead><tr><th>State</th><th>Type</th><th>License</th><th>Lines of authority</th><th>Status</th><th>Expires</th></tr></thead><tbody>
          ${L.rows.map(r => `<tr data-st="${r.st}"><td><b>${r.st}</b></td><td>${esc(r.type)}</td><td class="mono">${esc(r.no)}</td><td>${esc(r.lines)}</td><td><span class="chip ${/active/i.test(r.status) ? "ok" : "warn"} plain">${esc(r.status)}</span></td><td>${r.expires ? us(r.expires) : r.applied ? "applied " + us(r.applied) : "—"}</td></tr>`).join("")}</tbody></table></div>`, { tight: true, guide: "licenses" })}
      </div>
      <div class="stack">
        ${card("E&O and training", `<div class="fix" data-item="eo"><div><b>E&O · ${esc(E.insurer)}</b><small>${esc(E.policy)} · ${money(E.limit)} each claim · ${us(E.from)} to ${us(E.to)}</small></div></div>
          ${Tr.rows.map(r => `<div class="fix"><div><b>${esc(r.course)}</b><small>${us(r.done)}${r.year ? ` · plan year ${r.year}` : ""} · ${esc(r.result)}</small></div></div>`).join("")}`, { guide: "training" })}
        ${card("Background questions", `${In.background.map(b => `<div class="fix"><span class="chip ${/^no$/i.test(b.a) ? "ok" : "crit"} plain">${esc(b.a)}</span><span style="font-size:13px">${esc(b.q)}</span></div>`).join("")}`, { sub: "answered once, used on every carrier's form" })}
      </div></div>`;
  }

  function carriers() {
    const a = calcA(), In = S.intake;
    const REQ = [["ahip", "AHIP 2027"], ["eo", "E&O"], ["aml", "AML"], ["annuity", "Annuity training"]];
    const cell = (r, id) => { const q = r.reqs.find(x => x.id === id); return !q ? '<td class="c na">—</td>' : `<td class="c ${q.ok ? "yes" : "no"}" data-req="${r.key}-${id}">${q.ok ? "✓" : "✗"}<small>${esc(q.detail)}</small></td>`; };
    const stCell = (r, s) => `<td class="c ${s.ok ? "yes" : s.pending ? "wait" : "no"}" data-st="${r.key}-${s.st}">${s.ok ? "✓" : s.pending ? "Waits" : "✗"}${s.ok ? "" : `<small>${esc(s.pending ? "License pending" : s.why)}</small>`}</td>`;
    const status = r => S.submitted && r.status !== "blocked" ? `<span class="chip info">Submitted · ${r.okStates.map(s => s.st).join(", ")}</span>` : r.status === "blocked" ? `<span class="chip crit">Blocked</span>` : `<span class="chip ok">Ready · ${r.okStates.map(s => s.st).join(", ")}</span>`;
    const ready = a.ready.map(r => r.c.name);
    $("#aBody").innerHTML = `
      <div class="stack">
      ${card("Every carrier against the packet", `<div class="tbl-wrap"><table class="t mx"><thead><tr><th>Carrier</th>${In.states.map(s => `<th class="c">${s.st}</th>`).join("")}${REQ.map(([, l]) => `<th class="c">${l}</th>`).join("")}<th>Status</th></tr></thead><tbody>
        ${a.rows.map(r => `<tr data-car="${r.key}" class="${r.status === "blocked" ? "bad" : ""}"><td><div class="cell-2"><b>${esc(r.c.name)}</b><small>${esc(r.c.product)}</small></div></td>${r.states.map(s => stCell(r, s)).join("")}${REQ.map(([id]) => cell(r, id)).join("")}<td>${status(r)}</td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "matrix", sub: `${a.rows.length} carriers × ${In.states.length} states · Harborline's rules for each` })}
      <div class="grid g-main-l">
        <div class="stack">
          ${S.submitted ? `<div class="card" data-guide="submit"><div class="card-b" data-guide="sub-ok"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ok">Submitted</span><span class="muted" style="font-size:13px">${esc(listOf(ready))} for ${a.ready[0].okStates.map(s => s.st).join(" and ")}, ${a.appointments} appointments. Renee has one message with the ${a.fixes.length} fixes and a link for each. Florida goes in when the state issues the license.</span></div></div></div>`
            : card("Ready to submit today", `${a.ready.map(r => `<div class="fix"><span class="chip ok plain">Ready</span><div><b>${esc(r.c.name)} · ${esc(r.c.product)}</b><small>${r.okStates.map(s => s.st).join(" and ")} · usually ${esc(r.c.turnaround)}</small></div></div>`).join("")}`,
              { guide: "submit", foot: `<button class="btn primary" id="submitCarriers">${icon("send")}Submit ${a.ready.length} carriers and send Renee the fixes</button>` })}
        </div>
        <div class="stack">
          ${card(`What Renee needs to fix`, `${a.fixes.map(f => `<div class="fix" data-fixid="${f.id}"><span class="chip warn plain">Fix</span><div><b>${esc(f.text)}</b><small>Blocks ${esc(listOf(f.carriers))}</small></div></div>`).join("")}
            ${a.pendingStates.map(st => `<div class="fix" data-fixid="state-${st}"><span class="chip plain">Wait</span><div><b>${st} license is pending with the state</b><small>Applied ${us((S.license.rows.find(r => r.st === st) || {}).applied)}. ${st} appointments go in when it's issued.</small></div></div>`).join("")}`, { guide: "fixes", sub: "before submission" })}
        </div>
      </div></div>`;
    $("#submitCarriers") && ($("#submitCarriers").onclick = async e => { e.target.disabled = true; e.target.innerHTML = `<span class="g-spin"></span> Submitting…`; await UI.sleep(1200); S.submitted = true; toast(`Submitted to ${listOf(ready)} · fixes sent to Renee`); render(); });
  }

  /* ================= September commissions ================= */
  route("/commissions/2026-09/:tab", ({ tab }) => commView(tab));
  route("/commissions", () => go(BC + "/" + (readyC() ? "recon" : "statements")));
  function commView(tab) {
    const c = calcC();
    const tabs = [["statements", "Statements"], ["recon", "Reconciliation"], ["payouts", "Agent payouts"]];
    setPage([["September commissions"]], `${head("September commissions", `Carrier statements against Harborline's book · ${BOOK.agents.length} writing agents · payouts Friday, September 18`,
      c ? `<span class="chip ${S.disputed ? "info" : "warn"}">${S.disputed ? "Disputes sent" : `${m2(c.R.owed)} owed by carriers`}</span>` : `<span class="chip plain">2 statements in</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BC}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "statements" && S.sdocs.length ? `<span class="cnt">${S.sdocs.length}</span>` : ""}${k === "recon" && c && !S.disputed ? `<span class="cnt hot">${c.R.issues.length}</span>` : ""}</a>`).join("")}</div>
      ${!c ? next("Start", "<b>Load the statements.</b> Ashford's CSV export and Bluewater's PDF.") : ({
        statements: next("Step 1 of 3", "<b>Both statements read.</b> Next, every line against the book.", `<a class="btn sm primary" href="${BC}/recon">${icon("scale")}Reconciliation</a>`),
        recon: next("Step 2 of 3", S.disputed ? "<b>Disputes sent.</b> Then the payouts." : "<b>Every policy against what the carrier paid.</b>", `<a class="btn sm primary" href="${BC}/payouts">${icon("dollar")}Agent payouts</a>`),
        payouts: next("Step 3 of 3", `<b>${S.approved ? "Approved. Statements go to each agent Friday." : "Each agent paid for what they wrote."}</b>`, "", S.approved) }[tab] || "")}
      <div id="cBody"></div>`);
    if (tab !== "statements" && !c) { $("#cBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>No statements read yet.</b></p><p>Drop September's statements and the other tabs fill themselves.</p><a class="btn primary" href="${BC}/statements">Go to statements</a></div></div>`; return; }
    ({ statements, recon, payouts }[tab] || statements)();
  }

  function statements() {
    $("#cBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="cDrop"><div class="ic">${icon("upload")}</div><b>Drop carrier commission statements</b><div class="hint">Any carrier, CSV export or PDF statement.</div>
        <div style="margin-top:14px"><button class="btn primary" id="cSample">${icon("file")}Load September statements</button></div></div><div id="cRun" style="margin-top:14px"></div></div></div>
      ${S.sdocs.length ? card("Statements read", S.sdocs.map(d => `<div class="file-row"><div class="file-ic ${UI.ext(d.name) === "pdf" ? "pdf" : "csv"}">${UI.ext(d.name).toUpperCase()}</div><div class="meta"><b>${esc(d.name)}</b><small>${d.carrier ? `${esc(DATA.carriers[d.carrier].name)} · ${d.lines} lines · ${m2(d.total)}` : "Not recognized as a commission statement"}</small></div>${d.carrier ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "stmts-read", foot: readyC() ? `<a class="btn primary" href="${BC}/recon">${icon("arrow")}Reconcile</a>` : `<span class="muted" style="font-size:12.5px">Add Ashford's and Bluewater's statements.</span>` }) : ""}
    </div>
    <div class="stack">${card("What gets pulled out", `<div class="steps">${["Every policy paid, with its member and effective date", "The writing agent's name and NPN", "New, renewal or chargeback, and the amount", "Premium and rate, where commission is a percentage"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}</div>
    </div>`;
    const handle = async files => {
      const B = { stmts: { ...S.stmts }, sdocs: [...S.sdocs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let st = null;
        if (UI.ext(f.name) === "csv") { const text = await f.text(); if (Parsers.classify(f.name, text) === "statement") st = Parsers.statementCSV(text, f.name); }
        else if (UI.ext(f.name) === "pdf") { const doc = await UI.pdfLines(f); if (Parsers.classify(f.name, doc.lines.join("\n")) === "statement") st = Parsers.statementPDF(doc); }
        if (st && DATA.carriers[st.carrier] && st.lines.length) B.stmts[st.carrier] = st; else st = null;
        B.sdocs = B.sdocs.filter(d => d.name !== f.name).concat([{ name: f.name, carrier: st && st.carrier, lines: st ? st.lines.length : 0, total: st ? st.total : 0 }]);
        return { detail: st ? `${st.lines.length} lines · ${m2(st.total)}` : "not recognized" };
      }]);
      steps.push(["Matching every line to a policy in the book", async () => { Object.assign(S, B); memoC = null; const c = calcC(); return { detail: c ? `${c.R.rows.length} policies · ${c.R.issues.length} exceptions` : "" }; }]);
      steps.push(["Crediting each line to its writing agent", async () => { const c = calcC(); return { detail: c ? `${BOOK.agents.length} agents` : "" }; }]);
      await UI.runSteps($("#cRun"), steps, 450);
      const unk = S.sdocs.filter(d => !d.carrier).length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized as a commission statement`, "warn");
      if (readyC()) toast("Statements reconciled against the book"); else if (!unk) toast("Add both carriers' statements", "warn");
      render();
    };
    UI.dropzone($("#cDrop"), handle, { accept: ".csv,.pdf" });
    $("#cSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.statements.map(fn => UI.fetchSample(FC(fn))))); };
  }

  function dispute(R) {
    const cr = R.issues.filter(r => r.p.carrier === "ashford"), bw = R.issues.filter(r => r.p.carrier === "bluewater");
    return `To: Ashford Health, agent commissions
Re: Harborline Insurance Marketing, September 2026 statement

${cr.filter(r => r.status === "missing").length} enrollments effective ${us(Parsers.iso(cr.find(r => r.status === "missing")?.p.eff || ""))} were not paid:
${cr.filter(r => r.status === "missing").map(r => `  ${r.p.id}  ${r.p.first} ${r.p.last}, written by ${r.agent.name}, ${m2(r.expected)}`).join("\n")}

${cr.filter(r => r.status === "short").length} first-year enrollments were paid at the renewal rate:
${cr.filter(r => r.status === "short").map(r => `  ${r.p.id}  ${r.p.first} ${r.p.last}, effective ${r.p.eff}, paid ${m2(r.paid)}, due ${m2(r.expected)}`).join("\n")}

Total owed: ${m2(cr.reduce((s, r) => s - r.diff, 0))}. Please include it on the October statement.

To: Bluewater Senior, agent services
${bw.map(r => `Policy ${r.p.id} (${r.p.first} ${r.p.last}) is paid under ${r.paidTo.name}, NPN ${r.paidTo.npn}. The writing agent is ${r.agent.name}, NPN ${r.agent.npn}. Please correct the agent of record.`).join("\n")}

${S.who.name}
${DATA.firm}`;
  }
  function recon() {
    const { R } = calcC();
    const exp = R.summary.reduce((s, x) => s + x.expected, 0), paid = R.summary.reduce((s, x) => s + x.paid, 0);
    const issueRow = r => {
      const lbl = { missing: ["crit", "Not paid"], short: ["crit", r.why || "Paid short"], over: ["warn", "Paid over"], agent: ["warn", `Paid under ${r.paidTo ? r.paidTo.name : "another agent"}`], chargeback: ["info", "Chargeback · correct"] }[r.status];
      return `<tr data-pol="${r.p.id}" class="${r.status === "missing" || r.status === "short" ? "bad" : ""}"><td class="mono">${esc(r.p.id)}</td><td>${esc(r.p.first)} ${esc(r.p.last)}</td><td>${esc(r.agent.name)}</td><td>${esc(DATA.carriers[r.p.carrier].name)}</td><td class="nowrap">${esc(r.p.eff)}</td>
        <td class="num">${m2(r.expected)}</td><td class="num">${r.l ? m2(r.paid) : "—"}</td><td><span class="chip ${lbl[0]} plain">${esc(lbl[1])}</span></td></tr>`;
    };
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Due from carriers", m2(exp), `${R.rows.length} policies in the book`)}
        ${kpi("Paid on the statements", m2(paid), `${R.summary.reduce((s, x) => s + x.lines, 0)} lines, CSV and PDF`)}
        ${kpi("Owed by carriers", m2(R.owed), `${R.issues.filter(r => r.status !== "agent").length} policies unpaid or short`)}
        ${kpi("Paid to the wrong agent", R.issues.filter(r => r.status === "agent").length, "credited back to the writing agent")}
      </div>
      <div class="stack">
        ${card("By carrier", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Carrier</th><th>Statement</th><th class="num">Lines</th><th class="num">Due</th><th class="num">Paid</th><th class="num">Difference</th><th>Exceptions</th></tr></thead><tbody>
          ${R.summary.map(x => `<tr data-carrier="${x.key}"><td><b>${esc(x.name)}</b><div class="muted" style="font-size:12px">${esc(DATA.carriers[x.key].schedule || "")}</div></td><td>${x.format}</td><td class="num">${x.lines}</td><td class="num">${m2(x.expected)}</td><td class="num">${m2(x.paid)}</td><td class="num ${x.paid < x.expected - 0.005 ? "strong" : ""}">${m2(x.paid - x.expected)}</td><td>${x.issues ? `<span class="chip warn plain">${x.issues}</span>` : '<span class="chip ok plain">None</span>'}</td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "bycarrier", sub: "what each carrier's schedule says it owes, policy by policy" })}
        ${card("Exceptions", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Policy</th><th>Member</th><th>Writing agent</th><th>Carrier</th><th>Effective</th><th class="num">Due</th><th class="num">Paid</th><th>Issue</th></tr></thead><tbody>
          ${[...R.issues, ...R.chargebacks].map(issueRow).join("")}</tbody></table></div>`, { tight: true, guide: "exceptions", sub: `${R.issues.length} to fix · ${R.chargebacks.length} chargeback checked and correct` })}
        <div class="grid g-main-l">
          ${S.disputed ? `<div class="card" data-guide="dispute"><div class="card-b" data-guide="disp-ok"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ok">Sent</span><span class="muted" style="font-size:13px">Ashford has the ${R.issues.filter(r => r.p.carrier === "ashford").length} policies and ${m2(R.owed)} owed. Bluewater has the agent-of-record correction. Both are tracked until they show up on October's statements.</span></div></div></div>`
            : card("Disputes, drafted", `<div class="letter">${esc(dispute(R))}</div>`, { guide: "dispute", foot: `<button class="btn primary" id="dispute">${icon("send")}Send to Ashford and Bluewater</button>` })}
          <div class="stack">${card("Checked and correct", `${R.chargebacks.map(r => `<div class="fix"><span class="chip info plain">Chargeback</span><div><b>${esc(r.p.first)} ${esc(r.p.last)} · ${m2(r.paid)}</b><small>Effective ${esc(r.p.eff)}, disenrolled ${esc(r.p.ended)}, within three months. Ashford's schedule recoups all three months. Taken from ${esc(r.agent.name)}'s payout, not Harborline's override alone.</small></div></div>`).join("")}
            <div class="fix"><span class="chip ok plain">OK</span><div><b>${R.rows.filter(r => r.status === "ok").length} policies paid exactly right</b><small>Rate, months and writing agent all match the book.</small></div></div>`, { guide: "correct" })}</div>
        </div>
      </div>`;
    $("#dispute") && ($("#dispute").onclick = async e => { e.target.disabled = true; e.target.innerHTML = `<span class="g-spin"></span> Sending…`; await UI.sleep(1200); S.disputed = true; toast("Disputes sent to Ashford and Bluewater"); render(); });
  }

  function payouts() {
    const { P, R } = calcC();
    const tot = k => P.reduce((s, x) => s + x[k], 0);
    $("#cBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Received from carriers", m2(tot("received")), "after the chargeback")}
        ${kpi("Paid to agents", m2(tot("share")), "each at their contract level")}
        ${kpi("Harborline keeps", m2(tot("keep")), "override on September's business")}
        ${kpi("Still owed by carriers", m2(tot("pendingAmt")), "agents get their share when it's paid")}
      </div>
      ${card("Agent payouts · September", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Agent</th><th class="num">Level</th><th class="num">Policies paid</th><th class="num">Received</th><th class="num">Agent share</th><th class="num">Harborline keeps</th><th>Notes</th></tr></thead><tbody>
        ${P.map(x => { const notes = [...(x.charge ? [`Chargeback ${m2(x.charge)} (${R.chargebacks.filter(r => r.agent.id === x.a.id).map(r => r.p.id).join(", ")})`] : []),
            ...x.moved.map(r => `Credited ${m2(r.paid)} Bluewater paid under ${r.paidTo.name} (${r.p.id})`), ...(x.pendingAmt ? [`${m2(x.pendingAmt)} owed by Ashford · share paid when it arrives`] : [])];
          return `<tr data-agent="${x.a.id}"><td><div class="cell-2"><b>${esc(x.a.name)}</b><small class="mono">NPN ${x.a.npn}</small></div></td><td class="num">${Math.round(x.a.level * 100)}%</td><td class="num">${x.lines}</td><td class="num">${m2(x.received)}</td><td class="num strong">${m2(x.share)}</td><td class="num">${m2(x.keep)}</td><td style="font-size:12.5px">${notes.map(esc).join("<br>") || '<span class="muted">—</span>'}</td></tr>`; }).join("")}
        </tbody><tfoot><tr><td>Total</td><td></td><td class="num">${tot("lines")}</td><td class="num">${m2(tot("received"))}</td><td class="num">${m2(tot("share"))}</td><td class="num">${m2(tot("keep"))}</td><td></td></tr></tfoot></table></div>`,
        { tight: true, guide: "payouts", sub: "credited to the writing agent in the book, whatever name the carrier used",
          foot: S.approved ? `<span class="chip ok">Approved</span><span class="muted" style="font-size:12.5px;margin-left:10px">Statements go to each agent with Friday's payment.</span>` : `<button class="btn primary" id="approve">${icon("check")}Approve payouts</button><button class="btn" id="dlPay" style="margin-left:8px">${icon("download")}Download CSV</button>` })}`;
    $("#approve") && ($("#approve").onclick = () => { S.approved = true; toast("Payouts approved for Friday"); render(); });
    $("#dlPay") && ($("#dlPay").onclick = () => {
      UI.download("Harborline - agent payouts - 2026-09.csv", UI.toCSV([["Agent", "NPN", "Level", "Policies paid", "Received", "Agent share", "Harborline keeps", "Chargebacks", "Owed by carriers"],
        ...P.map(x => [x.a.name, x.a.npn, x.a.level, x.lines, x.received, x.share, x.keep, x.charge, x.pendingAmt])])); toast("Downloaded");
    });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [["Check a contracting packet against every carrier's rules", 90, 5, 20], ["Fill each carrier's contracting forms from the packet", 25, 3, 80],
      ["Chase a packet a carrier sent back", 40, 0, 12], ["Reconcile a carrier statement against the book", 180, 10, 14],
      ["Work out each agent's payout, chargebacks included", 20, 2, 48], ["Write a commission dispute to a carrier", 30, 3, 6]];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this month", "Minutes by hand against minutes with the desk, times how often it happens.")}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Hours saved a month", Math.round(saved), `about ${(saved / 160).toFixed(1)} of a full-time contracting and commissions person`)}
        ${kpi("Packets sent back", 0, `from ${tasks[2][3]} a month before`)}
        ${kpi("Statements reconciled", tasks[3][3], "every line against the book")}
        ${kpi("Agent payouts", tasks[4][3], "chargebacks on the right agent")}
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times a month</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for an FMO with about 50 agents" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "fm:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, stmts: S.sdocs.length > 0, submitted: S.submitted, disputed: S.disputed, approved: S.approved })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/fmo", p), 400); }
  async function restore(st) {
    Object.assign(S, { submitted: !!st.submitted, disputed: !!st.disputed, approved: !!st.approved });
    if (st.docs) for (const fn of DATA.packet) {
      const doc = await UI.pdfLines(await UI.fetchSample(FA(fn))); const kind = Parsers.classify(fn, doc.lines.join("\n")); const r = Parsers[kind] ? Parsers[kind](doc) : null;
      if (r) S[kind] = r; S.docs.push({ name: fn, kind, fields: r ? r.fields : 0 });
    }
    if (st.stmts) for (const fn of DATA.statements) {
      const f = await UI.fetchSample(FC(fn));
      const s = UI.ext(fn) === "csv" ? Parsers.statementCSV(await f.text(), fn) : Parsers.statementPDF(await UI.pdfLines(f));
      S.stmts[s.carrier] = s; S.sdocs.push({ name: fn, carrier: s.carrier, lines: s.lines.length, total: s.total });
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
    ...DATA.pipeline.map(p => ({ label: p.name, sub: `${p.city} · ${p.stage} · ${p.status}`, href: "#/agents/" + p.id, icon: "user", kind: "Agent" })),
    ...BOOK.agents.map(a => ({ label: a.name, sub: `NPN ${a.npn} · ${a.city} · ${Math.round(a.level * 100)}% level`, href: BC + "/payouts", icon: "dollar", kind: "Writing agent" })),
  ]);

  /* ================= guided demo ================= */
  Guide.init({
    app: "fmo", minutes: 8,
    intro: "A walkthrough of a new agent's contracting packet checked against five carriers, then September's commission statements checked against the book and paid out agent by agent. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What came in overnight", "Contracting board": "What stops agents selling this AEP", "New agent": "One packet, five carriers",
      "Commissions": "Statements against the book", "Payouts": "Each agent paid for what they wrote", "Results": "Hours saved" },
    welcomeTitle: "Welcome to FMO Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of a field marketing organization where the back office is automated: contracting packets checked against every carrier's rules before they're submitted, and carrier commission statements checked against the book and paid out to the right agents.</p><p>It runs on real sample documents: an agent's contracting packet and two carriers' commission statements, one CSV and one PDF. All people, carriers and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">One packet was checked against five carriers and three states, with three problems caught before submission instead of two weeks later. Two statements were checked against the book, turning up $230 owed and a policy paid to the wrong agent, and every agent's payout came out right.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/fmo", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:fmo:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What came in overnight",
        body: "A new agent's packet, a packet a carrier sent back, two commission statements and 14 appointments confirmed, all sorted before anyone logged in.", why: "Two weeks before AEP, contracting and commissions are most of the back office's day." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "A new agent to contract before AEP marketing opens, an agent who can't sell until E&O is renewed, payouts due Friday and an appointment that's running late." },

      { chapter: "Contracting board", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-agent="price"]', 'tr[data-agent="ruiz"]'],
        title: "What stops an agent selling this AEP", body: "Every agent in contracting, sorted by what's blocking them. A packet Ashford sent back over a 2026 AHIP certificate, and an E&O policy that has already expired." },

      { chapter: "New agent", route: BA + "/docs", target: "#aDrop", dropzone: "#aDrop", dropButton: "#aSample", doneWhen: '[data-guide="docs-read"]',
        files: DATA.packet.map((fn, i) => ({ name: ["Contracting intake", "License summary", "E&O certificate", "Training transcript"][i], url: FA(fn), note: ["Five carriers, three states", "TN, GA and FL", "Anchorpoint Professional", "AHIP, AML, annuity"][i] })),
        title: "Renee Castillo's packet", body: "An independent agent in Knoxville asking for five carriers in Tennessee, Georgia and Florida. <b>Drag the four documents onto the drop area.</b>" },
      { chapter: "New agent", route: BA + "/profile", target: '[data-guide="profile"]', block: "start",
        source: { type: "pdf", url: FA(DATA.packet[0]), find: ["19283746", "Ashford Health", "Sterling Annuity", "Clients who winter in Florida"], caption: "Agent intake · Renee Castillo", legend: "<i></i> read into the profile" },
        title: "One packet, read once", body: "NPN, agency, the five carriers and three states, the background answers and direct deposit. Typed once by the agent, never again by anyone at Harborline." },
      { chapter: "New agent", route: BA + "/carriers", target: '[data-guide="matrix"]', block: "start",
        marks: ['[data-req="ashford-ahip"]', '[data-req="sterling-aml"]'],
        source: { type: "pdf", url: FA(DATA.packet[3]), find: ["Plan year 2026", "03/14/2025"], caption: "Training transcript · Renee Castillo", legend: "<i></i> too old for two carriers" },
        title: "Five carriers, checked before anything is sent", body: "Each carrier's rules against the packet, state by state. Ashford needs a 2027 AHIP; Renee's is for 2026. Sterling wants AML within 12 months; Renee's is 18 months old.",
        why: "Submitted as is, three of these come back in two weeks, right as AEP opens." },
      { chapter: "New agent", route: BA + "/carriers", target: '[data-guide="matrix"]', block: "start",
        marks: ['[data-req="bluewater-eo"]', '[data-st="harvest-FL"]'],
        source: { type: "pdf", url: FA(DATA.packet[2]), find: ["10/15/2025 to 10/15/2026", "$1,000,000"], caption: "E&O certificate · Anchorpoint", legend: "<i></i> ends in 29 days" },
        title: "Two dates nobody would check", body: "The E&O policy ends October 15, 29 days out, and Harborline's carriers want at least 30 days left at submission. Florida's license is still pending with the state, so every Florida appointment waits." },
      { chapter: "New agent", route: BA + "/carriers", target: "#submitCarriers", advance: "click", hint: "Click Submit 2 carriers and send Renee the fixes",
        title: "Submit what's ready, ask for the rest", body: "Harvest Life and Clearview can go today in Tennessee and Georgia. The other three wait on three fixes. <b>Submit, and send Renee one message.</b>" },
      { chapter: "New agent", route: BA + "/carriers", target: '[data-guide="sub-ok"]', block: "center", wait: 8000,
        title: "Four appointments today, nothing sent back later", body: "Two carriers submitted for two states. Renee has the three fixes with a link for each, and Florida goes in when the state issues the license." },

      { chapter: "Commissions", route: BC + "/statements", target: "#cDrop", dropzone: "#cDrop", dropButton: "#cSample", doneWhen: '[data-guide="stmts-read"]',
        files: [{ name: "Ashford Health", url: FC(DATA.statements[0]), note: "CSV export · 63 lines" }, { name: "Bluewater Senior", url: FC(DATA.statements[1]), note: "PDF statement · 23 lines" }],
        title: "September's statements", body: "Two carriers, two formats: a CSV export from Ashford and a PDF from Bluewater. <b>Drag both onto the drop area.</b>" },
      { chapter: "Commissions", route: BC + "/recon", target: '[data-guide="bycarrier"]', block: "start",
        marks: ['tr[data-carrier="ashford"]'],
        title: "Every policy against its schedule", body: "Harborline's book says what each carrier owes for every policy: $57.50 a month for a first-year Medicare Advantage enrollment, $28.75 at renewal, 20% or 10% of a supplement premium. Ashford paid $230 less than it owes." },
      { chapter: "Commissions", route: BC + "/recon", target: '[data-guide="exceptions"]', block: "start",
        marks: ['tr[data-pol="BW-2240280"]'],
        source: { type: "csv", url: FC(DATA.statements[0]), caption: "Ashford Health - commission statement - 2026-09.csv", legend: "<i></i> first-year enrollments paid as renewals",
          mark: (i, h, v, row) => ["AH752003230", "AH880770066"].includes(row[3]) && (h === "Comm Type" || h === "Comm Amount" || h === "Eff Date") ? "bad" : "" },
        title: "Where the money went missing", body: "Three September enrollments weren't paid at all. Two first-year enrollments were paid at the renewal rate. And Bluewater paid Alicia Duran's policy under Terrence Hollis's NPN, so Alicia would have gone unpaid for it." },
      { chapter: "Commissions", route: BC + "/recon", target: "#dispute", advance: "click", hint: "Click Send to Ashford and Bluewater",
        title: "Disputes, already written", body: "Policy by policy, with the amounts and the right agent of record. <b>Send them.</b>" },
      { chapter: "Commissions", route: BC + "/recon", target: '[data-guide="disp-ok"]', block: "center", wait: 8000,
        title: "Tracked until it's paid", body: "Both carriers have it in writing, and each item stays open until it shows up on October's statements." },

      { chapter: "Payouts", route: BC + "/payouts", target: '[data-guide="payouts"]', block: "start",
        marks: ['tr[data-agent="hollis"]', 'tr[data-agent="duran"]'],
        title: "Each agent paid for what they wrote", body: "Each agent's share at their contract level. The early-disenrollment chargeback comes out of Terrence's payout. Alicia gets the Bluewater policy paid under Terrence's name. What Ashford still owes is paid out when it arrives." },

      { chapter: "Results", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-agent="castillo"]'],
        title: "Back on the board", body: "Renee is submitted where it's ready, with the fixes asked for, two weeks before AEP marketing opens." },
      { chapter: "Results", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth in a month", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your agency." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Sign out and clear this demo session">Sign out</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/fmo"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/fmo"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    }
  })();
})();
