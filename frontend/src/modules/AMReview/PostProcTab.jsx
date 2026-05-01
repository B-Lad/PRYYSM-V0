import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";

// Tech-specific post-processing steps
const PP_LIBRARY = {
    FDM: [
        { id: "support_removal", label: "Support Removal", time: "10–30 min", required: true, desc: "Break away or dissolve support structures" },
        { id: "sanding", label: "Sanding / Smoothing", time: "15–45 min", required: false, desc: "Sand with 220–800 grit for surface finish" },
        { id: "priming", label: "Priming", time: "20 min + dry", required: false, desc: "Apply primer coat before painting" },
        { id: "painting", label: "Painting", time: "30 min + dry", required: false, desc: "Colour coating per spec" },
        { id: "acetone", label: "Acetone Smoothing", time: "30 min", required: false, desc: "ABS only — acetone vapour smoothing" },
        { id: "heat_set", label: "Heat-Set Inserts", time: "10 min", required: false, desc: "Press in threaded inserts" },
        { id: "assembly", label: "Sub-Assembly", time: "Variable", required: false, desc: "Assemble multiple printed parts" },
    ],
    SLA: [
        { id: "ipa_wash", label: "IPA Wash", time: "15 min", required: true, desc: "Wash in 99% IPA to remove uncured resin" },
        { id: "uv_cure", label: "UV Cure", time: "30 min", required: true, desc: "Post-cure under UV lamp per resin spec" },
        { id: "support_removal", label: "Support Removal", time: "10–20 min", required: true, desc: "Carefully remove supports, avoid marks" },
        { id: "sanding", label: "Surface Sanding", time: "15–30 min", required: false, desc: "Wet sanding 400–1000 grit" },
        { id: "painting", label: "Painting / Coating", time: "30 min", required: false, desc: "Apply primer and paint" },
        { id: "inspection_clean", label: "Visual Inspection Clean", time: "5 min", required: false, desc: "Final clean before QA" },
    ],
    SLS: [
        { id: "cooldown", label: "Cool Down", time: "12h min", required: true, desc: "Parts must cool fully before removal — do not rush" },
        { id: "depowdering", label: "Depowdering", time: "20–40 min", required: true, desc: "Remove loose powder with brushes and vacuum" },
        { id: "media_blast", label: "Media Blasting", time: "10–15 min", required: false, desc: "Sandblast for uniform surface finish" },
        { id: "dyeing", label: "Dyeing", time: "60 min", required: false, desc: "Colour dye bath for PA12 parts" },
        { id: "coating", label: "Sealing / Coating", time: "30 min", required: false, desc: "Apply surface sealant for water resistance" },
        { id: "tumbling", label: "Barrel Tumbling", time: "2h", required: false, desc: "Mass finishing for batch parts" },
    ],
};

