import { useState } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";

export function ExtraCostTab({ sel, groups, groupIndex, setGroupIndex, onStatusChange }) {
    const [costItems, setCostItems] = useState([{ desc: "", amount: "" }]);
    const [extraCostApproved, setExtraCostApproved] = useState(false);

    function updateItem(i, field, val) {
        setCostItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    }

    function addItem() {
        setCostItems(prev => [...prev, { desc: "", amount: "" }]);
    }

    function removeItem(i) {
        setCostItems(prev => prev.filter((_, idx) => idx !== i));
    }

    function toggleApprove() {
        const newApproved = !extraCostApproved;
        setExtraCostApproved(newApproved);
        if (onStatusChange) onStatusChange(newApproved ? "ok" : null);
    }

    const hasItems = costItems.some(i => i.desc && i.amount);
    const total = costItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    return (
        <ReviewSection num="4" title="Extra Cost Approval" status={extraCostApproved ? "ok" : hasItems ? "warn" : null}>
            <GroupSelector
                groups={groups}
                selectedIndex={groupIndex}
                onSelect={setGroupIndex}
                project={sel}
            />

            {sel?.imageUrl && (
                <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                    <img src={sel.imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
                    <div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel.name}</div>
                        <div className="tiny" style={{ color: "var(--text2)" }}>G{groupIndex + 1}</div>
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <button
                    className={`btn ${extraCostApproved ? "btp" : hasItems ? "btp" : "btg"} bts`}
                    style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                    onClick={toggleApprove}
                    disabled={!hasItems}
                >
                    <span style={{ fontSize: 14 }}>{extraCostApproved ? "✓" : "○"}</span>
                    {extraCostApproved ? "Approved" : "Approve Costs"}
                </button>
            </div>

            {extraCostApproved && (
                <div className="astrip success mb12">
                    ✓ Extra costs approved for G{groupIndex + 1} — Total: ${total.toFixed(2)}
                </div>
            )}

            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>
                    Extra Costs for Group {groupIndex + 1}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {costItems.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input className="fi" style={{ flex: 2 }} placeholder="Cost description..." value={item.desc} onChange={e => updateItem(i, "desc", e.target.value)} />
                            <div style={{ flex: 1, position: "relative" }}>
                                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }}>$</span>
                                <input className="fi" type="number" style={{ paddingLeft: 24 }} placeholder="0.00" value={item.amount} onChange={e => updateItem(i, "amount", e.target.value)} />
                            </div>
                            <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>✕</button>
                        </div>
                    ))}
                </div>

                <button className="btn btg bts mt8" style={{ fontSize: 11 }} onClick={addItem}>+ Add Cost Item</button>

                {total > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--fd)", fontWeight: 700 }}>Total Extra Cost</span>
                        <span style={{ fontFamily: "var(--fm)", fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>${total.toFixed(2)}</span>
                    </div>
                )}
            </div>
        </ReviewSection>
    );
}