import React, { useState } from "react";
import { ROUTES_DATA } from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { TB, SB, DB, Tabs, Prog, Modal } from '../components/atoms.jsx';
import { TECH_C } from '../data/constants.js';

const KANBAN_STAGES = [
    { id: "submitted", label: "Submitted", icon: "📝" },
    { id: "review", label: "AM Review", icon: "✓" },
    { id: "planning", label: "Planning", icon: "📐" },
    { id: "printing", label: "Printing", icon: "🖨" },
    { id: "postproc", label: "Post-Process", icon: "⚙" },
    { id: "qa", label: "QA", icon: "✅" },
    { id: "closed", label: "Closed", icon: "🎯" }
];


export function Flow({ lcProjects = [] }) {
    const isDemo = useDemoMode();
    const seedRoutes = isDemo ? ROUTES_DATA : [];
    const [tab, setTab] = useState("kanban");
    const [selId, setSelId] = useState(null);

    const sel = lcProjects.find(p => p.id === selId);

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Flow & Tasks</h1></div>
            <Tabs tabs={[{ id: "kanban", label: "📋 WIP Kanban" }, { id: "routing", label: "🔀 Routing Templates" }]} active={tab} onChange={setTab} />

            {tab === "kanban" && (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${KANBAN_STAGES.length}, minmax(260px, 1fr))`, gap: 12, overflowX: "auto", paddingBottom: 16 }}>
                        {KANBAN_STAGES.map(stage => {
                            const cards = lcProjects.filter(p => p.stage === stage.id);
                            return (
                                <div key={stage.id} style={{ background: "var(--bg3)", borderRadius: "var(--r3)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)", overflow: "hidden" }}>
                                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", background: "var(--bg1)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                                        <span style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text)" }}>{stage.icon} {stage.label}</span>
                                        <span style={{ fontSize: 10, fontFamily: "var(--fm)", background: cards.length > 3 ? "var(--rdim)" : "var(--gdim)", color: cards.length > 3 ? "var(--red)" : "var(--green)", padding: "2px 6px", borderRadius: 10, fontWeight: 700 }}>{cards.length}</span>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                                        {cards.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "var(--text3)", fontSize: 11 }}>No items</div>}
                                        {cards.map(p => (
                                            <div key={p.id} className={`req-card ${p.dept?.toLowerCase()}`} style={{ cursor: "pointer", marginBottom: 0, padding: 10, borderLeftWidth: 3, position: "relative" }} onClick={() => setSelId(p.id)}>
                                                <div className="rowsb mb4">
                                                    <span className="tacc">{p.id}</span>
                                                    {p.priority === "urgent" && <span className="b burgent" style={{ fontSize: 8 }}>URGENT</span>}
                                                    {p.priority === "high" && <span className="b bhigh" style={{ fontSize: 8 }}>HIGH</span>}
                                                </div>
                                                <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
                                                <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 6 }}>{p.tech} · {p.material}</div>
                                                <div className="rowsb">
                                                    <span className="tiny">Qty: {p.qty}</span>
                                                    <span className="tiny" style={{ color: "var(--accent)", fontWeight: 700 }}>{p.printPct}%</span>
                                                </div>
                                                <div style={{ marginTop: 4 }}><Prog pct={p.printPct} h={3} color={p.printPct === 100 ? "green" : "cyan"} /></div>
                                                <div className="tiny mt4">👤 {p.owner}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {tab === "routing" && (
                <div className="g g3">
                    {seedRoutes.map(r => {
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

            {sel && (
                <Modal title={`Project Detail — ${sel.id}`} onClose={() => setSelId(null)}>
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                            {sel.imageUrl && <img src={sel.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 800 }}>{sel.name}</div>
                                <div className="tiny" style={{ color: "var(--text2)" }}>{sel.id} · {sel.tech}</div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <SB s={sel.priority} />
                                <SB s={sel.stage} />
                            </div>
                        </div>

                        <div className="g g2">
                            {[
                                ["Owner", sel.owner],
                                ["Department", sel.dept || "—"],
                                ["Due Date", sel.due || "—"],
                                ["Technology", sel.tech],
                                ["Material", sel.material],
                                ["Quantity", (sel.qty || 0) + " parts"],
                                ["Est. Time", sel.woPrintTime || "—"],
                                ["Machine", sel.machine || "—"]
                            ].map(([k, v]) => (
                                <div key={k} style={{ marginBottom: 12 }}>
                                    <div className="tiny mb4">{k.toUpperCase()}</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                                </div>
                            ))}
                        </div>

                        {(sel.description || sel.requestNote || sel.extraInfo) && <div className="sep" />}

                        {sel.description && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="tiny mb4">DESCRIPTION</div>
                                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{sel.description}</div>
                            </div>
                        )}

                        {sel.requestNote && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="tiny mb4">PRINT NOTES</div>
                                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{sel.requestNote}</div>
                            </div>
                        )}

                        {sel.extraInfo && (
                            <div style={{ marginBottom: 12 }}>
                                <div className="tiny mb4">ADDITIONAL INFORMATION</div>
                                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{sel.extraInfo}</div>
                            </div>
                        )}
                    </div>

                    <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", padding: 12, border: "1px solid var(--border)" }}>
                        <div className="tiny mb8">PROJECT HISTORY</div>
                        {(sel.history || []).map((h, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 11 }}>
                                <div style={{ color: "var(--text3)", whiteSpace: "nowrap" }}>{h.time}</div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 9, marginRight: 6 }}>{h.stage}:</span>
                                    <span style={{ color: "var(--text2)" }}>{h.note}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </div>
    );
}
