import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";
import { TB } from "../../components/atoms";
import { MATERIALS_DATA } from "../../data/seed";

// Unit label by tech
const UNIT = { FDM: "spools", SLA: "L", SLS: "kg" };
const MAT_UNIT = { FDM: "g", SLA: "ml", SLS: "g" };

export function MaterialTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const tech = sel?.tech || "FDM";
    const matUnit = MAT_UNIT[tech] || "g";

    // Inventory filtered to this tech
    const inventory = MATERIALS_DATA.filter(m => m.tech === tech);

    // Current group data
    const currentGroup = groups?.[groupIndex] || { qty: sel?.qty || 0, materials: [] };
    const groupMaterials = currentGroup?.materials || [];
    const qty = parseInt(currentGroup.qty) || sel?.qty || 0;

    // Previously confirmed data for this group
    const saved = reviewData?.[groupIndex]?.material || {};
    const [confirmed, setConfirmed] = useState(saved.confirmedIds || {});

    useEffect(() => {
        const saved = reviewData?.[groupIndex]?.material || {};
        setConfirmed(saved.confirmedIds || {});
    }, [groupIndex]);

    // Build material rows from group's materials or fallback to project-level
    const matRows = groupMaterials.length > 0
        ? groupMaterials.map((mat, mi) => {
            const name = mat.custom
                ? (mat.customName || mat.matType || "Custom")
                : (mat.matName || mat.matType || sel?.material || "—");
            const gramsPerItem = mat.grams ? +mat.grams : null;
            const totalQty = gramsPerItem ? gramsPerItem * qty : null;
            return { key: `${groupIndex}-${mi}`, name, type: mat.matType, color: mat.color, colorName: mat.colorName, gramsPerItem, totalQty, custom: mat.custom };
        })
        : [{ key: `${groupIndex}-0`, name: sel?.material || "—", type: sel?.tech, gramsPerItem: null, totalQty: null, custom: false }];

    function findInventoryMatch(row) {
        return inventory.find(inv =>
            inv.name.toLowerCase().includes((row.name || "").toLowerCase().split(" ")[0]) ||
            (row.name || "").toLowerCase().includes(inv.name.toLowerCase().split(" ")[0]) ||
            inv.name.toLowerCase().includes((row.type || "").toLowerCase())
        );
    }

    function toggleConfirm(key) {
        const next = { ...confirmed, [key]: !confirmed[key] };
        setConfirmed(next);
        const allDone = matRows.every(r => next[r.key]);
        const anyDone = matRows.some(r => next[r.key]);
        const status = allDone ? "ok" : anyDone ? "warn" : null;
        updateReviewData(groupIndex, "material", { confirmedIds: next, confirmed: allDone, rows: matRows });
        if (onStatusChange) onStatusChange(status);
    }

    const allConfirmed = matRows.length > 0 && matRows.every(r => confirmed[r.key]);

    function stockBadge(inv) {
        if (!inv) return <span className="b bidle" style={{ fontSize: 10 }}>Not in inventory</span>;
        if (inv.low) return <span className="b bwarn" style={{ fontSize: 10 }}>⚠ Low Stock — {inv.qty} {inv.unit}</span>;
        return <span className="b bsucc" style={{ fontSize: 10 }}>✓ In Stock — {inv.qty} {inv.unit}</span>;
    }

    return (
        <ReviewSection num="2" title="Material Availability" status={allConfirmed ? "ok" : Object.values(confirmed).some(Boolean) ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            {/* Group context header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: 12, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                {sel?.imageUrl && <img src={sel.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />}
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel?.name}</div>
                    <div className="tiny" style={{ color: "var(--text2)" }}>Group {groupIndex + 1} · <TB tech={tech} /> · ×{qty} pcs</div>
                    {currentGroup.name && <div className="tiny" style={{ color: "var(--accent)", marginTop: 2 }}>{currentGroup.name}</div>}
                </div>
            </div>

            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>
                Materials Required — Group {groupIndex + 1}
            </div>

            {/* Material confirmation table */}
            <div className="card" style={{ boxShadow: "none", marginBottom: 16 }}>
                <div className="tw">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}></th>
                                <th>Material</th>
                                <th>Type</th>
                                <th>{matUnit} / item</th>
                                <th>Total {matUnit}</th>
                                <th>Inventory Match</th>
                                <th>Stock Status</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matRows.map(row => {
                                const inv = findInventoryMatch(row);
                                const isConf = !!confirmed[row.key];
                                return (
                                    <tr key={row.key} style={{ background: isConf ? "rgba(15,155,106,.04)" : "" }}>
                                        <td>
                                            <div onClick={() => toggleConfirm(row.key)}
                                                style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${isConf ? "var(--green)" : "var(--border2)"}`, background: isConf ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                                {isConf && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: 12 }}>{row.name}</div>
                                            {row.colorName && <div className="tiny" style={{ color: "var(--text3)" }}>{row.colorName}</div>}
                                        </td>
                                        <td><TB tech={row.type || tech} /></td>
                                        <td className="mono" style={{ fontSize: 12 }}>{row.gramsPerItem || "—"}</td>
                                        <td className="mono" style={{ fontSize: 12, fontWeight: 600, color: row.totalQty ? "var(--text)" : "var(--text3)" }}>{row.totalQty || "—"}</td>
                                        <td style={{ fontSize: 12 }}>{inv ? inv.name : <span style={{ color: "var(--text3)" }}>—</span>}</td>
                                        <td>{stockBadge(inv)}</td>
                                        <td className="tiny" style={{ color: "var(--text3)" }}>{inv?.location || "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {allConfirmed && (
                <div className="astrip success mb12">
                    ✓ All materials for Group {groupIndex + 1} confirmed
                </div>
            )}

            {/* Inventory reference panel */}
            <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>
                    Full Inventory — {tech} Materials ({UNIT[tech]})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                    {inventory.map(inv => (
                        <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg2)", borderRadius: 6, border: `1px solid ${inv.low ? "rgba(184,134,11,.3)" : "var(--border)"}` }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: inv.low ? "var(--yellow)" : "var(--green)", flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inv.name}</div>
                                <div className="tiny" style={{ color: "var(--text3)" }}>{inv.qty} {inv.unit} · {inv.location}</div>
                            </div>
                            <span className={`b ${inv.low ? "bwarn" : "bsucc"}`} style={{ fontSize: 9, flexShrink: 0 }}>
                                {inv.low ? "Low" : "OK"}
                            </span>
                        </div>
                    ))}
                    {inventory.length === 0 && <span className="tiny" style={{ color: "var(--text3)" }}>No inventory data for {tech}</span>}
                </div>
            </div>
        </ReviewSection>
    );
}