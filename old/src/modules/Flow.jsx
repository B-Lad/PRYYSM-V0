import React, { useState, useEffect, useRef } from "react";
import { WOS, TASKS_DATA, ROUTES_DATA } from '../data/seed.js';
import { TB, SB, DB, Tabs, Prog } from '../components/atoms.jsx';
import { TECH_C } from '../data/constants.js';

export function Flow() {
    const [tab, setTab] = useState("kanban");
    const [pulled, setPulled] = useState(new Set());
    const STAGES = [
        { id: "printing", label: "Printing", status: "production", limit: 7, color: "var(--accent)" },
        { id: "postproc", label: "Post-Processing", status: "postproc", limit: 5, color: "var(--purple)" },
        { id: "qa", label: "QA", status: "qa", limit: 4, color: "var(--yellow)" },
        { id: "handoff", label: "Handoff to Dept", status: "completed", limit: 6, color: "var(--green)" },
    ];
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Flow & Tasks</h1></div>
            <Tabs tabs={[{ id: "kanban", label: "WIP Kanban" }, { id: "tasks", label: "Task Board" }, { id: "routing", label: "Routing Templates" }]} active={tab} onChange={setTab} />
            {tab === "kanban" && (
                <div className="kanban">
                    {STAGES.map(s => {
                        const wos = WOS.filter(w => w.status === s.status);
                        const over = wos.length > s.limit;
                        return (
                            <div key={s.id} className="kcol">
                                <div className="kch" style={{ borderTopColor: s.color, borderTopWidth: 2 }}>
                                    <span className="kct" style={{ color: s.color }}>{s.label}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span className="mono dim">{wos.length}</span><span className={`kwip ${over ? "ov" : "ok"}`}>lim {s.limit}</span></div>
                                </div>
                                <div className="kbody">
                                    {wos.map(wo => (
                                        <div key={wo.id} className={`kcard ${wo.priority}`}>
                                            <div className="rowsb mb4"><span className="tiny">{wo.id}</span><TB tech={wo.tech} /></div>
                                            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{wo.part}</div>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}><DB code={wo.code || wo.dept.slice(0, 3).toUpperCase()} /><span className="tiny">{wo.project}</span></div>
                                            <div style={{ fontSize: 10, color: "var(--text2)", display: "flex", gap: 8 }}><span>{wo.qty}×</span><span>{wo.due}</span>{wo.priority === "urgent" && <span style={{ color: "var(--red)", fontWeight: 600 }}>URGENT</span>}</div>
                                        </div>
                                    ))}
                                    {wos.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text4)", fontSize: 12 }}>Empty</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {tab === "tasks" && (
                <div>
                    <div className="rowsb mb16"><span className="dim small">Pull from your work center queue</span><select className="fsel" style={{ width: "auto", padding: "5px 10px", fontSize: 12 }}><option>All Work Centers</option><option>SLS Bay</option><option>SLA Station 1</option><option>QA Benches</option></select></div>
                    {TASKS_DATA.map(t => {
                        const done = pulled.has(t.id);
                        return <div key={t.id} className={`trow ${t.priority}`} style={{ opacity: done ? .4 : 1, transition: "opacity .3s" }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: t.priority === "urgent" ? "var(--red)" : t.priority === "high" ? "var(--yellow)" : "var(--green)", flexShrink: 0 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{t.name}</div><div style={{ fontSize: 11, color: "var(--text2)", display: "flex", gap: 14, flexWrap: "wrap" }}><span>{t.wc}</span><span className="mono">{t.wo}</span><span style={{ color: t.eta === "Now" ? "var(--red)" : "var(--text3)", fontWeight: t.eta === "Now" ? 700 : 400 }}>{t.eta === "Now" ? "⚡ NOW" : `ETA: ${t.eta}`}</span></div></div><TB tech={t.tech} /><SB s={t.priority} /><button style={{ padding: "5px 14px", borderRadius: "var(--r)", border: "1px solid var(--border2)", background: "transparent", color: done ? "var(--green)" : "var(--text2)", fontSize: 11, fontFamily: "var(--fm)", cursor: "pointer", transition: "all .12s" }} onClick={() => setPulled(p => new Set([...p, t.id]))}>{done ? "✓ Pulled" : "Pull →"}</button></div>;
                    })}
                    {pulled.size > 0 && <button className="btn btg bts mt8" onClick={() => setPulled(new Set())}>Reset</button>}
                </div>
            )}
            {tab === "routing" && (
                <div className="g g3">
                    {ROUTES_DATA.map(r => {
                        const c = TECH_C[r.tech];
                        return (
                            <div key={r.tech} className="card" style={{ borderTopColor: c, borderTopWidth: 2 }}>
                                <div className="ch"><span className="ct" style={{ color: c }}>{r.name}</span><TB tech={r.tech} /></div>
                                <div className="cb">
                                    {r.steps.map((s, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < r.steps.length - 1 ? 10 : 0 }}>
                                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: `${c}22`, border: `1px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fm)", fontSize: 9, color: c }}>{i + 1}</div>
                                            <div style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{s}</div>
                                            {i < r.steps.length - 1 && <div style={{ color: "var(--text4)", fontSize: 10 }}>↓</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   DEPARTMENTS & COST
══════════════════════════════════════════════════════════════════ */
