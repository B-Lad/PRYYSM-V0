import React, { useState, useEffect, useRef } from "react";
import { WOS, PRINT_REQUESTS, PROJECTS, ALERTS_DATA } from '../data/seed.jsx';
import { Prog, AStrip, LiveBadge, TB, SB, DB } from '../components/atoms.jsx';

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
                </div>
            </div>
        </div>
    );
}
