import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";
import { TB } from "../../components/atoms";
import { MATERIALS_DATA } from "../../data/seed";
import { useDemoMode } from "../../hooks/useDemoMode";

// Unit label by tech
const UNIT = { FDM: "spools", SLA: "L", SLS: "kg" };
const MAT_UNIT = { FDM: "g", SLA: "ml", SLS: "g" };

export function MaterialTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const isDemo = useDemoMode();
    const tech = sel?.tech || "FDM";
    const matUnit = MAT_UNIT[tech] || "g";
    const inventory = (isDemo ? MATERIALS_DATA : []).filter(m => m.tech === tech);

    const currentGroup = groups?.[groupIndex] || { qty: sel?.qty || 0, materials: [] };
    const qty = parseInt(currentGroup.qty) || sel?.qty || 0;
    
    // Original requested materials from the print request
    const requestedMaterials = currentGroup?.materials?.length > 0 
        ? currentGroup.materials 
        : [{ matName: sel?.material || "—", matType: tech, color: sel?.color, colorName: sel?.colorName, custom: false }];

    const saved = reviewData?.[groupIndex]?.material || {};
    const [confirmed, setConfirmed] = useState(saved.confirmed || false);
    
    // Custom procurement requests
    const [procReqs, setProcReqs] = useState(saved.procReqs || []);
    const [reqForm, setReqForm] = useState({ name: "", qty: "", notes: "" });

    function toggleConfirm() {
        const next = !confirmed;
        setConfirmed(next);
        updateReviewData(groupIndex, "material", { confirmed: next, procReqs });
        if (onStatusChange) onStatusChange(next ? "ok" : "warn");
    }

    function addProcReq() {
        if (!reqForm.name) return;
        const nextReqs = [...procReqs, { ...reqForm, id: Date.now() }];
        setProcReqs(nextReqs);
        setReqForm({ name: "", qty: "", notes: "" });
        updateReviewData(groupIndex, "material", { confirmed, procReqs: nextReqs });
    }

    function removeProcReq(id) {
        const nextReqs = procReqs.filter(r => r.id !== id);
        setProcReqs(nextReqs);
        updateReviewData(groupIndex, "material", { confirmed, procReqs: nextReqs });
    }

    function checkInventory(mat) {
        const searchName = mat.custom ? mat.customName : mat.matName;
        return inventory.find(inv => 
            inv.name.toLowerCase().includes((searchName || "").toLowerCase().split(" ")[0])
        );
    }

    return (
        <ReviewSection num="2" title="Material Availability" status={confirmed ? "ok" : "warn"}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            {/* Top Section: Original Request & Stock Check */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                        Original Request — Group {groupIndex + 1}
                    </div>
                    <button className={`btn ${confirmed ? "btp" : "btg"} bts`} style={{ fontSize: 11 }} onClick={toggleConfirm}>
                        {confirmed ? "✓ Materials Confirmed" : "Confirm Materials"}
                    </button>
                </div>
                
                <div className="card" style={{ boxShadow: "none" }}>
                    <div className="tw">
                        <table>
                            <thead>
                                <tr>
                                    <th>Requested Material</th>
                                    <th>Type</th>
                                    <th>{matUnit} / item</th>
                                    <th>Total {matUnit}</th>
                                    <th>Inventory Check</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requestedMaterials.map((mat, i) => {
                                    const inv = checkInventory(mat);
                                    const name = mat.custom ? (mat.customName || "Custom") : (mat.matName || "—");
                                    const grams = mat.grams ? +mat.grams : 0;
                                    const total = grams * qty;
                                    
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                                    {mat.color && <div style={{ width: 12, height: 12, borderRadius: "50%", background: mat.color, border: "1px solid var(--border2)" }} />}
                                                    {name}
                                                </div>
                                                {mat.colorName && <div className="tiny" style={{ color: "var(--text3)", marginTop: 2 }}>{mat.colorName}</div>}
                                            </td>
                                            <td><TB tech={mat.matType || tech} /></td>
                                            <td className="mono" style={{ fontSize: 12 }}>{grams || "—"}</td>
                                            <td className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{total || "—"}</td>
                                            <td>
                                                {inv ? (
                                                    <span className="b bsucc" style={{ fontSize: 10 }}>✓ In Stock ({inv.qty}{inv.unit})</span>
                                                ) : (
                                                    <span className="b berr" style={{ fontSize: 10 }}>✕ Not Available</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Procurement Requests */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", padding: 16 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 12 }}>
                    Special Procurement Requests
                </div>
                <div className="tiny" style={{ color: "var(--text2)", marginBottom: 12 }}>
                    If a required material is not available, submit a request to the inventory team below.
                </div>

                {/* Request Form */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <input className="fi" style={{ flex: 2, fontSize: 12 }} placeholder="Material Name & Details" 
                        value={reqForm.name} onChange={e => setReqForm({...reqForm, name: e.target.value})} />
                    <input type="number" className="fi" style={{ width: 100, fontSize: 12 }} placeholder={`Qty (${UNIT[tech]})`} 
                        value={reqForm.qty} onChange={e => setReqForm({...reqForm, qty: e.target.value})} />
                    <input className="fi" style={{ flex: 2, fontSize: 12 }} placeholder="Reason / Notes" 
                        value={reqForm.notes} onChange={e => setReqForm({...reqForm, notes: e.target.value})} />
                    <button className="btn btp bts" style={{ flexShrink: 0 }} onClick={addProcReq} disabled={!reqForm.name}>Send Request</button>
                </div>

                {/* Sent Requests List */}
                {procReqs.length > 0 && (
                    <div style={{ background: "var(--bg2)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(245,158,11,.05)" }}>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Requested Material</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Qty</th>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Notes</th>
                                    <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: "8px 12px", width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {procReqs.map(req => (
                                    <tr key={req.id} style={{ borderBottom: "1px solid var(--border2)" }}>
                                        <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>{req.name}</td>
                                        <td className="mono" style={{ padding: "8px 12px", fontSize: 12 }}>{req.qty}</td>
                                        <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text2)" }}>{req.notes || "—"}</td>
                                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                            <span className="b bta" style={{ fontSize: 9 }}>📦 Pending</span>
                                        </td>
                                        <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                            <button onClick={() => removeProcReq(req.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 14 }}>×</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Inventory Reference Panel */}
            <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)", marginTop: 16 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>
                    Full Inventory — {tech} Materials
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {inventory.map(inv => (
                        <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg2)", borderRadius: 6, border: `1px solid ${inv.low ? "rgba(184,134,11,.3)" : "var(--border)"}` }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: inv.low ? "var(--yellow)" : "var(--green)", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</div>
                                <div className="tiny" style={{ color: "var(--text3)" }}>{inv.qty} {inv.unit} · {inv.location}</div>
                            </div>
                        </div>
                    ))}
                    {inventory.length === 0 && <span className="tiny" style={{ color: "var(--text3)" }}>No inventory data for {tech}</span>}
                </div>
            </div>
        </ReviewSection>
    );
}