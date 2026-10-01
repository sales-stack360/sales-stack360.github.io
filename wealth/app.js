/* Wealth Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA), parsers.js (Parsers)
   and plan.js (Plan). */
(() => {
  const { $, $$, esc, money, fdate, daysUntil, icon, toast, route, go, render } = UI;
  const S = { docs: [], brokerage: null, ira: null, k401: null, tax: null, sent: false, who: null };
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const HH = DATA.household, BASE = "#/households/" + HH.id;
  const F = name => "samples/harrow/" + encodeURIComponent(name);
  const m2 = n => n == null ? "—" : money(n, 2);
  const pc = (n, dp = 0) => (n * 100).toFixed(dp) + "%";
  const ready = () => !!(S.brokerage && S.ira && S.k401 && S.tax);
  let memo = null;
  const calc = () => { if (!ready()) return null; const k = [S.brokerage, S.ira, S.k401, S.tax]; if (memo && memo.k.every((x, i) => x === k[i])) return memo.v;
    memo = { k, v: Plan.review(S.brokerage, S.ira, S.k401, S.tax) }; return memo.v; };
  const ACCT = { joint: "Joint brokerage", ira: "Rollover IRA", k401: "401(k)" };

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const dueChip = d => { const n = daysUntil(d); return `<span class="chip ${n <= 3 ? "crit" : n <= 10 ? "warn" : ""} plain">${n < 0 ? -n + " days late" : n === 0 ? "today" : n === 1 ? "tomorrow" : n + " days"}</span>`; };
  const kpi = (l, v, d) => `<div class="card kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
  const gl = n => n == null ? '<span class="muted">—</span>' : `<span style="color:${n < 0 ? "var(--crit)" : "var(--ok)"}">${n < 0 ? "" : "+"}${m2(n)}</span>`;

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/board", "users", "Onboarding", () => DATA.households.filter(h => h.kind === "crit").length, true]]],
    ["The Harrows", [[BASE + "/docs", "upload", "Documents"], [BASE + "/household", "home", "Household"], [BASE + "/holdings", "table", "Holdings & basis"],
      [BASE + "/transition", "scale", "Transition plan"], [BASE + "/import", "send", "Planning import"]]],
    ["Insights", [["#/savings", "clock", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const onboarding = DATA.households.filter(h => h.stage !== "Plan delivered");
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), "Wednesday, September 16 · what came in overnight and what needs you.",
      `<a class="btn" href="#/board">${icon("users")}Onboarding</a><a class="btn primary" href="${BASE}/docs">${icon("home")}Open the Harrows</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi(`${icon("users")} Households onboarding`, onboarding.length, `${onboarding.filter(h => h.stage === "Transfers").length} with transfers in progress`)}
        ${kpi(`${icon("dollar")} Assets coming in`, "$9.4M", "across the five households")}
        ${kpi(`${icon("alert")} Blocking a transfer`, DATA.households.filter(h => h.kind === "crit").length, "a rejected transfer form")}
        ${kpi(`${icon("clock")} Work handled · September ${I("Estimated from how long it takes by hand: about three hours to key a new household's statements and basis into planning software, and an hour to work out a tax-aware transition.")}`, "46 hrs", `<span class="up">+9 hrs</span> vs August`)}
      </div>
      <div class="grid g-main-l">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["The Harrows: follow-up meeting tomorrow", "Four documents to read before the plan conversation.", "2026-09-17", BASE + "/docs"],
          ["Fuentes: transfer rejected", "Corrected form drafted. Needs Maria's signature.", "2026-09-15", "#/board"],
          ["Gail Prentiss: 2025 tax return", "Asked twice. The plan can't be finished without it.", "2026-09-19", "#/board"],
          ["Delacroix: IRA beneficiary form", "Sent three weeks ago, not signed.", "2026-09-25", "#/board"],
        ].map(([t, w, d, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${esc(t)}</b><p>${w}</p></div>${dueChip(d)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= onboarding board ================= */
  const board = () => {
    const c = calc();
    const rows = DATA.households.map(h => h.id === HH.id && c ? { ...h, assets: money(c.total / 1e6, 2).replace(/$/, "M"), stage: "Planning", status: S.sent ? "In the planning software · meeting tomorrow" : `${c.flags.length} findings · ready for planning`, kind: S.sent ? "ok" : "info" } : h);
    const ord = { crit: 0, warn: 1, info: 2, ok: 3 };
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Household</th><th class="num">Assets</th><th>Stage</th><th>Status</th></tr></thead><tbody>
      ${rows.sort((a, b) => ord[a.kind] - ord[b.kind] || a.name.localeCompare(b.name)).map(h => `<tr class="click ${h.kind === "crit" ? "bad" : ""}" data-hh="${h.id}" onclick="location.hash='#/households/${h.id}'"><td><div class="cell-2"><b>${esc(h.name)}</b><small>${esc(h.city)}</small></div></td>
        <td class="num">${esc(h.assets)}</td><td>${esc(h.stage)}</td><td><span class="chip ${h.kind}">${esc(h.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
  };
  route("/board", () => setPage([["Onboarding"]], `${head("Onboarding", "Every household coming in, sorted by what's holding up their money.")}${card("Households", board(), { tight: true, guide: "board", sub: `${DATA.households.length} households` })}`));

  route("/households/:id", ({ id }) => id === HH.id ? go(BASE + "/" + (ready() ? "household" : "docs")) : other(id));
  route("/households/" + HH.id + "/:tab", ({ tab }) => hhView(tab));
  function other(id) {
    const h = DATA.households.find(x => x.id === id); if (!h) return go("#/board");
    setPage([["Onboarding", "#/board"], [h.name]], `${head(esc(h.name), `${esc(h.city)} · ${esc(h.assets)} · ${esc(h.stage)}`)}
      <div class="card"><div class="empty">${icon("home")}<p>The full onboarding workflow is set up on <b>the Harrows</b> for this walkthrough.</p><a class="btn primary" href="${BASE}/docs">Open the Harrows</a></div></div>`);
  }

  /* ================= the Harrows ================= */
  function hhView(tab) {
    const c = calc();
    const tabs = [["docs", "Documents"], ["household", "Household"], ["holdings", "Holdings & basis"], ["transition", "Transition plan"], ["import", "Planning import"]];
    setPage([["Onboarding", "#/board"], [HH.name]], `${head(esc(HH.name), `${esc(HH.city)} · prospective clients · follow-up meeting Thursday, September 17`,
      c ? `<span class="chip ${S.sent ? "ok" : "info"}">${S.sent ? "In the planning software" : money(c.total) + " across 3 accounts"}</span>` : `<span class="chip plain">4 documents in</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BASE}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}</a>`).join("")}</div>
      ${!c ? next("Start", "<b>Load what the Harrows sent.</b> Two custodians' statements, the 401(k) statement and last year's tax return.") : ({
        docs: next("Step 1 of 5", "<b>Everything read.</b> Next, the household on one page.", `<a class="btn sm primary" href="${BASE}/household">${icon("arrow")}Household</a>`),
        household: next("Step 2 of 5", "<b>Three custodians, one balance sheet.</b> Next, every holding with its basis.", `<a class="btn sm primary" href="${BASE}/holdings">${icon("table")}Holdings & basis</a>`),
        holdings: next("Step 3 of 5", "<b>Basis by lot, and the lots with none.</b> Next, a way out of the company stock.", `<a class="btn sm primary" href="${BASE}/transition">${icon("scale")}Transition plan</a>`),
        transition: next("Step 4 of 5", "<b>Diversify without a tax bill.</b> Then into the planning software.", `<a class="btn sm primary" href="${BASE}/import">${icon("send")}Planning import</a>`),
        import: next("Step 5 of 5", `<b>${S.sent ? "In the planning software, a day before the meeting." : "One import, nothing retyped."}</b>`, "", S.sent) }[tab] || "")}
      <div id="hBody"></div>`);
    if (tab !== "docs" && !c) { $("#hBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing read yet.</b></p><p>Drop the Harrows' documents and every other tab fills itself.</p><a class="btn primary" href="${BASE}/docs">Go to documents</a></div></div>`; return; }
    ({ docs, household, holdings, transition, import: importView }[tab] || docs)();
  }

  /* ---------- 1. documents ---------- */
  function docs() {
    const KIND = { brokerage: "Brokerage statement", ira: "IRA statement", k401: "401(k) statement", tax: "Tax return summary" };
    $("#hBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="dDrop"><div class="ic">${icon("upload")}</div><b>Drop what the household sent</b><div class="hint">Brokerage, IRA and 401(k) statements from any custodian, and tax returns. PDF.</div>
        <div style="margin-top:14px"><button class="btn primary" id="dSample">${icon("file")}Load the Harrows' documents</button></div></div><div id="dRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Documents read", S.docs.map(d => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${d.fields} values read` : "This demo reads brokerage, IRA and 401(k) statements and tax return summaries"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: ready() ? `<a class="btn primary" href="${BASE}/household">${icon("arrow")}See the household</a>` : `<span class="muted" style="font-size:12.5px">Add the brokerage, IRA and 401(k) statements and the tax return.</span>` }) : ""}
    </div>
    <div class="stack">${card("What gets pulled out", `<div class="steps">${["Every account, owner and value, whatever the custodian", "Every holding, and cost basis lot by lot", "Company stock basis inside the 401(k)", "Beneficiaries on file", "Income, taxable income and loss carryovers from the return"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}</div>
    </div>`;
    const handle = async files => {
      const B = { brokerage: S.brokerage, ira: S.ira, k401: S.k401, tax: S.tax, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", fields = 0;
        if (UI.ext(f.name) === "pdf") { const doc = await UI.pdfLines(f); kind = Parsers.classify(doc.lines.join("\n"));
          const r = Parsers[kind] && kind !== "unknown" ? Parsers[kind](doc) : null; if (r && r.fields) { B[kind] = r; fields = r.fields; } else kind = "unknown"; }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, fields }]);
        return { detail: kind === "unknown" ? "not recognized" : `${fields} values` };
      }]);
      steps.push(["Putting three custodians on one balance sheet", async () => { Object.assign(S, B); memo = null; const c = calc(); return { detail: c ? `${money(c.total)} · ${c.P.length} holdings` : "" }; }]);
      steps.push(["Checking basis, beneficiaries and the tax return", async () => { const c = calc(); return { detail: c ? `${c.flags.length} findings` : "" }; }]);
      await UI.runSteps($("#dRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Brokerage, IRA and 401(k) statements and tax return summaries are read.`, "warn");
      if (ready()) toast("Household built · holdings, basis and tax read"); else if (!unk) toast("Add the rest of the documents to build the household", "warn");
      render();
    };
    UI.dropzone($("#dDrop"), handle, { accept: ".pdf" });
    $("#dSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.packet.map(fn => UI.fetchSample(F(fn))))); };
  }

  /* ---------- 2. household ---------- */
  function household() {
    const c = calc(), X = S.tax, a = c.alloc;
    $("#hBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Household assets", money(c.total), "across three accounts")}
        ${kpi("Custodians", c.A.length, c.A.map(x => x.custodian.replace(/ (Securities|Retirement Services|Components 401\(k\) Plan)$/, "")).join(", "))}
        ${kpi(`${HH.employer} stock`, pc(c.employer / c.total), `${money(c.employer)}, two accounts`)}
        ${kpi("Cash and stable value", pc(a.pct("cash")), money(a.cash))}
      </div>
      <div class="grid g-main-l"><div class="stack">
        ${card("Accounts", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Account</th><th>Custodian</th><th>Owner</th><th>Tax</th><th class="num">Value</th><th>As of</th></tr></thead><tbody>
          ${c.A.map(x => `<tr data-acct="${x.id}"><td><b>${esc(x.name)}</b><div class="muted mono" style="font-size:12px">${esc(x.number)}</div></td><td>${esc(x.custodian)}</td><td>${esc(x.owner)}</td><td>${x.tax}</td><td class="num">${m2(x.value)}</td><td>${esc(x.asOf)}</td></tr>`).join("")}
          <tr class="sub"><td colspan="4"><b>Household</b></td><td class="num"><b>${m2(c.total)}</b></td><td></td></tr></tbody></table></div>`, { tight: true, guide: "accounts" })}
        <div class="grid g2">${card("Allocation", `<div class="alloc"><i class="s" style="width:${a.pct("stock") * 100}%"></i><i class="b" style="width:${a.pct("bond") * 100}%"></i><i class="c" style="width:${a.pct("cash") * 100}%"></i></div>
          <div class="legend"><span class="s">Stocks ${pc(a.pct("stock"))}</span><span class="b">Bonds ${pc(a.pct("bond"))}</span><span class="c">Cash ${pc(a.pct("cash"))}</span></div>
          <p class="note" style="margin-top:10px">${pc(c.employer / a.stock)} of the stocks are one company.</p>`, { guide: "alloc" })}${card("From the discovery meeting", `<p class="note">${esc(HH.notes)}</p>`)}</div>
        ${card(`From the ${X.year} return`, `<dl class="kv"><dt>Filing status</dt><dd>${esc(X.status)}</dd><dt>Wages</dt><dd>${m2(X.wages)}</dd><dt>Dividends</dt><dd>${m2(X.dividends)}, ${m2(X.qualified)} qualified</dd>
          <dt>Adjusted gross income</dt><dd>${m2(X.agi)}</dd><dt>Taxable income</dt><dd>${m2(X.taxable)}</dd><dt>${T("Bracket", `${DATA.brackets.year} brackets, ${DATA.brackets.status.toLowerCase()}`)}</dt><dd>${pc(c.T.rate)}, with ${money(c.T.room)} of room before ${pc(DATA.brackets.rows.find(r => r[0] > c.T.top)[1])}</dd>
          <dt>Capital loss carryover</dt><dd><b>${m2(X.carryover)}</b> into ${X.year + 1}</dd></dl>`, { guide: "tax" })}
      </div>
      <div class="stack">
        ${card("What the documents say that nobody asked about", `${c.flags.map(f => `<div class="list-item" data-flag="${f.id}"><div class="li-ic ${f.kind}">${icon(f.kind === "crit" ? "alert" : f.kind === "warn" ? "bell" : "spark")}</div><div class="li-b"><b>${esc(f.title)}</b><p>${esc(f.body)}</p></div></div>`).join("")}`, { tight: true, guide: "flags", sub: `${c.flags.length} findings for tomorrow's meeting` })}
      </div></div>`;
  }

  /* ---------- 3. holdings and basis ---------- */
  function holdings() {
    const c = calc(), B = S.brokerage;
    const brcx = c.P.find(p => p.lots);
    const rows = Object.keys(ACCT).map(id => {
      const ps = c.P.filter(p => p.account === id), acct = c.A.find(a => a.id === id);
      return `<tr class="grp"><td colspan="7">${esc(acct.name)} · ${esc(acct.custodian)} · ${acct.tax}</td></tr>` + ps.map(p => `<tr data-pos="${UI.slug(p.key)}"><td><div class="cell-2"><b>${esc(p.symbol !== "—" ? p.symbol : p.name)}</b>${p.symbol !== "—" ? `<small>${esc(p.name)}</small>` : ""}</div></td>
        <td class="num">${p.qty != null ? p.qty.toLocaleString("en-US", { maximumFractionDigits: 3 }) : ""}</td><td class="num">${p.price != null ? m2(p.price) : ""}</td><td class="num">${m2(p.value)}</td>
        <td class="num">${p.pretax ? (p.basis != null ? `${m2(p.basis)} <span class="chip info plain">for NUA</span>` : '<span class="muted">pre-tax</span>') : p.lots ? `${m2(p.basis)} <span class="chip warn plain">${p.missing.toLocaleString()} sh. none</span>` : m2(p.basis)}</td>
        <td class="num">${p.lots ? '<span class="muted">by lot</span>' : p.pretax ? "" : gl(p.gl)}</td><td class="num">${pc(p.value / c.total, 1)}</td></tr>`).join("");
    }).join("");
    $("#hBody").innerHTML = `<div class="stack">
      ${card("Every holding", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Holding</th><th class="num">Quantity</th><th class="num">Price</th><th class="num">Value</th><th class="num">Cost basis</th><th class="num">Gain or loss</th><th class="num">Of household</th></tr></thead><tbody>${rows}</tbody></table></div>`,
        { tight: true, guide: "positions", sub: "three statements, three layouts, one table" })}
      ${card(`${brcx.symbol} lot by lot · joint account`, `<div class="tbl-wrap"><table class="t"><thead><tr><th>Bought</th><th class="num">Shares</th><th class="num">Cost per share</th><th class="num">Cost basis</th><th class="num">Value</th><th class="num">Gain or loss</th><th></th></tr></thead><tbody>
        ${B.lots.map(l => `<tr data-lot="${l.acquired.replace(/\//g, "-")}" class="${l.covered ? "" : "bad"}"><td>${esc(l.acquired)}</td><td class="num">${l.qty.toLocaleString()}</td><td class="num">${l.covered ? m2(l.cps) : "—"}</td><td class="num">${l.covered ? m2(l.basis) : "—"}</td><td class="num">${m2(l.value)}</td><td class="num">${l.covered ? gl(l.gl) : "—"}</td>
          <td>${l.covered ? (l.gl < 0 ? '<span class="chip info plain">Loss to harvest</span>' : "") : '<span class="chip crit plain">No basis on file</span>'}</td></tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "lots", sub: `${brcx.missing.toLocaleString()} of ${brcx.qty.toLocaleString()} shares, ${money(c.noncovered.reduce((s, l) => s + l.value, 0))}, were bought before 2011 and have no basis reported`,
          foot: `<span class="muted" style="font-size:12.5px">Ask Robert for the purchase records, or Blue Ridge's stock plan statements from 2009 and 2010. Until then those lots stay out of any sale.</span>` })}
    </div>`;
  }

  /* ---------- 4. transition plan ---------- */
  function transition() {
    const c = calc(), TR = c.TR, X = S.tax, brcx = S.brokerage.holdings.find(h => h.symbol === S.brokerage.lotSymbol);
    $("#hBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Sold from the joint account", money(TR.proceeds), `three funds at a loss and ${TR.soldShares.toLocaleString()} ${brcx.symbol} shares`)}
        ${kpi(T("Net capital gain", "Gains realized, less the losses harvested, less the carryover from the return"), money(TR.taxable), `${money(-TR.losses)} of losses and ${money(TR.carryUsed)} of the carryover used`)}
        ${kpi(`${brcx.symbol} in the joint account`, `${pc(TR.before)} → ${pc(TR.after)}`, `${TR.keptShares.toLocaleString()} shares kept, ${S.brokerage.lots.filter(l => !l.covered).reduce((s, l) => s + l.qty, 0).toLocaleString()} of them waiting on basis`)}
        ${kpi("Ready to invest", money(TR.toInvest), `the sales plus ${money(S.brokerage.cash)} of cash`)}
      </div>
      <div class="stack">
        ${card("Trade list", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Sell</th><th class="num">Shares</th><th class="num">Proceeds</th><th class="num">Gain or loss</th><th>Why</th></tr></thead><tbody>
          ${TR.all.map(x => `<tr data-trade="${UI.slug(x.name)}"><td><b>${esc(x.kind === "fund" ? x.symbol : x.name)}</b>${x.kind === "fund" ? `<div class="muted" style="font-size:12px">${esc(x.name)}</div>` : ""}</td><td class="num">${x.qty.toLocaleString()}${x.of && x.of !== x.qty ? ` of ${x.of.toLocaleString()}` : ""}</td><td class="num">${m2(x.value)}</td><td class="num">${gl(x.gl)}</td>
            <td style="font-size:12.5px">${x.gl < 0 ? "A loss to offset the gains below" : x.of && x.of !== x.qty ? "Only as many shares as the losses and carryover cover" : "Highest cost basis first, so the least gain per share"}</td></tr>`).join("")}
          <tr class="sub"><td colspan="3"><b>Gains ${m2(TR.gains)} · losses ${m2(TR.losses)} · carryover ${m2(-TR.carryUsed)}</b></td><td class="num"><b>${m2(TR.taxable)}</b></td><td style="font-size:12.5px"><b>Net gain to report</b></td></tr>
          </tbody></table></div>`, { tight: true, guide: "trades", sub: "harvest the losses first, then sell company stock up to what they and the carryover cover" })}
        <div class="grid g-main-l">
          ${card("Left out on purpose", `<div class="list-item" data-later="basis"><div class="li-ic warn">${icon("file")}</div><div class="li-b"><b>${S.brokerage.lots.filter(l => !l.covered).reduce((s, l) => s + l.qty, 0).toLocaleString()} ${brcx.symbol} shares with no basis</b><p>Sold without records, the whole ${money(c.noncovered.reduce((s, l) => s + l.value, 0))} could be treated as gain. Next year's sale, once the records are found.</p></div></div>
            <div class="list-item" data-later="nua"><div class="li-ic crit">${icon("alert")}</div><div class="li-b"><b>The 401(k) company stock</b><p>${money(c.nua)} of growth over a ${money(S.k401.stockBasis)} basis. Decide on net unrealized appreciation before Robert's rollover in January, not after.</p></div></div>
            <div class="list-item"><div class="li-ic ok">${icon("check")}</div><div class="li-b"><b>TMIX and DGRX</b><p>Both have gains and both fit the model. They move across in kind, untouched.</p></div></div>`, { tight: true, guide: "later" })}
          <div class="stack">${card("The arithmetic", `<dl class="kv"><dt>Losses harvested</dt><dd>${m2(-TR.losses)}</dd><dt>Carryover on the ${X.year} return</dt><dd>${m2(X.carryover)}</dd><dt>Gains they can absorb</dt><dd><b>${m2(TR.offset)}</b></dd><dt>Gains taken</dt><dd>${m2(TR.gains)}</dd><dt>Carryover left</dt><dd>${m2(TR.carryLeft)}</dd></dl>`)}</div>
        </div>
      </div>`;
  }

  /* ---------- 5. planning import ---------- */
  function importView() {
    const c = calc(), rows = Plan.importRows(c, S.brokerage, S.ira, S.k401, S.tax);
    const n = t => rows.filter(r => r[0].startsWith(t)).length;
    $("#hBody").innerHTML = `<div class="stack">
      ${card("Import file for the planning software", `<div class="tbl-wrap" style="max-height:420px;overflow:auto"><table class="t"><thead><tr>${rows[0].map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>
        ${rows.slice(1).map(r => `<tr>${r.map((v, i) => `<td class="${i >= 6 && i <= 9 ? "num" : ""}">${typeof v === "number" ? (i === 6 ? v.toLocaleString("en-US", { maximumFractionDigits: 3 }) : m2(v)) : esc(v)}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>`, { tight: true, guide: "import", sub: `${n("Account")} accounts · ${n("Holding")} holdings and lots · ${n("Tax")} tax figures · the retirement date`,
        foot: S.sent ? `<div data-guide="plan-ok" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ok">Imported</span><span class="muted" style="font-size:13px">In the planning software with basis on every lot that has one, the ${S.tax.year} return and Robert's retirement date. ${esc(DATA.users[1].name)} has the draft plan to build before tomorrow's meeting.</span></div>`
          : `<button class="btn primary" id="sendPlan">${icon("send")}Send to planning software</button><button class="btn" id="dlPlan" style="margin-left:8px">${icon("download")}Download CSV</button>` })}
    </div>`;
    $("#sendPlan") && ($("#sendPlan").onclick = async e => { e.target.disabled = true; e.target.innerHTML = `<span class="g-spin"></span> Sending…`; await UI.sleep(1200); S.sent = true; toast("The Harrows are in the planning software"); render(); });
    $("#dlPlan") && ($("#dlPlan").onclick = () => { UI.download("Harrow household - planning import.csv", UI.toCSV(rows)); toast("Downloaded"); });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [["Key a new household's statements into planning software", 150, 5, 6], ["Pull cost basis lot by lot from statements", 45, 2, 6],
      ["Read a tax return for what the plan needs", 30, 2, 10], ["Work out a tax-aware transition for a taxable account", 60, 5, 5],
      ["Check beneficiaries and account titling", 20, 1, 10], ["Update holdings for quarterly reviews", 40, 3, 30]];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this month", "Minutes by hand against minutes with the desk, times how often it happens.")}
      <div class="grid g4" style="margin-bottom:16px">
        ${kpi("Hours saved a month", Math.round(saved), `about ${(saved / 160).toFixed(1)} of a full-time paraplanner`)}
        ${kpi("New households", tasks[0][3], "in the planning software the day documents arrive")}
        ${kpi("Lots with basis", "Every one", "that the statement reports")}
        ${kpi("Quarterly reviews", tasks[5][3], "holdings updated without retyping")}
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times a month</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for a firm adding six households a month" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "wd:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, sent: S.sent })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/wealth", p), 400); }
  async function restore(st) {
    S.sent = !!st.sent;
    if (st.docs) for (const fn of DATA.packet) {
      const doc = await UI.pdfLines(await UI.fetchSample(F(fn))); const kind = Parsers.classify(doc.lines.join("\n")); const r = Parsers[kind] ? Parsers[kind](doc) : null;
      if (r) S[kind] = r; S.docs.push({ name: fn, kind, fields: r ? r.fields : 0 });
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
    ...DATA.households.map(h => ({ label: h.name, sub: `${h.city} · ${h.assets} · ${h.status}`, href: "#/households/" + h.id, icon: "home", kind: "Household" })),
  ]);

  /* ================= guided demo ================= */
  const P0 = F(DATA.packet[0]), P1 = F(DATA.packet[1]), P2 = F(DATA.packet[2]), P3 = F(DATA.packet[3]);
  Guide.init({
    app: "wealth", minutes: 7,
    intro: "A walkthrough of one prospective household, from the statements they sent to an import for the planning software, then every household coming in on one board. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What came in overnight", "Onboarding": "What's holding up the money", "The household": "Three custodians, one balance sheet",
      "Basis and tax": "Lots, basis and the return", "Transition": "Out of the company stock, no tax bill", "Planning": "Into the planning software", "Results": "Hours saved" },
    welcomeTitle: "Welcome to Wealth Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of an advisory firm where onboarding is automated: statements from any custodian and the client's tax return read into one household, cost basis kept lot by lot, a tax-aware transition worked out and everything sent to the planning software.</p><p>It runs on real sample documents: a brokerage statement, an IRA statement, a 401(k) statement and a tax return summary. All people, custodians, securities and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">Four documents became one household. Company stock worth 31% of everything, $133,888 of 401(k) growth that could be taxed as capital gains, 2,000 shares with no basis and an IRA with no beneficiary were all found. The plan takes the company stock from 35% to 22% of the account with no net gain to report.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/wealth", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:wealth:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What came in overnight",
        body: "A new household's documents, a rejected transfer caught, three households loaded into the planning software and eleven quarterly reviews prepared.", why: "Keying statements is where a paraplanner's week goes." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "A follow-up meeting tomorrow, a transfer form to re-sign, a tax return that hasn't arrived and a beneficiary form nobody signed." },

      { chapter: "Onboarding", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-hh="fuentes"]', 'tr[data-hh="prentiss"]', 'tr[data-hh="delacroix"]'],
        title: "What's holding up the money", body: "Every household coming in, sorted by what's stopping their assets from moving. A rejected transfer sits at the top, not in someone's inbox." },

      { chapter: "The household", route: BASE + "/docs", target: "#dDrop", dropzone: "#dDrop", dropButton: "#dSample", doneWhen: '[data-guide="docs-read"]',
        files: [{ name: "Joint brokerage", url: P0, note: "Keel Harbor · with lot detail" }, { name: "Rollover IRA", url: P1, note: "Northgate Retirement" }, { name: "401(k)", url: P2, note: "Blue Ridge Components plan" }, { name: "2025 tax return", url: P3, note: "Summary from their CPA" }],
        title: "The Harrows, a day before the follow-up", body: "Robert retires from Blue Ridge Components at year end. The Harrows sent what they had: two custodians' statements, the 401(k) statement and last year's return. <b>Drag them onto the drop area.</b>" },
      { chapter: "The household", route: BASE + "/household", target: '[data-guide="accounts"]', block: "start",
        source: { type: "pdf", url: P0, find: ["KH-4471-2290", "$1,099,008.62"], caption: "Keel Harbor Securities · joint account", legend: "<i></i> read into the balance sheet" },
        title: "Three custodians, one balance sheet", body: "The joint brokerage account, Robert's rollover IRA and his 401(k), each in its own custodian's layout, now on one page: $1.8 million." },
      { chapter: "The household", route: BASE + "/household", target: '[data-guide="flags"]', place: "left",
        marks: ['[data-flag="concentration"]', '[data-flag="nua"]'],
        source: { type: "pdf", url: P2, find: ["Blue Ridge Components Stock Fund", "$41,200.00"], caption: "Blue Ridge Components 401(k) · Q2 2026", legend: "<i></i> company stock and its basis" },
        title: "31% of everything is one company", body: "Company stock in the joint account and inside the 401(k), from the company Robert is retiring from. The 401(k) shows the stock's cost basis: $41,200 against $175,088. That's $133,888 that could be taxed as capital gains instead of income, if nobody rolls it into an IRA first.",
        why: "Once the rollover is signed, that choice is gone." },
      { chapter: "The household", route: BASE + "/household", target: '[data-guide="flags"]', place: "left",
        marks: ['[data-flag="beneficiary"]', '[data-flag="cash"]'],
        source: { type: "pdf", url: P1, find: ["None on file"], caption: "Northgate Retirement · rollover IRA", legend: "<i></i> no beneficiary" },
        title: "No beneficiary, and $182,450 in cash", body: "The IRA has no beneficiary on file, primary or contingent. The brokerage account has $182,450 in a sweep earning 0.01%. Neither was on the list of things the Harrows mentioned." },

      { chapter: "Basis and tax", route: BASE + "/holdings", target: '[data-guide="lots"]', block: "center",
        marks: ['tr[data-lot="03-15-2009"]', 'tr[data-lot="06-30-2010"]'],
        source: { type: "pdf", url: P0, find: ["Not reported", "03/15/2009", "06/30/2010"], caption: "Keel Harbor · BRCX lot detail", legend: "<i></i> no basis reported" },
        title: "Basis by lot, and the lots with none", body: "Five lots of Blue Ridge stock. The two bought in 2009 and 2010 predate basis reporting, so the statement has nothing. Sold without records, all $224,800 could be taxed as gain. They're flagged, not guessed." },
      { chapter: "Basis and tax", route: BASE + "/household", target: '[data-guide="tax"]', place: "right",
        source: { type: "pdf", url: P3, find: ["$176,550.00", "$14,200.00"], caption: "2025 tax return summary", legend: "<i></i> what the plan needs" },
        title: "The return, read for the plan", body: "Taxable income of $176,550 leaves $30,150 before the 24% bracket. And a $14,200 capital loss carryover that nobody would think to use unless it was on the same page as the holdings." },

      { chapter: "Transition", route: BASE + "/transition", target: '[data-guide="trades"]', block: "start",
        title: "Out of the company stock, with no gain to report", body: "Sell the three funds sitting at a loss and the one Blue Ridge lot that's down. Add the carryover. That covers $30,190 of gains, so sell Blue Ridge's highest-basis lots up to exactly that. 1,253 shares go, the stock falls from 35% to 22% of the account, and the net gain is zero." },
      { chapter: "Transition", route: BASE + "/transition", target: '[data-guide="later"]', place: "right",
        title: "Left out on purpose", body: "The shares with no basis wait for records. The 401(k) stock waits for the net unrealized appreciation decision. The two funds with gains move across untouched." },

      { chapter: "Planning", route: BASE + "/import", target: '[data-guide="import"]', block: "start",
        title: "One import, nothing retyped", body: "Accounts, every holding and every lot with its basis, the tax figures and Robert's retirement date, in the planning software's import layout." },
      { chapter: "Planning", route: BASE + "/import", target: "#sendPlan", advance: "click", hint: "Click Send to planning software",
        title: "Send it", body: "<b>Send it to the planning software</b>, and the paraplanner builds the plan from the real numbers today." },
      { chapter: "Planning", route: BASE + "/import", target: '[data-guide="plan-ok"]', block: "center", wait: 8000,
        title: "Ready a day before the meeting", body: "The Harrows are in the planning software, with the findings to walk through tomorrow." },

      { chapter: "Results", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-hh="harrow"]'],
        title: "Back on the board", body: "The Harrows move to planning, with every finding ready for tomorrow's conversation." },
      { chapter: "Results", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth in a month", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your firm." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Sign out and clear this demo session">Sign out</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/wealth"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/wealth"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    }
  })();
})();
