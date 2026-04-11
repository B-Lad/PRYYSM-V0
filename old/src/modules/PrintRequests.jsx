import React, { useState, useEffect, useRef } from "react";
import { LC_SEED, LIFECYCLE_STAGES, MATS_BY_TECH, MACHINES_BASE } from '../data/seed.js';
import { TB, SB, DB, Modal, Tabs, Prog, AStrip } from '../components/atoms.jsx';
import { DEPT_CLS } from '../data/constants.js';
import { MAT_CATALOG, BLANK_MAT, BLANK_GROUP } from '../data/matCatalog.js';

export function ColorPicker({ cat, mat, gi, mi, setMat }) {
    const colorOpts = (cat.colors[`${mat.matType}|${mat.finish}`] || []);
    const selColor = colorOpts.find(c => c.name === mat.matName);
    const lightHexes = ["#F5F5F0", "#F0F0EE", "#EEEEEA", "#DCF0FF", "#E2E8F0", "#DDE4EF", "#F6E3A0", "#C6D0DC"];
    return (
        <div>
            <label className="fl">Available Color</label>
            <div style={{ position: "relative" }}>
                <select className="fsel" style={{ paddingLeft: mat.matName ? "28px" : "10px" }} value={mat.matName} onChange={e => setMat(gi, mi, "matName", e.target.value)}>
                    <option value="">Select color…</option>
                    {colorOpts.map(c => <option key={c.name} value={c.name}>{c.name} · {c.stock} {c.unit}</option>)}
                    {colorOpts.length === 0 && <option disabled>No stock available</option>}
                </select>
                {selColor && <div style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, borderRadius: "50%", background: selColor.hex, border: "1px solid rgba(0,0,0,.15)", pointerEvents: "none" }} />}
            </div>
            {selColor && (
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 7px", background: selColor.hex, borderRadius: 20, border: "1px solid rgba(0,0,0,.1)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(0,0,0,.25)", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: lightHexes.includes(selColor.hex) ? "#1A2540" : "#fff" }}>{selColor.name} — {selColor.stock} {selColor.unit}</span>
                </div>
            )}
        </div>
    );
}

