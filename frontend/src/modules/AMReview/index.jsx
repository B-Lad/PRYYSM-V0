import { useState } from "react";
import { JobAllotment } from "./JobAllotment";
import { MaterialTab } from "./MaterialTab";
import { SparesTab } from "./SparesTab";
import { ExtraCostTab } from "./ExtraCostTab";
import { PostProcTab } from "./PostProcTab";
import { QCTab } from "./QCTab";
import { WorkOrderTab } from "./WorkOrderTab";
import { TB, SB } from "../../components/atoms";

const REVIEW_TABS = [
    { id: "slots", label: "① Job Allotment" },
    { id: "material", label: "② Material" },
    { id: "spares", label: "③ Spares" },
    { id: "cost", label: "④ Extra Cost" },
    { id: "pp", label: "⑤ Post-Processing" },
    { id: "qc", label: "⑥ QC Checks" },
    { id: "wo", label: "⑦ Work Order" },
];

const DEFAULT_PROJECTS = [
    { id: "PRJ-011", name: "Falcon Wing Bracket Rev 4", tech: "SLS", priority: "urgent", stage: "review", qty: 4, owner: "Arjun S.", due: "2025-07-22", groups: [{name: "Main Body", qty: 2}, {name: "Mounting Flange", qty: 2}] },
    { id: "PRJ-009", name: "Biocompatible Housing v2", tech: "SLA", priority: "high", stage: "submitted", qty: 3, owner: "Dr. Priya N.", due: "2025-07-30", material: "BioMed Clear" },
    { id: "PRJ-012", name: "Jig & Fixture Set Mk3", tech: "FDM", priority: "medium", stage: "review", qty: 12, owner: "Marco R.", due: "2025-07-18", groups: [{name: "Base Plate", qty: 12}] },
];

