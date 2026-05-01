import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";
import { SPARE_SEED } from "../../data/seed";

export function SparesTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const currentGroup = groups?.[groupIndex] || { qty: sel?.qty || 0 };

    const saved = reviewData?.[groupIndex]?.spares || {};
    const [required, setRequired] = useState(saved.items || []);
    const [selectedId, setSelectedId] = useState("");
    const [selectedQty, setSelectedQty] = useState(1);
    const [note, setNote] = useState(saved.note || "");
    const [listConfirmed, setListConfirmed] = useState(saved.confirmed || false);

    useEffect(() => {
        const saved = reviewData?.[groupIndex]?.spares || {};
        setRequired(saved.items || []);
        setNote(saved.note || "");
        setListConfirmed(saved.confirmed || false);
    }, [groupIndex]);

    function persist(items, newNote, conf) {
        updateReviewData(groupIndex, "spares", { items, note: newNote, confirmed: conf });
    }

    function addSpare() {
        if (!selectedId) return;
        const spare = SPARE_SEED.find(s => s.id === selectedId);
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
        if (required.length === 0) return;
        const conf = !listConfirmed;
        setListConfirmed(conf);
        persist(required, note, conf);
        if (onStatusChange) onStatusChange(conf ? "ok" : "warn");
    }

    function statusBadge(s) {
        if (s.status === "critical") return <span className="b berr" style={{ fontSize: 9 }}>⚠ Critical</span>;
        if (s.status === "low") return <span className="b bwarn" style={{ fontSize: 9 }}>Low Stock</span>;
        return <span className="b bsucc" style={{ fontSize: 9 }}>In Stock</span>;
    }

    // Group SPARE_SEED by category for the picker
    const cats = [...new Set(SPARE_SEED.map(s => s.cat))];

    return (
        <ReviewSection num="3" title="Spare Parts & Consumables"
            status={listConfirmed ? "ok" : required.length > 0 ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: 12, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel?.name}</div>
                    <div className="tiny" style={{ color: "var(--text2)" }}>Group {groupIndex + 1} · {sel?.tech} · ×{currentGroup.qty || 0} pcs</div>
                </div>
            </div>

            {/* Add spares */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", padding: 14, marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>
                    Select Spares for Group {groupIndex + 1}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <select className="fsel" style={{ flex: 2 }} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                        <option value="">Select spare / consumable...</option>
                        {cats.map(cat => (
                            <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                                {SPARE_SEED.filter(s => s.cat === cat).map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} — {s.qty} in stock {s.status !== "ok" ? `(${s.status})` : ""}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <input type="number" className="fi" style={{ width: 80, textAlign: "center" }} min={1} value={selectedQty}
                        onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} placeholder="Qty" />
                    <button className="btn btp bts" onClick={addSpare} disabled={!selectedId}>+ Add</button>
                </div>
                <textarea className="fta" rows={2} style={{ fontSize: 11 }}
                    placeholder="Special instructions for spares preparation..."
                    value={note} onChange={e => { setNote(e.target.value); persist(required, e.target.value, listConfirmed); }} />
            </div>

            {/* Required list */}
            {required.length > 0 ? (
                <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                            Required for Group {groupIndex + 1} — {required.length} item(s)
                        </div>
                        <button className={`btn ${listConfirmed ? "btp" : "btg"} bts`} style={{ fontSize: 11 }} onClick={confirmList}>
                            {listConfirmed ? "✓ Confirmed" : "Confirm List"}
                        </button>
                    </div>
                    <div className="card" style={{ boxShadow: "none" }}>
                        <div className="tw">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Spare / Consumable</th>
                                        <th>Category</th>
                                        <th>Qty Needed</th>
                                        <th>In Stock</th>
                                        <th>Min Stock</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {required.map(s => (
                                        <tr key={s.key}>
                                            <td style={{ fontWeight: 600, fontSize: 12 }}>{s.name}</td>
                                            <td className="tiny">{s.cat}</td>
                                            <td className="mono" style={{ fontSize: 12, fontWeight: 700 }}>×{s.addedQty}</td>
                                            <td className="mono" style={{ fontSize: 12, color: s.qty < s.addedQty ? "var(--red)" : "var(--green)" }}>{s.qty}</td>
                                            <td className="mono" style={{ fontSize: 12, color: "var(--text3)" }}>{s.minStock}</td>
                                            <td className="tiny" style={{ color: "var(--text3)" }}>{s.location || "—"}</td>
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
                </div>
            ) : (
                <div className="tiny" style={{ color: "var(--text3)", textAlign: "center", padding: "16px 0", marginBottom: 14 }}>
                    No spare parts added yet — select from inventory above
                </div>
            )}

            {listConfirmed && <div className="astrip success mb12">✓ Spares list confirmed for Group {groupIndex + 1}</div>}

            {/* Full spare inventory reference */}
            <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>Available Spares Inventory</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 6 }}>
                    {SPARE_SEED.map(s => (
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