export function NewRequestWizard({ onClose, onCreate }) {
    const [step, setStep] = useState(0);
    const [f, setF] = useState({ name: "", dept: "", projCode: "", owner: "", priority: "normal", due: "", description: "", tech: "FDM", estHrs: 0, estMin: 0, groups: [BLANK_GROUP()], notes: "" });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const canNext = [f.name.trim() && f.owner.trim() && f.due, true, true, true][step];

    // Group ops
    const addGroup = () => setF(p => ({ ...p, groups: [...p.groups, BLANK_GROUP()] }));
    const delGroup = (gi) => setF(p => ({ ...p, groups: p.groups.filter((_, i) => i !== gi) }));
    const setGroup = (gi, k, v) => setF(p => { const g = [...p.groups]; g[gi] = { ...g[gi], [k]: v }; return { ...p, groups: g }; });
    // Material ops within a group
    const addMat = (gi) => setF(p => { const g = [...p.groups]; g[gi] = { ...g[gi], materials: [...g[gi].materials, BLANK_MAT()] }; return { ...p, groups: g }; });
    const delMat = (gi, mi) => setF(p => { const g = [...p.groups]; g[gi] = { ...g[gi], materials: g[gi].materials.filter((_, i) => i !== mi) }; return { ...p, groups: g }; });
    const setMat = (gi, mi, k, v) => setF(p => { const g = [...p.groups]; const m = [...g[gi].materials]; m[mi] = { ...m[mi], [k]: v }; g[gi] = { ...g[gi], materials: m }; return { ...p, groups: g }; });

    function submit() {
        const now = new Date();
        const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        const id = f.projCode || ("PRJ-" + (Math.floor(Math.random() * 900) + 100));
        const firstMat = f.groups[0]?.materials[0];
        onCreate({
            id, name: f.name, dept: f.dept || "ENG", priority: f.priority, owner: f.owner, description: f.description,
            stage: "submitted", created: ts, due: f.due, tech: f.tech, material: firstMat?.matType || "—",
            qty: f.groups.reduce((a, g) => a + Number(g.qty), 0), printPct: 0, requestNote: f.notes, woId: null, machine: null,
            groups: f.groups,
            history: LIFECYCLE_STAGES.map((s, i) => ({ stage: s.id, done: false, time: i === 0 ? ts : "Pending", note: i === 0 ? `Submitted by ${f.owner}.` : "" })),
        });
    }
    return (
        <Modal title="New Print Request" onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                {step > 0 && <button className="btn btg bts" onClick={() => setStep(s => s - 1)}>Back</button>}
                {step < WIZ_LABELS.length - 1
                    ? <button className="btn btp bts" onClick={() => setStep(s => s + 1)} disabled={!canNext}>Next</button>
                    : <button className="btn btp bts" onClick={submit}>Submit Request</button>}
            </>
        )}>
            <div className="wiz-steps">
                {WIZ_LABELS.map((label, i) => (
                    <div key={i} className={`wz-s ${i < step ? "wz-done" : i === step ? "wz-act" : ""}`}>
                        <div className="wz-num">{i < step ? "✓" : i + 1}</div>{label}
                    </div>
                ))}
            </div>

            {step === 0 && (
                <div>
                    <div className="frow"><div className="fg"><label className="fl">Part / Project Name *</label><input className="fi" placeholder="e.g. PCB Alignment Jig Mk4" value={f.name} onChange={e => set("name", e.target.value)} /></div></div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Department</label><input className="fi" placeholder="e.g. Engineering, R&D, Design..." value={f.dept} onChange={e => set("dept", e.target.value)} /></div>
                        <div className="fg"><label className="fl">Your Name *</label><input className="fi" placeholder="Full name" value={f.owner} onChange={e => set("owner", e.target.value)} /></div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Project Code</label><input className="fi" placeholder="e.g. PRJ-112" value={f.projCode} onChange={e => set("projCode", e.target.value)} /></div>
                        <div className="fg"><label className="fl">Priority</label><select className="fsel" value={f.priority} onChange={e => set("priority", e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Required By *</label><input type="date" className="fi" value={f.due} onChange={e => set("due", e.target.value)} /></div>
                    </div>
                    <div className="fg"><label className="fl">Description</label><textarea className="fta" placeholder="What is this part for? What assembly does it support?" value={f.description} onChange={e => set("description", e.target.value)}></textarea></div>
                </div>
            )}

            {step === 1 && (
                <div>
                    {/* Image + Est Time row */}
                    <div className="frow mb12" style={{ alignItems: "flex-start", gap: 16 }}>
                        <div>
                            <label className="fl">Image</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 72, height: 72, border: "1px solid var(--border2)", borderRadius: "var(--r2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: "var(--bg3)", flexShrink: 0 }}>
                                    <span style={{ fontSize: 18, color: "var(--text3)" }}>↑</span>
                                </div>
                                <button className="btn btg bts" style={{ fontSize: 11 }}>Upload Image</button>
                            </div>
                        </div>
                        <div className="fg">
                            <label className="fl">Est. Time per Item</label>
                            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                                <input className="fi" type="number" min={0} placeholder="0" style={{ flex: 1 }} value={f.estHrs} onChange={e => set("estHrs", e.target.value)} />
                                <input className="fi" type="number" min={0} placeholder="0" style={{ flex: 1 }} value={f.estMin} onChange={e => set("estMin", e.target.value)} />
                            </div>
                            <div className="tiny">A 5% buffer will be automatically added to the start of the print.</div>
                        </div>
                    </div>

                    {/* Technology */}
                    <div className="frow">
                        <div className="fg"><label className="fl">Technology *</label><select className="fsel" value={f.tech} onChange={e => set("tech", e.target.value)}><option>FDM</option><option>SLA</option><option>SLS</option></select></div>
                    </div>

                    {/* Project Items & Materials */}
                    <div className="rowsb mb8 mt4">
                        <span style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>Project Items &amp; Materials</span>
                        <span className="tiny">Total Groups: <span style={{ color: "var(--accent)", fontWeight: 700 }}>{f.groups.length}</span></span>
                    </div>

                    {f.groups.map((grp, gi) => {
                        const cat = MAT_CATALOG[f.tech] || MAT_CATALOG.FDM;
                        return (
                            <div key={gi} style={{ border: "1px solid var(--border2)", borderRadius: "var(--r2)", marginBottom: 12, overflow: "hidden" }}>
                                {/* Group header */}
                                <div style={{ background: "var(--bg3)", padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontFamily: "var(--fm)", fontSize: 10, color: "var(--text3)" }}>ITEM GROUP {gi + 1}</span>
                                    {f.groups.length > 1 && <button onClick={() => delGroup(gi)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}>✕</button>}
                                </div>

                                <div style={{ padding: 12 }}>
                                    {/* Qty row */}
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                                        <div style={{ width: 90, flexShrink: 0 }}>
                                            <label className="fl">Item Qty</label>
                                            <input className="fi" type="number" min={1} value={grp.qty} style={{ textAlign: "center" }} onChange={e => setGroup(gi, "qty", e.target.value)} />
                                        </div>
                                        <div className="fg" style={{ paddingTop: 14, color: "var(--text3)", fontSize: 11 }}>
                                            items in this group — each may have multiple materials below
                                        </div>
                                    </div>

                                    {/* Materials */}
                                    {grp.materials.map((mat, mi) => {
                                        return (
                                            <div key={mi} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 12px", marginBottom: 8, position: "relative" }}>
                                                {/* Delete material */}
                                                {grp.materials.length > 1 && (
                                                    <button onClick={() => delMat(gi, mi)} style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 13, lineHeight: 1 }}>🗑</button>
                                                )}
                                                {/* Custom toggle */}
                                                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginBottom: 8, paddingRight: 20 }}>
                                                    <span className="tiny">Custom Material</span>
                                                    <div onClick={() => setMat(gi, mi, "custom", !mat.custom)} style={{ width: 36, height: 20, borderRadius: 10, background: mat.custom ? "var(--accent)" : "var(--border2)", cursor: "pointer", position: "relative", transition: "background .15s", flexShrink: 0 }}>
                                                        <div style={{ position: "absolute", top: 2, left: mat.custom ? 16 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
                                                    </div>
                                                </div>

                                                {mat.custom ? (
                                                    /* ── Custom material fields ── */
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <div className="fg">
                                                                <label className="fl">Material Type</label>
                                                                <select className="fsel" value={mat.matType} onChange={e => setMat(gi, mi, "matType", e.target.value)}>
                                                                    <option value="">Select…</option>
                                                                    {cat.types.map(t => <option key={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="fg">
                                                                <label className="fl">Finish</label>
                                                                <select className="fsel" value={mat.finish} onChange={e => setMat(gi, mi, "finish", e.target.value)}>
                                                                    <option value="">Select…</option>
                                                                    {cat.finishes.map(t => <option key={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                                                            <div style={{ flexShrink: 0 }}>
                                                                <label className="fl">Color</label>
                                                                <label style={{ display: "block", width: 38, height: 38, borderRadius: "var(--r2)", overflow: "hidden", border: "2px solid var(--border2)", cursor: "pointer", background: mat.customHex || "#000000" }}>
                                                                    <input type="color" value={mat.customHex || "#000000"} onChange={e => setMat(gi, mi, "customHex", e.target.value)} style={{ opacity: 0, width: "100%", height: "100%", border: "none", cursor: "pointer", padding: 0 }} />
                                                                </label>
                                                            </div>
                                                            <div className="fg">
                                                                <label className="fl">Color Name</label>
                                                                <input className="fi" placeholder="e.g. Midnight Blue, RAL 5003…" value={mat.customName || ""} onChange={e => setMat(gi, mi, "customName", e.target.value)} />
                                                            </div>
                                                            <div style={{ flex: "0 0 100px" }}>
                                                                <label className="fl">Hex</label>
                                                                <input className="fi" placeholder="#000000" maxLength={7} value={mat.customHex || ""} onChange={e => setMat(gi, mi, "customHex", e.target.value)} style={{ fontFamily: "var(--fm)", fontSize: 11 }} />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 4 }}>
                                                            <div style={{ flex: "0 0 130px" }}>
                                                                <label className="fl">Material Required (g)</label>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                    <input className="fi" type="number" min={0} placeholder="0" value={mat.grams || ""} onChange={e => setMat(gi, mi, "grams", e.target.value)} style={{ fontFamily: "var(--fm)", fontSize: 11 }} />
                                                                    <span className="tiny" style={{ flexShrink: 0 }}>g / item</span>
                                                                </div>
                                                            </div>
                                                            <div className="tiny" style={{ paddingBottom: 10, color: "var(--text3)" }}>
                                                                {mat.grams && grp.qty ? <>Total: <strong style={{ color: "var(--text2)" }}>{(+mat.grams * +grp.qty).toLocaleString()} g</strong> for {grp.qty} items</> : "Enter grams per item to see total"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* ── Standard material fields ── */
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <div className="fg">
                                                                <label className="fl">Material Type</label>
                                                                <select className="fsel" value={mat.matType} onChange={e => { setMat(gi, mi, "matType", e.target.value); setMat(gi, mi, "matName", ""); }}>
                                                                    <option value="">Select…</option>
                                                                    {cat.types.map(t => <option key={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="fg">
                                                                <label className="fl">Finish</label>
                                                                <select className="fsel" value={mat.finish} onChange={e => setMat(gi, mi, "finish", e.target.value)}>
                                                                    <option value="">Select…</option>
                                                                    {cat.finishes.map(t => <option key={t}>{t}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        {mat.matType && mat.finish && <ColorPicker cat={cat} mat={mat} gi={gi} mi={mi} setMat={setMat} />}
                                                        {mat.matType && !mat.finish && <div className="tiny" style={{ color: "var(--text3)" }}>Select a finish to see available colors</div>}
                                                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 4 }}>
                                                            <div style={{ flex: "0 0 130px" }}>
                                                                <label className="fl">Material Required (g)</label>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                                    <input className="fi" type="number" min={0} placeholder="0" value={mat.grams || ""} onChange={e => setMat(gi, mi, "grams", e.target.value)} style={{ fontFamily: "var(--fm)", fontSize: 11 }} />
                                                                    <span className="tiny" style={{ flexShrink: 0 }}>g / item</span>
                                                                </div>
                                                            </div>
                                                            <div className="tiny" style={{ paddingBottom: 10, color: "var(--text3)" }}>
                                                                {mat.grams && grp.qty ? <>Total: <strong style={{ color: "var(--text2)" }}>{(+mat.grams * +grp.qty).toLocaleString()} g</strong> for {grp.qty} items</> : "Enter grams per item to see total"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <button className="btn btg bts" onClick={() => addMat(gi)} style={{ fontSize: 11, marginTop: 2 }}>⊕ Add Material to this Item</button>
                                </div>
                            </div>
                        );
                    })}

                    <button className="btn btg bts" onClick={addGroup} style={{ fontSize: 11 }}>⊕ Add Item Group</button>
                </div>
            )}
            {step === 2 && (
                <div>
                    <div className="fg mb12"><label className="fl">Print Notes / Special Requirements</label><textarea className="fta" style={{ minHeight: 100 }} placeholder="Tolerances, surface finish, orientation, support strategy..." value={f.notes} onChange={e => set("notes", e.target.value)}></textarea></div>
                    <div style={{ border: "2px dashed var(--border2)", borderRadius: "var(--r2)", padding: "24px 20px", textAlign: "center", color: "var(--text3)", fontSize: 12, cursor: "pointer", transition: "all .15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--adim)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "transparent"; }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>Drop .STL / .STEP / .3MF here<div className="tiny mt4">Max 100 MB per file</div>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div>
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)", marginBottom: 12 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{f.name || "—"}</div>
                        <div className="g g2">
                            {[["Owner", f.owner], ["Department", f.dept || "—"], ["Project Code", f.projCode || "—"], ["Priority", f.priority], ["Required By", f.due || "—"], ["Technology", f.tech], ["Est. Time", `${f.estHrs}h ${f.estMin}m`], ["Item Groups", (f.groups || []).length + ""]].map(([k, v]) => (
                                <div key={k}><div className="tiny mb4">{k.toUpperCase()}</div><div style={{ fontSize: 12, fontWeight: 500 }}>{v || "—"}</div></div>
                            ))}
                        </div>
                        {f.notes && <><div className="sep" /><div className="tiny mb4">PRINT NOTES</div><div className="dim small">{f.notes}</div></>}
                    </div>
                    <div style={{ background: "var(--adim)", border: "1px solid rgba(45,212,191,.2)", borderRadius: "var(--r2)", padding: 12, fontSize: 12 }}>
                        <div style={{ color: "var(--accent)", fontFamily: "var(--fd)", fontWeight: 700, marginBottom: 4 }}>What happens next</div>
                        <div className="dim">The AM Coordinator will review the request, confirm material availability and schedule, then approve. You will be notified at each stage from printing through to final handoff.</div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

/* ── action modals ── */
function ReviewModal({ project, onClose, onAdvance }) {
    const [decision, setDecision] = useState("approve");
    const [notes, setNotes] = useState("");
    return (
        <Modal title={`AM Review — ${project.id}`} onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                <button className="btn btp bts" onClick={() => onAdvance(decision === "approve" ? "planning" : "submitted", notes || "Reviewed.")}>{decision === "approve" ? "Approve & Create WO" : "Submit Decision"}</button>
            </>
        )}>
            <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 12, marginBottom: 12, border: "1px solid var(--border)" }}>
                {[["Part", project.name], ["Tech", project.tech], ["Material", project.material], ["Qty", project.qty + ""], ["Dept", DEPARTMENTS.find(d => d.code === project.dept)?.name || project.dept], ["Due", project.due]].map(([k, v]) => (
                    <div key={k} className="rowsb" style={{ padding: "5px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12 }}>{v}</span></div>
                ))}
                {project.requestNote && <div style={{ marginTop: 8, padding: "6px 8px", background: "var(--bg4)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>"{project.requestNote}"</div>}
            </div>
            <div style={{ background: "var(--ydim)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "var(--r2)", padding: 10, marginBottom: 12, fontSize: 11 }}>
                <div style={{ fontFamily: "var(--fd)", fontWeight: 700, color: "var(--yellow)", marginBottom: 4 }}>Reviewer Checklist</div>
                {["Material in stock", "Machine capacity available for due date", "Geometry feasible for selected tech", "Dept budget has headroom"].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: "var(--yellow)" }}>·</span><span className="dim">{item}</span></div>
                ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[{ v: "approve", l: "Approve" }, { v: "info", l: "Request Info" }, { v: "reject", l: "Reject" }].map(opt => (
                    <button key={opt.v} className={`btn bts ${decision === opt.v ? (opt.v === "reject" ? "btd" : opt.v === "info" ? "bta" : "btp") : "btg"}`} style={{ flex: 1 }} onClick={() => setDecision(opt.v)}>{opt.l}</button>
                ))}
            </div>
            <div className="fg"><label className="fl">Review Notes</label><textarea className="fta" placeholder="Add comments..." value={notes} onChange={e => setNotes(e.target.value)}></textarea></div>
        </Modal>
    );
}

function PlanningModal({ project, onClose, onAdvance }) {
    const [woId] = useState("WO-" + (Math.floor(Math.random() * 900) + 1000));
    const machs = { FDM: ["Ender Pro 1", "Bambu X1-C", "Ender Pro 2"], SLA: ["Form 4 Alpha", "Form 4 Beta"], SLS: ["EOS P396", "Fuse 1+"] };
    const [machine, setMachine] = useState(machs[project.tech][0]);
    const [sched, setSched] = useState("");
    const printTime = { FDM: "3h 22m", SLA: "6h 48m", SLS: "18h 10m" }[project.tech];
    const routing = { FDM: ["Print", "Support Removal", "Sand / Finish", "QA", "Handoff"], SLA: ["Print", "IPA Wash", "UV Cure", "Support Removal", "QA", "Handoff"], SLS: ["Print", "Cool Down 12h", "Depowder", "Media Blast", "QA", "Handoff"] }[project.tech];
    return (
        <Modal title="Create Work Order" onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                <button className="btn btp bts" onClick={() => onAdvance("printing", `${woId} created. Machine: ${machine}. Est. print time: ${printTime}.`, { woId, machine })}>Create WO + Start</button>
            </>
        )}>
            <div className="tiny mb8" style={{ color: "var(--accent)", fontFamily: "var(--fm)" }}>Work Order: {woId}</div>
            <div className="frow">
                <div className="fg"><label className="fl">Assign Machine</label><select className="fsel" value={machine} onChange={e => setMachine(e.target.value)}>{machs[project.tech].map(m => <option key={m}>{m}</option>)}</select></div>
                <div className="fg"><label className="fl">Scheduled Date</label><input type="date" className="fi" value={sched} onChange={e => setSched(e.target.value)} /></div>
            </div>
            <div className="frow">
                <div className="fg"><label className="fl">Est. Print Time</label><input className="fi" defaultValue={printTime} /></div>
                <div className="fg"><label className="fl">Operator</label><select className="fsel"><option>Marco R.</option><option>Yuki T.</option><option>Arjun S.</option></select></div>
            </div>
            <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 12, border: "1px solid var(--border)" }}>
                <div className="tiny mb8">ROUTING PLAN</div>
                {routing.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < routing.length - 1 ? 6 : 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--adim)", border: "1px solid rgba(45,212,191,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "var(--fm)", color: "var(--accent)", flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ fontSize: 12 }}>{step}</span>
                    </div>
                ))}
            </div>
        </Modal>
    );
}

function PostProcModal({ project, onClose, onAdvance }) {
    const steps = { FDM: [{ l: "Support Removal", d: "Manual" }, { l: "Sand / Finish", d: "15-30 min" }], SLA: [{ l: "IPA Wash", d: "15 min" }, { l: "UV Cure", d: "30 min" }, { l: "Support Removal", d: "Manual" }], SLS: [{ l: "Cool Down", d: "12h min" }, { l: "Depowdering", d: "20-40 min" }, { l: "Media Blast", d: "10 min" }] }[project.tech];
    const [done, setDone] = useState(new Set());
    const toggle = (i) => setDone(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
    return (
        <Modal title="Post-Processing Checklist" onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                <button className="btn btp bts" disabled={done.size < steps.length} onClick={() => onAdvance("qa", "All post-processing steps completed.")}>Send to QA</button>
            </>
        )}>
            <div className="dim small mb12">Complete each step and mark done before advancing to QA inspection.</div>
            {steps.map((s, i) => (
                <div key={i} onClick={() => toggle(i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--r2)", border: `1px solid ${done.has(i) ? "var(--green)" : "var(--border)"}`, background: done.has(i) ? "var(--gdim)" : "var(--bg3)", cursor: "pointer", marginBottom: 8, transition: "all .15s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${done.has(i) ? "var(--green)" : "var(--border2)"}`, background: done.has(i) ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", flexShrink: 0 }}>{done.has(i) ? "✓" : ""}</div>
                    <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 600 }}>{s.l}</div><div className="tiny">{s.d}</div></div>
                </div>
            ))}
            {done.size === steps.length && <div style={{ padding: 10, background: "var(--gdim)", border: "1px solid rgba(34,211,168,.2)", borderRadius: "var(--r2)", color: "var(--green)", fontSize: 12, fontFamily: "var(--fd)", fontWeight: 600 }}>All steps complete — ready for QA</div>}
        </Modal>
    );
}

function QAModal({ project, onClose, onAdvance }) {
    const checks = [
        "Dimensional check — critical features within tolerance",
        "Surface finish meets spec",
        "No delamination, voids, or print defects",
        "Support witness marks acceptable",
        project.tech === "SLA" ? "No uncured resin or hazing" : project.tech === "SLS" ? "Powder fully removed from all cavities" : "Infill density correct on cross-section",
        `Correct quantity — ${project.qty} parts present`,
    ];
    const [checked, setChecked] = useState(new Set());
    const [result, setResult] = useState(null);
    const [failNote, setFailNote] = useState("");
    const toggle = (i) => setChecked(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
    return (
        <Modal title={`QA Inspection — ${project.id}`} onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                {result === "fail"
                    ? <button className="btn btd bts" disabled={!failNote.trim()} onClick={() => onAdvance("postproc", "QA FAIL: " + failNote)}>Log NCR + Return</button>
                    : <button className="btn btp bts" disabled={checked.size < checks.length || result !== "pass"} onClick={() => onAdvance("handoff", `QA PASS — ${checks.length}/${checks.length} checks cleared.`)}>Approve for Handoff</button>
                }
            </>
        )}>
            {checks.map((c, i) => (
                <div key={i} className="qa-row">
                    <div className={`qa-box ${checked.has(i) ? "on" : ""}`} onClick={() => toggle(i)}>{checked.has(i) ? "✓" : ""}</div>
                    <span style={{ fontSize: 12.5, flex: 1 }}>{c}</span>
                    {checked.has(i) && <span style={{ color: "var(--green)", fontSize: 10, fontFamily: "var(--fm)" }}>PASS</span>}
                </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className={`btn bts ${result === "pass" ? "btp" : "btg"}`} style={{ flex: 1 }} onClick={() => setResult("pass")}>PASS — All checks cleared</button>
                <button className={`btn bts ${result === "fail" ? "btd" : "btg"}`} style={{ flex: 1 }} onClick={() => setResult("fail")}>FAIL — Issue found</button>
            </div>
            {result === "fail" && <div className="fg mt8"><label className="fl">Describe Defect</label><textarea className="fta" placeholder="Defect type, qty affected, proposed action..." value={failNote} onChange={e => setFailNote(e.target.value)}></textarea></div>}
            {result === "pass" && checked.size === checks.length && <div style={{ marginTop: 10, padding: 10, background: "var(--gdim)", border: "1px solid rgba(34,211,168,.2)", borderRadius: "var(--r2)", color: "var(--green)", fontSize: 12, fontFamily: "var(--fd)", fontWeight: 600 }}>All {checks.length} checks passed — ready for handoff</div>}
        </Modal>
    );
}

function HandoffModal({ project, onClose, onAdvance }) {
    const [recipient, setRecipient] = useState("");
    const [notes, setNotes] = useState("");
    return (
        <Modal title="Department Handoff" onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={onClose}>Cancel</button>
                <button className="btn btp bts" disabled={!recipient.trim()} onClick={() => onAdvance("evaluation", `Handed off to ${recipient}. ${notes || "No additional notes."}`)}>Confirm Handoff</button>
            </>
        )}>
            <div style={{ textAlign: "center", padding: "12px 0 16px" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{project.name}</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}><TB tech={project.tech} /><span className="b bidle">{project.qty} parts</span><span className="b bcomp">QA cleared</span><DB code={project.dept} /></div>
            </div>
            <div className="frow"><div className="fg"><label className="fl">Received By *</label><input className="fi" placeholder="Name of person collecting" value={recipient} onChange={e => setRecipient(e.target.value)} /></div></div>
            <div className="fg mb12"><label className="fl">Handoff Notes</label><textarea className="fta" placeholder="Storage, handling, known deviations..." value={notes} onChange={e => setNotes(e.target.value)}></textarea></div>
            <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 10, fontSize: 12, border: "1px solid var(--border)" }}>
                <div className="tiny mb6">HANDOFF CHECKLIST</div>
                {["Parts labelled with project ID", "Quantity verified vs work order", "QA sign-off included", "Recipient notified"].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 2 }}><span style={{ color: "var(--accent)" }}>·</span><span className="dim">{item}</span></div>
                ))}
            </div>
        </Modal>
    );
}

function EvalModal({ project, onClose, onAdvance }) {
    const [ratings, setRatings] = useState({ quality: 5, speed: 4, accuracy: 5 });
    const [feedback, setFeedback] = useState("");
    const setR = (k, v) => setRatings(p => ({ ...p, [k]: v }));
    return (
        <Modal title="Department Evaluation" onClose={onClose} footer={(
            <><button className="btn btg bts" onClick={() => onAdvance("closed", "Evaluation skipped. Project closed.")}>Skip</button>
                <button className="btn btp bts" onClick={() => onAdvance("closed", `Eval: Quality ${ratings.quality}/5, Speed ${ratings.speed}/5, Accuracy ${ratings.accuracy}/5. ${feedback || "No feedback."}`)}>Submit & Close Project</button>
            </>
        )}>
            <div className="dim small mb16">Rate this project to close the loop. Closes the project record.</div>
            {[{ k: "quality", l: "Part Quality", d: "Did parts meet dimensional and surface requirements?" },
            { k: "speed", l: "Turnaround Speed", d: "Was the project completed in an acceptable timeframe?" },
            { k: "accuracy", l: "Spec Accuracy", d: "Did parts match the design intent?" }].map(({ k, l, d }) => (
                <div key={k} style={{ marginBottom: 16 }}>
                    <div className="rowsb mb4"><span style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 600 }}>{l}</span><span style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800, color: "var(--accent)" }}>{ratings[k]}/5</span></div>
                    <div className="dim small mb8">{d}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                        {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} onClick={() => setR(k, n)} style={{ flex: 1, height: 24, borderRadius: "var(--r)", border: `1px solid ${ratings[k] >= n ? "var(--accent)" : "var(--border2)"}`, background: ratings[k] >= n ? "var(--accent)" : "var(--bg3)", cursor: "pointer", transition: "all .12s" }} />
                        ))}
                    </div>
                </div>
            ))}
            <div className="fg"><label className="fl">Feedback for AM Team</label><textarea className="fta" placeholder="What went well? What could be improved?" value={feedback} onChange={e => setFeedback(e.target.value)}></textarea></div>
        </Modal>
    );
}

/* ── project lifecycle timeline view ── */
function ProjectLifecycle({ project, onAdvance, onBack }) {
    const [modal, setModal] = useState(null);
    const livePct = useLivePrintPct(project);
    const curIdx = lcIdx(project.stage);

    function stSt(id) {
        const si = lcIdx(id);
        if (si < curIdx) return "sd";
        if (si === curIdx) return project.stage === "closed" ? "sd" : "sa";
        return "sf";
    }
    function handleAction() {
        const map = { submitted: "review", review: "planning", planning: "printing", printing: "postproc", postproc: "qa", qa: "handoff", handoff: "evaluation", evaluation: "closed" };
        if (map[project.stage]) setModal(map[project.stage]);
    }
    function advance(nextStage, note, extra = {}) {
        setModal(null);
        onAdvance(project.id, nextStage, note, extra);
    }
    const actionLabel = {
        submitted: "Start AM Review", review: "Create Work Order", planning: "Start Print Job",
        printing: livePct >= 100 ? "Mark Print Complete" : "Print in progress...",
        postproc: "Post-Processing Checklist", qa: "Open QA Inspection",
        handoff: "Record Dept Handoff", evaluation: "Submit Evaluation",
    }[project.stage];
    const nextGuide = {
        submitted: "AM Coordinator reviews the request, checks material stock and schedule, then approves to create a Work Order.",
        review: "AM team creates a Work Order, assigns a machine and operator, and schedules the print slot.",
        planning: "Operator loads file, prepares machine, and starts the print job.",
        printing: "Print running live. When 100% complete, advance to post-processing.",
        postproc: "Parts move through washing, curing, depowdering, or support removal depending on tech.",
        qa: "QA Inspector performs dimensional check and visual inspection against spec.",
        handoff: "Parts are labelled and physically collected by the requesting department.",
        evaluation: "Requesting team rates quality, speed, and accuracy to close the loop.",
    }[project.stage] || "";

    return (
        <div>
            <div className="rowsb mb16">
                <button className="btn btg bts" onClick={onBack}>← All Requests</button>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <DB code={project.dept} /><TB tech={project.tech} />
                    {project.priority === "urgent" && <SB s="urgent" />}
                    {project.priority === "high" && <SB s="high" />}
                </div>
            </div>

            {/* Pipeline */}
            <div className="pipeline">
                {LIFECYCLE_STAGES.filter(s => s.id !== "closed").map((s, i) => {
                    const st = stSt(s.id);
                    return (
                        <div key={s.id} className={`ps ${st}`}>
                            <div className="ps-num">{st === "sd" ? "✓" : st === "sa" ? s.icon : i + 1}</div>
                            <div className="ps-lbl">{s.label.split(" ")[0]}</div>
                        </div>
                    );
                })}
            </div>

            <div className="g g21">
                <div className="card">
                    <div className="ch"><span className="ct">Project Lifecycle Timeline</span>{project.stage !== "closed" && <LiveBadge />}</div>
                    <div className="cb">
                        <div className="tl">
                            {LIFECYCLE_STAGES.map((s, i) => {
                                const st = stSt(s.id);
                                const hist = project.history.find(h => h.stage === s.id) || {};
                                const isCur = s.id === project.stage && project.stage !== "closed";
                                const isLast = i === LIFECYCLE_STAGES.length - 1;
                                const lineSt = lcIdx(s.id) < curIdx ? "ld" : lcIdx(s.id) === curIdx ? "la" : "";
                                return (
                                    <div key={s.id} className={`tl-item ${st}`}>
                                        <div className="tl-spine">
                                            <div className={`tl-dot ${st}`}>{st === "sd" ? "✓" : s.icon}</div>
                                            {!isLast && <div className={`tl-line ${lineSt}`} />}
                                        </div>
                                        <div className="tl-content">
                                            <div className="tl-sname">{s.label}</div>
                                            <div className="tl-meta">
                                                <span className="tl-time">{hist.time || "Pending"}</span>
                                                {isCur && <span className="b bprod" style={{ fontSize: 9 }}>ACTIVE</span>}
                                                {st === "sd" && <span className="b bcomp" style={{ fontSize: 9 }}>DONE</span>}
                                            </div>
                                            {(hist.note || isCur) && (
                                                <div className="sbox">
                                                    {hist.note && <div className="dim small mb8">{hist.note}</div>}
                                                    {s.id === "printing" && st === "sa" && (
                                                        <div>
                                                            <div className="rowsb mb4"><span className="tiny">Print progress</span><span className="mono" style={{ color: "var(--accent)" }}>{Math.round(livePct)}%</span></div>
                                                            <Prog pct={livePct} h={5} />
                                                            <div className="tiny mt4" style={{ color: livePct >= 100 ? "var(--green)" : "var(--accent)" }}>{livePct >= 100 ? "Print complete — advance to post-processing" : "Updating live..."}</div>
                                                        </div>
                                                    )}
                                                    {isCur && (
                                                        <div style={{ marginTop: 8 }}>
                                                            <button className="btn btp bts" disabled={s.id === "printing" && livePct < 100} onClick={handleAction}>{actionLabel}</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div>
                    <div className="card mb16">
                        <div className="ch"><span className="ct">Project Info</span></div>
                        <div className="cb">
                            {[["ID", project.id], ["Submitted", project.created], ["Due", project.due], ["Owner", project.owner], ["Tech", project.tech], ["Material", project.material], ["Qty", project.qty + " parts"], ["WO", project.woId || "—"], ["Machine", project.machine || "—"]].map(([k, v]) => (
                                <div key={k} className="rowsb" style={{ padding: "5px 0", borderBottom: "1px solid var(--border)" }}><span className="tiny">{k}</span><span style={{ fontSize: 12, fontWeight: 500 }}>{v}</span></div>
                            ))}
                            {project.description && <><div className="sep" /><div className="tiny mb4">DESCRIPTION</div><div className="dim small">{project.description}</div></>}
                            {project.requestNote && <><div className="sep" /><div className="tiny mb4">PRINT NOTES</div><div className="dim small">{project.requestNote}</div></>}
                        </div>
                    </div>

                    {project.stage !== "closed" && (
                        <div className="card" style={{ borderTopColor: "var(--accent)", borderTopWidth: 2 }}>
                            <div className="ch"><span className="ct" style={{ color: "var(--accent)" }}>What Happens Next</span></div>
                            <div className="cb">
                                <div className="dim small mb12">{nextGuide}</div>
                                <button className="btn btp bts" style={{ width: "100%" }} disabled={project.stage === "printing" && livePct < 100} onClick={handleAction}>{actionLabel}</button>
                            </div>
                        </div>
                    )}
                    {project.stage === "closed" && (
                        <div className="card" style={{ borderTopColor: "var(--green)", borderTopWidth: 2 }}>
                            <div className="cb" style={{ textAlign: "center", padding: "24px 16px" }}>
                                <div style={{ fontSize: 38, marginBottom: 8 }}>🎯</div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800, color: "var(--green)", marginBottom: 6 }}>Project Complete</div>
                                <div className="dim small">All stages closed. Parts delivered and evaluated.</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modal === "review" && <ReviewModal project={project} onClose={() => setModal(null)} onAdvance={advance} />}
            {modal === "planning" && <PlanningModal project={project} onClose={() => setModal(null)} onAdvance={(ns, note, extra) => advance(ns, note, extra)} />}
            {modal === "postproc" && <PostProcModal project={project} onClose={() => setModal(null)} onAdvance={advance} />}
            {modal === "qa" && <QAModal project={project} onClose={() => setModal(null)} onAdvance={advance} />}
            {modal === "handoff" && <HandoffModal project={project} onClose={() => setModal(null)} onAdvance={advance} />}
            {modal === "evaluation" && <EvalModal project={project} onClose={() => setModal(null)} onAdvance={advance} />}
        </div>
    );
}

/* ── main PrintRequests section ── */
export function PrintRequests({ lcProjects, onLcProjectsChange, toast }) {
    const [sel, setSel] = useState(null);
    const [showWiz, setShowWiz] = useState(false);
    const [filter, setFilter] = useState("all");

    const selProject = lcProjects.find(p => p.id === sel);

    const FILTERS = [
        { id: "all", l: "All" },
        { id: "pending", l: "Pending Review" },
        { id: "active", l: "In Progress" },
        { id: "qa", l: "QA" },
        { id: "closed", l: "Closed" },
    ];
    const filtered = lcProjects.filter(p => {
        if (filter === "pending") return ["submitted", "review"].includes(p.stage);
        if (filter === "active") return ["planning", "printing", "postproc"].includes(p.stage);
        if (filter === "qa") return p.stage === "qa";
        if (filter === "closed") return p.stage === "closed";
        return true;
    });

    function handleCreate(proj) {
        onLcProjectsChange([proj, ...lcProjects]);
        setShowWiz(false);
        setSel(proj.id);
        toast("Request " + proj.id + " submitted — awaiting AM Review", "s");
    }

    function handleAdvance(projId, nextStage, note, extra = {}) {
        onLcProjectsChange(lcProjects.map(p => {
            if (p.id !== projId) return p;
            const now = new Date();
            const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            const newHist = p.history.map(h => {
                if (h.stage === p.stage) return { ...h, done: true, time: ts, note };
                if (h.stage === nextStage && !h.done) return { ...h, time: ts };
                return h;
            });
            return { ...p, stage: nextStage, history: newHist, ...(extra.woId ? { woId: extra.woId } : {}), ...(extra.machine ? { machine: extra.machine } : {}) };
        }));
        const msgs = { planning: "Approved! Work order created.", printing: "Print job started.", postproc: "Print complete — moved to post-processing.", handoff: "QA passed — ready for handoff.", evaluation: "Handoff recorded.", closed: "Project closed. All stages complete." };
        toast(msgs[nextStage] || "Stage advanced", "s");
    }

    if (selProject) {
        return <ProjectLifecycle project={selProject} onAdvance={handleAdvance} onBack={() => setSel(null)} />;
    }

    const pendingCount = lcProjects.filter(p => ["submitted", "review"].includes(p.stage)).length;
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Print Requests</h1></div>
            <div className="rowsb mb12">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {FILTERS.map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "4px 12px", borderRadius: "var(--r)", border: "1px solid", fontSize: 11, fontFamily: "var(--fm)", cursor: "pointer", background: filter === f.id ? "var(--accent)" : "transparent", color: filter === f.id ? "#000" : "var(--text2)", borderColor: filter === f.id ? "var(--accent)" : "var(--border2)", transition: "all .12s" }}>{f.l}</button>
                    ))}
                </div>
                <button className="btn btp bts" onClick={() => setShowWiz(true)}>+ New Request</button>
            </div>

            {pendingCount > 0 && (
                <div className="astrip warn mb16">
                    <span>⚠️</span>
                    <div style={{ fontSize: 12 }}><strong>{pendingCount} request{pendingCount > 1 ? "s" : ""} awaiting AM Review</strong> — click any card to open and review</div>
                </div>
            )}

            <div className="g g2">
                {filtered.map(p => {
                    const pct = lcPct(p.stage);
                    const dColor = DEPT_C[p.dept] || "var(--text2)";
                    const stage = LIFECYCLE_STAGES.find(s => s.id === p.stage);
                    return (
                        <div key={p.id} className={`req-card ${p.dept.toLowerCase()}`} onClick={() => setSel(p.id)} style={{ cursor: "pointer" }}>
                            <div className="rowsb mb8">
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <span className="tacc">{p.id}</span>
                                    <DB code={p.dept} />
                                    <TB tech={p.tech} />
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {p.priority === "urgent" && <SB s="urgent" />}
                                    {p.priority === "high" && <SB s="high" />}
                                    {stage && <span className="b bsched" style={{ fontSize: 9 }}>{stage.icon} {stage.label}</span>}
                                </div>
                            </div>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <span>👤 {p.owner}</span>
                                <span>{p.material} · ×{p.qty}</span>
                                <span style={{ color: "var(--text3)" }}>{p.created}</span>
                            </div>
                            <div className="rowsb">
                                <div style={{ flex: 1, marginRight: 10 }}>
                                    <Prog pct={pct} h={3} />
                                </div>
                                <span className="tiny">{pct}%</span>
                            </div>
                            {p.stage === "printing" && <div className="tiny mt4" style={{ color: "var(--accent)" }}>🖨 Printing in progress →</div>}
                            {["submitted", "review"].includes(p.stage) && <div className="tiny mt4" style={{ color: "var(--yellow)" }}>⏳ Awaiting AM Review →</div>}
                            {p.stage === "closed" && <div className="tiny mt4" style={{ color: "var(--green)" }}>🎯 Complete</div>}
                        </div>
                    );
                })}
            </div>

            {showWiz && <NewRequestWizard onClose={() => setShowWiz(false)} onCreate={handleCreate} />}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   PROJECTS & WORK ORDERS
══════════════════════════════════════════════════════════════════ */
function Projects() {
