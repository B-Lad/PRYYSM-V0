import React, { useState } from "react";
import { PROJECTS, WOS, DEPARTMENTS, MACHINES_BASE, LC_SEED, LIFECYCLE_STAGES } from '../data/seed.jsx';
import { TB, SB, DB, Tabs, Modal } from '../components/atoms.jsx';
import { DEPT_C } from '../data/constants.js';

export function Projects({ lcProjects, onLcProjectsChange, toast, setSection }) {
    const [tab, setTab] = useState("projects");
    const [selProj, setSelProj] = useState(null);
    const [selWO, setSelWO] = useState(null);
    const [showRestartModal, setShowRestartModal] = useState(null);
    const [selCompleted, setSelCompleted] = useState(null);

    // Get completed projects from lcProjects
    const completedProjects = (lcProjects || []).filter(p => p.stage === "closed");

    function handleRestart(proj) {
        const now = new Date();
        const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        const restartCount = lcProjects.filter(p => p.previousRun?.projectId === proj.id).length;
        const newId = proj.id + "-R" + (restartCount + 1);

        // Create new project based on the completed one
        const newProject = {
            ...proj,
            id: newId,
            name: proj.name + " (Restart)",
            stage: "review",
            created: ts,
            woId: null,
            machine: null,
            printPct: 0,
            history: LIFECYCLE_STAGES.map((s, i) => ({
                stage: s.id,
                done: i <= 1,
                time: i <= 1 ? ts : "Pending",
                note: i === 0 ? `Restarted from ${proj.id}. Previous settings available for reference.` : i === 1 ? "Direct to AM Review — verify settings and approve." : ""
            })),
            previousRun: {
                projectId: proj.id,
                projectName: proj.name,
                completedAt: proj.history?.find(h => h.stage === "closed")?.time || "Unknown",
                machine: proj.machine,
                material: proj.material,
                tech: proj.tech,
                qty: proj.qty,
            }
        };

        onLcProjectsChange([newProject, ...lcProjects]);
        setShowRestartModal(null);
        setSelCompleted(null);
        toast(`Project restarted as ${newId} — open in AM Review to verify and approve`, "s");
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Projects & Work Orders</h1></div>
            <Tabs tabs={[
                { id: "projects", label: "Active Projects" },
                { id: "wos", label: "Work Orders" },
                { id: "completed", label: `Completed Projects (${completedProjects.length})` }
            ]} active={tab} onChange={setTab} />

            {/* ACTIVE PROJECTS TAB */}
            {tab === "projects" && (
                <div className="g g21">
                    <div className="card">
                        <div className="tw"><table><thead><tr><th>Project</th><th>Name</th><th>Owner</th><th>Status</th><th>WOs</th><th>Due</th></tr></thead><tbody>
                            {PROJECTS.filter(p => p.status !== "completed").map(p => (
                                <tr key={p.id} className="cl" onClick={() => setSelProj(p)} style={{ background: selProj?.id === p.id ? "var(--bg3)" : undefined }}>
                                    <td><span className="tacc">{p.id}</span></td>
                                    <td style={{ fontWeight: 600, color: selProj?.id === p.id ? "var(--accent)" : undefined, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                                    <td className="tdim">{p.owner}</td>
                                    <td><SB s={p.status} /></td>
                                    <td><span className="tm">{p.wos}</span></td>
                                    <td><span className="tm">{p.due}</span></td>
                                </tr>
                            ))}
                        </tbody></table></div>
                    </div>
                    <div>
                        {selProj ? (
                            <div className="card" style={{ position: "sticky", top: 20 }}>
                                <div className="ch" style={{ borderTopColor: DEPT_C[selProj.code], borderTopWidth: 2 }}>
                                    <div><div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 800 }}>{selProj.name}</div><div className="tiny mt4">{selProj.id}</div></div>
                                    <div style={{ display: "flex", gap: 6 }}><SB s={selProj.status} /></div>
                                </div>
                                <div className="cb">
                                    {[["Owner", selProj.owner], ["Due", selProj.due], ["Priority", selProj.priority], ["Work Orders", selProj.wos]].map(([k, v]) => (
                                        <div key={k} className="rowsb" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                                    ))}
                                    <div className="sep" />
                                    <div className="tiny mb8">WORK ORDERS</div>
                                    {WOS.filter(w => w.project === selProj.id).map(wo => (
                                        <div key={wo.id} className="ii">
                                            <span className="tacc" style={{ flexShrink: 0 }}>{wo.id}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.part}</div><div className="tiny"><TB tech={wo.tech} /></div></div>
                                            <SB s={wo.status} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}><div style={{ textAlign: "center", color: "var(--text3)" }}><div style={{ fontSize: 32, marginBottom: 8 }}>◧</div><div>Select a project</div></div></div>}
                    </div>
                </div>
            )}

            {/* WORK ORDERS TAB */}
            {tab === "wos" && (
                <div className="card"><div className="tw"><table><thead><tr><th>WO</th><th>Part</th><th>Project</th><th>Tech</th><th>Qty</th><th>Status</th><th>Due</th><th>Priority</th><th>Requestor</th></tr></thead><tbody>
                    {WOS.map(wo => (
                        <tr key={wo.id} className="cl" onClick={() => setSelWO(wo)}>
                            <td><span className="tacc">{wo.id}</span></td>
                            <td style={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.part}</td>
                            <td><span className="tm">{wo.project}</span></td>
                            <td><TB tech={wo.tech} /></td>
                            <td className="tm">{wo.qty}</td>
                            <td><SB s={wo.status} /></td>
                            <td><span className="tm">{wo.due}</span></td>
                            <td><SB s={wo.priority} /></td>
                            <td className="tdim">{wo.requestor}</td>
                        </tr>
                    ))}
                </tbody></table></div></div>
            )}

            {/* COMPLETED PROJECTS ARCHIVE TAB */}
            {tab === "completed" && (
                <div>
                    <div className="g g21">
                        <div className="card">
                            <div className="ch"><span className="ct">Completed Projects Archive</span></div>
                            <div className="tw"><table><thead><tr><th>Project</th><th>Name</th><th>Completed</th><th>WO</th><th>Machine</th><th>Material</th><th></th></tr></thead><tbody>
                                {completedProjects.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>No completed projects yet</td></tr>
                                ) : (
                                    completedProjects.map(p => (
                                        <tr key={p.id} className="cl" onClick={() => setSelCompleted(p)} style={{ background: selCompleted?.id === p.id ? "var(--bg3)" : undefined }}>
                                            <td><span className="tacc">{p.id}</span></td>
                                            <td style={{ fontWeight: 600, color: selCompleted?.id === p.id ? "var(--accent)" : undefined, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                                            <td><span className="tm">{p.history?.find(h => h.stage === "closed")?.time || "—"}</span></td>
                                            <td><span className="mono" style={{ fontSize: 11 }}>{p.woId || "—"}</span></td>
                                            <td><span className="tiny">{p.machine || "—"}</span></td>
                                            <td><span className="tiny">{p.material || "—"}</span></td>
                                            <td style={{ width: 100 }}>
                                                <button
                                                    className="btn btp bts"
                                                    style={{ fontSize: 10, padding: "4px 8px" }}
                                                    onClick={(e) => { e.stopPropagation(); setShowRestartModal(p); }}
                                                >
                                                    ↻ Restart
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody></table></div>
                        </div>

                        {/* Completed Project Detail Panel */}
                        <div>
                            {selCompleted ? (
                                <div className="card" style={{ position: "sticky", top: 20 }}>
                                    <div className="ch" style={{ borderTopColor: "var(--green)", borderTopWidth: 2 }}>
                                        <div>
                                            <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 800 }}>{selCompleted.name}</div>
                                            <div className="tiny mt4">{selCompleted.id} · <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ COMPLETED</span></div>
                                        </div>
                                    </div>
                                    <div className="cb">
                                        <div className="tiny mb8" style={{ color: "var(--green)", fontWeight: 700 }}>PROJECT DETAILS</div>
                                        {[
                                            ["Owner", selCompleted.owner],
                                            ["Technology", selCompleted.tech],
                                            ["Material", selCompleted.material],
                                            ["Quantity", selCompleted.qty + " pcs"],
                                            ["Completed", selCompleted.history?.find(h => h.stage === "closed")?.time || "—"],
                                            ["Work Order", selCompleted.woId || "—"],
                                            ["Machine Used", selCompleted.machine || "—"],
                                        ].map(([k, v]) => (
                                            <div key={k} className="rowsb" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                                        ))}

                                        <div className="sep" />
                                        <div className="tiny mb8">PROJECT HISTORY</div>
                                        {(selCompleted.history || []).filter(h => h.done).map(h => (
                                            <div key={h.stage} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                                                <div className="rowsb">
                                                    <span style={{ fontSize: 11, fontWeight: 600 }}>{LIFECYCLE_STAGES.find(s => s.id === h.stage)?.label || h.stage}</span>
                                                    <span className="tiny">{h.time || "—"}</span>
                                                </div>
                                                {h.note && <div className="tiny" style={{ color: "var(--text3)", marginTop: 2 }}>{h.note}</div>}
                                            </div>
                                        ))}

                                        <div className="sep" />
                                        <button
                                            className="btn btp bts"
                                            style={{ width: "100%", fontSize: 12, marginBottom: 8 }}
                                            onClick={() => setShowRestartModal(selCompleted)}
                                        >
                                            ↻ Restart This Project
                                        </button>
                                        <div className="tiny" style={{ color: "var(--text3)", textAlign: "center", fontStyle: "italic" }}>
                                            Creates new request with same settings — goes directly to AM Review
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
                                    <div style={{ textAlign: "center", color: "var(--text3)" }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                                        <div>Select a completed project to view details</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Work Order Modal */}
            {selWO && (
                <Modal title={`Work Order ${selWO.id}`} onClose={() => setSelWO(null)}
                    footer={(<><button className="btn btg bts" onClick={() => setSelWO(null)}>Close</button><button className="btn btp bts" onClick={() => setSelWO(null)}>Save Changes</button></>)} >
                    <div className="g g2 mb12">
                        {[["WO", selWO.id], ["Project", selWO.project], ["Part", selWO.part], ["Requestor", selWO.requestor], ["Machine", selWO.machine || "—"]].map(([k, v]) => (
                            <div key={k}><div className="tiny mb4">{k.toUpperCase()}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                        ))}
                    </div>
                    <div className="sep" />
                    <div className="frow">
                        <div className="fg"><label className="fl">Status</label><select className="fsel" defaultValue={selWO.status}><option value="planned">Planned</option><option value="scheduled">Scheduled</option><option value="production">In Production</option><option value="postproc">Post-Process</option><option value="qa">QA</option><option value="completed">Completed</option></select></div>
                        <div className="fg"><label className="fl">Priority</label><select className="fsel" defaultValue={selWO.priority}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Assign Machine</label><select className="fsel" defaultValue={selWO.machine || ""}>{MACHINES_BASE.filter(m => m.tech === selWO.tech).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}<option value="">— Unassigned</option></select></div>
                        <div className="fg"><label className="fl">Due Date</label><input type="date" className="fi" defaultValue={selWO.due} /></div>
                    </div>
                    <div className="fg mb12"><label className="fl">Notes</label><textarea className="fta" placeholder="Add notes or instructions..."></textarea></div>
                    <div className="sep" />
                    <div className="tiny mb8">GENEALOGY / TRACEABILITY</div>
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 12 }}>
                        {[["Machine", selWO.machine || "—"], ["Operator", "Marco R."], ["Material Lot", "PA-5511"], ["Started", "Today 08:14"], ["Linked Request", selWO.project]].map(([k, v]) => (
                            <div key={k} className="rowsb" style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Restart Project Modal */}
            {showRestartModal && (
                <Modal
                    title="Restart Completed Project"
                    onClose={() => setShowRestartModal(null)}
                    footer={(
                        <>
                            <button className="btn btg bts" onClick={() => setShowRestartModal(null)}>Cancel</button>
                            <button className="btn btp bts" onClick={() => handleRestart(showRestartModal)}>↻ Create Restart Request</button>
                        </>
                    )}
                >
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{showRestartModal.name}</div>
                        <div className="tiny">{showRestartModal.id} · {showRestartModal.tech} · {showRestartModal.material} · {showRestartModal.qty} pcs</div>
                        <div className="tiny mt4" style={{ color: "var(--green)" }}>✓ Completed: {showRestartModal.history?.find(h => h.stage === "closed")?.time || "Unknown"}</div>
                    </div>

                    <div style={{ padding: 12, background: "var(--adim)", border: "1px solid rgba(45,212,191,.2)", borderRadius: "var(--r2)", marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>What will be created:</div>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.8, color: "var(--text2)" }}>
                            <li>New request ID: <strong style={{ color: "var(--text)" }}>{showRestartModal.id}-R{(lcProjects || []).filter(p => p.previousRun?.projectId === showRestartModal.id).length + 1}</strong></li>
                            <li>Name: <strong style={{ color: "var(--text)" }}>{showRestartModal.name} (Restart)</strong></li>
                            <li>All settings from previous run preserved</li>
                            <li>Machine, material, tech, quantity — all carried forward</li>
                            <li>Status: <strong style={{ color: "var(--yellow)" }}>AM Review — verify and approve</strong></li>
                            <li>Review/edit all settings in AM Review before approval</li>
                        </ul>
                    </div>

                    <div style={{ padding: 10, background: "var(--ydim)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "var(--r2)", fontSize: 11 }}>
                        <div style={{ fontFamily: "var(--fd)", fontWeight: 700, color: "var(--yellow)", marginBottom: 4 }}>ℹ️ How Restart Works</div>
                        <div style={{ color: "var(--text2)" }}>
                            This creates a new request that goes directly to AM Review. All previous settings are available for reference.
                            Verify machine, material, post-processing, and QC settings — then approve to start production.
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