export function PostProcTab({ sel, groups, groupIndex, setGroupIndex, reviewData, updateReviewData, onStatusChange }) {
    const tech = sel?.tech || "FDM";
    const steps = PP_LIBRARY[tech] || PP_LIBRARY.FDM;

    const currentGroup = groups?.[groupIndex] || {};
    const saved = reviewData?.[groupIndex]?.pp || {};

    const [selected, setSelected] = useState(() => {
        // Auto-select required steps
        const init = saved.selected || {};
        if (Object.keys(init).length === 0) {
            return Object.fromEntries(steps.filter(s => s.required).map(s => [s.id, true]));
        }
        return init;
    });
    const [customSteps, setCustomSteps] = useState(saved.customSteps || []);
    const [newStep, setNewStep] = useState("");
    const [notes, setNotes] = useState(saved.notes || "");
    const [confirmed, setConfirmed] = useState(saved.confirmed || false);

    useEffect(() => {
        const saved = reviewData?.[groupIndex]?.pp || {};
        const init = saved.selected || {};
        if (Object.keys(init).length === 0) {
            setSelected(Object.fromEntries(steps.filter(s => s.required).map(s => [s.id, true])));
        } else {
            setSelected(init);
        }
        setCustomSteps(saved.customSteps || []);
        setNotes(saved.notes || "");
        setConfirmed(saved.confirmed || false);
    }, [groupIndex, tech]);

    const selectedSteps = steps.filter(s => selected[s.id]);
    const totalTime = [...selectedSteps, ...customSteps].length;
    const hasSteps = selectedSteps.length > 0 || customSteps.length > 0;

    function toggle(id) {
        const next = { ...selected, [id]: !selected[id] };
        setSelected(next);
        persist(next, customSteps, notes, false);
        setConfirmed(false);
    }

    function addCustom() {
        if (!newStep.trim()) return;
        const next = [...customSteps, { id: `c-${Date.now()}`, label: newStep.trim() }];
        setCustomSteps(next);
        setNewStep("");
        persist(selected, next, notes, false);
        setConfirmed(false);
    }

    function removeCustom(id) {
        const next = customSteps.filter(s => s.id !== id);
        setCustomSteps(next);
        persist(selected, next, notes, confirmed);
    }

    function confirmSteps() {
        if (!hasSteps) return;
        const conf = !confirmed;
        setConfirmed(conf);
        persist(selected, customSteps, notes, conf);
        if (onStatusChange) onStatusChange(conf ? "ok" : "warn");
    }

    function persist(sel, custom, n, conf) {
        updateReviewData(groupIndex, "pp", {
            selected: sel,
            customSteps: custom,
            notes: n,
            confirmed: conf,
            // Serialised for sending to operator / Post-Processing tab
            stepsList: [
                ...steps.filter(s => sel[s.id]).map(s => ({ id: s.id, label: s.label, time: s.time, required: s.required })),
                ...custom,
            ],
        });
    }

    return (
        <ReviewSection num="5" title="Post-Processing Instructions" status={confirmed ? "ok" : hasSteps ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, padding: 12, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel?.name} — Group {groupIndex + 1}</div>
                    <div className="tiny" style={{ color: "var(--text2)" }}>{tech} · {currentGroup.name || `Group ${groupIndex + 1}`} · ×{currentGroup.qty || sel?.qty || 0} pcs</div>
                    {sel?.requestNote && <div className="tiny" style={{ color: "var(--text3)", fontStyle: "italic", marginTop: 2 }}>Note: {sel.requestNote}</div>}
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                    {tech} Post-Processing Steps — {selectedSteps.length + customSteps.length} selected
                </div>
                <button className={`btn ${confirmed ? "btp" : hasSteps ? "btg" : "btg"} bts`} style={{ fontSize: 11 }} onClick={confirmSteps} disabled={!hasSteps}>
                    {confirmed ? "✓ Confirmed — Send to Operator" : "Confirm & Send to Operator"}
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 14 }}>
                {steps.map(step => {
                    const isOn = !!selected[step.id];
                    return (
                        <div key={step.id} onClick={() => toggle(step.id)} style={{
                            padding: "12px 14px", borderRadius: 8, cursor: "pointer", transition: "all .12s",
                            border: `1.5px solid ${isOn ? (step.required ? "var(--accent)" : "rgba(45,212,191,.4)") : "var(--border)"}`,
                            background: isOn ? "var(--adim)" : "var(--bg3)",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 12 }}>{step.label}</div>
                                    <div className="tiny" style={{ color: "var(--text3)", marginTop: 2 }}>{step.desc}</div>
                                    <div className="tiny" style={{ color: isOn ? "var(--accent)" : "var(--text3)", marginTop: 3 }}>⏱ {step.time}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${isOn ? "var(--accent)" : "var(--border2)"}`, background: isOn ? "var(--accent)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        {isOn && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                                    </div>
                                    {step.required && <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 3, background: "var(--adim)", color: "var(--accent)", fontWeight: 700 }}>REQ</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Custom steps */}
            {customSteps.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 6 }}>Custom Steps</div>
                    {customSteps.map(s => (
                        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg3)", borderRadius: 6, marginBottom: 4, border: "1px solid var(--border)" }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{s.label}</span>
                            <button onClick={() => removeCustom(s.id)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16 }}>×</button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="fi" style={{ flex: 1, fontSize: 12 }} placeholder="Add custom post-processing step..." value={newStep}
                    onChange={e => setNewStep(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustom()} />
                <button className="btn btp bts" onClick={addCustom} disabled={!newStep.trim()}>+ Add</button>
            </div>

            <textarea className="fta" rows={2} style={{ fontSize: 11, marginBottom: 12 }}
                placeholder="Additional notes for the operator (e.g. handle with care, check tolerances before/after)..."
                value={notes} onChange={e => { setNotes(e.target.value); persist(selected, customSteps, e.target.value, confirmed); }} />

            {confirmed && (
                <div className="astrip success">
                    ✓ Post-processing steps confirmed for Group {groupIndex + 1} — instructions will appear in the Post-Processing module when this WO goes live
                </div>
            )}
        </ReviewSection>
    );
}