export function AMReview({ lcProjects = [], printerAssignments = {}, onPrinterAssignmentsChange = () => {}, onWOIssued }) {
    const [sel, setSel] = useState(null);
    const [reviewTab, setReviewTab] = useState("slots");
    const [groupIndex, setGroupIndex] = useState(0);

    // Central per-group review state: reviewData[groupIdx][tabId] = data object
    const [reviewData, setReviewData] = useState({});

    // Per-tab overall status pills
    const [tabStatuses, setTabStatuses] = useState({});

    // Filter to show "submitted" and "review" stage projects
    const reviewStageProjects = lcProjects.filter(p => p.stage === "submitted" || p.stage === "review");
    const projects = reviewStageProjects.length > 0 ? reviewStageProjects : DEFAULT_PROJECTS;
    const groups = sel?.groups?.length > 0 ? sel.groups : null;
    const numGroups = groups?.length || 1;

    function updateReviewData(gIdx, tabId, data) {
        setReviewData(prev => ({
            ...prev,
            [gIdx]: { ...prev[gIdx], [tabId]: data }
        }));
    }

    function getTabStatus(tabId) {
        // A tab is "ok" if all groups have data for it
        const allOk = Array.from({ length: numGroups }, (_, i) => i)
            .every(i => reviewData[i]?.[tabId]?.confirmed);
        const anyDone = Array.from({ length: numGroups }, (_, i) => i)
            .some(i => reviewData[i]?.[tabId]?.confirmed);
        if (allOk && numGroups > 0) return "ok";
        if (anyDone) return "warn";
        return tabStatuses[tabId] || null;
    }

    function getGroupCompletionPct(gIdx) {
        const relevant = ["slots", "material", "spares", "pp", "qc"];
        const done = relevant.filter(t => {
            if (t === "slots") return Object.keys(printerAssignments).some(k => k.startsWith(`${sel?.id}-grp${gIdx}`));
            return reviewData[gIdx]?.[t]?.confirmed;
        }).length;
        return Math.round((done / relevant.length) * 100);
    }

    function handleSelectProject(project) {
        setSel(project);
        setGroupIndex(0);
        setTabStatuses({});
        setReviewData({});
    }

    function handleTabChange(tabId) {
        const hasAssignment = sel && Object.keys(printerAssignments).some(k => k.startsWith(sel.id));
        if (reviewTab === "slots" && !hasAssignment && tabId !== "slots") {
            if (!window.confirm("No printer assigned yet. Continue anyway?")) return;
        }
        setReviewTab(tabId);
    }

    const tabProps = {
        sel,
        groups,
        groupIndex,
        setGroupIndex,
        reviewData,
        updateReviewData,
    };

    if (!sel) {
        const newReqs = projects.filter(p => p.stage === "submitted");
        const inProgReqs = projects.filter(p => p.stage === "review");

        const renderCard = (p, isNew) => {
            const gCount = p.groups?.length || 0;
            return (
                <div key={p.id} onClick={() => handleSelectProject(p)}
                    style={{
                        display: "flex", gap: 16, padding: 16, background: "var(--bg3)",
                        borderRadius: "var(--r3)", border: "1px solid var(--border)",
                        cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        position: "relative", overflow: "hidden"
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
                        e.currentTarget.querySelector(".cta-btn").style.opacity = "1";
                        e.currentTarget.querySelector(".cta-btn").style.transform = "translateX(0)";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                        e.currentTarget.querySelector(".cta-btn").style.opacity = "0.7";
                        e.currentTarget.querySelector(".cta-btn").style.transform = "translateX(4px)";
                    }}
                >
                    {/* Visual left bar for new requests */}
                    {isNew && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--green)" }} />}

                    {/* Image / Icon */}
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--bg4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid var(--border2)" }}>
                        {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: 24 }}>{p.tech === "SLA" ? "💧" : p.tech === "SLS" ? "💨" : "⚡"}</span>
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{p.name}</div>
                            {isNew && <span style={{ fontSize: 9, padding: "2px 6px", background: "rgba(15,155,106,.1)", color: "var(--green)", borderRadius: 4, fontWeight: 800, letterSpacing: "0.5px" }}>NEW</span>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--text2)", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{p.id}</span>
                            <span>•</span>
                            <TB tech={p.tech} />
                            {p.material && (
                                <>
                                    <span>•</span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 500, color: "var(--text)" }}>{p.material}</span>
                                </>
                            )}
                            <span>•</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📦 {p.qty || "—"} pcs</span>
                            {gCount > 0 && (
                                <>
                                    <span>•</span>
                                    <span style={{ color: "var(--accent)", fontWeight: 500 }}>🧩 {gCount} groups</span>
                                </>
                            )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>👤 {p.owner || "—"}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>📅 Due {p.due || "—"}</span>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                        <SB s={p.priority} />
                        <div className="cta-btn" style={{
                            padding: "6px 14px", background: isNew ? "var(--green)" : "var(--text)",
                            color: "var(--bg1)", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                            opacity: 0.7, transform: "translateX(4px)"
                        }}>
                            {isNew ? "Start Review" : "Continue Review"} →
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
                {/* Sleek Header */}
                <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: "1px", textTransform: "uppercase" }}>Operations</span>
                        <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--fd)", color: "var(--text)", margin: "4px 0 0 0", letterSpacing: "-0.5px" }}>AM Review</h1>
                        <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--text2)", maxWidth: 500, lineHeight: 1.5 }}>
                            Verify material and spare availability, define QC checks, and generate work orders.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", fontFamily: "var(--fm)", lineHeight: 1 }}>{newReqs.length}</div>
                            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", fontWeight: 700, marginTop: 4, letterSpacing: "0.5px" }}>New</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", fontFamily: "var(--fm)", lineHeight: 1 }}>{inProgReqs.length}</div>
                            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", fontWeight: 700, marginTop: 4, letterSpacing: "0.5px" }}>In Progress</div>
                        </div>
                    </div>
                </div>

                {reviewStageProjects.length === 0 && (
                    <div style={{ padding: "24px 12px", background: "var(--bg3)", borderRadius: 12, color: "var(--text2)", fontSize: 13, marginBottom: 24, border: "1px dashed var(--border2)", textAlign: "center" }}>
                        Showing sample projects — no live projects in Submitted or Review stage.
                    </div>
                )}

                {/* Queue Sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {newReqs.length > 0 && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "var(--fd)", color: "var(--text)" }}>New Submissions</h2>
                                <span style={{ padding: "3px 8px", background: "rgba(15,155,106,.1)", color: "var(--green)", borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Action Required</span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {newReqs.map(p => renderCard(p, true))}
                            </div>
                        </div>
                    )}

                    {inProgReqs.length > 0 && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "var(--fd)", color: "var(--text)" }}>Reviews In Progress</h2>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {inProgReqs.map(p => renderCard(p, false))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="pg-hd" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">AM Review</h1></div>
                <button className="btn btg" onClick={() => setSel(null)}>← Back to List</button>
            </div>

            {/* Project Info Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                {sel.imageUrl && <img src={sel.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />}
                <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 14 }}>{sel.name}</div>
                    <div className="tiny" style={{ color: "var(--text2)", marginTop: 2 }}>
                        {sel.id} · <TB tech={sel.tech} /> · ×{sel.qty} pcs · Due {sel.due || "—"} · {parseInt(sel?.estHrs) || 0}h {parseInt(sel?.estMin) || 0}m est.
                    </div>
                    {sel.requestNote && <div className="tiny" style={{ color: "var(--text3)", marginTop: 2, fontStyle: "italic" }}>Note: {sel.requestNote}</div>}
                </div>
                <SB s={sel.priority} />
            </div>

            {/* Group Tabs — only shown if multiple groups */}
            {groups && groups.length > 1 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                    <span className="tiny" style={{ alignSelf: "center", marginRight: 4, color: "var(--text3)" }}>GROUPS:</span>
                    {groups.map((g, i) => {
                        const pct = getGroupCompletionPct(i);
                        const isCurrent = groupIndex === i;
                        return (
                            <button key={i} onClick={() => setGroupIndex(i)}
                                style={{
                                    padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: isCurrent ? 700 : 500, cursor: "pointer",
                                    border: `1.5px solid ${isCurrent ? "var(--accent)" : pct === 100 ? "rgba(15,155,106,.4)" : "var(--border2)"}`,
                                    background: isCurrent ? "var(--adim)" : pct === 100 ? "rgba(15,155,106,.07)" : "var(--bg2)",
                                    color: isCurrent ? "var(--accent)" : pct === 100 ? "var(--green)" : "var(--text2)",
                                    display: "flex", alignItems: "center", gap: 6,
                                }}>
                                <span>G{i + 1}: {g.name || `Group ${i + 1}`}</span>
                                <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: pct === 100 ? "var(--green)" : pct > 0 ? "var(--yellow)" : "var(--bg4)", color: pct > 0 ? "#fff" : "var(--text3)", fontWeight: 700 }}>
                                    {pct === 100 ? "✓" : `${pct}%`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Review Tab Pills */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                {REVIEW_TABS.map(t => {
                    const st = t.id === "slots"
                        ? (Object.keys(printerAssignments).some(k => k.startsWith(sel?.id)) ? "ok" : null)
                        : getTabStatus(t.id);
                    const isActive = reviewTab === t.id;
                    return (
                        <button key={t.id} onClick={() => handleTabChange(t.id)}
                            style={{
                                padding: "6px 14px", borderRadius: 20, fontSize: 11.5, fontWeight: isActive ? 700 : 500, cursor: "pointer",
                                border: `1.5px solid ${isActive ? "var(--accent)" : st === "ok" ? "rgba(15,155,106,.4)" : st === "warn" ? "rgba(184,134,11,.4)" : "var(--border2)"}`,
                                background: isActive ? "var(--adim)" : st === "ok" ? "rgba(15,155,106,.07)" : st === "warn" ? "var(--golddim)" : "var(--bg2)",
                                color: isActive ? "var(--accent)" : st === "ok" ? "var(--green)" : st === "warn" ? "var(--gold)" : "var(--text2)",
                                fontFamily: "var(--fd)", transition: "all .12s",
                            }}>
                            {t.label} {st === "ok" ? "✓" : st === "warn" ? "⚠" : ""}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {reviewTab === "slots" && (
                <JobAllotment
                    sel={sel} lcProjects={lcProjects}
                    printerAssignments={printerAssignments}
                    onPrinterAssignmentsChange={onPrinterAssignmentsChange}
                    groups={groups} groupIndex={groupIndex} setGroupIndex={setGroupIndex}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, slots: s }))}
                />
            )}
            {reviewTab === "material" && (
                <MaterialTab {...tabProps}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, material: s }))}
                />
            )}
            {reviewTab === "spares" && (
                <SparesTab {...tabProps}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, spares: s }))}
                />
            )}
            {reviewTab === "cost" && (
                <ExtraCostTab {...tabProps}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, cost: s }))}
                />
            )}
            {reviewTab === "pp" && (
                <PostProcTab {...tabProps}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, pp: s }))}
                />
            )}
            {reviewTab === "qc" && (
                <QCTab {...tabProps}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, qc: s }))}
                />
            )}
            {reviewTab === "wo" && (
                <WorkOrderTab {...tabProps}
                    printerAssignments={printerAssignments}
                    onStatusChange={(s) => setTabStatuses(p => ({ ...p, wo: s }))}
                    onWOIssued={onWOIssued}
                />
            )}
        </div>
    );
}