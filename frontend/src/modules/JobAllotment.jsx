import React, { useState, useEffect, useRef } from "react";
import { SCHEDULE_JOBS, ALLOT_QUEUE } from '../data/seed.jsx';
import { TB, SB, Prog, Modal } from '../components/atoms.jsx';

export function JobAllotment() {
    const [techFilter, setTechFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAutoConfirm, setShowAutoConfirm] = useState(null);
    const [showManual, setShowManual] = useState(null);
    const [showAddProject, setShowAddProject] = useState(false);
    const [showPrintLog, setShowPrintLog] = useState(null);
    const [queue, setQueue] = useState(ALLOT_QUEUE);
    const [newProj, setNewProj] = useState({ name: "", qty: 1, deadline: new Date().toISOString().split("T")[0], tech: "FDM", priority: "Medium" });

    const printerGrid = SCHEDULE_JOBS.slice(0, 8);
    const priorityBadge = { low: "bnorm", medium: "bwait", high: "burgent" };
    const priorityColor = { low: "var(--text3)", medium: "var(--yellow)", high: "var(--red)" };

    const PRINT_LOG = [
        { job: "Job 2 for PRUSA01", code: "BUSY-PRUSA01", start: "19-03 18:29", dur: "9h" },
        { job: "Job 3 for PRUSA01", code: "BUSY-PRUSA01", start: "20-03 03:29", dur: "9h" },
        { job: "Job 4 for PRUSA01", code: "BUSY-PRUSA01", start: "20-03 12:29", dur: "12h" },
        { job: "Job 5 for PRUSA01", code: "BUSY-PRUSA01", start: "20-03 22:29", dur: "—" },
    ];

    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Job Allotment</h1></div>
            <div className="rowsb mb16">
                <div><div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700 }}>Job Allotment</div><div className="tiny dim">Drag and drop projects to assign them to printers</div></div>
                <button className="btn btp bts" onClick={() => setShowAddProject(true)}>⊕ Add New Project</button>
            </div>

            <div className="card mb16">
                <div className="ch">
                    <div><span className="ct">Unassigned Projects Queue</span><div className="tiny mt4">Projects waiting for assignment.</div></div>
                    <div className="row" style={{ gap: 8 }}>
                        <select className="fsel" style={{ fontSize: 11, padding: "4px 10px", width: 140 }} value={techFilter} onChange={e => setTechFilter(e.target.value)}>
                            <option value="all">All Technologies</option><option>FDM</option><option>SLA</option><option>SLS</option><option>MJF</option>
                        </select>
                        <select className="fsel" style={{ fontSize: 11, padding: "4px 10px", width: 120 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Statuses</option><option>unassigned</option><option>assigned</option>
                        </select>
                    </div>
                </div>
                <div className="tw">
                    <table>
                        <thead><tr><th>Project Name</th><th>Est. Time</th><th>Items</th><th>Priority</th><th>Technology</th><th>Deadline</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
                        <tbody>
                            {queue.filter(q => techFilter === "all" || q.tech === techFilter).map(q => (
                                <tr key={q.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: 12 }}>Order: {q.id}</div>
                                        <div className="tiny">{q.code}</div>
                                    </td>
                                    <td className="mono">{q.estTime}</td>
                                    <td className="mono">{q.items}</td>
                                    <td><span className={`b ${priorityBadge[q.priority] || "bnorm"}`} style={{ fontSize: 9 }}>{q.priority.charAt(0).toUpperCase() + q.priority.slice(1)}</span></td>
                                    <td><TB tech={q.tech} /></td>
                                    <td className="mono">{q.deadline}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                                            <button className="btn btp bts" style={{ fontSize: 10 }} onClick={() => setShowAutoConfirm(q)}>⚡ Auto</button>
                                            <button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => setShowManual(q)}>✎ Manual</button>
                                            <button className="btn bts" style={{ fontSize: 10, background: "var(--rdim)", color: "var(--red)", border: "1px solid rgba(244,63,94,.3)" }} onClick={() => setQueue(p => p.filter(x => x.id !== q.id))}>✕</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Printer Grid */}
            <div className="g g4">
                {printerGrid.map(p => (
                    <div key={p.id} className={`mc ${p.status === "printing" ? "running" : p.status === "maintenance" ? "maintenance" : "idle"}`} style={{ cursor: "pointer" }} onClick={() => p.job && setShowPrintLog(p)}>
                        <div className="rowsb mb6">
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11.5, fontWeight: 700 }}>{p.printer}</div>
                            <div style={{ display: "flex", gap: 4 }}>
                                <TB tech={p.tech} />
                                <SB s={p.status === "printing" ? "running" : p.status} />
                            </div>
                        </div>
                        {p.job
                            ? <><div className="tiny mb4" style={{ color: "var(--text2)" }}>{p.job}</div><Prog pct={65} h={4} /><div className="tiny mt4">Queue (3)</div></>
                            : <div className="tiny" style={{ color: "var(--text4)" }}>No active job</div>
                        }
                        {p.status === "maintenance" && <div className="tiny mt4" style={{ color: "var(--yellow)" }}>Under maintenance</div>}
                        {p.job && <div className="tiny mt4" style={{ color: "var(--text3)" }}>▷ {Math.floor(Math.random() * 8 + 1)} more</div>}
                    </div>
                ))}
            </div>

            {/* Auto Confirm Modal */}
            {showAutoConfirm && (
                <Modal title="Confirm Auto-Assignment" onClose={() => setShowAutoConfirm(null)} footer={(
                    <><button className="btn btg bts" onClick={() => setShowAutoConfirm(null)}>✕ Cancel</button>
                        <button className="btn btp bts" onClick={() => { setQueue(p => p.filter(x => x.id !== showAutoConfirm.id)); setShowAutoConfirm(null); }}>✓ Confirm &amp; Assign</button></>
                )}>
                    <div className="astrip info mb12">The AI has found an optimal slot for this project. Please review and confirm.</div>
                    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14 }}>
                        <div className="tiny mb8">Assignment Details</div>
                        <div className="rowsb mb6"><span className="tiny">Project</span><span style={{ fontSize: 12, fontWeight: 600 }}>Order: {showAutoConfirm.id}</span></div>
                        <div className="rowsb mb6"><span className="tiny">Assign to Printer</span><span style={{ fontSize: 12 }}>EOS Formiga P 110</span></div>
                        <div className="rowsb"><span className="tiny">Proposed Start Time</span><span style={{ fontSize: 12, fontFamily: "var(--fm)" }}>19-03-2026, 10:51 AM</span></div>
                    </div>
                </Modal>
            )}

            {/* Manual Assign Modal */}
            {showManual && (
                <Modal title="Manual Project Assignment" onClose={() => setShowManual(null)} footer={(
                    <><button className="btn btg bts" onClick={() => setShowManual(null)}>Cancel</button>
                        <button className="btn btp bts" onClick={() => { setQueue(p => p.filter(x => x.id !== showManual.id)); setShowManual(null); }}>✓ Assign to Selected Printer</button></>
                )}>
                    <div className="tiny mb12">Select a printer for <strong>Order: {showManual.id}</strong>. The system will find the earliest available slot.</div>
                    {[{ name: "EDS Formiga P 110", tech: "SLS", slot: "Next Slot: 19 Mar, 10:51 AM" }, { name: "Formlabs Fuse 1", tech: "SLS", slot: "Next Slot: 19 Mar, 10:52 AM" }].map(p => (
                        <div key={p.name} className="rowsb mb8" style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 14px" }}>
                            <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.name}</div>
                                <div className="tiny">{p.slot}</div>
                            </div>
                            <div className="row" style={{ gap: 6 }}><TB tech={p.tech} /><span className="b bidle" style={{ fontSize: 9 }}>Idle</span></div>
                        </div>
                    ))}
                </Modal>
            )}

            {/* Print Log Modal */}
            {showPrintLog && (
                <Modal title={`Print Log: ${showPrintLog.printer}`} onClose={() => setShowPrintLog(null)}>
                    <div className="tiny mb12">Showing all upcoming jobs scheduled for this printer.</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th>Project</th><th>Start Time</th><th>Duration</th></tr></thead>
                        <tbody>
                            {PRINT_LOG.map((j, i) => (
                                <tr key={i}><td><div style={{ fontSize: 12, fontWeight: 500 }}>{j.job}</div><div className="tiny">{j.code}</div></td><td className="mono">{j.start}</td><td className="mono">{j.dur}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </Modal>
            )}

            {/* Add Project Modal */}
            {showAddProject && (
                <Modal title="Add New Project" onClose={() => setShowAddProject(false)} footer={(
                    <><button className="btn btg bts" onClick={() => setShowAddProject(false)}>Cancel</button>
                        <button className="btn btp bts" onClick={() => { setQueue(p => [...p, { id: "ORD-" + (106 + p.length), code: "PRJ-NEW", name: newProj.name || "New Project", estTime: "2h 0m", items: newProj.qty, priority: newProj.priority.toLowerCase(), tech: newProj.tech, deadline: newProj.deadline, status: "unassigned" }]); setShowAddProject(false); }}>Add Project</button></>
                )}>
                    <div className="frow">
                        <div className="fg"><label className="fl">Est. Time per item</label><input type="number" className="fi" defaultValue={0} /></div>
                        <div className="fg"><label className="fl">Priority</label><select className="fsel" onChange={e => setNewProj(p => ({ ...p, priority: e.target.value }))}><option>Medium</option><option>Low</option><option>High</option></select></div>
                    </div>
                    <div className="frow"><div className="fg"><label className="fl">Project Name</label><input className="fi" placeholder="Project name" value={newProj.name} onChange={e => setNewProj(p => ({ ...p, name: e.target.value }))} /></div></div>
                    <div className="frow"><div className="fg"><label className="fl">Project Code</label><input className="fi" placeholder="e.g. PRJ-106" /></div></div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Deadline</label><input type="date" className="fi" value={newProj.deadline} onChange={e => setNewProj(p => ({ ...p, deadline: e.target.value }))} /></div>
                        <div className="fg"><label className="fl">Technology</label><select className="fsel" onChange={e => setNewProj(p => ({ ...p, tech: e.target.value }))}><option>FDM</option><option>SLA</option><option>SLS</option></select></div>
                    </div>
                    <div className="sep" />
                    <div className="tiny mb8">Project Items &amp; Materials</div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Item Quantity</label><input type="number" className="fi" defaultValue={1} /></div>
                        <div className="fg"><label className="fl">Custom Material</label><input className="fi" placeholder="Material type" /></div>
                    </div>
                    <button className="btn btg bts mt8">⊕ Add Material to this Item</button>
                </Modal>
            )}
        </div>
    );
}
