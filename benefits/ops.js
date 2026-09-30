/* Benefits Desk, part 2: website leads, engagements and fee terms, claims diagnostic, savings models (first-dollar care
   and ICHRA on the real sample census), savings proposal, savings tracker, fees and invoices, employee communications,
   board pack and time saved. Uses the state app.js shares on window.BD. */
(() => {
  const { $, $$, esc, money, num, fdate, icon, toast, modal, route, go, render, sleep } = UI;
  const BD = window.BD, S = BD.S, T = UI.tip, I = UI.info;
  const X = () => S.x;
  const { card, head, setPage } = BD;
  const G = id => DATA.groups.find(g => g.id === id);
  const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const p1 = v => (v * 100).toFixed(1) + "%";
  const k$ = n => { const a = Math.abs(n), s = n < 0 ? "-$" : "$"; return a >= 1e6 ? s + (a / 1e6).toFixed(2) + "M" : a >= 1e4 ? s + Math.round(a / 1e3) + "K" : money(n); };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").split("\n").map(l => /^- /.test(l) ? `<li>${l.slice(2)}</li>` : l.trim() ? `<p>${l}</p>` : "").join("").replace(/(<li>.*?<\/li>)+/g, s => `<ul>${s}</ul>`);
  async function typeOut(el, text) {
    if (!el) return; el.classList.add("typing"); const parts = text.split(/(\s+)/); let out = "";
    for (let i = 0; i < parts.length; i++) { out += parts[i]; if (i % 6 === 0) { el.innerHTML = md(out); await sleep(12); } }
    el.innerHTML = md(text); el.classList.remove("typing");
  }
  /* letters: first line is the title, "Label." starts a bold clause, "______" lines are signature lines */
  const letter = t => { const [first, ...rest] = t.split("\n"); return `<h1 style="font-size:20px;margin:0 0 14px">${esc(first.charAt(0) + first.slice(1).toLowerCase())}</h1>` +
    md(rest.join("\n")).replace(/<p>((?:\d+\. )?[A-Z][A-Za-z -]{2,30}\.) /g, "<p><b>$1</b> ").replace(/<p>(_{6,}.*?)<\/p>/g, '<p class="sig">$1</p>'); };
  const once = (key, el, text) => { const seen = (X().typed ||= {}); if (seen[key]) { if (el) el.innerHTML = md(text); return; } seen[key] = 1; BD.save(); typeOut(el, text); };

  /* ================= time saved ================= */
  const TASKS = [
    ["census", "Clean a census into carrier format", 40, 3, 12], ["quotes", "Spread fully insured quotes", 90, 6, 10], ["bids", "Normalize self-funded vendor bids", 240, 15, 3],
    ["proposal", "Write a client proposal", 60, 5, 10], ["diagnostic", "Claims cost-driver diagnostic", 600, 60, 2], ["models", "Model first-dollar care and ICHRA", 240, 20, 4],
    ["letters", "Engagement letter and fee terms", 45, 3, 4], ["leads", "Qualify and answer a website lead", 25, 2, 20], ["inbox", "Answer a service email", 6, 1, 300],
    ["recon", "Reconcile a carrier bill to payroll", 90, 8, 12], ["tracker", "Document a month of savings", 120, 10, 4], ["board", "Build a committee or board pack", 480, 45, 1],
    ["comms", "Write employee announcements and FAQs", 90, 8, 6], ["compliance", "Prepare a compliance notice", 45, 5, 10],
  ];
  const fmtM = m => m < 60 ? `${Math.round(m)} min` : `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, "0")} m`;
  function credit(id, key = id, times = 1) {
    const t = TASKS.find(x => x[0] === id); if (!t) return;
    const c = (X().credited ||= {}); if (c[key]) return; c[key] = { id, times, at: now() };
    X().saved = (X().saved || 0) + (t[2] - t[3]) * times; pill(true); BD.save();
  }
  function pill(bump) {
    if (!document.body.dataset.authed) return;
    let el = $("#savedPill");
    if (!el) { const s = $(".topbar .search"); if (!s) return; el = document.createElement("a"); el.id = "savedPill"; el.className = "saved-pill"; el.href = "#/time-saved";
      el.dataset.tip = "Time the desk saved in this session, from how long each task takes by hand. Click for the monthly view."; s.before(el); }
    const m = Math.round(X().saved || 0);
    el.innerHTML = `${icon("clock")}<b>${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} m</b><span>saved this session</span>`;
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  BD.credit = credit; BD.afterNav = () => pill();

  route("/time-saved", () => {
    const counts = X().roi || {}, hourly = X().hourly ?? 45;
    const rows = TASKS.map(t => { const f = counts[t[0]] ?? t[4]; return { t, f, saved: (t[2] - t[3]) * f }; });
    const min = rows.reduce((s, r) => s + r.saved, 0), hrs = min / 60, max = Math.max(...rows.map(r => r.saved));
    const cr = Object.values(X().credited || {});
    setPage([["Time & cost saved"]], `${head("Time & cost saved", "Minutes each task takes by hand against minutes with the desk, times how often it happens in a month.")}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">${icon("clock")} Hours saved each month</div><div class="v">${Math.round(hrs).toLocaleString()}</div><div class="d">about ${(hrs / 160).toFixed(1)} full-time staff</div></div>
        <div class="card kpi"><div class="l">${icon("dollar")} Staff cost saved each month</div><div class="v">${money(hrs * hourly)}</div><div class="d">at ${money(hourly)} an hour</div></div>
        <div class="card kpi"><div class="l">${icon("chart")} Staff cost saved each year</div><div class="v">${money(hrs * hourly * 12)}</div><div class="d">same team, more clients</div></div>
        <div class="card kpi"><div class="l">${icon("zap")} Saved in this session</div><div class="v">${fmtM(X().saved || 0)}</div><div class="d">${cr.length} task${cr.length === 1 ? "" : "s"} done in the demo</div></div>
      </div>
      <div class="grid g-main" style="grid-template-columns:minmax(0,1fr) 300px">
        <div data-guide="time-saved">${card("Per task", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Task</th><th class="num">By hand</th><th class="num">With the desk</th><th class="num">${T("Times a month", "Change these to match the practice")}</th><th class="num">Hours saved</th><th style="width:80px"></th></tr></thead><tbody>
          ${rows.map(r => `<tr><td style="min-width:220px">${r.t[1]}</td><td class="num">${fmtM(r.t[2])}</td><td class="num">${fmtM(r.t[3])}</td><td class="num"><input class="input num" style="width:78px;padding:4px 8px" type="number" min="0" data-cnt="${r.t[0]}" value="${r.f}" aria-label="${r.t[1]} per month"></td><td class="num strong">${(r.saved / 60).toFixed(1)}</td><td><div class="progress ok"><i style="width:${max ? r.saved / max * 100 : 0}%"></i></div></td></tr>`).join("")}
          </tbody><tfoot><tr><td>Total</td><td></td><td></td><td></td><td class="num">${hrs.toFixed(1)}</td><td></td></tr></tfoot></table></div>`, { tight: true, sub: "starting estimates for a benefits practice" })}</div>
        <div class="stack">
          ${card("Your numbers", `<div class="field"><label>Loaded staff cost per hour ($)</label><input class="input" type="number" min="1" id="hourly" value="${hourly}"></div><p class="muted" style="font-size:12.5px;margin:0">Change the monthly counts in the table too. Everything recalculates.</p>`)}
          ${card("This session", cr.length ? cr.map(c => { const t = TASKS.find(x => x[0] === c.id); return `<div class="list-item" style="padding:9px 14px"><div class="li-ic ok">${icon("check")}</div><div class="li-b"><b>${t[1]}</b><p>${fmtM((t[2] - t[3]) * c.times)} saved</p></div><div class="li-t">${c.at}</div></div>`; }).join("") : `<div class="empty" style="padding:22px">${icon("clock")}<p>Nothing done yet. Work through a case and it adds up here.</p></div>`, { tight: true })}
        </div></div>`);
    $$("[data-cnt]").forEach(inp => inp.onchange = () => { (X().roi ||= {})[inp.dataset.cnt] = Math.max(0, +inp.value || 0); BD.save(); render(); });
    $("#hourly").onchange = e => { X().hourly = Math.max(1, +e.target.value || 1); BD.save(); render(); };
  });

  /* ================= fee terms and engagements ================= */
  const FEE = () => ({ pct: 1, min: 10000, max: 50000, perf: 20, refund: 30, ...(X().fee || {}) });
  const retainer = spend => { const f = FEE(); return clamp(spend * f.pct / 100, f.min, f.max); };
  const rule = spend => { const f = FEE(), raw = spend * f.pct / 100; return raw < f.min ? "Minimum" : raw > f.max ? "Cap" : `${f.pct}% of spend`; };
  const ENG = [
    { id: "cedar-ridge", contact: "Janet Morales", title: "CFO", spend: 31820000, stage: "Bids compared", letter: "Signed", broker: "Midwest Risk Partners", brokerContact: "Tom Reilly" },
    { id: "northfield", contact: "Greg Halvorsen", title: "VP, Human Resources", spend: 17940000, stage: "Claims diagnostic", letter: "Signed", broker: "Lakeland Benefits Group", brokerContact: "Kara Voss" },
    { id: "alder-finch", contact: "Renee Alder", title: "Managing Partner", spend: 612000, stage: "Tracking savings", letter: "Signed", broker: "", brokerContact: "" },
    { id: "trinity-oak", contact: "Angela Mercer", title: "Practice Administrator", spend: 419460, stage: "Savings models", letter: "Sent", broker: "", brokerContact: "" },
    { id: "harbor-point", contact: "Dana Whitley", title: "HR Manager", spend: 842600, stage: "Letter drafted", letter: "Draft", broker: "", brokerContact: "" },
  ];
  const engs = () => [...ENG, ...(X().newEng || [])];
  const letterState = e => (X().sig || {})[e.id] || e.letter;
  const gname = e => G(e.id)?.name || e.name;
  function ndaText(e) {
    return `MUTUAL NON-DISCLOSURE AGREEMENT\n\nDate: September 16, 2026\n\nBetween ${DATA.firm} ("Advisor") and ${gname(e)} ("Company").\n\n1. Purpose. The parties will share confidential information, including employee census data, claims experience, carrier and vendor contracts and renewal history, to evaluate health plan savings.\n\n2. Protected health information. De-identified data is used wherever possible. Any protected health information is handled under a separate Business Associate Agreement.\n\n3. Use. Information is used only for this review and is not shared with carriers or vendors without the Company's written consent.\n\n4. Term. Two years from the date above.\n\n5. Return. All data is returned or destroyed on request.\n\nAdvisor: ______________________\n\nCompany: ______________________   ${e.contact}, ${e.title}`;
  }
  function engText(e) {
    const f = FEE(), r = retainer(e.spend);
    return `ENGAGEMENT LETTER\n\n${gname(e)}\nAttention: ${e.contact}, ${e.title}\n\nScope. We review your census, claims, contracts and renewal history; model first-dollar care, employee-owned coverage (ICHRA) and an employer-owned plan; run a full-market bid; and document the savings in writing.\n\n${e.broker ? `Your broker. ${e.broker} continues to manage your plan and renewal. We work alongside them.\n\n` : ""}Retainer. ${money(r)} (${f.pct}% of ${money(e.spend)} annual health plan spend; minimum ${money(f.min)}, maximum ${money(f.max)}).\n\nPerformance fee. ${f.perf}% of documented year-one savings, invoiced quarterly as the savings are realized.\n\nGuarantee. If documented savings do not appear, the full retainer is refunded within ${f.refund} days.\n\nIndependence. No carrier, vendor or administrator compensation is accepted.\n\nAccepted: ______________________   Date: __________`;
  }
  route("/engagements", () => engagement("cedar-ridge"));
  route("/engagements/:id", ({ id }) => engagement(id));
  function engagement(id) {
    const all = engs(), e = all.find(x => x.id === id) || all[0], f = FEE(), st = letterState(e), doc = X().doc || "eng";
    setPage([["Engagements"]], `${head("Engagements", "Mutual NDA and engagement letter built from the client record, fee terms calculated, sent and tracked to signature.")}
      <div class="grid" style="grid-template-columns:minmax(0,1.9fr) minmax(280px,1fr);margin-bottom:16px;align-items:start">
        ${card("Clients", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Client</th><th class="num">Annual spend</th><th class="num">Retainer</th><th>${T("Rule", "Which fee rule applied: the percentage, the minimum or the cap")}</th><th>Letter</th></tr></thead><tbody>
          ${all.map(x => { const s = letterState(x); return `<tr class="click ${x.id === e.id ? "sel" : ""}" data-eng="${x.id}" onclick="location.hash='#/engagements/${x.id}'"><td><b class="nowrap">${esc(gname(x))}</b><div class="muted" style="font-size:12px">${esc(x.contact)} · ${esc(x.stage)}</div></td><td class="num">${k$(x.spend)}</td><td class="num strong">${money(retainer(x.spend))}</td><td><span class="chip ${rule(x.spend) === "Cap" ? "violet" : rule(x.spend) === "Minimum" ? "info" : ""} plain">${rule(x.spend)}</span></td><td><span class="chip ${s === "Signed" ? "ok" : s === "Sent" ? "warn" : ""}">${s}</span></td></tr>`; }).join("")}
          </tbody></table></div>`, { tight: true })}
        <div data-guide="fee-terms">${card(`Fee terms ${I("Set once for the practice. Every letter, invoice and proposal uses them.")}`, `<div class="grid g2" style="gap:10px">
            <div class="field" style="margin:0"><label>Retainer, % of spend</label><input class="input" type="number" step="0.1" min="0" data-fee="pct" value="${f.pct}"></div>
            <div class="field" style="margin:0"><label>Performance fee, % of savings</label><input class="input" type="number" min="0" data-fee="perf" value="${f.perf}"></div>
            <div class="field" style="margin:0"><label>Minimum retainer ($)</label><input class="input" type="number" min="0" data-fee="min" value="${f.min}"></div>
            <div class="field" style="margin:0"><label>Maximum retainer ($)</label><input class="input" type="number" min="0" data-fee="max" value="${f.max}"></div>
            <div class="field" style="margin:0"><label>Refund window (days)</label><input class="input" type="number" min="0" data-fee="refund" value="${f.refund}"></div></div>
          <div class="alert" style="margin-top:12px">${icon("dollar")}<div><b>${esc(gname(e))}:</b> ${f.pct}% of ${money(e.spend)} is ${money(e.spend * f.pct / 100)}${rule(e.spend) === "Cap" ? `, capped at ${money(f.max)}` : rule(e.spend) === "Minimum" ? `, raised to the ${money(f.min)} minimum` : ""}.</div></div>`)}</div>
      </div>
      <div class="grid g-main-l">
        <div class="card"><div class="card-h"><div class="seg" id="docSeg"><button data-d="nda" class="${doc === "nda" ? "on" : ""}">Mutual NDA</button><button data-d="eng" class="${doc === "eng" ? "on" : ""}">Engagement letter</button></div><div class="actions"><span class="chip ${st === "Signed" ? "ok" : st === "Sent" ? "warn" : ""}">${st}</span></div></div>
          <div class="card-b" style="background:#e9ebef"><div class="report letter" id="letterDoc">${letter(doc === "nda" ? ndaText(e) : engText(e))}</div></div>
          <div class="card-f">${st === "Signed" ? '<span class="muted" style="font-size:12.5px">Signed copy filed to the client record</span>' : `<button class="btn primary" id="sendSig">${icon("send")}${st === "Sent" ? "Resend for e-signature" : "Send NDA and letter for e-signature"}</button>`}<button class="btn" onclick="UI.printOnly(document.querySelector('#letterDoc'))">${icon("printer")}Download PDF</button></div></div>
        <div class="stack">
          ${e.broker ? card(`Weekly update to ${esc(e.broker)}`, `<div class="draft" id="brokerMail"></div>`, {
            foot: (X().brokerSent || {})[e.id] ? `<span class="chip ok">Sent ${esc(X().brokerSent[e.id])}</span>` : `<button class="btn primary" id="brokerSend">${icon("send")}Send update</button><label class="row" style="font-size:12.5px"><input type="checkbox" checked> Every Monday</label>` }) : ""}
          ${card("Signature tracker", all.map(x => { const s = letterState(x); return `<div class="list-item" style="padding:9px 14px"><div class="li-ic ${s === "Signed" ? "ok" : s === "Sent" ? "warn" : ""}">${icon(s === "Signed" ? "check" : "file")}</div><div class="li-b"><b>${esc(gname(x))}</b><p>${s === "Sent" ? "Sent · reminder in 48 hours" : s === "Signed" ? "NDA and engagement letter signed" : "Draft ready to send"}</p></div></div>`; }).join(""), { tight: true })}
        </div></div>`);
    $$("[data-fee]").forEach(inp => inp.onchange = () => { (X().fee ||= {})[inp.dataset.fee] = Math.max(0, +inp.value || 0); BD.save(); render(); });
    $$("#docSeg button").forEach(b => b.onclick = () => { X().doc = b.dataset.d; BD.save(); render(); });
    const bm = $("#brokerMail"); if (bm) bm.innerHTML = md(`Subject: ${gname(e)}, weekly update\n\nHi ${e.brokerContact.split(" ")[0]},\n\nA quick update on ${gname(e)} (stage: ${e.stage.toLowerCase()}).\n- Census and claims files are in and reconciled.\n- ${e.id === "cedar-ridge" ? "The TPA, PBM and stop-loss bids are compared and the savings report is with the CFO." : "The cost-driver diagnostic is done; findings go to the benefits committee next."}\n- Nothing changes on your side: you keep the plan, the carrier relationships and the renewal.\n- One ask: the large-claimant report through August, if you have it.\n\nHappy to walk you through the numbers before we meet the client.`);
    const bs = $("#brokerSend"); if (bs) bs.onclick = () => { (X().brokerSent ||= {})[e.id] = now(); BD.save(); toast(`Update sent to ${e.brokerContact}`); render(); };
    const s = $("#sendSig"); if (s) s.onclick = () => { (X().sig ||= {})[e.id] = "Sent"; credit("letters", "letters:" + e.id); BD.save(); toast("Sent for e-signature · reminder in 48 hours"); render();
      setTimeout(() => { X().sig[e.id] = "Signed"; BD.save(); toast(`${e.contact} signed the NDA and engagement letter`); if (location.hash.startsWith("#/engagements")) render(); }, 2600); };
  }

  /* ================= website leads ================= */
  const LEADS = [
    { id: "brazos-bank", co: "Brazos Community Bank", who: "Rachel Kim", role: "CFO", hc: 410, state: "TX", spend: 5200000, fund: "Fully insured", pain: "Two double-digit renewals in a row", when: "Today 9:42 AM", score: 92,
      q: ["What does it cost if you find nothing?", "We've had our broker for 12 years. Do we have to leave?", "Could an ICHRA work for 410 people?"],
      a: ["Nothing: the retainer is refunded in full if we can't document savings.", "No. Your broker keeps the plan and the renewal; we work alongside them.", "It can. We model it on your actual census, including the affordability test for every employee, next to the other options."] },
    { id: "panhandle", co: "Panhandle Freight Lines", who: "Luis Carrera", role: "HR Director", hc: 1800, state: "TX", spend: 21000000, fund: "Self-funded", pain: "Stop-loss premium up 31%", when: "Today 8:15 AM", score: 88,
      q: ["How long does the diagnostic take?", "Our board meets quarterly. Does that work?"],
      a: ["About 30 days from the day we have claims and contracts, and it takes your team a few hours.", "Yes. The findings are built to hold through a full committee and board cycle."] },
    { id: "granite-hills", co: "Granite Hills Clinics", who: "Mark Ellison", role: "COO", hc: 260, state: "OK", spend: 3400000, fund: "Level-funded", pain: "High-cost claimants driving the renewal", when: "Yesterday", score: 84,
      q: ["What happens to employees in the middle of treatment?", "Can you work with our current administrator?"],
      a: ["Anyone in active treatment is identified first, and continuity of care is part of every option we model.", "Yes. Your administrator can bid alongside the others."] },
    { id: "blue-door", co: "Blue Door Bakery", who: "Sofia Reyes", role: "Owner", hc: 38, state: "TX", spend: 410000, fund: "Fully insured", pain: "Can't afford family coverage", when: "Yesterday", score: 61,
      q: ["Is the $0 care program really free for employees?", "Is it legal?"],
      a: ["For employees, the covered visits, labs and many prescriptions are $0.", "It's built under Section 125 and reviewed by benefits counsel before anyone enrolls."] },
  ];
  const route3 = hc => hc >= 1000 ? ["Enterprise review", "Diagnostic first, then a committee and board process"] : hc >= 100 ? ["Full savings review", "All three paths modeled on the census"] : ["Small group", "Start with the $0 care program"];
  route("/leads", () => lead(LEADS[0].id));
  route("/leads/:id", ({ id }) => lead(id));
  function lead(id) {
    const L = LEADS.find(x => x.id === id) || LEADS[0], done = (X().leads || {})[L.id], r = route3(L.hc);
    const mail = `Subject: Straight answers to your questions, ${L.co}\n\nHi ${L.who.split(" ")[0]},\n\nThanks for the questions you asked on our site today. Here are straight answers:\n${L.q.map((q, i) => `- **${q}** ${L.a[i]}`).join("\n")}\n\nFor ${L.hc.toLocaleString()} employees on ${L.fund.toLowerCase()} coverage, the first step is ${L.hc >= 1000 ? "a 30-day claims diagnostic" : L.hc >= 100 ? "a look at your census and renewal against all three paths" : "the $0 care program, which leaves your current plan in place"}.\n\nDo you have 20 minutes Tuesday at 10:00 or Thursday at 2:00?\n\n${S.who?.name || "Morgan Hale"}\n${DATA.firm}`;
    setPage([["Website leads"]], `${head("Website leads", "Conversations from the website assistant, scored, routed by size and answered the same day.")}
      <div class="grid" style="grid-template-columns:minmax(250px,330px) minmax(0,1fr)">
        <div class="card" style="align-self:start">${LEADS.map(x => `<a class="list-item" href="#/leads/${x.id}" style="text-decoration:none;color:inherit;${x.id === L.id ? "background:var(--accent-w)" : ""}"><div class="avatar s">${UI.initials(x.who)}</div><div class="li-b"><b>${x.co}</b><p>${x.who}, ${x.role} · ${x.hc.toLocaleString()} employees</p><div style="margin-top:4px">${(X().leads || {})[x.id] ? `<span class="chip ok">${(X().leads || {})[x.id]}</span>` : `<span class="chip ${x.score >= 85 ? "ok" : x.score >= 70 ? "info" : "warn"} plain">Fit ${x.score}</span>`}</div></div><div class="li-t">${x.when}</div></a>`).join("")}</div>
        <div class="stack">
          <div class="grid" style="grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);align-items:start">
            ${card("What they asked the website assistant", `${L.q.map(q => `<div class="bub me" style="margin:0 0 8px auto">${esc(q)}</div>`).join("")}<p class="muted" style="font-size:12.5px;margin:6px 0 0">${L.who}, ${L.role} · ${L.when}</p>`)}
            <div data-guide="lead-summary">${card(`${icon("spark")} Lead summary`, `<dl class="kv"><dt>Company</dt><dd>${L.co} (${L.state})</dd><dt>Employees</dt><dd>${L.hc.toLocaleString()}</dd><dt>Health plan spend</dt><dd>about ${k$(L.spend)} a year</dd><dt>Funding</dt><dd>${L.fund}</dd><dt>Main pain</dt><dd>${L.pain}</dd>
              <dt>${T("Routed to", "By headcount: under 100 start with the $0 care program, 100 to 999 get the full review, 1,000 and up the enterprise diagnostic")}</dt><dd data-guide="lead-route"><span class="chip accent">${r[0]}</span> <span class="muted" style="font-size:12.5px">${r[1]}</span></dd>
              <dt>Retainer at this size</dt><dd>${money(retainer(L.spend))} <span class="muted" style="font-size:12px">(${rule(L.spend).toLowerCase()})</span></dd></dl>
              <div class="alert ${L.score >= 85 ? "ok" : "warn"}" style="margin-top:12px">${icon("zap")}<div><b>Fit ${L.score} of 100.</b> ${L.hc >= 100 ? "Size fits the full review" : "Under 100 employees, so the $0 care program comes first"}; spend confirmed in the chat; the pain is renewal-driven; asked about ${L.q.length > 2 ? "cost, their broker and fit" : "process"}.</div></div>`)}</div>
          </div>
          ${card("Follow-up email", `<div class="draft">${md(mail)}</div>`, { sub: "answers every question they asked",
            foot: `<button class="btn primary" id="lSend">${icon("send")}Send follow-up</button><button class="btn" id="lBook">${icon("calendar")}Offer call times</button><button class="btn" id="lConv">${icon("plus")}Create engagement</button>` })}
        </div></div>`);
    const mark = (label, msg) => { (X().leads ||= {})[L.id] = label; credit("leads", "lead:" + L.id); BD.save(); toast(msg); render(); };
    $("#lSend").onclick = () => mark("Emailed", `Follow-up sent to ${L.who}`);
    $("#lBook").onclick = () => mark("Call offered", `Call times sent to ${L.who}`);
    $("#lConv").onclick = () => { const list = (X().newEng ||= []); if (!list.some(e => e.id === L.id)) list.push({ id: L.id, name: L.co, contact: L.who, title: L.role, spend: L.spend, stage: "Letter drafted", letter: "Draft", broker: "", brokerContact: "" });
      (X().leads ||= {})[L.id] = "Engagement created"; credit("leads", "lead:" + L.id); BD.save(); toast(`Engagement created for ${L.co}. NDA and letter drafted`); go("#/engagements/" + L.id); };
  }

  /* ================= claims diagnostic (Northfield) ================= */
  const DX = { group: "northfield", total: 17940000, employees: 1260,
    cats: [["Inpatient facility", 0.22, "Hospital stays, paid at 248% of Medicare on average"], ["Outpatient facility", 0.20, "Surgery centers, imaging and hospital outpatient, paid at 262% of Medicare"], ["Professional", 0.21, "Physician and clinician services"],
      ["Specialty drugs", 0.15, "60% of pharmacy spend on 2% of members"], ["Other prescription drugs", 0.10, "Brand and generic, spread-priced PBM contract"], ["Fixed costs", 0.12, "Administration, network access and stop loss"]],
    levers: [["Outpatient facility pricing", 640000, 850000, "Reference-based pricing or direct contracts at about 200% of Medicare on outpatient facility claims"], ["Specialty drugs", 320000, 480000, "Pass-through PBM pricing plus manufacturer assistance, 12% to 18% of specialty spend"],
      ["Fixed costs rebid", 170000, 300000, "Administration and stop loss out to bid, 8% to 14% of fixed costs"], ["Other prescription drugs", 110000, 160000, "Moving from spread to pass-through pricing, 6% to 9%"], ["High-cost claimant care management", 60000, 100000, "Case management on the 5 members over $250,000, 3% to 5% of their spend"]],
    hcc: [["Member A", "Oncology", 612000, "Ongoing"], ["Member B", "Cardiac surgery", 438000, "Resolved"], ["Member C", "Specialty drug (biologic)", 351000, "Ongoing"], ["Member D", "NICU", 296000, "Resolved"], ["Member E", "Dialysis", 262000, "Ongoing"]],
    files: [["Northfield medical claims, 24 months.csv", "41,882 claim lines"], ["Clarus Rx pharmacy claims, 24 months.csv", "18,406 fills"], ["Harborstone stop-loss contract.pdf", "$250,000 specific deductible"], ["ClearPath administration invoices, Jan to Aug 2026.pdf", "8 invoices"]] };
  const pepm = Array.from({ length: 24 }, (_, i) => Math.round(1048 * Math.pow(1.132, i / 23) * (1 + [0.02, -0.01, 0.015, -0.02, 0.01, 0, -0.015, 0.02, 0.005, -0.01, 0.012, -0.006, 0.018, -0.012, 0.004, 0.01, -0.018, 0.015, 0, -0.008, 0.012, 0.006, -0.01, 0][i])));
  function lineSVG(v, w = 560, h = 170) {
    const mx = Math.max(...v) * 1.03, mn = Math.min(...v) * 0.97, x = i => 36 + i * (w - 50) / (v.length - 1), y = n => h - 22 - (n - mn) / (mx - mn) * (h - 40), pts = v.map((n, i) => `${x(i)},${y(n)}`).join(" ");
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Cost per employee per month over 24 months"><line x1="36" y1="${h - 22}" x2="${w - 14}" y2="${h - 22}" stroke="#e3e6eb"/><polygon points="36,${h - 22} ${pts} ${x(v.length - 1)},${h - 22}" fill="var(--accent-w)"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>
      <text x="36" y="${h - 6}" font-size="10" fill="#8a93a5">Sep 2024</text><text x="${w - 14}" y="${h - 6}" font-size="10" fill="#8a93a5" text-anchor="end">Aug 2026</text><text x="${x(v.length - 1) - 4}" y="${y(v.at(-1)) - 8}" font-size="11" fill="#141a26" text-anchor="end" font-weight="700">${money(v.at(-1))}</text><text x="40" y="${y(v[0]) - 8}" font-size="11" fill="#4b5467">${money(v[0])}</text></svg>`;
  }
  route("/diagnostic", () => {
    const g = G(DX.group);
    if (!X().diag) {
      setPage([["Claims diagnostic"]], `${head("Claims diagnostic", `${g.name} · self-funded · ${num(DX.employees)} enrolled employees`)}${card("Reading the claims files", `<div id="dxRun"></div>`)}`);
      UI.runSteps($("#dxRun"), [...DX.files.map(([f, d]) => [`Reading ${esc(f)}`, async () => ({ detail: d })]), ["Grouping spend into cost drivers", async () => ({ detail: "6 categories" })], ["Pricing facility claims against Medicare", async () => ({ detail: "248% inpatient · 262% outpatient" })], ["Sizing the savings levers", async () => ({ detail: "5 levers" })]], 330)
        .then(() => { X().diag = true; credit("diagnostic"); BD.save(); if (location.hash.startsWith("#/diagnostic")) render(); });
      return;
    }
    const lo = DX.levers.reduce((s, l) => s + l[1], 0), hi = DX.levers.reduce((s, l) => s + l[2], 0), maxL = Math.max(...DX.levers.map(l => l[2]));
    const hccTotal = DX.hcc.reduce((s, h) => s + h[2], 0), reimb = DX.hcc.reduce((s, h) => s + Math.max(0, h[2] - 250000), 0), claims = DX.total * (1 - 0.12);
    const findings = [`**Outpatient facility pricing is the biggest lever:** paying about 200% of Medicare instead of 262% saves ${k$(DX.levers[0][1])} to ${k$(DX.levers[0][2])}.`, `**Specialty drugs are 60% of pharmacy spend.** Pass-through pricing and manufacturer assistance save ${k$(DX.levers[1][1])} to ${k$(DX.levers[1][2])}.`,
      `**Fixed costs are above market** for a group this size. A rebid saves ${k$(DX.levers[2][1])} to ${k$(DX.levers[2][2])}.`, `**Five members were over $250,000** (${k$(hccTotal)}, ${p1(hccTotal / claims)} of claims). Stop loss reimburses about ${k$(reimb)}; three are ongoing and continue into the next plan year.`,
      `**Cost per employee rose ${p1(pepm.at(-1) / pepm[0] - 1)} in two years.** Without changes, the next renewal is likely to land in double digits.`];
    setPage([["Claims diagnostic"]], `${head("Claims diagnostic", `${g.name} · self-funded · ${num(DX.employees)} enrolled employees · 24 months of claims`, `<button class="btn" onclick="UI.printOnly(document.querySelector('#dxPrint'))">${icon("printer")}Download findings</button>`)}
      <div id="dxPrint">
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Plan cost, last 12 months</div><div class="v">${k$(DX.total)}</div><div class="d">${money(DX.total / DX.employees / 12)} per employee per month</div></div>
        <div class="card kpi"><div class="l">Two-year cost trend</div><div class="v">${p1(pepm.at(-1) / pepm[0] - 1)}</div><div class="d">${money(pepm[0])} to ${money(pepm.at(-1))} PEPM</div></div>
        <div class="card kpi"><div class="l">${T("Facility prices", "What the plan pays hospitals and outpatient facilities, as a percentage of what Medicare pays for the same services")}</div><div class="v">262%</div><div class="d">of Medicare, outpatient</div></div>
        <div class="card kpi" style="border-color:var(--ok)"><div class="l">Savings opportunity</div><div class="v" style="color:var(--ok);font-size:22px;padding-top:4px">${k$(lo)} to ${k$(hi)}</div><div class="d">${p1(lo / DX.total)} to ${p1(hi / DX.total)} of plan cost</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        <div data-guide="dx-drivers">${card("Where the money goes", `<div class="bars">${DX.cats.map(([n, s, why]) => `<div data-cat="${UI.slug(n)}" style="margin-bottom:12px"><div class="row" style="font-size:13px"><b>${n}</b><span class="spacer"></span><span class="strong">${k$(DX.total * s)}</span><span class="muted" style="width:46px;text-align:right">${Math.round(s * 100)}%</span></div><div class="progress" style="margin-top:4px"><i style="width:${s / 0.22 * 100}%"></i></div><div class="muted" style="font-size:12px;margin-top:2px">${why}</div></div>`).join("")}</div>
          <p class="muted" style="font-size:12px;margin:4px 0 0">The six categories add up to the full ${k$(DX.total)}.</p>`)}</div>
        <div class="stack">
          ${card("Cost per employee per month", lineSVG(pepm) + `<p class="muted" style="font-size:12.5px;margin:6px 0 0">Up ${p1(pepm.at(-1) / pepm[0] - 1)} over 24 months, from ${money(pepm[0])} to ${money(pepm.at(-1))}.</p>`)}
          ${card("High-cost claimants", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Member</th><th>Category</th><th class="num">Paid, 12 mo</th><th class="num">${T("Stop loss", "Paid above the $250,000 specific deductible, reimbursed by the stop-loss carrier")}</th><th>Status</th></tr></thead><tbody>
            ${DX.hcc.map(h => `<tr><td class="nowrap">${h[0]}</td><td>${h[1]}</td><td class="num">${money(h[2])}</td><td class="num">${money(h[2] - 250000)}</td><td><span class="chip ${h[3] === "Ongoing" ? "warn" : "ok"} plain">${h[3]}</span></td></tr>`).join("")}</tbody>
            <tfoot><tr><td colspan="2">Total</td><td class="num">${money(hccTotal)}</td><td class="num">${money(reimb)}</td><td></td></tr></tfoot></table></div>`, { tight: true, sub: "de-identified" })}
        </div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        <div data-guide="dx-levers">${card("Savings levers", DX.levers.map(([n, a, b, how]) => `<div data-lever="${UI.slug(n)}" style="padding:10px 0;border-bottom:1px solid var(--line-2)"><div class="row"><b style="font-size:13.5px">${n}</b><span class="spacer"></span><b style="color:var(--ok)">${k$(a)} to ${k$(b)}</b></div>
            <div class="lever-bar"><i style="left:${a / maxL * 100}%;width:${(b - a) / maxL * 100}%"></i><s style="width:${a / maxL * 100}%"></s></div><div class="muted" style="font-size:12px">${how}</div></div>`).join("") + `<div class="row" style="padding-top:10px"><b>Total</b><span class="spacer"></span><b style="color:var(--ok)">${k$(lo)} to ${k$(hi)}</b></div>`)}</div>
        ${card("Files read", DX.files.map(([f, d]) => `<div class="file-row"><div class="file-ic ${/\.pdf$/.test(f) ? "pdf" : "csv"}">${/\.pdf$/.test(f) ? "PDF" : "CSV"}</div><div class="meta"><b>${esc(f)}</b><small>${d}</small></div><span class="chip ok">Read</span></div>`).join(""), { tight: true })}
      </div>
      ${card(`${icon("spark")} Findings`, `<div class="draft" id="dxFind"></div>`, { guide: "dx-findings" })}
      </div>`);
    once("dx", $("#dxFind"), findings.map(f => "- " + f).join("\n"));
  });

  /* ================= savings models on the Trinity Oak census ================= */
  const AGE_CURVE = { 21: 1, 22: 1, 23: 1, 24: 1, 25: 1.004, 26: 1.024, 27: 1.048, 28: 1.087, 29: 1.119, 30: 1.135, 31: 1.159, 32: 1.183, 33: 1.198, 34: 1.214, 35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262, 40: 1.278, 41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397, 45: 1.444, 46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706, 50: 1.786, 51: 1.865, 52: 1.952, 53: 2.04, 54: 2.135, 55: 2.23, 56: 2.333, 57: 2.437, 58: 2.548, 59: 2.603, 60: 2.714, 61: 2.81, 62: 2.873, 63: 2.952, 64: 3 };
  const LCS21 = 375; // lowest-cost silver, age 21, Collin County sample rate
  const zipF = zip => /^762/.test(zip) ? 0.98 : 1;
  const lcs = (age, zip) => Math.round(LCS21 * (AGE_CURVE[clamp(age ?? 40, 21, 64)] || 1) * zipF(zip));
  const MIN_WAGE_MONTH = 7.25 * 2080 / 12;
  let CEN = null;
  async function census() {
    if (CEN) return CEN;
    const f = await UI.fetchSample("samples/trinity-oak/" + encodeURIComponent("TrinityOak_employee list FINAL (2).csv")); const text = await f.text();
    const r = Parsers.census(text, f.name), rows = UI.parseCSV(text), si = rows[0].findIndex(h => /salary/i.test(h)), oi = rows[0].findIndex(h => /office/i.test(h));
    CEN = r.people.map(p => ({ name: `${p.first} ${p.last}`, age: p.age, zip: p.zip, office: rows[p.line - 1]?.[oi] || p.location, salary: UI.parseMoney(rows[p.line - 1]?.[si] || "0"), deps: p.deps.length, tier: p.tier }));
    return CEN;
  }
  const FD = () => ({ part: 85, pretax: 1250, cost: 49, setup: 1500, ...(X().fd || {}) });
  const ICH = () => ({ b1: 360, b2: 440, b3: 480, dep: 380, admin: 18, aff: 9.96, share: 72, ...(X().ich || {}) });
  const band = a => (a ?? 40) < 30 ? "b1" : (a ?? 40) < 50 ? "b2" : "b3";
  const BANDS = { b1: "Under 30", b2: "30 to 49", b3: "50 and over" };
  function calcFD(emps) {
    const p = FD(), n = Math.round(emps.length * p.part / 100), fica = n * p.pretax * 12 * 0.0765, cost = n * p.cost * 12, net = fica - cost;
    return { p, n, fica, cost, net, year1: net - p.setup, day: net > 0 ? Math.max(1, Math.round(p.setup / (net / 365))) : null, empGain: p.pretax * 0.0765,
      rows: emps.map(e => ({ ...e, ok: e.salary / 12 - p.pretax >= MIN_WAGE_MONTH })) };
  }
  function calcICH(emps) {
    const p = ICH(), g = G("trinity-oak");
    const rows = emps.map(e => { const self = p[band(e.age)], allow = self + (e.deps ? p.dep : 0), prem = lcs(e.age, e.zip), cost = Math.max(0, prem - self), limit = Math.round(e.salary / 12 * p.aff / 100); return { ...e, self, allow, prem, cost, limit, pass: cost <= limit }; });
    const budget = rows.reduce((s, r) => s + r.allow * 12, 0), admin = p.admin * 12 * rows.length, total = budget + admin, current = g.renewalAnnual * p.share / 100;
    return { p, rows, budget, admin, total, current, savings: current - total, pct: (current - total) / current, fails: rows.filter(r => !r.pass) };
  }
  const slider = (key, label, v, min, max, step, fmt, tip) => `<div class="field"><label class="sl-l"><span>${label} ${tip ? I(tip) : ""}</span><b data-out="${key}">${fmt(v)}</b></label><input type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
  function barsSVG(v, w = 560, h = 160) {
    const top = Math.max(0, ...v), bot = Math.min(0, ...v), span = (top - bot) || 1, z = 8 + (h - 16) * top / span, bw = (w - 30) / v.length, sc = (h - 16) / span;
    return `<svg viewBox="0 0 ${w} ${h + 16}" width="100%" role="img" aria-label="Cumulative cash flow by month"><line x1="16" y1="${z}" x2="${w - 8}" y2="${z}" stroke="#c9d0da"/>${v.map((n, i) => { const bh = Math.max(1, Math.abs(n) * sc); return `<rect x="${20 + i * bw}" y="${n >= 0 ? z - bh : z}" width="${bw - 6}" height="${bh}" rx="2" fill="${n >= 0 ? "#0e7a4f" : "#d98a00"}"/><text x="${20 + i * bw + (bw - 6) / 2}" y="${h + 12}" font-size="10" text-anchor="middle" fill="#8a93a5">M${i + 1}</text>`; }).join("")}</svg>`;
  }
  route("/models", () => models("ichra"));
  route("/models/:tab", ({ tab }) => models(tab));
  async function models(tab) {
    const g = G("trinity-oak");
    setPage([["Savings models"]], `${head("Savings models", `${g.name} · ${g.enrolled} enrolled of ${g.eligible} eligible · renewal ${money(g.renewalAnnual)} (${UI.pct((g.renewalAnnual / g.annual - 1) * 100)})`)}
      <div class="tabs"><a href="#/models/first-dollar" class="${tab === "first-dollar" ? "on" : ""}">First-dollar care</a><a href="#/models/ichra" class="${tab !== "first-dollar" ? "on" : ""}">Employee-owned (ICHRA)</a><a href="#/savings-proposal">Savings proposal</a></div><div id="mBody"><div class="empty">${icon("refresh")}<p>Reading the census…</p></div></div>`);
    const emps = await census(); if (!$("#mBody")) return;
    credit("models");
    (tab === "first-dollar" ? firstDollar : ichra)(emps);
  }
  function firstDollar(emps) {
    const r = calcFD(emps), p = r.p, cum = Array.from({ length: 12 }, (_, i) => Math.round(r.net / 12 * (i + 1) - p.setup));
    $("#mBody").innerHTML = `<div class="grid g-main" style="grid-template-columns:320px minmax(0,1fr)">
      ${card("Inputs", slider("part", "Participation", p.part, 30, 100, 1, v => v + "%") + slider("pretax", "Pre-tax amount per enrollee / month", p.pretax, 400, 2000, 25, money, "The monthly amount run through the Section 125 plan before payroll taxes") +
        slider("cost", "Program cost per enrollee / month", p.cost, 20, 100, 1, money) + slider("setup", "One-time setup", p.setup, 0, 10000, 250, money) +
        `<p class="muted" style="font-size:12.5px;margin:0">${emps.length} employees on the census · ${r.n} enrolled at ${p.part}%</p>`)}
      <div class="stack">
        <div class="grid g4" data-guide="fd-kpis"><div class="card kpi"><div class="l">Payroll tax saved / yr</div><div class="v">${k$(r.fica)}</div><div class="d">7.65% employer FICA</div></div><div class="card kpi"><div class="l">Program cost / yr</div><div class="v">${k$(r.cost)}</div></div>
          <div class="card kpi"><div class="l">Net to the practice / yr</div><div class="v" style="color:${r.net >= 0 ? "var(--ok)" : "var(--crit)"}">${k$(r.net)}</div></div><div class="card kpi"><div class="l">Cash-flow positive</div><div class="v">${r.day ? "Day " + r.day : "Not at these inputs"}</div></div></div>
        ${card("Cumulative cash flow, first 12 months", barsSVG(cum) + `<p class="muted" style="font-size:12.5px;margin:4px 0 0">${money(cum.at(-1))} by month 12, after the ${money(p.setup)} setup.</p>`)}
        ${card(`${icon("spark")} Read-out`, `<div class="draft" id="fdOut"></div><div class="alert warn" style="margin-top:10px">${icon("shield")}<div>Payroll tax treatment depends on how the program is built. Have benefits counsel confirm the structure before anyone enrolls.</div></div>`)}
      </div></div>
      ${card("Employee check", `<div class="tbl-wrap" style="max-height:380px;overflow:auto"><table class="t"><thead><tr><th>Employee</th><th>Office</th><th class="num">Salary</th><th>${T("Take-home check", "Monthly pay after the pre-tax amount stays above the federal minimum wage")}</th><th class="num">Employee payroll tax saved / mo</th></tr></thead><tbody>
        ${r.rows.map(e => `<tr><td>${esc(e.name)}</td><td>${esc(e.office)}</td><td class="num">${money(e.salary)}</td><td><span class="chip ${e.ok ? "ok" : "warn"} plain">${e.ok ? "Eligible" : "Review"}</span></td><td class="num">${e.ok ? money(r.empGain) : "—"}</td></tr>`).join("")}</tbody></table></div>`, { tight: true, sub: "from the Trinity Oak census" })}`;
    const txt = r.net > 0 ? `About ${r.n} of ${emps.length} employees enroll. The practice saves ${money(r.fica)} a year in payroll taxes, pays ${money(r.cost)} for the program and nets ${money(r.net)}, turning cash-flow positive around day ${r.day}. Employees get $0 telehealth, mental health, primary care, labs and many prescriptions, and keep about ${money(r.empGain)} a month in payroll taxes. The current medical plan stays as it is, so this is the low-risk first step.` : `At these inputs the program costs more than it saves: each enrollee saves ${money(p.pretax * 12 * 0.0765)} a year in employer payroll tax against ${money(p.cost * 12)} in program cost. Raise the pre-tax amount or negotiate the per-enrollee price; participation doesn't change the break-even.`;
    $("#fdOut").innerHTML = md(txt);
    bindSliders("fd", () => firstDollar(emps));
  }
  function ichra(emps) {
    const r = calcICH(emps), p = r.p, fixed = X().ichFixed || [];
    const need = {}; r.fails.forEach(e => { const b = band(e.age); need[b] = Math.max(need[b] || 0, Math.ceil((e.cost - e.limit) / 10) * 10); });
    const advice = r.fails.length ? `${r.fails.length} employee${r.fails.length > 1 ? "s fail" : " fails"} the affordability test: ${r.fails.map(e => `${e.name} (${e.age}, ${money(e.salary)}) would pay ${money(e.cost)} a month against a ${money(e.limit)} limit`).join("; ")}. Raising the ${Object.entries(need).map(([b, v]) => `${BANDS[b].toLowerCase()} allowance by ${money(v)}`).join(" and ")} fixes ${r.fails.length > 1 ? "all of them" : "it"} and still saves about ${p1((r.savings - Object.entries(need).reduce((s, [b, v]) => s + v * 12 * r.rows.filter(x => band(x.age) === b).length, 0)) / r.current)}.`
      : `Every employee passes the affordability test. Trinity Oak moves to a fixed ${money(r.total)} budget and saves ${money(r.savings)} (${p1(r.pct)}) against its share of the renewal. A bad claims year can't move this number.`;
    $("#mBody").innerHTML = `<div class="grid g-main" style="grid-template-columns:320px minmax(0,1fr)">
      ${card("Allowance design", slider("b1", "Under 30, per month", p.b1, 200, 900, 10, money) + slider("b2", "30 to 49, per month", p.b2, 200, 1100, 10, money) + slider("b3", "50 and over, per month", p.b3, 300, 1500, 10, money) +
        slider("dep", "Added for employees with dependents", p.dep, 0, 900, 10, money) + slider("admin", "ICHRA administration per employee / month", p.admin, 0, 50, 1, money) +
        slider("share", "Practice pays today, % of premium", p.share, 40, 100, 1, v => v + "%", "Share of the renewal premium the practice pays under its current contribution strategy") +
        slider("aff", "Affordability threshold", p.aff, 8, 10.5, 0.01, v => (+v).toFixed(2) + "%", "2026 IRS affordability percentage: the employee's self-only cost for the lowest-cost silver plan, after the allowance, can't exceed this share of income"))}
      <div class="stack">
        <div class="grid g4"><div class="card kpi"><div class="l">Practice's share of renewal</div><div class="v">${k$(r.current)}</div><div class="d">${p.share}% of ${money(G("trinity-oak").renewalAnnual)}</div></div><div class="card kpi"><div class="l">ICHRA budget + admin</div><div class="v">${k$(r.total)}</div><div class="d">fixed, set by the practice</div></div>
          <div class="card kpi"><div class="l">Year-one savings</div><div class="v" style="color:${r.savings >= 0 ? "var(--ok)" : "var(--crit)"}">${k$(r.savings)}</div><div class="d">${p1(r.pct)}</div></div><div class="card kpi" data-guide="ich-afford-kpi"><div class="l">Affordability</div><div class="v" style="color:${r.fails.length ? "var(--crit)" : "var(--ok)"}">${r.fails.length ? r.fails.length + " fail" : "All pass"}</div><div class="d">${r.rows.length} employees tested</div></div></div>
        <div data-guide="ich-advice">${card(`${icon("spark")} Design advice`, `<div class="draft">${md(advice)}</div>`, { actions: r.fails.length ? `<button class="btn sm primary" id="ichFix">${icon("check")}Apply fix</button>` : fixed.length ? '<span class="chip ok">Fixed</span>' : "" })}</div>
        ${card("Budget by age band", ["b1", "b2", "b3"].map(b => { const rows = r.rows.filter(x => band(x.age) === b), tot = rows.reduce((s, x) => s + x.allow * 12, 0); return `<div class="bar-row" style="grid-template-columns:110px 1fr 160px;margin-bottom:8px"><span>${BANDS[b]}</span><div class="track"><i style="width:${tot / r.budget * 100}%"></i></div><span class="num">${money(tot)} · ${rows.length} people</span></div>`; }).join(""))}
      </div></div>
      <div data-guide="ich-afford">${card("Affordability, employee by employee", `<div class="tbl-wrap" style="max-height:420px;overflow:auto"><table class="t"><thead><tr><th>Employee</th><th class="num">Age</th><th>Office</th><th class="num">Salary</th><th class="num">Allowance</th><th class="num">${T("Lowest-cost silver", "Self-only premium for the lowest-cost silver plan in the employee's rating area, by age")}</th><th class="num">Employee pays</th><th class="num">${T("Limit", "Affordability threshold × monthly pay")}</th><th>Result</th></tr></thead><tbody>
        ${[...r.rows].sort((a, b) => (a.pass - b.pass) || (fixed.includes(b.name) - fixed.includes(a.name))).map(e => `<tr data-emp="${esc(e.name)}" ${fixed.includes(e.name) ? "data-fixed" : ""} class="${e.pass ? "" : "bad"}"><td>${esc(e.name)}${e.age == null ? ' <span class="chip warn plain">No DOB, age 40 used</span>' : ""}</td><td class="num">${e.age ?? "—"}</td><td>${esc(e.office)}</td><td class="num">${money(e.salary)}</td><td class="num">${money(e.allow)}</td><td class="num">${money(e.prem)}</td><td class="num">${money(e.cost)}</td><td class="num">${money(e.limit)}</td><td><span class="chip ${e.pass ? "ok" : "crit"}">${e.pass ? (fixed.includes(e.name) ? "Affordable after fix" : "Affordable") : "Fails"}</span></td></tr>`).join("")}</tbody></table></div>`, { tight: true, sub: "from the Trinity Oak census" })}</div>`;
    bindSliders("ich", () => ichra(emps));
    const fx = $("#ichFix"); if (fx) fx.onclick = () => { const o = (X().ich ||= {}); Object.entries(need).forEach(([b, v]) => o[b] = ICH()[b] + v); X().ichFixed = r.fails.map(e => e.name); BD.save(); toast(`Allowances adjusted · all ${r.rows.length} employees pass`); ichra(emps); };
  }
  function bindSliders(key, redraw) {
    $$("input[type=range][data-k]").forEach(s => {
      s.oninput = () => { const o = (X()[key] ||= {}); o[s.dataset.k] = +s.value; const out = $(`[data-out="${s.dataset.k}"]`); if (out) out.textContent = /aff/.test(s.dataset.k) ? (+s.value).toFixed(2) + "%" : /part|share/.test(s.dataset.k) ? s.value + "%" : money(+s.value); clearTimeout(s._t); s._t = setTimeout(() => { const y = window.scrollY; redraw(); window.scrollTo(0, y); BD.save(); }, 160); };
    });
  }

  /* ================= savings proposal ================= */
  route("/savings-proposal", async () => {
    const g = G("trinity-oak"), e = ENG.find(x => x.id === "trinity-oak");
    setPage([["Savings proposal"]], `${head("Savings proposal", `${g.name} · all three paths in one written savings number`)}<div id="spBody"><div class="empty">${icon("refresh")}<p>Building…</p></div></div>`);
    const emps = await census(); if (!$("#spBody")) return;
    const fd = calcFD(emps), ich = calcICH(emps), share = ich.p.share / 100, tiers = DATA.rfp["trinity-oak"].tiers;
    let mkt = null;
    if (S.fi.plans.length) { const ren = S.fi.plans.find(p => p.isRenewal), rec = S.fi.plans.find(p => p.id === S.recommend) || S.fi.plans.filter(p => !p.isRenewal).sort((a, b) => BD.planCost(a, tiers) - BD.planCost(b, tiers))[0];
      if (ren && rec) mkt = { name: rec.carrier, plan: rec.name, save: (BD.planCost(ren, tiers) - BD.planCost(rec, tiers)) * 12 * share }; }
    const best = mkt && mkt.save > ich.savings ? { k: `Market bid: ${mkt.name}`, n: "3", save: mkt.save } : { k: "Employee-owned coverage (ICHRA)", n: "2", save: ich.savings };
    const total = Math.max(0, fd.year1) + best.save, f = FEE(), ret = retainer(e.spend), perf = total * f.perf / 100, keeps = total - ret - perf;
    credit("proposal", "proposal:savings");
    $("#spBody").innerHTML = `<div class="grid g-main-l" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)">
      <div class="stack">
        ${card("The three paths", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Path</th><th class="num">Practice's cost</th><th class="num">Year-one savings</th></tr></thead><tbody>
          <tr><td>Current plan, renewal</td><td class="num">${money(ich.current)}</td><td class="num">—</td></tr>
          <tr><td><b>1.</b> First-dollar care, on top of the plan <a href="#/models/first-dollar" class="muted" style="font-size:12px">model</a></td><td class="num">${money(ich.current - fd.year1)}</td><td class="num" style="color:var(--ok)">${money(fd.year1)}</td></tr>
          <tr><td><b>2.</b> Employee-owned coverage (ICHRA) <a href="#/models/ichra" class="muted" style="font-size:12px">model</a></td><td class="num">${money(ich.total)}</td><td class="num" style="color:var(--ok)">${money(ich.savings)}</td></tr>
          <tr><td><b>3.</b> ${mkt ? `Market bid: ${esc(mkt.name)} ${esc(mkt.plan)}` : "Market bid"} <a href="#/marketing/trinity-oak/compare" class="muted" style="font-size:12px">${mkt ? "comparison" : "read the quotes"}</a></td><td class="num">${mkt ? money(ich.current - mkt.save) : "—"}</td><td class="num" style="color:var(--ok)">${mkt ? money(mkt.save) : '<span class="muted">quotes not read yet</span>'}</td></tr>
          <tr class="sel"><td><b>Recommended: 1 + ${best.n}</b></td><td class="num strong">${money(ich.current - total)}</td><td class="num strong" style="color:var(--ok)">${money(total)}</td></tr></tbody></table></div>`, { tight: true, sub: `at the practice's ${ich.p.share}% share of premium` })}
        ${card(`${icon("spark")} Why this path`, `<div class="draft" id="spWhy"></div>`)}
        <div class="row"><button class="btn primary" onclick="UI.printOnly(document.querySelector('#spReport'))">${icon("printer")}Download client proposal</button><button class="btn" id="spLetter">${icon("file")}Savings guarantee letter</button></div>
      </div>
      <div data-guide="receipt"><div class="receipt"><h3>Savings in writing</h3><p class="muted" style="text-align:center;margin:0 0 12px">${g.name} · ${emps.length} employees</p>
        <div class="ln"><span>Practice's share of the renewal</span><b>${money(ich.current)}</b></div>
        <div class="ln"><span>${best.k}</span><b style="color:var(--ok)">−${money(best.save)}</b></div>
        <div class="ln"><span>First-dollar care, net of setup</span><b style="color:var(--ok)">−${money(Math.max(0, fd.year1))}</b></div>
        <div class="ln"><span>New annual cost</span><b>${money(ich.current - total)}</b></div>
        <div class="tot">${money(total)}</div><p style="text-align:center;margin:0" class="muted">year-one savings · ${p1(total / ich.current)}</p>
        <div class="ln" style="margin-top:14px"><span>Retainer (${rule(e.spend).toLowerCase()})</span><span>${money(ret)}</span></div>
        <div class="ln"><span>Performance fee (${f.perf}%)</span><span>${money(perf)}</span></div>
        <div class="ln"><span>Practice keeps</span><b style="color:var(--ok)">${money(keeps)}</b></div>
        <p class="muted" style="text-align:center;font-size:12px;margin:12px 0 0">If the savings aren't documented, the retainer is refunded within ${f.refund} days.</p></div></div>
    </div>
    <div class="report hide-screen" id="spReport"><div class="rep-meta">${DATA.firm.toUpperCase()} · SAVINGS PROPOSAL</div><h1 style="margin-top:8px">${g.name}</h1><div class="rep-meta">${emps.length} employees · prepared September 16, 2026</div>
      <h2>Year-one savings: ${money(total)} (${p1(total / ich.current)})</h2><p>Against the practice's ${money(ich.current)} share of the ${money(g.renewalAnnual)} renewal.</p>
      <h2>The plan, in order</h2><table class="t"><tbody><tr><td>1. First-dollar care: $0 telehealth, mental health, primary care, labs and many prescriptions for about ${fd.n} employees</td><td class="num">${money(fd.year1)}</td></tr><tr><td>${best.n}. ${esc(best.k)}</td><td class="num">${money(best.save)}</td></tr></tbody></table>
      <h2>Fees and guarantee</h2><table class="t"><tbody><tr><td>Retainer</td><td class="num">${money(ret)}</td></tr><tr><td>Performance fee, ${f.perf}% of documented savings</td><td class="num">${money(perf)}</td></tr><tr><td><b>Practice keeps</b></td><td class="num"><b>${money(keeps)}</b></td></tr></tbody></table>
      <p>If documented savings do not appear, the retainer is refunded in full within ${f.refund} days.</p><p class="muted" style="font-size:12px;margin-top:24px">Figures are estimates until confirmed against underwritten quotes. Sample document: all companies and figures are fictional.</p></div>`;
    once("spWhy", $("#spWhy"), `${best.k} saves more than any other single move for ${g.name} (${money(best.save)}). First-dollar care stacks on top without changing the medical plan. After the retainer and performance fee, the practice still keeps ${money(keeps)} in year one.${mkt ? "" : " Read the carrier quotes to add the market bid to the comparison."}`);
    $("#spLetter").onclick = () => modal({ title: "Savings guarantee letter", wide: true, body: `<div class="report letter" id="guarDoc">${letter(`SAVINGS GUARANTEE\n\nSeptember 16, 2026\n\n${g.name}\nAttention: ${e.contact}, ${e.title}\n\nWe will document year-one savings for ${g.name} from the plan in our proposal dated today, currently estimated at ${money(total)} against the practice's ${money(ich.current)} share of the renewal.\n\nIf documented savings do not appear, the ${money(ret)} retainer is refunded in full within ${f.refund} days.\n\nPerformance fees (${f.perf}%) apply only to savings that are documented, and are invoiced as those savings are realized.\n\n______________________\n${DATA.firm}`)}</div>`,
      actions: [{ label: "Close" }, { label: "Download PDF", primary: true, onClick: () => UI.printOnly(document.querySelector("#guarDoc")) }] });
  });

  /* ================= savings tracker (Alder & Finch, ICHRA since January) ================= */
  const TR = { group: "alder-finch", baseYear: 709590, actual: [49210, 49880, 50140, 50920, 53960, 51230, 51480, 51890], months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"] };
  const trackCalc = () => { const base = TR.baseYear / 12, sv = TR.actual.map(a => base - a); const cum = sv.reduce((a, v) => (a.push((a.at(-1) || 0) + v), a), []); return { base, sv, cum }; };
  route("/tracker", () => {
    const g = G(TR.group), t = trackCalc(), f = FEE(), proj = t.cum.at(-1) / TR.actual.length * 12, guar = 85000, maxV = Math.max(t.base, ...TR.actual) * 1.05;
    credit("tracker");
    setPage([["Savings tracker"]], `${head("Savings tracker", `${g.name} · moved to ICHRA January 1, 2026 · baseline is the prior group plan, trended`, `<button class="btn" id="trCert">${icon("file")}Savings certificate</button>`)}
      <div class="grid g4" style="margin-bottom:16px" data-guide="tracker">
        <div class="card kpi" style="border-color:var(--ok)"><div class="l">Documented savings, Jan to Aug</div><div class="v" style="color:var(--ok)">${money(t.cum.at(-1))}</div><div class="d">${p1(t.cum.at(-1) / (t.base * TR.actual.length))} under baseline</div></div>
        <div class="card kpi"><div class="l">Projected for 2026</div><div class="v">${money(proj)}</div><div class="d">at the average so far</div></div>
        <div class="card kpi"><div class="l">${T("Savings in writing", "The year-one figure in the signed proposal")}</div><div class="v">${money(guar)}</div><div class="d"><span class="up">${p1(proj / guar - 1)} ahead</span></div></div>
        <div class="card kpi"><div class="l">Performance fee earned</div><div class="v">${money(t.cum.at(-1) * f.perf / 100)}</div><div class="d">${f.perf}% of documented savings</div></div>
      </div>
      <div class="grid g-main-l" style="margin-bottom:16px">
        ${card("Baseline vs actual, by month", `<svg viewBox="0 0 560 200" width="100%" role="img" aria-label="Baseline versus actual cost by month">${TR.actual.map((a, i) => { const bw = 520 / TR.actual.length, x = 24 + i * bw, hb = t.base / maxV * 160, ha = a / maxV * 160;
            return `<rect x="${x}" y="${180 - hb}" width="${bw / 2 - 4}" height="${hb}" fill="#c9d0da"/><rect x="${x + bw / 2 - 4}" y="${180 - ha}" width="${bw / 2 - 4}" height="${ha}" fill="${i === 4 ? "#d98a00" : "#0e7a4f"}"/><text x="${x + bw / 2 - 4}" y="195" font-size="10" text-anchor="middle" fill="#8a93a5">${TR.months[i]}</text>`; }).join("")}</svg>
          <p class="muted" style="font-size:12.5px;margin:4px 0 0"><span style="color:#9aa3b2">■</span> Baseline ${money(t.base)} a month · <span style="color:#0e7a4f">■</span> Actual allowances and administration</p>`)}
        <div class="stack">
          ${card("30-day checkpoint", `<div class="alert ok">${icon("check")}<div><b>Passed January 31.</b> Savings verified from the first reimbursement report and payroll. Retainer kept.</div></div>`)}
          ${card(`${icon("spark")} Watch list`, `<div class="draft" id="trWatch"></div>`)}
        </div>
      </div>
      ${card("Monthly ledger", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Month</th><th class="num">Baseline</th><th class="num">Actual</th><th class="num">Saved</th><th class="num">Cumulative</th><th class="num">Fee accrued</th><th>${T("Source", "Each month is matched to the ICHRA administrator's reimbursement report and payroll")}</th></tr></thead><tbody>
        ${TR.actual.map((a, i) => `<tr><td>${TR.months[i]} 2026</td><td class="num">${money(t.base)}</td><td class="num">${money(a)}</td><td class="num" style="color:var(--ok);font-weight:600">${money(t.sv[i])}</td><td class="num">${money(t.cum[i])}</td><td class="num">${money(t.sv[i] * f.perf / 100)}</td><td><span class="chip ok plain">Reimbursements + payroll matched</span></td></tr>`).join("")}</tbody></table></div>`, { tight: true })}`);
    once("tr", $("#trWatch"), `- May ran ${money(TR.actual[4] - TR.actual[3])} over April: three new hires with family allowances. Still ${money(t.sv[4])} under baseline.\n- Allowance use is at 94% of budget, in line with the model.\n- The Q3 performance fee invoice goes out October 5.\n- Next check: August reimbursement report reconciled on the 10th.`);
    $("#trCert").onclick = () => modal({ title: "Certificate of documented savings", wide: true, body: `<div class="report letter" id="certDoc">${letter(`CERTIFICATE OF DOCUMENTED SAVINGS\n\n${g.name}\nJanuary 1 to August 31, 2026\n\nDocumented savings: **${money(t.cum.at(-1))}** against a trended baseline of ${money(t.base * TR.actual.length)}.\n\n${TR.actual.map((a, i) => `- ${TR.months[i]}: ${money(t.sv[i])}`).join("\n")}\n\nEach month is matched to the ICHRA administrator's reimbursement report and payroll records.\n\n______________________\n${DATA.firm}`)}</div>`,
      actions: [{ label: "Close" }, { label: "Download PDF", primary: true, onClick: () => UI.printOnly(document.querySelector("#certDoc")) }] });
  });

  /* ================= fees & invoices ================= */
  route("/fees", () => {
    const f = FEE(), t = trackCalc(), sfSave = sfSavings();
    const q = [[0, 3], [3, 6], [6, 8]].map(([a, b]) => t.sv.slice(a, b).reduce((s, v) => s + v, 0) * f.perf / 100);
    const rows = engs().map(e => { const s = letterState(e); return { e, ret: retainer(e.spend), status: s === "Signed" ? "Paid" : s === "Sent" ? "Invoice on signature" : "Letter not sent", perf: e.id === "alder-finch" ? t.cum.at(-1) * f.perf / 100 : e.id === "cedar-ridge" && sfSave ? sfSave * f.perf / 100 : null }; });
    setPage([["Fees & invoices"]], `${head("Fees & invoices", "Retainers and performance fees from the fee terms, tied to documented savings.", `<a class="btn" href="#/engagements">${icon("gear")}Fee terms</a><a class="btn" href="#/commissions">${icon("dollar")}Commissions</a>`)}
      <div class="grid g4" style="margin-bottom:16px">
        <div class="card kpi"><div class="l">Retainers in book</div><div class="v">${money(rows.reduce((s, r) => s + r.ret, 0))}</div><div class="d">${rows.length} fee-based clients</div></div>
        <div class="card kpi"><div class="l">Retainers collected</div><div class="v">${money(rows.filter(r => r.status === "Paid").reduce((s, r) => s + r.ret, 0))}</div></div>
        <div class="card kpi"><div class="l">Performance fees earned</div><div class="v">${money(t.cum.at(-1) * f.perf / 100)}</div><div class="d">Alder & Finch, Jan to Aug</div></div>
        <div class="card kpi"><div class="l">Retainers at refund risk</div><div class="v">$0</div><div class="d">every live client is ahead of plan</div></div>
      </div>
      <div data-guide="fees">${card("Client fee book", `<div class="tbl-wrap"><table class="t"><thead><tr><th>Client</th><th class="num">Annual spend</th><th>Rule</th><th class="num">Retainer</th><th>Retainer status</th><th class="num">Performance fee</th><th></th></tr></thead><tbody>
        ${rows.map(r => `<tr><td><b>${esc(gname(r.e))}</b><div class="muted" style="font-size:12px">${esc(r.e.stage)}</div></td><td class="num">${k$(r.e.spend)}</td><td><span class="chip ${rule(r.e.spend) === "Cap" ? "violet" : rule(r.e.spend) === "Minimum" ? "info" : ""} plain">${rule(r.e.spend)}</span></td><td class="num strong">${money(r.ret)}</td>
          <td><span class="chip ${r.status === "Paid" ? "ok" : r.status === "Invoice on signature" ? "warn" : ""}">${r.status}</span></td><td class="num">${r.perf != null ? money(r.perf) + (r.e.id === "cedar-ridge" ? ' <span class="muted" style="font-size:11.5px">projected</span>' : "") : '<span class="muted">after go-live</span>'}</td><td><button class="btn sm" data-inv="${r.e.id}">${icon("file")}Invoice</button></td></tr>`).join("")}</tbody></table></div>`, { tight: true })}</div>
      <div class="grid g-main-l" style="margin-top:16px">
        ${card("Performance fee schedule · Alder & Finch", `<table class="t"><thead><tr><th>Quarter</th><th class="num">Documented savings</th><th class="num">Fee (${f.perf}%)</th><th>Status</th></tr></thead><tbody>
          ${["Q1 2026", "Q2 2026", "Q3 2026 to date"].map((l, i) => `<tr><td>${l}</td><td class="num">${money(q[i] * 100 / f.perf)}</td><td class="num">${money(q[i])}</td><td><span class="chip ${i < 2 ? "ok" : "warn"}">${i < 2 ? "Paid" : "Invoice Oct 5"}</span></td></tr>`).join("")}</tbody></table>`, { tight: true })}
        ${card("How fees are set", `<div class="steps">${[`Retainer: ${f.pct}% of annual spend, between ${money(f.min)} and ${money(f.max)}`, `Performance fee: ${f.perf}% of documented year-one savings`, "Invoiced quarterly, only after savings are matched to invoices and payroll", `Retainer refunded within ${f.refund} days if savings don't appear`].map(t => `<div class="step done"><span class="s-ic"></span><span>${t}</span></div>`).join("")}</div>`)}
      </div>`);
    $$("[data-inv]").forEach(b => b.onclick = () => { const e = engs().find(x => x.id === b.dataset.inv), n = "INV-" + (2600 + engs().indexOf(e) * 7 + 11), r = retainer(e.spend);
      modal({ title: `Invoice ${n}`, wide: true, body: `<div class="report letter" id="invDoc"><div class="rep-meta">${DATA.firm.toUpperCase()} · INVOICE ${n}</div><h1 style="margin-top:8px">${esc(gname(e))}</h1><div class="rep-meta">Attention: ${esc(e.contact)}, ${esc(e.title)} · September 16, 2026 · due in 15 days</div>
        <table class="t" style="margin-top:18px"><thead><tr><th>Description</th><th class="num">Amount</th></tr></thead><tbody><tr><td>Health plan savings retainer: ${f.pct}% of ${money(e.spend)} annual spend (minimum ${money(f.min)}, maximum ${money(f.max)})</td><td class="num">${money(r)}</td></tr></tbody><tfoot><tr><td>Total due</td><td class="num">${money(r)}</td></tr></tfoot></table>
        <p style="margin-top:16px">Refunded in full within ${f.refund} days if documented savings do not appear.</p></div>`,
        actions: [{ label: "Close" }, { label: "Download PDF", onClick: () => UI.printOnly(document.querySelector("#invDoc")) }, { label: "Email invoice", primary: true, onClick: () => toast(`Invoice ${n} emailed to ${e.contact}`) }] }); });
  });

  /* ================= employee communications ================= */
  const PROGS = ["First-dollar care", "Employee-owned (ICHRA)", "New group plan"];
  function commsText(prog, fmt, lang, g) {
    const es = lang === "es", fd = prog.startsWith("First"), ich = prog.startsWith("Employee");
    if (fmt === "sms") return es ? `${g.name}: la inscripción para ${fd ? "el programa de atención sin costo" : ich ? "su asignación de salud" : "el nuevo plan médico"} cierra el viernes. Toma 4 minutos. Responda AYUDA y le llamamos.` : `${g.name}: enrollment for ${fd ? "the $0 care program" : ich ? "your health allowance" : "the new medical plan"} closes Friday. It takes 4 minutes. Reply HELP and we'll call you.`;
    if (fmt === "faq") return es
      ? `Preguntas frecuentes\n\n**¿Voy a perder a mi médico?**\n${fd ? "No. Su plan médico actual no cambia." : ich ? "Usted elige un plan que incluya a su médico, y le ayudamos a comprobarlo antes de elegir." : "Revisamos que sus médicos estén en la red antes de la inscripción."}\n\n**¿Me cuesta algo?**\n${fd ? "No. Telemedicina, salud mental, atención primaria, análisis y muchos medicamentos cuestan $0." : ich ? "La empresa le da una asignación mensual libre de impuestos. Muchas personas pagan poco o nada extra." : "La misma o mejor cobertura, con una deducción igual o menor."}\n\n**¿Quién me puede ayudar?**\nResponda a este correo o reserve una llamada de 10 minutos.`
      : `Questions employees ask\n\n**Will I lose my doctor?**\n${fd ? "No. Your current medical plan doesn't change." : ich ? "You choose a plan that includes your doctor, and we help you check before you pick." : "We check your doctors are in network before enrollment."}\n\n**Does it cost me anything?**\n${fd ? "No. Telehealth, mental health, primary care, labs and many prescriptions are $0." : ich ? "The practice gives you a tax-free monthly allowance. Many people pay little or nothing extra." : "The same or better coverage, with the same or a lower payroll deduction."}\n\n**Who can help me?**\nReply to this email or book a 10-minute call.`;
    return es
      ? `Asunto: Un nuevo beneficio de salud en ${g.name}\n\nHola a todos:\n\n${fd ? "A partir del próximo mes tendrán telemedicina, apoyo de salud mental, atención primaria, análisis y muchos medicamentos a $0, además de su plan actual. Su cobertura actual no cambia." : ich ? "A partir del próximo año del plan recibirán una asignación mensual libre de impuestos para elegir el plan de salud que mejor les funcione. El plan es suyo y se queda con ustedes si cambian de trabajo." : "Cotizamos nuestro plan de salud. El próximo año tendrán la misma o mejor cobertura con el mismo costo o menos."}\n\nLa inscripción abre el lunes y toma unos 4 minutos.\n\n¿Preguntas? Respondan a este correo o reserven una llamada de 10 minutos.\n\nRecursos Humanos, ${g.name}`
      : `Subject: A new health benefit at ${g.name}\n\nHi everyone,\n\n${fd ? "Starting next month you'll have $0 telehealth, mental health support, primary care, labs and many prescriptions, on top of your current plan. Your current coverage doesn't change." : ich ? "Starting next plan year you'll get a tax-free monthly allowance to choose the health plan that fits you and your family. The plan is yours, and it stays with you if you change jobs." : "We shopped our health plan. Next year you'll have the same or better coverage at the same or lower cost to you."}\n\nEnrollment opens Monday and takes about 4 minutes.\n\nQuestions? Reply to this email or book a 10-minute call.\n\nHR, ${g.name}`;
  }
  route("/comms", async () => {
    const g = G("trinity-oak"), c = { prog: PROGS[1], fmt: "email", lang: "en", ...(X().comms || {}) }, p = ICH();
    const pc = { age: 41, cover: "me", visits: 4, rx: "none", ...(X().chooser || {}) };
    const allowFor = (age, cover) => p[band(age)] + (cover !== "me" ? p.dep : 0);
    const prem = Math.round(lcs(pc.age, "75034") * ({ me: 1, spouse: 2, family: 2.6 }[pc.cover]));
    const tier = pc.visits > 8 || pc.rx === "specialty" ? "Gold" : pc.visits > 3 || pc.rx === "generic" ? "Silver" : "Bronze";
    const cost = Math.round(prem * { Gold: 1.2, Silver: 1, Bronze: 0.8 }[tier]), allow = allowFor(pc.age, pc.cover);
    setPage([["Employee comms"]], `${head("Employee communications", "Announcements, FAQs and reminders for every program, written, translated and tracked to enrollment.")}
      <div class="row" style="margin-bottom:14px"><div class="seg" id="progSeg">${PROGS.map(x => `<button data-p="${x}" class="${c.prog === x ? "on" : ""}">${x}</button>`).join("")}</div><span class="muted" style="font-size:12.5px">${g.name} · ${g.eligible} eligible employees</span></div>
      <div class="grid g-main-l">
        <div data-guide="comms">${card("Announcement", `<div class="draft" style="min-height:260px" id="cmOut">${md(commsText(c.prog, c.fmt, c.lang, g))}</div>`,
          { actions: `<div class="seg" id="fmtSeg">${[["email", "Email"], ["faq", "FAQ"], ["sms", "Text reminder"]].map(([k, l]) => `<button data-f="${k}" class="${c.fmt === k ? "on" : ""}">${l}</button>`).join("")}</div><select class="input" id="langSel" style="width:auto;padding:4px 8px"><option value="en" ${c.lang === "en" ? "selected" : ""}>English</option><option value="es" ${c.lang === "es" ? "selected" : ""}>Español</option></select>`,
            foot: `<button class="btn primary" id="cmSend">${icon("send")}Send to ${g.eligible} employees</button><button class="btn" id="cmCopy">${icon("download")}Download</button><span class="muted" style="font-size:12.5px">Reminder every 3 days to anyone not enrolled</span>` })}</div>
        <div class="stack">
          ${card("Enrollment progress", [["Alder & Finch LLP", "ICHRA plan selection", 0.91], ["Harbor Point Hospitality", "Open enrollment", 0.64], ["Bluebonnet Veterinary Partners", "Open enrollment", 0.38], ["Prairie Wind Credit Union", "HSA elections", 0.97]].map(([n, w, v]) => `<div style="margin-bottom:10px"><div class="row" style="font-size:13px"><b>${n}</b><span class="spacer"></span><span class="strong">${Math.round(v * 100)}%</span></div><div class="progress ${v > 0.8 ? "ok" : v > 0.5 ? "" : "warn"}" style="margin-top:3px"><i style="width:${v * 100}%"></i></div><div class="muted" style="font-size:12px">${w}</div></div>`).join(""))}
          ${card("ICHRA plan chooser", `<div class="grid g2" style="gap:8px"><div class="field" style="margin:0"><label>Age</label><input class="input" type="number" min="21" max="64" data-pc="age" value="${pc.age}"></div>
            <div class="field" style="margin:0"><label>Covering</label><select class="input" data-pc="cover"><option value="me" ${pc.cover === "me" ? "selected" : ""}>Just me</option><option value="spouse" ${pc.cover === "spouse" ? "selected" : ""}>Me + spouse</option><option value="family" ${pc.cover === "family" ? "selected" : ""}>Family</option></select></div>
            <div class="field" style="margin:0"><label>Doctor visits a year</label><input class="input" type="number" min="0" data-pc="visits" value="${pc.visits}"></div>
            <div class="field" style="margin:0"><label>Monthly prescriptions</label><select class="input" data-pc="rx"><option value="none" ${pc.rx === "none" ? "selected" : ""}>None</option><option value="generic" ${pc.rx === "generic" ? "selected" : ""}>Generic</option><option value="specialty" ${pc.rx === "specialty" ? "selected" : ""}>Specialty</option></select></div></div>
            <div class="alert ok" style="margin-top:12px">${icon("spark")}<div><b>Suggested: a ${tier} plan, about ${money(cost)} a month.</b> The allowance covers ${money(allow)}, so ${cost > allow ? `you pay ${money(cost - allow)} a month` : `you pay $0 and ${money(allow - cost)} is left for care`}.</div></div>`, { sub: "what employees see" })}
        </div></div>`);
    const setC = o => { X().comms = { ...c, ...o }; BD.save(); render(); };
    $$("#progSeg button").forEach(b => b.onclick = () => setC({ prog: b.dataset.p }));
    $$("#fmtSeg button").forEach(b => b.onclick = () => setC({ fmt: b.dataset.f }));
    $("#langSel").onchange = e => setC({ lang: e.target.value });
    $$("[data-pc]").forEach(inp => inp.onchange = () => { X().chooser = { ...pc, [inp.dataset.pc]: inp.type === "number" ? clamp(+inp.value || 21, inp.dataset.pc === "age" ? 21 : 0, inp.dataset.pc === "age" ? 64 : 99) : inp.value }; BD.save(); render(); });
    $("#cmSend").onclick = () => { credit("comms", "comms:" + c.prog); toast(`Scheduled to ${g.eligible} employees · reminders every 3 days`); };
    $("#cmCopy").onclick = () => UI.download(`${g.name.replace(/\W+/g, "_")}_${c.fmt}_${c.lang}.txt`, $("#cmOut").innerText);
  });

  /* ================= board pack (Cedar Ridge) ================= */
  function sfSavings() {
    if (!S.sf.bids.length) return null;
    const lines = ["TPA", "PBM", "SL"].map(t => { const list = S.sf.bids.filter(b => b.type === t); return { inc: list.find(b => b.incumbent), sel: list.find(b => b.filename === S.sel[t]) }; }).filter(l => l.inc && l.sel);
    return lines.reduce((s, l) => s + l.inc.annual - l.sel.annual, 0);
  }
  route("/board", () => {
    const g = G("cedar-ridge"), save = sfSavings();
    if (save == null) { setPage([["Board pack"]], `${head("Board pack", `${g.name} · ${num(g.enrolled)} enrolled`)}<div class="card"><div class="empty">${icon("file")}<p><b>The board pack is built from the documented savings.</b></p><p>Read the nine vendor bids first.</p><a class="btn primary" href="#/marketing/cedar-ridge/bids">Open Cedar Ridge bids</a></div></div>`); return; }
    credit("board");
    const ren = g.renewalAnnual, rec = ren - save, three = [0, 1, 2].map(y => [ren * Math.pow(1.07, y), rec * Math.pow(1.07, y)]);
    const ms = [["Mutual NDA signed", "Done", "Jun 12"], ["Claims, contracts and census received", "Done", "Jul 8"], ["Vendor bids compared", "Done", "Sep 14"], ["Findings to the CFO", "Done", "Sep 16"], ["Benefits committee review", "In progress", "Oct 6"], ["Board decision", "Scheduled", "Oct 20"], ["Vendor contracts signed", "Scheduled", "Nov 13"], ["New vendors live", "Scheduled", "Jan 1"]];
    const sum = `${g.name} spends ${k$(ren)} on its self-funded plan at the 2027 renewal. The vendor bids document ${money(save)} in annual savings (${p1(save / ren)}), and about ${k$(three.reduce((s, [a, b]) => s + a - b, 0))} over three years. Coverage for employees stays the same or better. No vendor, carrier or administrator pays us. The committee can decide on its own calendar: the bids hold through January 1.`;
    setPage([["Board pack"]], `${head("Board pack", `${g.name} · ${num(g.enrolled)} enrolled in 4 states · for the benefits committee and board`, `<button class="btn primary" onclick="UI.printOnly(document.querySelector('#boardDoc'))">${icon("printer")}Download board pack</button>`)}
      <div class="report" id="boardDoc" data-guide="board">
        <div class="rep-meta">${DATA.firm.toUpperCase()} · BOARD PACK</div><h1 style="margin-top:8px">Health plan cost review</h1><div class="rep-meta">${g.name} · prepared September 16, 2026</div>
        <div class="grid g3" style="margin:22px 0 6px">
          <div class="card kpi"><div class="l">2027 renewal, current vendors</div><div class="v">${k$(ren)}</div></div>
          <div class="card kpi" style="border-color:var(--ok)"><div class="l">Documented annual savings</div><div class="v" style="color:var(--ok)">${money(save)}</div><div class="d">${p1(save / ren)}</div></div>
          <div class="card kpi"><div class="l">Three-year savings</div><div class="v">${k$(three.reduce((s, [a, b]) => s + a - b, 0))}</div><div class="d">with 7% plan trend</div></div>
        </div>
        <h2>Executive summary</h2><div id="bdSum"></div>
        <h2>Three-year view</h2><table class="t"><thead><tr><th>Year</th><th class="num">Status quo</th><th class="num">Recommended</th><th class="num">Saved</th></tr></thead><tbody>${three.map(([a, b], y) => `<tr><td>${2027 + y}</td><td class="num">${k$(a)}</td><td class="num">${k$(b)}</td><td class="num" style="color:var(--ok);font-weight:600">${k$(a - b)}</td></tr>`).join("")}</tbody></table>
        <p class="muted" style="font-size:12.5px">Both columns trend at 7% a year, so the savings grow with the plan rather than from a lower trend assumption.</p>
        <h2>Timeline</h2><table class="t"><tbody>${ms.map(([m, s, d]) => `<tr><td>${m}</td><td>${d}</td><td><span class="chip ${s === "Done" ? "ok" : s === "In progress" ? "warn" : ""}">${s}</span></td></tr>`).join("")}</tbody></table>
        <h2>Decision log</h2><table class="t"><tbody><tr><td>CFO</td><td>Asked for the risk-adjusted cost, not just the price</td><td><span class="chip ok">In the pack</span></td></tr><tr><td>Benefits committee</td><td>Employees in active treatment keep their providers</td><td><span class="chip ok">Confirmed with vendors</span></td></tr><tr><td>Board chair</td><td>Wants a three-year view</td><td><span class="chip ok">In the pack</span></td></tr></tbody></table>
        <p class="muted" style="font-size:12px;margin-top:24px">Savings figures come from the vendor bids and the savings report. Sample document: all companies and figures are fictional.</p>
      </div>`);
    once("board", $("#bdSum"), sum);
  });
})();
