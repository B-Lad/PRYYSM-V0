import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";

const QC_LIBRARY = {
    FDM: [
        { id: "dim", label: "Dimensional Check", desc: "Verify all critical dimensions per drawing", severity: "required" },
        { id: "layer", label: "Layer Adhesion", desc: "Check for delamination or layer separation", severity: "required" },
        { id: "surface", label: "Surface Finish", desc: "Inspect surface quality vs spec", severity: "required" },
        { id: "support_marks", label: "Support Mark Inspection", desc: "Verify support removal is clean", severity: "recommended" },
        { id: "fit", label: "Fit / Assembly Check", desc: "Test fit with mating parts if applicable", severity: "recommended" },
        { id: "warping", label: "Warp Check", desc: "Check flatness of base, no warping", severity: "required" },
        { id: "weight", label: "Weight Check", desc: "Weigh part vs expected (infill verification)", severity: "optional" },
        { id: "labelling", label: "Labelling & Packaging", desc: "Label with WO number, qty, date", severity: "required" },
    ],
    SLA: [
        { id: "dim", label: "Dimensional Check", desc: "Verify ±0.05mm tolerances per drawing", severity: "required" },
        { id: "cure", label: "Full Cure Verification", desc: "Confirm part is not tacky (fully cured)", severity: "required" },
        { id: "surface", label: "Surface Quality", desc: "Inspect for print lines, rough patches", severity: "required" },
        { id: "support_marks", label: "Support Mark Inspection", desc: "Check support scars are within tolerance", severity: "required" },
        { id: "transparency", label: "Transparency / Colour Check", desc: "For clear resins — verify optical quality", severity: "optional" },
        { id: "flex_test", label: "Flexibility Check", desc: "For flexible resins — test Shore hardness", severity: "optional" },
        { id: "biocompat", label: "Biocompatibility Sign-off", desc: "ISO 10993 check for medical parts", severity: "recommended" },
        { id: "labelling", label: "Labelling & Packaging", desc: "Label with WO number, material lot, date", severity: "required" },
    ],
    SLS: [
        { id: "dim", label: "Dimensional Check", desc: "Measure critical features — SLS ±0.3mm typical", severity: "required" },
        { id: "surface", label: "Surface Uniformity", desc: "Check for pock marks or rough areas", severity: "required" },
        { id: "powder_free", label: "Powder-Free Confirmation", desc: "No residual powder in cavities or channels", severity: "required" },
        { id: "mechanical", label: "Mechanical Property Check", desc: "Verify strength / stiffness vs material spec", severity: "recommended" },
        { id: "dye_evenness", label: "Dye Evenness", desc: "If dyed — uniform colour, no blotching", severity: "optional" },
        { id: "density", label: "Density / Weight Check", desc: "Compare against theoretical weight", severity: "optional" },
        { id: "fit", label: "Fit / Assembly Test", desc: "Test with mating components", severity: "recommended" },
        { id: "labelling", label: "Labelling & Packaging", desc: "Label with WO, powder lot, batch ID", severity: "required" },
    ],
};

