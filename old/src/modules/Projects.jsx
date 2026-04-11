import React, { useState, useEffect, useRef } from "react";
import { PROJECTS, WOS, DEPARTMENTS } from '../data/seed.js';
import { TB, SB, DB, Tabs, Prog, AStrip } from '../components/atoms.jsx';

export function Projects() {
    const [tab, setTab] = useState("projects");
    const [selProj, setSelProj] = useState(null);
    const [selWO, setSelWO] = useState(null);
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Projects & Work Orders</h1></div>
            <Tabs tabs={[{ id: "projects", label: "Projects" }, { id: "wos", label: "Work Orders" }]} active={tab} onChange={setTab} />
            {tab === "projects" && (
                <div className="g g21">
                    <div className="card">
                        <div className="tw"><table><thead><tr><th>Project</th><th>Name</th><th>Dept</th><th>Owner</th><th>Status</th><th>WOs</th><th>Budget</th><th>Due</th></tr></thead><tbody>
                            {PROJECTS.map(p => (
                                <tr key={p.id} className="cl" onClick={() => setSelProj(p)} style={{ background: selProj?.id === p.id ? "var(--bg3)" : undefined }}>
                                    <td><span className="tacc">{p.id}</span></td>
                                    <td style={{ fontWeight: 600, color: selProj?.id === p.id ? "var(--accent)" : undefined, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                                    <td><DB code={p.code} /></td>
                                    <td className="tdim">{p.owner}</td>
                                    <td><SB s={p.status} /></td>
                                    <td><span className="tm">{p.wos}</span></td>
                                    <td>
                                        <div style={{ minWidth: 100 }}>
                                            <div className="rowsb mb2"><span className="tiny">AED {p.spent.toLocaleString()}</span><span className="tiny" style={{ color: p.spent / p.budget > 0.9 ? "var(--red)" : "var(--text3)" }}>{Math.round(p.spent / p.budget * 100)}%</span></div>
                                            <Prog pct={p.spent / p.budget * 100} color={p.spent / p.budget > 0.9 ? "red" : p.spent / p.budget > 0.7 ? "yellow" : "green"} h={4} />
                                        </div>
                                    </td>
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
                                    <div style={{ display: "flex", gap: 6 }}><DB code={selProj.code} /><SB s={selProj.status} /></div>
                                </div>
                                <div className="cb">
                                    {[["Owner", selProj.owner], ["Department", selProj.dept], ["Due", selProj.due], ["Priority", selProj.priority], ["Work Orders", selProj.wos]].map(([k, v]) => (
                                        <div key={k} className="rowsb" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                                    ))}
                                    <div className="sep" />
                                    <div className="tiny mb8">BUDGET UTILISATION</div>
                                    <BudgetBar spent={selProj.spent} budget={selProj.budget} color={DEPT_C[selProj.code]} />
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
            {tab === "wos" && (
                <div className="card"><div className="tw"><table><thead><tr><th>WO</th><th>Part</th><th>Project</th><th>Dept</th><th>Tech</th><th>Qty</th><th>Status</th><th>Due</th><th>Priority</th><th>Requestor</th></tr></thead><tbody>
                    {WOS.map(wo => (
                        <tr key={wo.id} className="cl" onClick={() => setSelWO(wo)}>
                            <td><span className="tacc">{wo.id}</span></td>
                            <td style={{ fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{wo.part}</td>
                            <td><span className="tm">{wo.project}</span></td>
                            <td><DB code={wo.code || wo.dept.slice(0, 3).toUpperCase()} /></td>
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
            {selWO && (
                <Modal title={`Work Order ${selWO.id}`} onClose={() => setSelWO(null)}
                    footer={(<><button className="btn btg bts" onClick={() => setSelWO(null)}>Close</button><button className="btn btp bts" onClick={() => setSelWO(null)}>Save Changes</button></>)} >
                    <div className="g g2 mb12">
                        {[["WO", selWO.id], ["Project", selWO.project], ["Part", selWO.part], ["Dept", selWO.dept], ["Requestor", selWO.requestor], ["Machine", selWO.machine || "—"]].map(([k, v]) => (
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
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   MACHINES
══════════════════════════════════════════════════════════════════ */
