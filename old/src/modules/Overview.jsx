import React, { useState, useEffect, useRef } from "react";
import { WOS, PRINT_REQUESTS, DEPARTMENTS, PROJECTS, ALERTS_DATA } from '../data/seed.js';
import { Ring, Spark, Prog, GRow, AStrip, LiveBadge } from '../components/atoms.jsx';
import { TECH_C } from '../data/constants.js';

export function Overview({ machines, setSection }) {
    const running = machines.filter(m => m.status === "running").length;
    const avgOEE = Math.round(machines.reduce((a, m) => a + m.oee, 0) / machines.length);
    const activeJobs = WOS.filter(w => ["production", "postproc", "qa"].includes(w.status)).length;
    const pendingReqs = PRINT_REQUESTS.filter(r => r.status === "pending").length;
    const WIP = [
        { label: "Printing", status: "production", limit: 7, color: "var(--accent)" },
        { label: "Post-processing", status: "postproc", limit: 5, color: "var(--purple)" },
        { label: "QA", status: "qa", limit: 4, color: "var(--yellow)" },
        { label: "Handoff", status: "completed", limit: 6, color: "var(--green)" },
    ];
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">FACTORY</span><h1 className="pg-title">Factory Overview</h1></div>
            <div className="g g4 mb16">
                {[
                    { l: "Active Jobs", v: activeJobs, s: `${running} printers running`, c: "cc" },
                    { l: "Pending Requests", v: pendingReqs, s: <span onClick={() => setSection("requests")} style={{ cursor: "pointer", color: "var(--yellow)" }}>↗ Review now</span>, c: "cy" },
                    { l: "Fleet OEE", v: `${avgOEE}%`, s: <span><span className="kd up">↑ 2.1%</span> vs last week</span>, c: "cg" },
                    { l: "Active Projects", v: PROJECTS.filter(p => p.status === "active").length, s: "across all departments", c: "cb2" },
                ].map(k => (
                    <div key={k.l} className={`kpi ${k.c}`}><div className="kl">{k.l}</div><div className="kv">{k.v}</div><div className="ks">{k.s}</div></div>
                ))}
            </div>

            <div className="g g21">
                <div>
                    {/* Tech rings */}
                    <div className="g g3 mb16">
                        {["FDM", "SLA", "SLS"].map(tech => {
                            const ms = machines.filter(m => m.tech === tech);
                            const on = ms.filter(m => m.status === "running").length;
                            const err = ms.filter(m => m.status === "error").length;
                            const oee = Math.round(ms.reduce((a, m) => a + m.oee, 0) / ms.length);
                            const c = TECH_C[tech];
                            return (
                                <div key={tech} className="card" style={{ borderTopColor: c, borderTopWidth: 2 }}>
                                    <div className="cb row">
                                        <Ring value={oee} color={c} label="OEE" size={64} />
                                        <div><div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 800, color: c }}>{tech}</div>
                                            <div className="tiny mt4">{on}/{ms.length} active</div>
                                            {err > 0 && <div className="tiny mt4" style={{ color: "var(--red)" }}>⚠ {err} error</div>}
                                            <Spark data={[72, 75, oee - 4, oee - 1, oee + 2, oee - 1, oee]} color={c} h={18} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* WIP */}
                    <div className="card mb16">
                        <div className="ch"><span className="ct">WIP by Stage</span><span className="tiny">limits enforced</span></div>
                        <div className="cb">
                            {WIP.map(s => {
                                const cnt = WOS.filter(w => w.status === s.status).length;
                                const over = cnt > s.limit;
                                return (
                                    <div key={s.label} className="mb12">
                                        <div className="rowsb mb4"><span style={{ fontSize: 12 }}>{s.label}</span><span className="mono" style={{ fontSize: 10, color: over ? "var(--red)" : "var(--text3)" }}>{cnt}/{s.limit}{over && " ⚠ OVER"}</span></div>
                                        <Prog pct={(cnt / s.limit) * 100} color={over ? "red" : "green"} h={5} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Machines */}
                    <div className="card">
                        <div className="ch"><span className="ct">Machine Status</span><LiveBadge /></div>
                        <div className="cb" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {machines.map(m => (
                                <div key={m.id} className={`mc ${m.status}`}>
                                    <div className="rowsb mb8">
                                        <div><div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>{m.name}</div><div className="tiny">{m.model}</div></div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}><TB tech={m.tech} /><SB s={m.status} /></div>
                                    </div>
                                    {m.status === "running" && <><div className="tiny mb4">{m.job} · {WOS.find(w => w.id === m.job)?.dept || ""}</div><Prog pct={m.pct} h={5} /><div className="rowsb mt4"><span className="tiny">{Math.round(m.pct)}%</span><span className="mono" style={{ color: "var(--text2)" }}>{m.remaining}</span></div></>}
                                    {m.status === "error" && <div style={{ color: "var(--red)", fontSize: 11, marginTop: 8, fontFamily: "var(--fm)" }}>⛔ Fault — operator needed</div>}
                                    {m.status === "waiting" && <div style={{ color: "var(--yellow)", fontSize: 11, marginTop: 8 }}>{m.remaining}</div>}
                                    {m.status === "idle" && <div className="tiny mt8" style={{ color: "var(--text4)" }}>Queue empty</div>}
                                    <div className="rowsb mt8"><span className="tiny">OEE</span><span className="mono" style={{ color: m.oee > 80 ? "var(--green)" : m.oee > 65 ? "var(--yellow)" : "var(--red)" }}>{m.oee}%</span></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="card mb16">
                        <div className="ch"><span className="ct">🔴 Alerts & Exceptions</span><span className="b berr">{ALERTS_DATA.filter(a => a.type === "err").length} critical</span></div>
                        <div className="cb">{ALERTS_DATA.map((a, i) => <AStrip key={i} {...a} />)}</div>
                    </div>
                    <div className="card mb16">
                        <div className="ch"><span className="ct">Department Load</span></div>
                        <div className="cb">
                            {DEPARTMENTS.map(d => {
                                const deptWos = WOS.filter(w => w.dept === d.name && ["production", "postproc", "qa", "scheduled"].includes(w.status)).length;
                                return <GRow key={d.id} label={d.name} val={deptWos} max={6} lw={120} />;
                            })}
                        </div>
                    </div>
                    <div className="card">
                        <div className="ch"><span className="ct">Work Center Load</span></div>
                        <div className="cb">{WCS.map(wc => <GRow key={wc.id} label={wc.name} val={wc.load} max={wc.cap} lw={130} />)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