export function QCTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const tech = sel?.tech || "FDM";
    const checks = QC_LIBRARY[tech] || QC_LIBRARY.FDM;

    const currentGroup = groups?.[groupIndex] || {};
    const saved = reviewData?.[groupIndex]?.qc || {};

    const [selected, setSelected] = useState(() => {
        const init = saved.selected || {};
        if (Object.keys(init).length === 0) {
            return Object.fromEntries(checks.filter(c => c.severity === "required").map(c => [c.id, true]));
        }
        return init;
    });
    const [customChecks, setCustomChecks] = useState(saved.customChecks || []);
    const [tolerance, setTolerance] = useState(saved.tolerance || "");
    const [notes, setNotes] = useState(saved.notes || "");
    const [confirmed, setConfirmed] = useState(saved.confirmed || false);
    const [newCheck, setNewCheck] = useState("");

    useEffect(() => {
        const saved = reviewData?.[groupIndex]?.qc || {};
        const init = saved.selected || {};
        if (Object.keys(init).length === 0) {
            setSelected(Object.fromEntries(checks.filter(c => c.severity === "required").map(c => [c.id, true])));
        } else {
            setSelected(init);
        }
        setCustomChecks(saved.customChecks || []);
        setTolerance(saved.tolerance || "");
        setNotes(saved.notes || "");
        setConfirmed(saved.confirmed || false);
    }, [groupIndex, tech]);

    const selectedChecks = checks.filter(c => selected[c.id]);
    const hasChecks = selectedChecks.length > 0 || customChecks.length > 0;
    const reqCount = checks.filter(c => c.severity === "required" && selected[c.id]).length;
    const totalRequired = checks.filter(c => c.severity === "required").length;

    function toggle(id) {
        const next = { ...selected, [id]: !selected[id] };
        setSelected(next);
        persist(next, customChecks, tolerance, notes, false);
        setConfirmed(false);
    }

    function addCustom() {
        if (!newCheck.trim()) return;
        const next = [...customChecks, { id: `c-${Date.now()}`, label: newCheck.trim(), severity: "custom" }];
        setCustomChecks(next);
        setNewCheck("");
        persist(selected, next, tolerance, notes, false);
        setConfirmed(false);
    }

    function removeCustom(id) {
        const next = customChecks.filter(c => c.id !== id);
        setCustomChecks(next);
        persist(selected, next, tolerance, notes, confirmed);
    }

    function confirmChecks() {
        if (!hasChecks) return;
        const conf = !confirmed;
        setConfirmed(conf);
        persist(selected, customChecks, tolerance, notes, conf);
        if (onStatusChange) onStatusChange(conf ? "ok" : "warn");
    }

    function persist(sel, custom, tol, n, conf) {
        updateReviewData(groupIndex, "qc", {
            selected: sel,
            customChecks: custom,
            tolerance: tol,
            notes: n,
            confirmed: conf,
            // Serialised for sending to QA module
            checksList: [
                ...checks.filter(c => sel[c.id]).map(c => ({ id: c.id, label: c.label, desc: c.desc, severity: c.severity })),
                ...custom,
            ],
        });
    }

    function copyToAll() {
        if (!window.confirm("Copy these QC settings to ALL groups? This will overwrite existing group data.")) return;
        const numGroups = groups?.length || 1;
        for (let i = 0; i < numGroups; i++) {
            updateReviewData(i, "qc", {
                selected, customChecks, tolerance, notes, confirmed,
                checksList: [
                    ...checks.filter(c => selected[c.id]).map(c => ({ id: c.id, label: c.label, desc: c.desc, severity: c.severity })),
                    ...customChecks,
                ],
            });
        }
    }

    const SEV_COLOR = { required: "var(--red)", recommended: "var(--yellow)", optional: "var(--text3)", custom: "var(--accent)" };
    const SEV_BG = { required: "rgba(239,68,68,.08)", recommended: "rgba(184,134,11,.08)", optional: "var(--bg3)", custom: "var(--adim)" };

    return (
        <ReviewSection num="6" title="QC Inspection Checks" status={confirmed ? "ok" : hasChecks ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                        {tech} Checks — {selectedChecks.length + customChecks.length} selected
                    </div>
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: reqCount === totalRequired ? "var(--gdim)" : "var(--rdim)", color: reqCount === totalRequired ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                        {reqCount}/{totalRequired} REQ
                    </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btg bts" style={{ fontSize: 10 }} onClick={copyToAll}>Apply to All Groups</button>
                    <button className={`btn ${confirmed ? "btp" : hasChecks ? "btg" : "btg"} bts`} style={{ fontSize: 10 }} onClick={confirmChecks} disabled={!hasChecks}>
                        {confirmed ? "✓ Confirmed" : "Confirm QC"}
                    </button>
                </div>
            </div>

            {/* Tolerance input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                <label style={{ fontSize: 12, fontWeight: 600, flexShrink: 0 }}>Tolerance Spec:</label>
                <input className="fi" style={{ flex: 1, fontSize: 12 }}
                    placeholder="e.g. ±0.1mm critical features, ±0.3mm general"
                    value={tolerance} onChange={e => { setTolerance(e.target.value); persist(selected, customChecks, e.target.value, notes, confirmed); }} />
            </div>

            {/* QC checks grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {checks.map(check => {
                    const isOn = !!selected[check.id];
                    return (
                        <div key={check.id} onClick={() => toggle(check.id)} style={{
                            padding: "11px 14px", borderRadius: 8, cursor: "pointer", transition: "all .12s",
                            border: `1.5px solid ${isOn ? "var(--green)" : "var(--border)"}`,
                            background: isOn ? "rgba(15,155,106,.06)" : SEV_BG[check.severity],
                            display: "flex", alignItems: "center", gap: 12,
                        }}>
                            <div style={{ width: 22, height: 22, borderRadius: 4, flexShrink: 0, border: `2px solid ${isOn ? "var(--green)" : "var(--border2)"}`, background: isOn ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isOn && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 12 }}>{check.label}</div>
                                <div className="tiny" style={{ color: "var(--text3)", marginTop: 1 }}>{check.desc}</div>
                            </div>
                            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 6, background: `${SEV_COLOR[check.severity]}22`, color: SEV_COLOR[check.severity], fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>
                                {check.severity}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Custom checks */}
            {customChecks.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 6 }}>Custom Checks</div>
                    {customChecks.map(c => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--adim)", borderRadius: 6, marginBottom: 4, border: "1px solid rgba(45,212,191,.2)" }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{c.label}</span>
                            <button onClick={() => removeCustom(c.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>×</button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="fi" style={{ flex: 1, fontSize: 12 }} placeholder="Add custom QC check (e.g. ISO 10993 sign-off)..." value={newCheck}
                    onChange={e => setNewCheck(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} />
                <button className="btn btp bts" onClick={addCustom} disabled={!newCheck.trim()}>+ Add</button>
            </div>

            <textarea className="fta" rows={2} style={{ fontSize: 11, marginBottom: 12 }}
                placeholder="QC notes (e.g. use CMM for critical dims, compare to golden sample)..."
                value={notes} onChange={e => { setNotes(e.target.value); persist(selected, customChecks, tolerance, e.target.value, confirmed); }} />

            {confirmed && (
                <div className="astrip success">
                    ✓ QC checks confirmed for Group {groupIndex + 1} — checks will appear in the QA Inspection module when this WO reaches QA stage
                </div>
            )}
        </ReviewSection>
    );
}