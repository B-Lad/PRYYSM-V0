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
    { id: "PRJ-011", name: "Falcon Wing Bracket Rev 4", tech: "SLS", priority: "urgent", stage: "review", qty: 4, owner: "Arjun S.", due: "2025-07-22" },
    { id: "PRJ-009", name: "Biocompatible Housing v2", tech: "SLA", priority: "high", stage: "review", qty: 3, owner: "Dr. Priya N.", due: "2025-07-30" },
    { id: "PRJ-012", name: "Jig & Fixture Set Mk3", tech: "FDM", priority: "urgent", stage: "review", qty: 12, owner: "Marco R.", due: "2025-07-18" },
];

export function AMReview({ lcProjects = [], printerAssignments = {}, onPrinterAssignmentsChange = () => {}, onWOIssued }) {
    const [sel, setSel] = useState(null);
    const [reviewTab, setReviewTab] = useState("slots");
    const [groupIndex, setGroupIndex] = useState(0);

    // Central per-group review state: reviewData[groupIdx][tabId] = data object
    const [reviewData, setReviewData] = useState({});

    // Per-tab overall status pills
    const [tabStatuses, setTabStatuses] = useState({});

    // Filter to only show "review" stage projects
    const reviewStageProjects = lcProjects.filter(p => p.stage === "review");
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
        return (
            <div>
                <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">AM Review</h1></div>
                <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text2)" }}>
                    {reviewStageProjects.length > 0
                        ? `${reviewStageProjects.length} project(s) awaiting AM Review`
                        : "Showing sample projects — no live projects in Review stage"}
                </div>
                <div className="g g3">
                    {projects.map(p => {
                        const gCount = p.groups?.length || 0;
                        return (
                            <div key={p.id} className="card" onClick={() => handleSelectProject(p)} style={{ cursor: "pointer", transition: "border-color .12s" }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = ""}>
                                <div className="ch">
                                    <div>
                                        <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                                        <div className="tiny" style={{ color: "var(--text2)" }}>{p.id} · <TB tech={p.tech} /></div>
                                    </div>
                                    <SB s={p.priority} />
                                </div>
                                <div className="cb">
                                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                                        <span>👤 {p.owner || "—"}</span>
                                        <span>📅 Due {p.due || "—"}</span>
                                        <span>×{p.qty || "—"} pcs</span>
                                    </div>
                                    {gCount > 0 && (
                                        <div className="tiny" style={{ color: "var(--accent)" }}>
                                            {gCount} item group{gCount > 1 ? "s" : ""} — requires per-group review
                                        </div>
                                    )}
                                    <div style={{ marginTop: 10, padding: "6px 10px", background: "var(--adim)", borderRadius: "var(--r2)", fontSize: 11, color: "var(--accent)", fontWeight: 600, textAlign: "center" }}>
                                        → Start AM Review
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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