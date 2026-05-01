import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";
import { SPARE_SEED } from "../../data/seed";
import { useDemoMode } from "../../hooks/useDemoMode";

export function SparesTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const isDemo = useDemoMode();
    const seedSpareSeed = isDemo ? seedSpareSeed : [];
    const currentGroup = groups?.[groupIndex] || { qty: sel?.qty || 0 };

    const saved = reviewData?.[groupIndex]?.spares || {};
    const [required, setRequired] = useState(saved.items || []);
    const [selectedId, setSelectedId] = useState("");
    const [selectedQty, setSelectedQty] = useState(1);
    const [note, setNote] = useState(saved.note || "");
    const [listConfirmed, setListConfirmed] = useState(saved.confirmed || false);

    // Custom procurement requests for spares
    const [procReqs, setProcReqs] = useState(saved.procReqs || []);
    const [reqForm, setReqForm] = useState({ name: "", qty: "", notes: "" });

    useEffect(() => {
        const saved = reviewData?.[groupIndex]?.spares || {};
        setRequired(saved.items || []);
        setNote(saved.note || "");
        setListConfirmed(saved.confirmed || false);
        setProcReqs(saved.procReqs || []);
    }, [groupIndex]);

    function persist(items, newNote, conf, reqs = procReqs) {
        updateReviewData(groupIndex, "spares", { items, note: newNote, confirmed: conf, procReqs: reqs });
    }

    function addSpare() {
        if (!selectedId) return;
        const spare = seedSpareSeed.find(s => s.id === selectedId);
        if (!spare) return;
        const next = [...required, { ...spare, addedQty: selectedQty, key: `${Date.now()}` }];
        setRequired(next);
        setSelectedId("");
        setSelectedQty(1);
        persist(next, note, false);
        setListConfirmed(false);
    }

    function removeSpare(key) {
        const next = required.filter(s => s.key !== key);
        setRequired(next);
        persist(next, note, false);
        setListConfirmed(false);
    }

    function confirmList() {
        if (required.length === 0 && procReqs.length === 0) return;
        const conf = !listConfirmed;
        setListConfirmed(conf);
        persist(required, note, conf);
        if (onStatusChange) onStatusChange(conf ? "ok" : "warn");
    }

    function addProcReq() {
        if (!reqForm.name) return;
        const nextReqs = [...procReqs, { ...reqForm, id: Date.now() }];
        setProcReqs(nextReqs);
        setReqForm({ name: "", qty: "", notes: "" });
        persist(required, note, listConfirmed, nextReqs);
    }

    function removeProcReq(id) {
        const nextReqs = procReqs.filter(r => r.id !== id);
        setProcReqs(nextReqs);
        persist(required, note, listConfirmed, nextReqs);
    }

    function statusBadge(s) {
        if (s.status === "critical") return <span className="b berr" style={{ fontSize: 9 }}>⚠ Critical</span>;
        if (s.status === "low") return <span className="b bwarn" style={{ fontSize: 9 }}>Low Stock</span>;
        return <span className="b bsucc" style={{ fontSize: 9 }}>In Stock</span>;
    }

    function copyToAll() {
        if (!window.confirm("Copy these spare requirements to ALL groups? This will overwrite existing group data.")) return;
        const numGroups = groups?.length || 1;
        for (let i = 0; i < numGroups; i++) {
            updateReviewData(i, "spares", { items: required, note, confirmed: listConfirmed, procReqs });
        }
    }

    // Group seedSpareSeed by category for the picker
    const cats = [...new Set(seedSpareSeed.map(s => s.cat))];
    const hasItems = required.length > 0 || procReqs.length > 0;

    return (
        <ReviewSection num="3" title="Spare Parts & Consumables"
            status={listConfirmed ? "ok" : hasItems ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            {/* Top Section: Assigned Spares */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                        Assigned Spares — Group {groupIndex + 1}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btg bts" style={{ fontSize: 10 }} onClick={copyToAll}>Apply to All Groups</button>
                        <button className={`btn ${listConfirmed ? "btp" : "btg"} bts`} style={{ fontSize: 10 }} onClick={confirmList} disabled={!hasItems}>
                            {listConfirmed ? "✓ Spares Confirmed" : "Confirm Spares"}
                        </button>
                    </div>
                </div>

                <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", padding: 14, marginBottom: 14 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <select className="fsel" style={{ flex: 2 }} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                            <option value="">Select spare / consumable...</option>
                            {cats.map(cat => (
                                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                                    {seedSpareSeed.filter(s => s.cat === cat).map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} — {s.qty} in stock {s.status !== "ok" ? `(${s.status})` : ""}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        <input type="number" className="fi" style={{ width: 80, textAlign: "center" }} min={1} value={selectedQty}
                            onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} placeholder="Qty" />
                        <button className="btn btp bts" onClick={addSpare} disabled={!selectedId}>+ Assign</button>
                    </div>
                    <textarea className="fta" rows={2} style={{ fontSize: 11 }}
                        placeholder="Special instructions for spares preparation..."
                        value={note} onChange={e => { setNote(e.target.value); persist(required, e.target.value, listConfirmed); }} />
                </div>

                {required.length > 0 && (
                    <div className="card" style={{ boxShadow: "none" }}>
                        <div className="tw">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Spare / Consumable</th>
                                        <th>Qty Needed</th>
                                        <th>In Stock</th>
                                        <th>Status</th>
                                        <th style={{ width: 40 }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {required.map(s => (
                                        <tr key={s.key}>
                                            <td style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</td>
                                            <td className="mono" style={{ fontSize: 12, fontWeight: 700 }}>×{s.addedQty}</td>
                                            <td className="mono" style={{ fontSize: 12, color: s.qty < s.addedQty ? "var(--red)" : "var(--green)" }}>{s.qty}</td>
                                            <td>{statusBadge(s)}</td>
                                            <td>
                                                <button onClick={() => removeSpare(s.key)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>×</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Procurement Requests */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", padding: 16 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 12 }}>
                    Special Procurement Requests
                </div>
                <div className="tiny" style={{ color: "var(--text2)", marginBottom: 12 }}>
                    If a required spare part or consumable is not in our standard inventory, submit a request below.
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <input className="fi" style={{ flex: 2, fontSize: 12 }} placeholder="Spare Part Name / Specs" 
                        value={reqForm.name} onChange={e => setReqForm({...reqForm, name: e.target.value})} />
                    <input type="number" className="fi" style={{ width: 100, fontSize: 12 }} placeholder="Qty" 
                        value={reqForm.qty} onChange={e => setReqForm({...reqForm, qty: e.target.value})} />
                    <input className="fi" style={{ flex: 2, fontSize: 12 }} placeholder="Reason / Notes" 
                        value={reqForm.notes} onChange={e => setReqForm({...reqForm, notes: e.target.value})} />
                    <button className="btn btp bts" style={{ flexShrink: 0 }} onClick={addProcReq} disabled={!reqForm.name}>Send Request</button>
                </div>

                {procReqs.length > 0 && (
                    <div style={{ background: "var(--bg2)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(245,158,11,.05)" }}>
                                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>Requested Spare</th>
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
                <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>Available Spares Inventory</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
                    {seedSpareSeed.map(s => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg2)", borderRadius: 6, border: `1px solid ${s.status === "critical" ? "rgba(239,68,68,.3)" : s.status === "low" ? "rgba(184,134,11,.3)" : "var(--border)"}` }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.status === "critical" ? "var(--red)" : s.status === "low" ? "var(--yellow)" : "var(--green)", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                                <div className="tiny" style={{ color: "var(--text3)" }}>{s.qty} in stock · {s.location || "—"}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </ReviewSection>
    );
}