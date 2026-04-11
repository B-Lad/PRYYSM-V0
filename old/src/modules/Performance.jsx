import React, { useState, useEffect, useRef } from "react";
import { QC_DATA, DEPARTMENTS, WOS } from '../data/seed.js';
import { TB, SB, Tabs, Ring, Spark, Prog, AStrip } from '../components/atoms.jsx';

export function Performance({ machines }) {
    const [tab, setTab] = useState("oee");
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">BUSINESS</span><h1 className="pg-title">Performance & Quality</h1></div>
            <Tabs tabs={[{ id: "oee", label: "OEE Dashboards" }, { id: "flow", label: "Flow & Bottlenecks" }, { id: "quality", label: "Quality & NCR" }, { id: "cost", label: "Cost Analytics" }]} active={tab} onChange={setTab} />
            {tab === "oee" && (
                <div>
                    <div className="g g4 mb16">
                        {["FDM", "SLA", "SLS", "Fleet"].map(tech => {
                            const ms = tech === "Fleet" ? machines : machines.filter(m => m.tech === tech);
                            const oee = Math.round(ms.reduce((a, m) => a + m.oee, 0) / ms.length);
                            const avail = Math.round(ms.reduce((a, m) => a + m.avail, 0) / ms.length);
                            const perf = Math.round(ms.reduce((a, m) => a + m.perf, 0) / ms.length);
                            const qual = Math.round(ms.reduce((a, m) => a + m.qual, 0) / ms.length);
                            const c = tech === "FDM" ? "var(--fdm)" : tech === "SLA" ? "var(--sla)" : tech === "SLS" ? "var(--sls)" : "var(--yellow)";
                            return (
                                <div key={tech} className="card" style={{ borderTopColor: c, borderTopWidth: 2 }}>
                                    <div className="ch"><span className="ct" style={{ color: c }}>{tech}</span></div>
                                    <div className="cb">
                                        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
                                            <Ring value={avail} color="var(--green)" label="Avail" size={56} />
                                            <Ring value={perf} color="var(--accent)" label="Perf" size={56} />
                                            <Ring value={qual} color="var(--purple)" label="Qual" size={56} />
                                        </div>
                                        <div style={{ textAlign: "center" }}><Ring value={oee} color={c} label="OEE" size={76} /></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="card"><div className="ch"><span className="ct">Per-Machine OEE</span></div><div className="tw"><table><thead><tr><th>Machine</th><th>Tech</th><th>Avail</th><th>Perf</th><th>Qual</th><th>OEE</th><th>7d Trend</th></tr></thead><tbody>
                        {machines.map(m => <tr key={m.id}><td style={{ fontWeight: 500 }}>{m.name}</td><td><TB tech={m.tech} /></td><td><span className="tm" style={{ color: "var(--green)" }}>{m.avail}%</span></td><td><span className="tm" style={{ color: "var(--accent)" }}>{m.perf}%</span></td><td><span className="tm" style={{ color: "var(--purple)" }}>{m.qual}%</span></td><td><span className="tm" style={{ fontWeight: 700, color: m.oee > 80 ? "var(--green)" : m.oee > 65 ? "var(--yellow)" : "var(--red)" }}>{m.oee}%</span></td><td><Spark data={[73, 75, m.oee - 6, m.oee - 3, m.oee - 1, m.oee + 1, m.oee]} color="var(--accent)" h={28} /></td></tr>)}
                    </tbody></table></div></div>
                </div>
            )}
            {tab === "flow" && (
                <div className="g g2">
                    <div className="card"><div className="ch"><span className="ct">Lead Time Breakdown (avg)</span></div><div className="cb">
                        {[{ l: "Queue / Waiting", h: 4.2, c: "var(--text3)" }, { l: "Print Time", h: 8.5, c: "var(--accent)" }, { l: "Post-processing", h: 3.1, c: "var(--purple)" }, { l: "QA", h: 0.8, c: "var(--yellow)" }, { l: "Handoff", h: 0.4, c: "var(--green)" }].map(s => <div key={s.l} className="cseg"><span className="dim small" style={{ width: 120, flexShrink: 0 }}>{s.l}</span><div className="cstrack"><div className="csfill" style={{ width: `${(s.h / 17) * 100}%`, background: s.c, opacity: .8 }} /></div><span className="mono" style={{ width: 38, textAlign: "right" }}>{s.h}h</span></div>)}
                        <div className="sep" /><div className="rowsb"><span className="dim small">Total avg</span><span style={{ fontFamily: "var(--fd)", fontSize: 18, fontWeight: 800 }}>17.0h</span></div>
                    </div></div>
                    <div className="card"><div className="ch"><span className="ct">Bottleneck Utilisation</span></div><div className="cb">{WCS.map(wc => <GRow key={wc.id} label={wc.name} val={wc.load} max={wc.cap} lw={130} />)}</div></div>
                    <div className="card"><div className="ch"><span className="ct">7-Day Throughput</span></div><div className="cb">{["FDM", "SLA", "SLS"].map(tech => { const c = TECH_C[tech]; return <div key={tech} className="mb12"><div className="rowsb mb4"><TB tech={tech} /><span className="tiny">jobs/day</span></div><Spark data={[4, 6, 5, 7, 8, 6, 7]} color={c} h={32} /></div>; })}</div></div>
                    <div className="card"><div className="ch"><span className="ct">Request-to-Print Cycle Time</span></div><div className="cb">
                        {[{ l: "REQ → Approved", h: 0.5 }, { l: "Approved → Sliced", h: 1.2 }, { l: "Sliced → Print Start", h: 2.1 }, { l: "Print → QA Pass", h: 14.2 }, { l: "QA → Dept Handoff", h: 0.8 }].map(s => <div key={s.l} className="cseg"><span className="dim small" style={{ width: 160, flexShrink: 0 }}>{s.l}</span><div className="cstrack"><div className="csfill" style={{ width: `${(s.h / 15) * 100}%`, background: "var(--blue)", opacity: .7 }} /></div><span className="mono" style={{ width: 38, textAlign: "right" }}>{s.h}h</span></div>)}
                    </div></div>
                </div>
            )}
            {tab === "quality" && (
                <div>
                    <div className="g g4 mb16">
                        {[{ l: "Pass Rate", v: "94.2%", c: "cg" }, { l: "Defect Rate", v: "5.8%", c: "cr" }, { l: "Rework WOs", v: "3", c: "cy" }, { l: "Open NCRs", v: "1", c: "cr" }].map(k => <div key={k.l} className={`kpi ${k.c}`}><div className="kl">{k.l}</div><div className="kv">{k.v}</div></div>)}
                    </div>
                    <div className="card mb16"><div className="ch"><span className="ct">QC Records</span></div><div className="tw"><table><thead><tr><th>QC ID</th><th>Work Order</th><th>Dept</th><th>Tech</th><th>Result</th><th>Defects</th><th>Note</th><th>Operator</th><th>Time</th></tr></thead><tbody>
                        {QC_DATA.map(q => <tr key={q.id}><td><span className="tacc">{q.id}</span></td><td><span className="tm">{q.wo}</span></td><td><DB code={q.dept.slice(0, 3).toUpperCase()} /></td><td><TB tech={q.tech} /></td><td><SB s={q.result} /></td><td className="tm">{q.defects}</td><td className="tdim">{q.note}</td><td className="tdim">{q.op}</td><td><span className="tiny">{q.time}</span></td></tr>)}
                    </tbody></table></div></div>
                    <div className="card"><div className="ch"><span className="ct">Non-Conformance — NCR-019</span><span className="b brwk">Open</span></div><div className="cb"><div className="g g2">
                        <div>{[["Work Order", "WO-2031"], ["Dept", "MFG / PRJ-012"], ["Defect", "Layer delamination — 3/40"], ["Root Cause", "Temp variance FDM Bay A"]].map(([k, v]) => <div key={k} className="rowsb" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>)}</div>
                        <div><div className="tiny mb8">CORRECTIVE ACTION</div><textarea className="fta" defaultValue="Check nozzle temp calibration on Ender Pro 1. Reprint 3 parts under WO-2031-R1. Notify MFG team."></textarea><button className="btn btp bts mt8">Create Rework WO</button></div>
                    </div></div></div>
                </div>
            )}
            {tab === "cost" && (
                <div className="g g2">
                    <div className="card"><div className="ch"><span className="ct">Internal Cost per Department (MTD)</span></div><div className="cb">
                        {DEPARTMENTS.map(d => <div key={d.id} className="mb12"><div className="rowsb mb4"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /><span style={{ fontSize: 12 }}>{d.name}</span></div><span className="mono" style={{ color: d.color }}>AED {d.spent.toLocaleString()}</span></div><Prog pct={d.spent / d.budget * 100} color="cyan" h={6} /></div>)}
                    </div></div>
                    <div className="card"><div className="ch"><span className="ct">Monthly AM Spend (AED)</span></div><div className="cb"><Spark data={[280000, 310000, 265000, 340000, 325000, 360000, 331700]} color="var(--accent)" h={80} /><div className="rowsb mt12"><span className="dim small">MTD Total Spend</span><span style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>AED 331,700</span></div></div></div>
                    <div className="card"><div className="ch"><span className="ct">Cost per Part by Technology</span></div><div className="cb">
                        {[{ tech: "FDM", cpu: 38, jobs: 47, color: "var(--fdm)" }, { tech: "SLA", cpu: 112, jobs: 23, color: "var(--sla)" }, { tech: "SLS", cpu: 198, jobs: 18, color: "var(--sls)" }].map(t => <div key={t.tech} className="mb12"><div className="rowsb mb4"><TB tech={t.tech} /><div><span className="mono">AED {t.cpu}/part</span><span className="tiny" style={{ marginLeft: 8 }}>{t.jobs} jobs</span></div></div><Prog pct={t.cpu / 200 * 100} color="cyan" h={6} /></div>)}
                    </div></div>
                    <div className="card"><div className="ch"><span className="ct">Cost vs Budget by Dept</span></div><div className="cb">
                        {DEPARTMENTS.map(d => <div key={d.id} className="mb8"><div className="rowsb mb4"><span style={{ fontSize: 12 }}>{d.name}</span><span className="tiny" style={{ color: d.spent / d.budget > 0.9 ? "var(--red)" : "var(--text3)" }}>{Math.round(d.spent / d.budget * 100)}%</span></div><Prog pct={d.spent / d.budget * 100} color={d.spent / d.budget > 0.9 ? "red" : d.spent / d.budget > 0.7 ? "yellow" : "green"} h={7} /></div>)}
                    </div></div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════════════════════════ */
function IntegrationRow({ item }) {
    const color = item.status === "connected" ? "var(--green)" : item.status === "pending" ? "var(--yellow)" : "var(--text3)";
    const dotStyle = { width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 };
    const badgeCls = item.status === "connected" ? "bcomp" : item.status === "pending" ? "bpend" : "bidle";
    return (
        <div className="ii">
            <div style={dotStyle} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{item.name}</div>
            </div>
            <span className={`b ${badgeCls}`}>{item.status}</span>
            <button className="btn btg bts">{item.status === "connected" ? "Config" : "Connect"}</button>
        </div>
    );
}

function Config() {
