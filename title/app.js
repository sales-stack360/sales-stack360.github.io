/* Title Desk: screens. Depends on shared/core.js (UI), shared/guide.js (Guide), data.js (DATA),
   parsers.js (Parsers) and closing.js (Closing). */
(() => {
  const { $, $$, esc, money, fdate, daysUntil, icon, toast, route, go, render } = UI;
  const S = { docs: [], search: null, payoff: null, lender: null, helocAsked: false, heloc: null, who: null };
  const HELOC_PAYOFF = 18420.66;
  const view = () => $("#view");
  const T = UI.tip, I = UI.info;
  const MR = "maple-ridge", BASE = "#/files/" + MR;
  const F = name => "samples/maple-ridge/" + encodeURIComponent(name);
  const FILE = id => DATA.files.find(f => f.id === id);
  const m2 = n => n == null ? "—" : money(n, 2);

  function setPage(crumbs, html) {
    $("#crumbs").innerHTML = crumbs.map((c, i) => i === crumbs.length - 1 ? `<b>${esc(c[0])}</b>` : `<a href="${c[1]}">${esc(c[0])}</a><span>/</span>`).join(" ");
    view().innerHTML = html;
  }
  const head = (title, sub, actions = "") => `<div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div><div class="actions">${actions}</div></div>`;
  const card = (title, body, { sub = "", actions = "", tight = false, foot = "", guide = "" } = {}) =>
    `<div class="card" ${guide ? `data-guide="${guide}"` : ""}><div class="card-h"><h3>${title}</h3>${sub ? `<span class="sub">${sub}</span>` : ""}<div class="actions">${actions}</div></div><div class="card-b ${tight ? "tight" : ""}">${body}</div>${foot ? `<div class="card-f">${foot}</div>` : ""}</div>`;
  const next = (step, text, btn = "", done = false) => `<div class="next ${done ? "done" : ""}"><span class="n-step">${step}</span><span class="n-text">${text}</span>${btn}</div>`;
  const daysChip = d => { const n = daysUntil(d); return `<span class="chip ${n < 0 ? "" : n <= 3 ? "crit" : n <= 10 ? "warn" : ""} plain">${n < 0 ? "closed" : n + " days"}</span>`; };
  const ready = () => !!(S.search && S.payoff && S.lender);
  const commit = () => ready() ? Closing.commitment(S.search, S.lender) : null;
  const ss = () => ready() ? Closing.settlement(S.search, S.payoff, S.lender, S.heloc) : null;
  const clear = () => ready() && S.heloc != null;

  const NAV = [
    ["Workspace", [["#/home", "home", "Home"], ["#/board", "layers", "Open files", () => DATA.files.filter(f => f.kind === "crit").length, true]]],
    ["1418 Maple Ridge Dr", [[BASE + "/docs", "file", "Documents"], [BASE + "/summary", "building", "File summary"], [BASE + "/commitment", "shield", "Commitment"],
      [BASE + "/settlement", "dollar", "Settlement statement"], [BASE + "/clear", "check", "Clear to close"]]],
    ["Insights", [["#/savings", "chart", "Time saved"]]],
  ];

  /* ================= home ================= */
  route("/home", () => {
    const open = DATA.files.filter(f => daysUntil(f.close) >= 0);
    setPage([["Home"]], `${head("Good morning, " + esc(S.who.name.split(" ")[0]), "Wednesday, September 16 · what the desk drafted overnight and what needs you.",
      `<a class="btn" href="#/board">${icon("layers")}Open files</a><a class="btn primary" href="${BASE}/docs">${icon("building")}Open 1418 Maple Ridge Dr</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">${icon("layers")} Open files</div><div class="v">${open.length}</div><div class="d">${money(open.reduce((s, f) => s + f.amount, 0))} in transactions</div></div>
        <div class="card kpi"><div class="l">${icon("calendar")} Closing in 10 days</div><div class="v">${open.filter(f => daysUntil(f.close) <= 10).length}</div><div class="d">2 not yet clear to close</div></div>
        <div class="card kpi"><div class="l">${icon("alert")} Blocking a closing</div><div class="v">2</div><div class="d">an expired payoff, a judgment on a seller</div></div>
        <div class="card kpi"><div class="l">${icon("clock")} Drafting handled · September ${I("Estimated from how long it takes by hand: about 45 minutes to draft a commitment from a search and 40 to build a settlement statement.")}</div><div class="v">52 hrs</div><div class="d"><span class="up">+17 hrs</span> vs August</div></div>
      </div>
      <div class="grid g-main-l">
        ${card("Handled automatically", DATA.activity.map(a => `<a class="list-item" href="${a.link}" style="text-decoration:none;color:inherit"><div class="li-ic ${a.kind}">${icon(a.icon)}</div><div class="li-b"><b>${a.title}</b><p>${a.body}</p></div><div class="li-t">${a.t}</div></a>`).join(""), { tight: true, sub: "since 6:00 PM yesterday", guide: "activity" })}
        ${card("Needs a decision", [
          ["1418 Maple Ridge Dr: a second lien nobody mentioned", "The sellers disclosed one mortgage. The search found two.", "2026-10-09", BASE + "/commitment"],
          ["77 Stonegate Ln: payoff ran out before closing", "Updated payoff requested. Closing Friday.", "2026-09-18", "#/board"],
          ["910 Harbor Way: judgment against the seller", "Pay from proceeds, or have it released first", "2026-09-25", "#/board"],
          ["15 Orchard Pl: fence over the property line", "Add a survey exception, or ask the neighbor for an agreement", "2026-10-02", "#/board"],
        ].map(([t, w, d, l]) => `<a class="list-item" href="${l}" style="text-decoration:none;color:inherit"><div class="li-b"><b>${t}</b><p>${w}</p></div>${daysChip(d)}</a>`).join(""), { tight: true, guide: "tasks" })}
      </div>`);
  });

  /* ================= open files ================= */
  const board = () => {
    const rows = DATA.files.map(f => f.id === MR && ready() ? { ...f, status: clear() ? "Clear to close" : S.helocAsked ? "Waiting on second lien payoff" : "Commitment drafted", kind: clear() ? "ok" : "warn" } : f);
    const ord = { crit: 0, warn: 1, info: 2, ok: 3 };
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Property</th><th>Type</th><th>Parties</th><th class="num">Amount</th><th>Closing</th><th>Status</th></tr></thead><tbody>
      ${rows.sort((a, b) => ord[a.kind] - ord[b.kind] || a.close.localeCompare(b.close)).map(f => `<tr class="click ${f.kind === "crit" ? "bad" : ""}" data-file="${f.id}" onclick="location.hash='#/files/${f.id}'"><td><div class="cell-2"><b>${esc(f.addr)}</b><small>${esc(f.city)}, IN</small></div></td>
        <td>${esc(f.type)}</td><td>${esc(f.parties)}</td><td class="num">${money(f.amount)}</td><td class="nowrap">${fdate(f.close)} ${daysChip(f.close)}</td><td><span class="chip ${f.kind}">${esc(f.status)}</span></td></tr>`).join("")}</tbody></table></div>`;
  };
  route("/board", () => setPage([["Open files"]], `${head("Open files", "Every file in progress. What's blocking a closing sits at the top.")}${card("Files", board(), { tight: true, guide: "board", sub: `${DATA.files.length} files` })}`));

  route("/files/:id", ({ id }) => id === MR ? go(BASE + "/" + (ready() ? "summary" : "docs")) : other(id));
  route("/files/" + MR + "/:tab", ({ tab }) => fileView(tab));
  function other(id) {
    const f = FILE(id); if (!f) return go("#/board");
    setPage([["Open files", "#/board"], [f.addr]], `${head(esc(f.addr), `${esc(f.type)} · ${esc(f.parties)} · closing ${fdate(f.close)}`)}
      <div class="card"><div class="empty">${icon("building")}<p>The full file workflow is set up on <b>1418 Maple Ridge Dr</b> for this walkthrough.</p><a class="btn primary" href="${BASE}/docs">Open 1418 Maple Ridge Dr</a></div></div>`);
  }

  /* ================= the Maple Ridge file ================= */
  function fileView(tab) {
    const tabs = [["docs", "Documents"], ["summary", "File summary"], ["commitment", "Commitment"], ["settlement", "Settlement statement"], ["clear", "Clear to close"]];
    setPage([["Open files", "#/board"], ["1418 Maple Ridge Dr"]], `${head("1418 Maple Ridge Dr", `Carmel, IN · purchase · Novak from Hayes · $415,000 · order ${DATA.order.id}`,
      `${daysChip("2026-10-09")}<span class="chip ${clear() ? "ok" : "plain"}">${clear() ? "Clear to close" : "Closing October 9"}</span>`)}
      <div class="tabs">${tabs.map(([k, l]) => `<a href="${BASE}/${k}" class="${tab === k ? "on" : ""}">${l}${k === "docs" && S.docs.length ? `<span class="cnt">${S.docs.length}</span>` : ""}</a>`).join("")}</div>
      ${!ready() ? next("Start", "<b>Load what came in.</b> The abstractor's search, the sellers' mortgage payoff and the buyers' lender's closing instructions.") : ({
        docs: next("Step 1 of 5", "<b>Everything read.</b> Check the parties and dates, then the drafted commitment.", `<a class="btn sm primary" href="${BASE}/summary">${icon("arrow")}File summary</a>`),
        summary: next("Step 2 of 5", "<b>Who, what and when, from three documents.</b> Next, the commitment.", `<a class="btn sm primary" href="${BASE}/commitment">${icon("shield")}Commitment</a>`),
        commitment: next("Step 3 of 5", "<b>Drafted from the search.</b> One requirement nobody expected. Then the money.", `<a class="btn sm primary" href="${BASE}/settlement">${icon("dollar")}Settlement statement</a>`),
        settlement: next("Step 4 of 5", "<b>Buyer and seller, to the cent.</b> Then clear the requirements.", `<a class="btn sm primary" href="${BASE}/clear">${icon("check")}Clear to close</a>`),
        clear: next("Step 5 of 5", `<b>${clear() ? "Every requirement satisfied. Clear to close." : "Clear what's left on Schedule B-I."}</b>`, "", clear()) }[tab] || "")}
      <div id="fBody"></div>`);
    if (tab !== "docs" && !ready()) { $("#fBody").innerHTML = `<div class="card"><div class="empty">${icon("file")}<p><b>Nothing read yet.</b></p><p>Drop the file's documents and every other tab fills itself.</p><a class="btn primary" href="${BASE}/docs">Go to documents</a></div></div>`; return; }
    ({ docs, summary, commitment, settlement, clear: clearView }[tab] || docs)();
  }

  /* ---------- 1. documents ---------- */
  function docs() {
    const KIND = { search: "Title search", payoff: "Payoff statement", lender: "Lender closing instructions" };
    $("#fBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      <div class="card"><div class="card-b"><div class="drop" id="dDrop"><div class="ic">${icon("upload")}</div><b>Drop what came in for this file</b><div class="hint">Search packages, payoff letters, lender packages, contracts, surveys. PDF, any abstractor's or lender's layout.</div>
        <div style="margin-top:14px"><button class="btn primary" id="dSample">${icon("file")}Load 1418 Maple Ridge Dr documents</button></div></div><div id="dRun" style="margin-top:14px"></div></div></div>
      ${S.docs.length ? card("Documents read", S.docs.map(d => `<div class="file-row"><div class="file-ic pdf">PDF</div><div class="meta"><b>${esc(d.name)}</b><small>${KIND[d.kind] ? `${KIND[d.kind]} · ${d.fields} values read · ${d.pages} page${d.pages > 1 ? "s" : ""}` : "This demo reads title searches, payoff statements and lender instructions"}</small></div>${KIND[d.kind] ? '<span class="chip ok">Read</span>' : '<span class="chip warn">Not recognized</span>'}</div>`).join(""),
        { tight: true, guide: "docs-read", foot: ready() ? `<a class="btn primary" href="${BASE}/summary">${icon("arrow")}Review the file</a>` : `<span class="muted" style="font-size:12.5px">Add the search, the payoff and the lender instructions to draft the file.</span>` }) : ""}
    </div>
    ${card("What gets pulled out", `<div class="steps">${["Owner of record, vesting deed and the legal description", "Every open mortgage and lien, with instrument numbers", "Easements, covenants and tax status for the exceptions", "The payoff, its good-through date and the per diem", "Sales price, loan amount, closing date and the lender's policy requirements", "Every charge the lender puts on the buyer"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
    </div>`;
    const handle = async files => {
      const B = { search: S.search, payoff: S.payoff, lender: S.lender, docs: [...S.docs] };
      const steps = files.map(f => [`Reading ${esc(f.name)}`, async () => {
        let kind = "unknown", fields = 0, pages = 0;
        if (UI.ext(f.name) === "pdf") {
          const doc = await UI.pdfLines(f); pages = doc.numPages; kind = Parsers.classify(doc.lines.join("\n"));
          const r = Parsers[kind] ? Parsers[kind](doc) : null;
          if (r && ((kind === "search" && r.owner) || (kind === "payoff" && r.total) || (kind === "lender" && r.price))) { B[kind] = r; fields = r.fields; } else kind = "unknown";
        }
        B.docs = B.docs.filter(d => d.name !== f.name).concat([{ name: f.name, kind, fields, pages }]);
        return { detail: `${{ search: "title search", payoff: "payoff statement", lender: "lender instructions" }[kind] || "unrecognized"} · ${fields} values` };
      }]);
      steps.push(["Checking every lien against what the sellers disclosed", async () => { Object.assign(S, B); const c = commit(); return { detail: c ? `${S.search.liens.length} liens · ${c.undisclosed.length} not disclosed` : "" }; }]);
      steps.push(["Carrying the payoff to the closing date", async () => { const t = ss(); return { detail: t ? (t.po.stale ? `${t.po.gap} days of per diem added` : "good through closing") : "" }; }]);
      await UI.runSteps($("#dRun"), steps, 450);
      const unk = S.docs.filter(d => d.kind === "unknown").length;
      if (unk) toast(`${unk} file${unk > 1 ? "s weren't" : " wasn't"} recognized. Title searches, payoff statements and lender instructions are read.`, "warn");
      if (ready()) toast("File drafted · commitment and settlement statement ready"); else if (!unk) toast("Add the search, payoff and lender instructions to draft the file", "warn");
      render();
    };
    UI.dropzone($("#dDrop"), handle, { accept: ".pdf" });
    $("#dSample").onclick = async e => { e.stopPropagation(); e.target.disabled = true; handle(await Promise.all(DATA.packet.map(fn => UI.fetchSample(F(fn))))); };
  }

  /* ---------- 2. file summary ---------- */
  function summary() {
    const Sx = S.search, P = S.payoff, L = S.lender;
    $("#fBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Sales price</div><div class="v">${money(L.price)}</div><div class="d">${money(L.amount)} loan · ${Math.round(L.amount / L.price * 100)}% of price</div></div>
        <div class="card kpi"><div class="l">Closing</div><div class="v" style="font-size:20px">${fdate(Closing.toDate(L.closing))}</div><div class="d">${daysUntil("2026-10-09")} days away</div></div>
        <div class="card kpi"><div class="l">Liens to clear</div><div class="v">${Sx.liens.length}</div><div class="d">the sellers disclosed ${DATA.order.disclosedLiens.length}</div></div>
        <div class="card kpi"><div class="l">${T("Search effective", "The date the search runs through. Anything recorded after it is picked up by a bring-down before closing.")}</div><div class="v" style="font-size:20px">${esc(Sx.effective)}</div><div class="d">${esc(Sx.abstractor)}</div></div>
      </div>
      <div class="grid g-main-l">
        ${card("Parties and property", `<dl class="kv"><dt>Sellers, owners of record</dt><dd>${esc(Sx.owner)}</dd><dt>Vesting deed</dt><dd>${esc(Sx.deed)}, recorded ${esc(Sx.deedRecorded)}</dd><dt>Buyers</dt><dd>${esc(L.borrowers)}</dd><dt>Buyers' lender</dt><dd>${esc(L.lender)}, loan ${esc(L.loan)}</dd><dt>Property</dt><dd>${esc(Sx.address)}</dd><dt>Parcel</dt><dd class="mono">${esc(Sx.parcel)}</dd><dt>County</dt><dd>${esc(Sx.county)}</dd></dl>`, { guide: "parties" })}
        ${card("Liens of record", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Holder</th><th>Type</th><th>Instrument</th><th class="num">Recorded amount</th><th></th></tr></thead><tbody>
          ${Sx.liens.map(l => { const disclosed = DATA.order.disclosedLiens.some(h => l.holder.startsWith(h)); return `<tr class="${disclosed ? "" : "bad"}" data-lien="${UI.slug(l.holder)}"><td><b>${esc(l.holder)}</b></td><td>${esc(l.type)}</td><td class="mono">${esc(l.instrument)}</td><td class="num">${money(l.amount)}</td><td>${disclosed ? '<span class="chip ok plain">Disclosed</span>' : '<span class="chip crit plain">Not disclosed</span>'}</td></tr>`; }).join("")}
        </tbody></table></div>`, { tight: true, guide: "liens", sub: "from the title search" })}
      </div>`;
  }

  /* ---------- 3. commitment ---------- */
  function commitment() {
    const C = commit();
    $("#fBody").innerHTML = `<div class="grid g-main-l"><div class="stack">
      ${card("Schedule A", `<dl class="kv"><dt>${T("Effective date", "The search date the commitment is good from")}</dt><dd>${esc(C.effective)}</dd>
        <dt>Owner's policy</dt><dd>${money(C.owners.amount)} · proposed insured ${esc(C.owners.insured)}</dd>
        <dt>Loan policy</dt><dd>${money(C.loan.amount)} · ${esc(C.loan.insured)}</dd><dt>Endorsements</dt><dd>${C.loan.endorsements.map(esc).join(", ")}</dd>
        <dt>Estate</dt><dd>${C.estate}</dd><dt>Title vested in</dt><dd>${esc(C.vested)}</dd></dl>
        <p style="margin:14px 0 0;font-size:13.5px;color:var(--ink-2)"><b style="color:var(--ink)">The land.</b> ${esc(C.legal)}</p>`, { guide: "sched-a" })}
      ${card("Schedule B, part I · requirements", `<div class="sched"><p style="margin:0;color:var(--ink-2)">To be complied with before the policies are issued:</p><ol>${C.req.map(r => `<li class="${r.found ? "new" : ""}" data-req="${r.id}">${esc(r.text)}${r.found ? ` <span class="chip crit plain" style="margin-left:4px">Found in the search</span>` : ""}</li>`).join("")}</ol></div>`, { guide: "sched-b1" })}
      ${card("Schedule B, part II · exceptions", `<div class="sched"><p style="margin:0;color:var(--ink-2)">The policies won't cover loss from:</p><ol>${C.exc.map(e => `<li>${esc(e.text)}</li>`).join("")}</ol></div>`, { guide: "sched-b2" })}
    </div>
    <div class="stack">
      ${C.undisclosed.map(u => `<div class="card" data-guide="catch" style="border-color:#f3d6a4;background:#fffbf2"><div class="card-b"><b style="font-size:14.5px">A second lien nobody mentioned</b>
        <p style="margin:6px 0 0;color:var(--ink-2);font-size:13.5px">The sellers disclosed one mortgage, to ${esc(DATA.order.disclosedLiens[0])}. The search also found a ${esc(u.type.toLowerCase())} with ${esc(u.holder)}, recorded ${esc(u.recorded)}, for up to ${money(u.amount)}.</p>
        <p style="margin:8px 0 0;color:var(--ink-2);font-size:13.5px">It's on Schedule B-I as a requirement, and the lender needs a first lien. The payoff can be requested from the clear-to-close tab.</p></div></div>`).join("")}
      ${card("Drafted from", `<div class="steps">${["Vesting, deed and legal description from the search", "Policy amounts, insured lender and endorsements from the lender's instructions", "A requirement for every open lien the search found", "An exception for every recorded easement and covenant", "Taxes not yet due, as an exception"].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
    </div></div>`;
  }

  /* ---------- 4. settlement statement ---------- */
  function settlement() {
    const t = ss(), P = S.payoff;
    const cell = v => v === null ? '<td class="num pend">Pending</td>' : `<td class="num">${v ? m2(v) : ""}</td>`;
    $("#fBody").innerHTML = `
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Buyers bring to closing</div><div class="v">${m2(t.buyer.cash)}</div><div class="d">after the loan and earnest money</div></div>
        <div class="card kpi"><div class="l">Sellers net</div><div class="v">${t.helocPending ? "Pending" : m2(t.seller.net)}</div><div class="d">${t.helocPending ? `${m2(t.seller.net)} before the second lien` : "every payoff in"}</div></div>
        <div class="card kpi"><div class="l">Payoff at closing</div><div class="v">${m2(t.po.total)}</div><div class="d">${t.po.stale ? `+${m2(t.po.extra)} of per diem` : "good through closing"}</div></div>
        <div class="card kpi"><div class="l">${T("Tax proration", "Indiana taxes are paid a year behind, so the sellers credit the buyers for this year's taxes up to closing")}</div><div class="v">${m2(t.proration)}</div><div class="d">${t.taxDays} days of ${esc(S.search.taxes.find(x => /not yet due/i.test(x.status))?.year || "")}</div></div>
      </div>
      ${t.po.stale ? `<div class="card" data-guide="catch" style="margin-bottom:16px;border-color:#f3d6a4;background:#fffbf2"><div class="card-b" style="display:flex;gap:14px;align-items:flex-start">
        <div style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--warn-w);color:var(--warn)">${icon("alert")}</div>
        <div><b style="font-size:14.5px">The payoff letter runs out before closing</b><p style="margin:4px 0 0;color:var(--ink-2)">${esc(P.lender)}'s letter is good through ${esc(P.goodThrough)}. Closing is ${esc(S.lender.closing)}. Wiring the letter's ${m2(P.total)} would leave the loan ${t.po.gap} days of interest short and the release unrecorded. At ${m2(P.perDiem)} a day that's <b>${m2(t.po.extra)}</b>, added here so the payoff clears in full.</p></div></div></div>` : ""}
      <div class="card" data-guide="settlement"><div class="card-h"><h3>Settlement statement</h3><span class="sub">buyer and seller · closing ${esc(S.lender.closing)}</span></div>
        <div class="tbl-wrap"><table class="t ss"><thead><tr><th>Item</th><th class="num">Buyer debit</th><th class="num">Buyer credit</th><th class="num">Seller debit</th><th class="num">Seller credit</th><th>${T("From", "Which document each figure came from")}</th></tr></thead><tbody>
          ${t.lines.map(l => `<tr data-line="${l[6]}" class="${l[3] === null ? "bad" : ""}"><td>${esc(l[0])}</td>${cell(l[1])}${cell(l[2])}${cell(l[3])}${cell(l[4])}<td><span class="src">${esc(l[5])}</span></td></tr>`).join("")}
          <tr class="sub"><td>Totals</td><td class="num">${m2(t.buyer.debits)}</td><td class="num">${m2(t.buyer.credits)}</td><td class="num">${m2(t.seller.debits)}${t.helocPending ? "+" : ""}</td><td class="num">${m2(t.seller.credits)}</td><td></td></tr>
          <tr class="sub" data-line="net"><td>Cash from buyers · to sellers</td><td class="num" colspan="2" style="text-align:center">${m2(t.buyer.cash)} from buyers</td><td class="num" colspan="2" style="text-align:center">${t.helocPending ? "Pending second lien payoff" : m2(t.seller.net) + " to sellers"}</td><td></td></tr>
        </tbody></table></div></div>`;
  }

  /* ---------- 5. clear to close ---------- */
  function clearView() {
    const C = commit(), t = ss();
    const status = r => {
      if (r.id === "deed") return ["ok", "Drafted · signed at closing"];
      if (r.id === "mortgage") return ["ok", "From the lender · signed at closing"];
      if (r.id === "taxes") return ["ok", "Nothing due now · this year's taxes prorated"];
      if (r.id === "affidavit") return ["ok", "Drafted · signed at closing"];
      if (r.lien && !r.found) return ["ok", `Payoff in file · carried to closing at ${m2(t.po.total)}`];
      if (r.found) return S.heloc != null ? ["ok", `Payoff received · ${m2(S.heloc)} · closure authorization signed`] : S.helocAsked ? ["warn", "Payoff and closure letter requested · waiting on the credit union"] : ["crit", "No payoff requested yet"];
      return ["info", ""];
    };
    $("#fBody").innerHTML = `<div class="grid g-main-l">
      ${card("Schedule B-I, cleared one by one", C.req.map((r, i) => { const [k, s] = status(r); return `<div class="list-item" data-req="${r.id}"><div class="li-ic ${k}">${icon(k === "ok" ? "check" : k === "crit" ? "alert" : "clock")}</div><div class="li-b"><b>${i + 1}. ${esc(r.text)}</b><p>${esc(s)}</p></div></div>`; }).join(""), { tight: true, guide: "reqs" })}
      <div class="stack">
        <div class="card" data-guide="heloc"><div class="card-b">${S.heloc != null ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip ok">Received</span><span class="muted" style="font-size:13px">Riverbend Credit Union sent a payoff of ${m2(S.heloc)} good through October 9, with the sellers' authorization to close the line. The settlement statement is complete.</span></div>`
          : S.helocAsked ? `<div style="display:flex;gap:10px;align-items:center"><span class="g-spin"></span><span class="muted" style="font-size:13px">Payoff and closure letter requested from Riverbend Credit Union…</span></div>`
          : `<b>The second lien needs a payoff</b><p style="margin:6px 0 10px;color:var(--ink-2);font-size:13.5px">A payoff good through October 9, and the sellers' signed authorization to close the line so it can't be drawn on after closing.</p><button class="btn primary" id="askHeloc">${icon("send")}Request payoff and closure letter</button>`}</div></div>
        <div class="card"><div class="card-b" data-guide="ctc">${clear() ? `<div style="display:flex;gap:10px;align-items:center" data-guide="ctc-ok"><span class="chip ok">Clear to close</span><span class="muted" style="font-size:13px">Every requirement is satisfied. Sellers net ${m2(t.seller.net)}.</span></div>` : `<div style="display:flex;gap:10px;align-items:center"><span class="chip warn">Not clear to close</span><span class="muted" style="font-size:13px">One requirement is still open.</span></div>`}</div></div>
      </div></div>`;
    $("#askHeloc") && ($("#askHeloc").onclick = async () => { S.helocAsked = true; render(); await UI.sleep(1600); S.heloc = HELOC_PAYOFF; toast("Riverbend Credit Union sent the payoff · the file is clear to close"); render(); });
  }

  /* ================= time saved ================= */
  const COUNTS = {};   // times a month, as changed on the page
  route("/savings", () => {
    const tasks = [["Draft a commitment from a search package", 45, 3, 60], ["Build a settlement statement", 40, 4, 55], ["Read a payoff and carry it to the closing date", 10, 1, 70],
      ["Key a lender's closing instructions into the file", 20, 2, 55], ["Track Schedule B-I requirements to clear to close", 25, 3, 55]];
    tasks.forEach((t, i) => { if (COUNTS[i] != null) t[3] = COUNTS[i]; });
    const saved = tasks.reduce((s, t) => s + (t[1] - t[2]) * t[3], 0) / 60;
    setPage([["Time saved"]], `${head("Time saved this month", "Minutes by hand against minutes with the desk, times how often it happens.")}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Hours saved a month</div><div class="v">${Math.round(saved)}</div><div class="d">about ${(saved / 160).toFixed(1)} of a full-time processor</div></div>
        <div class="card kpi"><div class="l">Commitments drafted</div><div class="v">${tasks[0][3]}</div><div class="d">3 minutes each, not 45</div></div>
        <div class="card kpi"><div class="l">Payoffs checked</div><div class="v">${tasks[2][3]}</div><div class="d">none wired short</div></div>
        <div class="card kpi"><div class="l">Files closed</div><div class="v">${tasks[1][3]}</div><div class="d">a month</div></div>
      </div>
      ${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">Times a month</th><th class="num">Hours saved</th></tr></thead><tbody>
        ${tasks.map((t, i) => `<tr><td>${t[0]}</td><td class="num">${t[1]} min</td><td class="num">${t[2]} min</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${i}" value="${t[3]}" aria-label="How often: ${esc(t[0])}"></td><td class="num strong">${((t[1] - t[2]) * t[3] / 60).toFixed(1)}</td></tr>`).join("")}
      </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${saved.toFixed(0)}</td></tr></tfoot></table></div>`, { tight: true, guide: "savings", sub: "starting estimates for an agency closing 55 files a month" })}`);
    $$("[data-cnt]").forEach(x => x.onchange = () => { COUNTS[+x.dataset.cnt] = Math.max(0, Math.round(+x.value || 0)); render(); });
  });

  /* ================= state ================= */
  const SK = "td:state"; let saveT = null, frozen = false;
  function snapshot() { return JSON.parse(JSON.stringify({ who: S.who, docs: S.docs.length > 0, helocAsked: S.helocAsked, heloc: S.heloc })); }
  function save() { if (!S.who || frozen) return; const p = snapshot(); try { sessionStorage.setItem(SK, JSON.stringify(p)); } catch (e) { } clearTimeout(saveT); saveT = setTimeout(() => UI.api("PUT", "/api/state/title", p), 400); }
  async function restore(st) {
    Object.assign(S, { helocAsked: !!st.helocAsked, heloc: st.heloc ?? null });
    if (S.helocAsked && S.heloc == null) S.heloc = HELOC_PAYOFF;
    if (st.docs) for (const fn of DATA.packet) {
      const doc = await UI.pdfLines(await UI.fetchSample(F(fn))); const kind = Parsers.classify(doc.lines.join("\n")); const r = Parsers[kind] ? Parsers[kind](doc) : null;
      if (r) S[kind] = r; S.docs.push({ name: fn, kind, fields: r ? r.fields : 0, pages: doc.numPages });
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
    ...DATA.files.map(f => ({ label: f.addr, sub: `${f.city} · ${f.type} · ${f.parties} · ${f.status}`, href: "#/files/" + f.id, icon: "building", kind: "File" })),
  ]);

  /* ================= guided demo ================= */
  Guide.init({
    app: "title", minutes: 7,
    intro: "A walkthrough of one purchase file, from the documents that came in to clear to close, then every open file on one board. Where there's something to click, the tour waits for you.",
    chapterNotes: { "Morning view": "What was drafted overnight", "Open files": "What's blocking a closing", "The file": "Search, payoff, lender instructions", "Commitment": "Drafted, with a lien nobody mentioned",
      "Settlement": "A payoff that runs out before closing", "Clear to close": "Requirements cleared", "Results": "Hours saved" },
    welcomeTitle: "Welcome to Title Desk",
    welcomeBody: `<p style="margin-top:0">A working sample of a title and escrow agency where the drafting is automated: search packages turned into commitments, payoffs carried to the closing date, settlement statements built and Schedule B-I requirements tracked to clear to close.</p><p>It runs on real sample documents: a title search, a payoff letter and a lender's closing instructions. All people, properties and figures are fictional.</p>`,
    doneTitle: "That's the walkthrough",
    doneBody: `<p style="margin-top:0">Three documents became a drafted commitment, a settlement statement to the cent and a file cleared to close, with a lien nobody mentioned and a payoff that would have been short both caught before the closing table.</p><p>Everything stays clickable. Open <b>Guided demo</b> to replay any chapter.</p>`,
    reset: async () => { frozen = true; clearTimeout(saveT); const who = S.who; await UI.api("PUT", "/api/state/title", { who }); try { sessionStorage.clear(); sessionStorage.setItem(SK, JSON.stringify({ who })); sessionStorage.setItem("guide:title:welcomed", "1"); } catch (e) { } location.hash = "#/home"; location.reload(); },
    steps: [
      { chapter: "Morning view", route: "#/home", target: '[data-guide="activity"]', place: "right", title: "What was drafted overnight",
        body: "A search turned into a commitment, four payoffs read into their files, an expired payoff caught and a judgment found, before anyone opened a file.", why: "Drafting is most of a processor's day. This does the draft; they check it." },
      { chapter: "Morning view", route: "#/home", target: '[data-guide="tasks"]', place: "left", title: "Only decisions reach a person",
        body: "A lien nobody mentioned, a payoff that ran out, a judgment against a seller, a fence over a line. Each with its closing date." },

      { chapter: "Open files", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-file="stonegate"]', 'tr[data-file="harbor-way"]'],
        title: "What's blocking a closing, first", body: "Every open file, sorted by what stops it closing. An expired payoff and a judgment sit at the top, not buried in a queue." },

      { chapter: "The file", route: BASE + "/docs", target: "#dDrop", dropzone: "#dDrop", dropButton: "#dSample", doneWhen: '[data-guide="docs-read"]',
        files: [{ name: "Title search", url: F(DATA.packet[0]), note: "Hamilton Abstract · 40 years" }, { name: "Payoff letter", url: F(DATA.packet[1]), note: "The sellers' mortgage" }, { name: "Lender instructions", url: F(DATA.packet[2]), note: "The buyers' loan" }],
        title: "A purchase in Carmel, closing October 9", body: "The Novaks are buying from the Hayeses for $415,000. In: the abstractor's search, the payoff on the sellers' mortgage and the buyers' lender's instructions. <b>Drag the files onto the drop area.</b>" },
      { chapter: "The file", route: BASE + "/summary", target: '[data-guide="liens"]', block: "center",
        marks: ['tr[data-lien="riverbend-credit-union"]'],
        source: { type: "pdf", url: F(DATA.packet[0]), find: ["Riverbend Credit Union", "2021071458", "Home equity line of credit"], caption: "Title search · open mortgages and liens", legend: "<i></i> not disclosed by the sellers" },
        title: "Two liens, one disclosed", body: "The sellers told the agent about their Heartland mortgage. The search also found a home equity line with Riverbend Credit Union, recorded in 2021. Checked against the order, it's flagged." },

      { chapter: "Commitment", route: BASE + "/commitment", target: '[data-guide="sched-a"]', block: "start",
        source: { type: "pdf", url: F(DATA.packet[0]), find: ["Lot 42 in Maple Ridge Section Three", "Robert L. Hayes and Diane M. Hayes"], caption: "Title search · vesting and legal description", legend: "<i></i> carried into Schedule A" },
        title: "Schedule A, drafted", body: "Vesting and the legal description from the search, policy amounts and the insured lender from the lender's instructions. Nobody retyped a lot number." },
      { chapter: "Commitment", route: BASE + "/commitment", target: '[data-guide="sched-b1"]', block: "start",
        marks: ['[data-req="lien-2021071458"]'],
        title: "A requirement nobody expected", body: "Every open lien becomes a requirement to pay off and release. The home equity line also needs the sellers' written authorization to close it, or it could be drawn on after closing.",
        why: "Finding this at the closing table is how closings slip a week." },

      { chapter: "Settlement", route: BASE + "/settlement", target: '[data-guide="catch"]', block: "start",
        source: { type: "pdf", url: F(DATA.packet[1]), find: ["10/02/2026", "$28.74", "$183,080.85"], caption: "Heartland Bank payoff statement", legend: "<i></i> good through a date before closing" },
        title: "The payoff letter runs out before closing", body: "It's good through October 2. Closing is October 9. Wiring the letter's figure would leave the loan seven days of interest short and the release unrecorded. The per diem is added: $201.18.",
        why: "A short payoff means a second wire and a release that sits for weeks." },
      { chapter: "Settlement", route: BASE + "/settlement", target: '[data-guide="settlement"]', block: "start",
        marks: ['tr[data-line="payoff"]', 'tr[data-line="proration"]', 'tr[data-line="heloc"]'],
        title: "Buyer and seller, to the cent", body: "The payoff at closing, this year's taxes prorated over 281 days, the lender's charges and the title premiums. The second lien is marked pending, so nobody closes on a guess." },

      { chapter: "Clear to close", route: BASE + "/clear", target: '[data-guide="reqs"]', block: "start",
        marks: ['[data-req="lien-2021071458"]'],
        title: "Schedule B-I, cleared one by one", body: "Five of six are satisfied or set for the closing table. One is open: the second lien." },
      { chapter: "Clear to close", route: BASE + "/clear", target: "#askHeloc", advance: "click", hint: "Click Request payoff and closure letter",
        title: "Request the payoff", body: "<b>Request it</b>, and the payoff and the closure authorization are asked for together, good through the closing date." },
      { chapter: "Clear to close", route: BASE + "/clear", target: '[data-guide="ctc-ok"]', block: "center", wait: 8000,
        title: "Clear to close", body: "Riverbend's payoff is in. Every requirement is satisfied, and the settlement statement now shows what the sellers actually net." },

      { chapter: "Results", route: "#/board", target: '[data-guide="board"]', block: "start",
        marks: ['tr[data-file="maple-ridge"]'],
        title: "Back on the board, clear to close", body: "1418 Maple Ridge Dr moves to clear to close, nine days ahead." },
      { chapter: "Results", route: "#/savings", target: '[data-guide="savings"]', block: "start",
        title: "What it's worth in a month", body: "Minutes by hand against minutes with the desk, times how often each happens. Change the counts to match your volume." },
    ],
  });

  /* ================= sign in ================= */
  function enter(u) {
    S.who = u; document.body.dataset.authed = "1"; $("#login").classList.add("hide"); $("#shell").classList.remove("hide");
    $("#me").innerHTML = `<div class="avatar s">${UI.initials(u.name)}</div><div>${u.name}<small>${u.role}</small></div><button id="out" data-tip="Clear this demo session and start again">Restart</button>`;
    $("#out").onclick = async () => { frozen = true; clearTimeout(saveT); await UI.api("POST", "/api/reset/title"); try { sessionStorage.clear(); } catch (e) { } location.hash = ""; location.reload(); };
  }
  let who = DATA.users[0];
  $("#users").innerHTML = DATA.users.map((u, i) => `<button type="button" class="user-opt" data-u="${i}" aria-pressed="${i === 0}"><div class="avatar s">${UI.initials(u.name)}</div><div><b>${u.name}</b><span>${u.role}</span></div></button>`).join("");
  $$("[data-u]").forEach(b => b.onclick = () => { who = DATA.users[+b.dataset.u]; $$("[data-u]").forEach(x => x.setAttribute("aria-pressed", x === b)); $("#email").value = who.email; });
  $("#loginForm").onsubmit = e => { e.preventDefault(); enter(who); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin(); };
  (async () => {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem(SK) || "null"); } catch (e) { }
    const remote = await UI.api("GET", "/api/state/title"); UI.setBackend(!!remote);
    if (!saved && remote && remote.who) saved = remote;
    if (saved && saved.who) {
      enter(saved.who); view().innerHTML = `<div class="empty" style="padding:80px">${icon("refresh")}<p><b>Restoring your session…</b></p></div>`;
      restore(saved).catch(() => toast("Some sample files could not be reloaded", "warn")).finally(() => { render(); Guide.afterLogin({ restored: true }); });
    } else {                     // no sign-in page: open straight on the dashboard as the first sample user
      enter(DATA.users[0]); if (!location.hash || location.hash === "#") location.hash = "#/home"; render(); Guide.afterLogin();
    }
  })();
})();
