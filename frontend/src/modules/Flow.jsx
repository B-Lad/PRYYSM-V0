import React, { useState } from "react";
import { WOS, PROJECTS, ROUTES_DATA } from '../data/seed.jsx';
import { TB, SB, Tabs, Prog } from '../components/atoms.jsx';
import { TECH_C } from '../data/constants.js';

const STAGES = [
    { id: "production", label: "🖨 Printing", icon: "🖨", limit: 7 },
    { id: "postproc", label: "⚙️ Post-Processing", icon: "⚙️", limit: 5 },
    { id: "qa", label: "🔍 QA", icon: "🔍", limit: 4 },
    { id: "completed", label: "📦 Handoff", icon: "📦", limit: 6 },
];

const STATUS_COLORS = {
    production: "var(--accent)",
    postproc: "var(--purple)",
    qa: "var(--yellow)",
    completed: "var(--green)",
};

function getProjectInfo(projectId) {
    const proj = PROJECTS.find(p => p.id === projectId);
    return proj ? { name: proj.name, owner: proj.owner, priority: proj.priority } : { name: projectId, owner: "—", priority: "normal" };
}

export function Flow() {
    const [tab, setTab] = useState("kanban");
    const [selectedWO, setSelectedWO] = useState(null);

    const selWO = selectedWO ? WOS.find(w => w.id === selectedWO) : null;

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Flow & Tasks</h1></div>
            <Tabs tabs={[{ id: "kanban", label: "📋 WIP Kanban" }, { id: "routing", label: "🔀 Routing Templates" }]} active={tab} onChange={setTab} />

            {tab === "kanban" && (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(280px, 1fr))`, gap: 12, overflowX: "auto", paddingBottom: 16 }}>
                        {STAGES.map(stage => {
                            const cards = WOS.filter(w => w.status === stage.id);
                            const over = cards.length > stage.limit;
                            return (
                                <div key={stage.id} style={{ background: "var(--bg3)", borderRadius: "var(--r3)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)", overflow: "hidden" }}>
                                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderTopColor: STATUS_COLORS[stage.id], borderTopWidth: 3 }}>
                                        <span style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700 }}>{stage.icon} {stage.label}</span>
                                        <span style={{ fontSize: 10, fontFamily: "var(--fm)", background: over ? "var(--rdim)" : "var(--gdim)", color: over ? "var(--red)" : "var(--green)", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{cards.length}/{stage.limit}</span>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                        {cards.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 11 }}>No items</div>}
                                        {cards.map(wo => {
                                            const proj = getProjectInfo(wo.project);
                                            return (
                                                <div key={wo.id} className={`kcard ${wo.priority}`} style={{ cursor: "pointer", marginBottom: 0, padding: 10, borderLeftWidth: 3, position: "relative" }}
                                                    onClick={() => setSelectedWO(wo.id === selectedWO ? null : wo.id)}>
                                                    <div className="rowsb mb4">
                                                        <span className="tacc">{wo.id}</span>
                                                        <div style={{ display: "flex", gap: 4 }}>
                                                            {wo.priority === "urgent" && <span className="b burgent" style={{ fontSize: 8 }}>URGENT</span>}
                                                            {wo.priority === "high" && <span className="b bhigh" style={{ fontSize: 8 }}>HIGH</span>}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 3, lineHeight: 1.3 }}>{proj.name}</div>
                                                    <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4 }}>{wo.part}</div>
                                                    <div style={{ fontSize: 10, color: "var(--text2)", display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                                                        <span>{wo.tech} · {wo.material}</span>
                                                    </div>
                                                    <div className="rowsb mb4">
                                                        <TB tech={wo.tech} />
                                                        <span className="tiny">Qty: {wo.qty}</span>
                                                    </div>
                                                    <div className="tiny mb4" style={{ color: "var(--text2)" }}>👤 {wo.requestor}</div>
                                                    <div className="rowsb">
                                                        <span className="tiny" style={{ color: wo.priority === "urgent" ? "var(--red)" : "var(--text3)" }}>Due: {wo.due}</span>
                                                        {wo.machine && wo.machine !== "—" && <span className="tiny" style={{ color: "var(--accent)" }}>🖨 {wo.machine}</span>}
                                                    </div>

                                                    {selectedWO === wo.id && (
                                                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 10, color: "var(--text2)" }}>
                                                            <div className="rowsb mb2"><span className="tiny">Project</span><span style={{ fontWeight: 600 }}>{proj.name}</span></div>
                                                            <div className="rowsb mb2"><span className="tiny">Owner</span><span>{proj.owner}</span></div>
                                                            <div className="rowsb"><span className="tiny">Priority</span><SB s={wo.priority} /></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
