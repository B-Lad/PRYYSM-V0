import React, { useState, useEffect, useRef } from "react";
import {
    SCHEDULE_JOBS, ALLOT_QUEUE,
    RAW_FILAMENTS, RAW_RESINS, RAW_POWDERS,
    SPARE_CATEGORIES, SPARE_SEED
} from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { MAT_CATALOG } from '../data/matCatalog.js';
import { TB, SB, DB, Modal, Prog, AStrip, Tabs } from '../components/atoms.jsx';
import { ScheduleGantt } from '../components/ScheduleGantt.jsx';
import { RMI_STATUS_BADGE, RMI_STATUS_LBL } from './RawMaterialInventory.jsx';
import { SPARE_STATUS_BADGE, SPARE_STATUS_LABEL } from './SpareStores.jsx';
import { api } from '../services/api.js'; // Import API

const POST_PROCESS_OPTS = {
    FDM: ["Support Removal", "Sanding", "Priming", "Painting", "Acetone Smoothing"],
    SLA: ["IPA Wash", "UV Cure", "Support Removal", "Sanding", "Painting"],
    SLS: ["Depowdering", "Media Blasting", "Dyeing", "Coating", "Sealing"],
};
const QC_CHECKS = {
    FDM: ["Dimensional Check", "Layer Adhesion", "Surface Finish", "Fit Check", "Weight Check"],
    SLA: ["Dimensional Check", "Surface Quality", "Transparency Check", "Fit Check", "Mechanical Test"],
    SLS: ["Dimensional Check", "Powder Residue", "Surface Finish", "Tensile Strength", "Weight Check"],
};

/* small reusable chip-toggle */
function ChipToggle({ label, active, onToggle, color = "var(--accent)", dimColor = "var(--adim)", onRemove }) {
    return (
        <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${active ? color : "var(--border2)"}`, background: active ? dimColor : "var(--bg2)", cursor: "pointer", transition: "all .12s", fontSize: 12, userSelect: "none" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${active ? color : "var(--border2)"}`, background: active ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {active && <span style={{ color: "#fff", fontSize: 9, lineHeight: 1 }}>✓</span>}
            </div>
            {label}
            {onRemove && <span onClick={e => { e.stopPropagation(); onRemove(); }} style={{ marginLeft: 2, color: "var(--red)", fontSize: 11, lineHeight: 1, cursor: "pointer" }}>×</span>}
        </div>
    );
}

/* section header used inside the review panel */
function ReviewSection({ num, title, status, children }) {
    const dot = status === "ok" ? "var(--green)" : status === "warn" ? "var(--gold)" : status === "err" ? "var(--red)" : "var(--border2)";
    return (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r3)", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "var(--fm)", fontWeight: 700, color: "var(--text3)", flexShrink: 0 }}>{num}</div>
                <span style={{ fontFamily: "var(--fd)", fontSize: 12.5, fontWeight: 700, flex: 1 }}>{title}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            </div>
            <div style={{ padding: 14 }}>{children}</div>
        </div>
    );
}

export function AMReview({ lcProjects, onLcProjectsChange, toast, printerAssignments, onPrinterAssignmentsChange }) {
    const isDemo = useDemoMode();
    const seedScheduleJobs = isDemo ? SCHEDULE_JOBS : [];
    const seedRawFilaments = isDemo ? RAW_FILAMENTS : [];
    const seedRawResins = isDemo ? RAW_RESINS : [];
    const seedRawPowders = isDemo ? RAW_POWDERS : [];
    const seedSpareSeed = isDemo ? SPARE_SEED : [];

    const pending = lcProjects.filter(p => ["submitted", "review"].includes(p.stage));
    const reviewed = lcProjects.filter(p => !["submitted", "review"].includes(p.stage));

    /* list vs detail view */
    const [sel, setSel] = useState(null);
    const [listTab, setListTab] = useState("pending");

    /* per-review state */
    const [reviewTab, setReviewTab] = useState("slots");
    const [slotPrinter, setSlotPrinter] = useState(null);
    const [slotStartTime, setSlotStartTime] = useState(""); // computed from schedule, e.g. "Today 14:15"
    const [matStatus, setMatStatus] = useState(null);       // "ok"|"low"|"order"
    const [matConfirmedIds, setMatConfirmedIds] = useState({}); // { id: true/false } for each material
    const [matOrderNote, setMatOrderNote] = useState("");
    const [spareStatus, setSpareStatus] = useState(null);   // "ok"|"needed"
    const [spareRequired, setSpareRequired] = useState([]);  // [{ partId, qty }]
    const [sparePartSelect, setSparePartSelect] = useState("");
    const [sparePartQty, setSparePartQty] = useState(1);
    const [spareRequests, setSpareRequests] = useState([]);   // [{ name, category, qty, urgency, supplier, cost, notes }]
    const [spareConfirmed, setSpareConfirmed] = useState({}); // { id: bool }
    const [spareNote, setSpareNote] = useState("");
    const [spareListConfirmed, setSpareListConfirmed] = useState(false);
    const [extraCost, setExtraCost] = useState(false);
    const [costItems, setCostItems] = useState([{ desc: "", amount: "" }]);
    const [postProc, setPostProc] = useState({});
    const [customPostProc, setCustomPostProc] = useState([]);
    const [newPostProc, setNewPostProc] = useState("");
    const [qcChecks, setQcChecks] = useState({});
    const [customQC, setCustomQC] = useState([]);
    const [newQC, setNewQC] = useState("");
    const [ppInstructions, setPpInstructions] = useState({});  // { stepName: text }
    const [ppDone, setPpDone] = useState({});                   // { stepName: bool }
    const [ppComments, setPpComments] = useState({});           // { stepName: text }
    const [qcInstructions, setQcInstructions] = useState({});  // { checkName: text }
    const [qcDone, setQcDone] = useState({});                   // { checkName: bool }
    const [qcComments, setQcComments] = useState({});           // { checkName: text }
    const [woMachine, setWoMachine] = useState("");
    const [woCustomNum, setWoCustomNum] = useState("");
    const [woOperator, setWoOperator] = useState("Marco R.");
    const [woSched, setWoSched] = useState(new Date().toISOString().split("T")[0]);
    const [woPrintTime, setWoPrintTime] = useState("4h 00m");
    const [woNotes, setWoNotes] = useState("");

    /* job allotment state (embedded in slots tab) */
    const [jaShowAutoConfirm, setJaShowAutoConfirm] = useState(null);
    const [jaShowManual, setJaShowManual] = useState(null);
    const [jaShowPrintLog, setJaShowPrintLog] = useState(null);
    const [jaCustomDate, setJaCustomDate] = useState("");
    const [jaCustomTime, setJaCustomTime] = useState("");
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [ganttFilter, setGanttFilter] = useState("all");
    const [ganttDate, setGanttDate] = useState(new Date("2026-04-23"));
    const [ganttView, setGanttView] = useState("day");

    const REVIEW_TABS = [
        { id: "slots", label: "① Job Allotment" },
        { id: "material", label: "② Material" },
        { id: "spares", label: "③ Spares" },
        { id: "cost", label: "④ Extra Cost" },
        { id: "pp", label: "⑤ Post-Processing" },
        { id: "qc", label: "⑥ QC Inspection" },
        { id: "wo", label: "⑦ Work Order" },
    ];

    function openReview(p) {
        setSel(p);
        setReviewTab("slots");
        setSlotPrinter(null); setSlotStartTime(""); setJaCustomDate(""); setJaCustomTime(""); setSelectedGroups([]); setGanttFilter("all"); setGanttDate(new Date("2026-04-23")); setGanttView("day");
        setMatStatus(null); setMatConfirmedIds({}); setMatOrderNote("");
        setSpareStatus(null); setSpareRequired([]); setSparePartSelect(""); setSparePartQty(1); setSpareRequests([]); setSpareConfirmed({}); setSpareNote(""); setSpareListConfirmed(false);
        setExtraCost(false); setCostItems([{ desc: "", amount: "" }]);
        setPostProc({}); setCustomPostProc([]); setNewPostProc(""); setPpInstructions({}); setPpDone({}); setPpComments({});
        setQcChecks({}); setCustomQC([]); setNewQC(""); setQcInstructions({}); setQcDone({}); setQcComments({});
        setWoMachine(""); setWoCustomNum(""); setWoOperator("Marco R."); setWoNotes("");
        setWoSched(new Date().toISOString().split("T")[0]);
        setWoPrintTime("4h 00m");
    }

    function addCustomPostProc() { if (newPostProc.trim()) { setCustomPostProc(p => [...p, newPostProc.trim()]); setPostProc(p => ({ ...p, [newPostProc.trim()]: true })); setNewPostProc(""); } }
    function addCustomQC() { if (newQC.trim()) { setCustomQC(p => [...p, newQC.trim()]); setQcChecks(p => ({ ...p, [newQC.trim()]: true })); setNewQC(""); } }
    function removeCustomPostProc(opt) { setCustomPostProc(p => p.filter(x => x !== opt)); setPostProc(p => { const n = { ...p }; delete n[opt]; return n; }); }
    function removeCustomQC(opt) { setCustomQC(p => p.filter(x => x !== opt)); setQcChecks(p => { const n = { ...p }; delete n[opt]; return n; }); }

    function approve() {
        const ts = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        const woId = "WO-" + (woCustomNum || (2060 + lcProjects.length));
        const summary = [
            slotPrinter ? `Machine: ${slotPrinter}` : "",
            matStatus ? `Material: ${matStatus}` : "",
            spareStatus ? `Spares: ${Object.values(spareConfirmed).filter(Boolean).length} confirmed` : "",
            extraCost ? "Extra costs logged" : "",
            Object.keys(postProc).filter(k => postProc[k]).length ? `Post-proc: ${Object.keys(postProc).filter(k => postProc[k]).join(", ")}` : "",
            Object.keys(qcChecks).filter(k => qcChecks[k]).length ? `QC: ${Object.keys(qcChecks).filter(k => qcChecks[k]).join(", ")}` : "",
            woNotes ? `Notes: ${woNotes}` : "",
        ].filter(Boolean).join(" · ");

        // 1. Update Local UI Optimistically (Instant Feedback)
        const updated = lcProjects.map(p => {
            if (p.id !== sel.id) return p;
            const hist = p.history.map(h => {
                if (h.stage === "review") return { ...h, done: true, time: ts, note: `AM Review complete. ${summary}` };
                if (h.stage === "planning") return { ...h, done: false, time: "In progress", note: `${woId} created. ${slotPrinter ? "Machine: " + slotPrinter : ""}` };
                return h;
            });
            return { ...p, stage: "planning", woId, machine: slotPrinter || "", history: hist };
        });
        onLcProjectsChange(updated);

        // 2. Save Work Order to Database (Permanent Storage)
        api.createWorkOrder({
            project_id: sel.id,
            part_name: sel.name,
            tech: sel.tech,
            material: sel.material,
            qty: sel.qty,
            due_date: sel.due
        }).then(response => {
            toast("Work Order saved to database successfully!", "s");
        }).catch(err => {
            console.error("Failed to save WO to DB:", err);
            toast("UI updated, but failed to save to DB", "w");
        });

        setSel(null);
    }

    function reject() {
        const updated = lcProjects.map(p => p.id !== sel.id ? p : { ...p, stage: "submitted" });
        onLcProjectsChange(updated);
        toast("Returned to requester", "w");
        setSel(null);
    }

    /* slot status indicator per review tab */
    const tabStatus = {
        slots: slotPrinter ? "ok" : null,
        material: matStatus === "ok" ? "ok" : matStatus ? "warn" : null,
        spares: spareListConfirmed ? "ok" : spareRequired.length > 0 ? "warn" : null,
        cost: extraCost ? "warn" : "ok",
        pp: Object.values(postProc).some(Boolean) ? "ok" : null,
        qc: Object.values(qcChecks).some(Boolean) ? "ok" : null,
        wo: woMachine ? "ok" : null,
    };

    /* printer options for the slot + WO tabs — pulled from seedScheduleJobs */
    const printersByTech = sel ? seedScheduleJobs.filter(j => j.tech === sel.tech) : [];

    /* ── LIST VIEW ── */
    if (!sel) return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">AM Review</h1></div>
            <div className="g g4 mb16">
                {[
                    { l: "Pending Review", v: pending.length, c: "cy" },
                    { l: "In Planning", v: lcProjects.filter(p => p.stage === "planning").length, c: "cc" },
                    { l: "In Production", v: lcProjects.filter(p => p.stage === "printing").length, c: "cg" },
                    { l: "Completed", v: lcProjects.filter(p => p.stage === "closed").length, c: "cp" },
                ].map(k => <div key={k.l} className={`kpi ${k.c}`}><div className="kl">{k.l}</div><div className="kv">{k.v}</div></div>)}
            </div>

            <Tabs tabs={[{ id: "pending", label: `Pending (${pending.length})` }, { id: "inprogress", label: "In Progress" }]} active={listTab} onChange={setListTab} />

            {listTab === "pending" && (
                pending.length === 0
                    ? <div className="card"><div className="cb" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>✓ No pending requests</div></div>
                    : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {pending.map(p => (
                            <div key={p.id} className={`req-card ${(p.dept || "eng").toLowerCase()}`}>
                                <div className="rowsb mb6">
                                    <div>
                                        <span style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                                        <span className="mono" style={{ marginLeft: 10, fontSize: 10, color: "var(--text3)" }}>{p.id}</span>
                                    </div>
                                    <div className="row" style={{ gap: 6 }}>
                                        <TB tech={p.tech} /><SB s={p.priority || "normal"} />
                                        <button className="btn btp bts" onClick={() => openReview(p)}>Open Review →</button>
                                    </div>
                                </div>
                                <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
                                    {[["By", p.owner], ["Dept", p.dept || "—"], ["Material", p.material], ["Qty", p.qty], ["Due", p.due || "—"]].map(([k, v]) =>
                                        <span key={k} className="tiny">{k}: <strong>{v}</strong></span>
                                    )}
                                </div>
                                {p.requestNote && <div className="tiny mt6" style={{ fontStyle: "italic", color: "var(--text2)" }}>"{p.requestNote}"</div>}
                            </div>
                        ))}
                    </div>
            )}

            {listTab === "inprogress" && (
                <div className="card"><div className="tw"><table>
                    <thead><tr><th>Request</th><th>Owner</th><th>Tech</th><th>Stage</th><th>WO</th><th>Machine</th></tr></thead>
                    <tbody>
                        {reviewed.map(p => (
                            <tr key={p.id}>
                                <td><div style={{ fontWeight: 600 }}>{p.name}</div><div className="tiny">{p.id}</div></td>
                                <td className="tdim">{p.owner}</td>
                                <td><TB tech={p.tech} /></td>
                                <td><SB s={p.stage} /></td>
                                <td className="mono">{p.woId || "—"}</td>
                                <td className="tdim">{p.machine || "—"}</td>
                            </tr>
                        ))}
                        {reviewed.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text3)", padding: 30 }}>No requests in progress</td></tr>}
                    </tbody>
                </table></div></div>
            )}
        </div>
    );

    /* ── DETAIL REVIEW VIEW ── */
    return (
        <div>
            {/* breadcrumb header */}
            <div className="rowsb mb16">
                <div className="row" style={{ gap: 10 }}>
                    <button className="btn btg bts" onClick={() => setSel(null)}>← All Requests</button>
                    <div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>{sel.name}</div>
                        <div className="tiny mt4">{sel.id} · <TB tech={sel.tech} /> · {sel.owner} · {sel.dept || "—"} · Due {sel.due || "—"}</div>
                    </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                    <button className="btn btg bts" onClick={reject} style={{ color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }}>✕ Return</button>
                    <button className="btn btp" onClick={approve} disabled={!slotPrinter || !matStatus || !woMachine}>
                        ✓ Approve &amp; Create WO
                    </button>
                </div>
            </div>

            {/* request summary strip */}
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 16px", marginBottom: 16, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
                {sel.imageUrl && (
                    <img
                        src={sel.imageUrl}
                        alt={sel.name}
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: "var(--r)",
                            objectFit: "cover",
                            border: "2px solid var(--border)",
                            flexShrink: 0
                        }}
                    />
                )}
                <div style={{ flex: 1, display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {[["Material", sel.material], ["Qty", sel.qty + " pcs"], ["Priority", sel.priority || "normal"], ["Due", sel.due || "—"]].map(([k, v]) => (
                        <div key={k}><div className="tiny mb2">{k}</div><div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div></div>
                    ))}
                    {sel.requestNote && <div style={{ borderLeft: "2px solid var(--border2)", paddingLeft: 16 }}><div className="tiny mb2">Requester Note</div><div style={{ fontSize: 12, fontStyle: "italic", color: "var(--text2)" }}>{sel.requestNote}</div></div>}
                </div>
            </div>

            {/* progress pills */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
                {REVIEW_TABS.map(t => {
                    const st = tabStatus[t.id];
                    const isActive = reviewTab === t.id;
                    return (
                        <button key={t.id} onClick={() => setReviewTab(t.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${isActive ? "var(--accent)" : st === "ok" ? "rgba(15,155,106,.4)" : st === "warn" ? "rgba(184,134,11,.4)" : "var(--border2)"}`, background: isActive ? "var(--adim)" : st === "ok" ? "rgba(15,155,106,.07)" : st === "warn" ? "var(--golddim)" : "var(--bg2)", color: isActive ? "var(--accent)" : st === "ok" ? "var(--green)" : st === "warn" ? "var(--gold)" : "var(--text2)", fontSize: 11.5, fontWeight: isActive ? 700 : 500, cursor: "pointer", transition: "all .12s", fontFamily: "var(--fd)" }}>
                            {t.label} {st === "ok" ? "✓" : st === "warn" ? "⚠" : ""}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB: JOB ALLOTMENT ── */}
            {reviewTab === "slots" && (() => {
                const priorityBadge = { low: "bnorm", medium: "bwait", high: "burgent", normal: "bnorm" };

// Build allotted jobs from printerAssignments
                const allottedJobs = Object.entries(printerAssignments).map(([projectId, assignment]) => {
                    const isGroupAssignment = projectId.includes("-grp");
                    const baseProjectId = isGroupAssignment ? projectId.split("-grp")[0] : projectId;
                    const groupIndex = isGroupAssignment ? parseInt(projectId.split("-grp")[1]) : null;
                    const project = lcProjects.find(p => p.id === baseProjectId) || assignment.projectData;
                    const groupData = isGroupAssignment && groupIndex !== null ? (project?.groups?.[groupIndex] || {}) : {};
                    const printerData = seedScheduleJobs.find(p => p.printer === assignment.printer || p.printerCode === assignment.printer);
                    let startHour = 10;
                    let startDate = new Date("2026-04-23");
                    const todayTomorrowMatch = assignment.startTime?.match(/(Today|Tomorrow)\s+(\d{2}):(\d{2})/);
                    if (todayTomorrowMatch) {
                        startHour = parseInt(todayTomorrowMatch[2]);
                        if (todayTomorrowMatch[1] === "Tomorrow") {
                            startDate = new Date("2026-04-24");
                        }
                    } else {
                        const customDateMatch = assignment.startTime?.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
                        if (customDateMatch) {
                            startDate = new Date(customDateMatch[1]);
                            startHour = parseInt(customDateMatch[2]);
                        }
                    }
                    const estHrs = groupData.estHrs ?? project?.estHrs ?? 4;
                    const estMin = groupData.estMin ?? project?.estMin ?? 0;
                    const rawMin = ((parseInt(estHrs) * 60 + parseInt(estMin)) * 1.05);
                    const durHrs = rawMin / 60;
                    return {
                        id: `ALLOT-${projectId}`,
                        printer: assignment.printer,
                        printerCode: printerData?.printerCode || assignment.printer,
                        job: groupData.name || groupData.qty ? `${project?.name || baseProjectId} (Grp ${(groupIndex || 0) + 1})` : (project?.name || baseProjectId),
                        projectNo: projectId,
                        start: startHour,
                        startDate: startDate.toISOString().split("T")[0],
                        dur: Math.ceil(durHrs),
                        tech: project?.tech || "FDM",
                        status: "scheduled",
                        client: project?.owner || "",
                        material: project?.material || "",
                        imageUrl: project?.imageUrl || "",
                        isAllotted: true,
                        confirmed: assignment.confirmed || false,
                    };
                });

                // Merge seedScheduleJobs with allotted jobs (allotted take priority for same printer at overlapping times)
                const allJobs = [...seedScheduleJobs, ...allottedJobs];

                // Current review project assignment
                const currentAssignment = printerAssignments[sel.id];

                function assignPrinter(projectId, printer, startTime, groupIndex = null) {
                    const fullId = groupIndex !== null ? `${projectId}-grp${groupIndex}` : projectId;
                    const project = lcProjects.find(p => p.id === projectId);
                    onPrinterAssignmentsChange(prev => ({ ...prev, [fullId]: { printer, startTime, projectData: project, confirmed: false, groupIndex } }));
                    if (projectId === sel.id) {
                        setSlotPrinter(printer);
                        setSlotStartTime(startTime);
                    }
                    toast(`Assigned to ${printer}${groupIndex !== null ? ` (Grp ${groupIndex + 1})` : ""}`, "s");
                }

                function unassignPrinter(projectId) {
                    onPrinterAssignmentsChange(prev => {
                        const next = { ...prev };
                        delete next[projectId];
                        return next;
                    });
                    if (projectId === sel.id) {
                        setSlotPrinter(null);
                        setSlotStartTime("");
                    }
                }

                function handleJobClick(job) {
                    if (job.isAllotted) {
                        const projectId = job.projectNo;
                        const assignment = printerAssignments[projectId];
                        if (assignment) {
                            const project = lcProjects.find(p => p.id === projectId) || assignment.projectData;
                            setJaShowPrintLog({
                                ...job,
                                name: project?.name || job.job,
                                projectData: project,
                            });
                        }
                    } else if (job.job) {
                        setJaShowPrintLog(job);
                    }
                }

                return (
                    <div>
                        {/* ── Header ── */}
                        <div className="mb14">
                            <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700 }}>Job Allotment</div>
                            <div className="tiny dim">Assign this request to an available printer using the schedule below</div>
                        </div>

                        {/* ── Shared Schedule Gantt ── */}
                        <ScheduleGantt
                            jobs={allJobs}
                            currentDate={ganttDate}
                            onDateChange={setGanttDate}
                            view={ganttView}
                            onViewChange={setGanttView}
                            techFilter={ganttFilter}
                            onTechFilterChange={setGanttFilter}
                            onJobClick={handleJobClick}
                            showDurationLegend={true}
                        />

{/* ── Current Request Pending Allotment ── */}
                        <div className="card mb16">
                            <div className="ch">
                                <div><span className="ct">Request Pending Allotment</span></div>
                            </div>
                            <div className="tw">
                                <table>
                                    <thead><tr><th>#</th><th>Project / Group</th><th>Est. Time (w/5%)</th><th>Qty</th><th>Priority</th><th>Technology</th><th>Deadline</th><th>Assigned To</th><th style={{ textAlign: "right", minWidth: 120 }}>Actions</th></tr></thead>
                                    <tbody>
                                        {sel.groups && sel.groups.length > 0 ? sel.groups.map((g, gi) => {
                                            const groupAssignment = printerAssignments[`${sel.id}-grp${gi}`];
                                            const groupEstHrs = g.estHrs || sel.estHrs || 4;
                                            const groupEstMin = g.estMin || sel.estMin || 0;
                                            const rawMin = (groupEstHrs * 60 + groupEstMin) * 1.05;
                                            const timeWithBuffer = `${Math.floor(rawMin / 60)}h ${Math.round(rawMin % 60)}m`;
                                            return (
                                                <tr key={`${sel.id}-grp${gi}`} style={{ background: groupAssignment ? "rgba(15,155,106,.05)" : "rgba(37,99,235,.03)" }}>
                                                    <td style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>G{gi + 1}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                            {sel.imageUrl && (
                                                                <img src={sel.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                                                            )}
                                                            <div>
                                                                {gi === 0 && <div style={{ fontWeight: 700, fontSize: 12 }}>{sel.name}</div>}
                                                                {gi > 0 && <div style={{ fontWeight: 600, fontSize: 11, color: "var(--text2)" }}>{sel.name}</div>}
                                                                <div className="tiny">{sel.id} · Grp {gi + 1}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="mono" style={{ fontSize: 12 }}>{timeWithBuffer}</td>
                                                    <td className="mono" style={{ fontSize: 12 }}>{g.qty || 0}</td>
                                                    <td><span className={`b ${priorityBadge[sel.priority] || "bnorm"}`} style={{ fontSize: 10 }}>{(sel.priority || "normal").charAt(0).toUpperCase() + (sel.priority || "normal").slice(1)}</span></td>
                                                    <td><TB tech={sel.tech} /></td>
                                                    <td className="mono" style={{ fontSize: 11 }}>{sel.due || "—"}</td>
                                                    <td>
                                                        {groupAssignment ? (
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>✓ {groupAssignment.printer}</span>
                                                        ) : (
                                                            <span className="tiny" style={{ color: "var(--text3)" }}>Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        {groupAssignment ? (
                                                            <button className="btn btg bts" style={{ fontSize: 10, padding: "6px 12px" }} onClick={() => {
                                                                const next = { ...printerAssignments };
                                                                delete next[`${sel.id}-grp${gi}`];
                                                                onPrinterAssignmentsChange(next);
                                                            }}>✕ Unassign</button>
                                                        ) : (
                                                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                <button className="btn btp" style={{ fontSize: 11, padding: "6px 14px", fontWeight: 600 }} onClick={() => setJaShowAutoConfirm({ ...sel, groupIndex: gi })}>⚡ Auto</button>
                                                                <button className="btn btg" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setJaShowManual({ ...sel, groupIndex: gi })}>✎ Manual</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (() => {
                                            const fallbackAssignment = printerAssignments[sel.id];
                                            const groupEstHrs = sel.estHrs || 4;
                                            const groupEstMin = sel.estMin || 0;
                                            const rawMin = (groupEstHrs * 60 + groupEstMin) * 1.05;
                                            const timeWithBuffer = `${Math.floor(rawMin / 60)}h ${Math.round(rawMin % 60)}m`;
                                            return (
                                                <tr key={sel.id} style={{ background: fallbackAssignment ? "rgba(15,155,106,.05)" : "rgba(37,99,235,.03)" }}>
                                                    <td style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>G1</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                            {sel.imageUrl && (
                                                                <img src={sel.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                                                            )}
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: 12 }}>{sel.name}</div>
                                                                <div className="tiny">{sel.id} · Grp 1</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="mono" style={{ fontSize: 12 }}>{timeWithBuffer}</td>
                                                    <td className="mono" style={{ fontSize: 12 }}>{sel.qty || 0}</td>
                                                    <td><span className={`b ${priorityBadge[sel.priority] || "bnorm"}`} style={{ fontSize: 10 }}>{(sel.priority || "normal").charAt(0).toUpperCase() + (sel.priority || "normal").slice(1)}</span></td>
                                                    <td><TB tech={sel.tech} /></td>
                                                    <td className="mono" style={{ fontSize: 11 }}>{sel.due || "—"}</td>
                                                    <td>
                                                        {fallbackAssignment ? (
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>✓ {fallbackAssignment.printer}</span>
                                                        ) : (
                                                            <span className="tiny" style={{ color: "var(--text3)" }}>Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        {fallbackAssignment ? (
                                                            <button className="btn btg bts" style={{ fontSize: 10, padding: "6px 12px" }} onClick={() => unassignPrinter(sel.id)}>✕ Unassign</button>
                                                        ) : (
                                                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                <button className="btn btp" style={{ fontSize: 11, padding: "6px 14px", fontWeight: 600 }} onClick={() => setJaShowAutoConfirm(sel)}>⚡ Auto</button>
                                                                <button className="btn btg" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setJaShowManual(sel)}>✎ Manual</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })()}</tbody>
                                </table>
                            </div>
                        </div>

{/* ── Printer Grid ── */}
                        <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>Printer Availability</div>
                        <div className="g g4 mb16">
                            {seedScheduleJobs
                                .filter(p => {
                                    if (p.status === "maintenance" || p.status === "offline") return false;
                                    if (sel.tech && (p.tech || "").toUpperCase() !== sel.tech.toUpperCase()) return false;
                                    return true;
                                })
                                .map(p => {
                                const isSelectedForCurrent = slotPrinter === p.printer;
                                const assignedProjectId = Object.entries(printerAssignments).find(([, a]) => a.printer === p.printer)?.[0];
                                const busy = p.status === "printing" || p.status === "maintenance" || p.status === "offline";
                                const now = new Date();
                                const currentH = now.getHours();
                                const currentMin = now.getMinutes();
                                let nextH, nextMin;
                                if (p.status === "maintenance" || p.status === "offline") {
                                    nextH = 14; nextMin = 0;
                                } else if (p.status === "printing" && p.start != null && p.dur > 0) {
                                    nextH = p.start + p.dur; nextMin = 15;
                                } else if (p.status === "waiting") {
                                    nextH = 6 + (p.start || 0) + 1; nextMin = 0;
                                } else {
                                    nextH = currentH + 1; nextMin = currentMin;
                                }
                                if (nextH >= 24) { nextH = 8; nextMin = 0; }
                                const nextTime = `${String(nextH).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`;
                                const isNextDay = p.start != null && p.dur > 0 && (p.start + p.dur) >= 24;

                                function handlePrinterClick() {
                                    if (p.job) {
                                        setJaShowPrintLog(p);
                                    } else if (!busy) {
                                        const startTime = `${isNextDay ? "Tomorrow " : "Today "}${nextTime}`;
                                        assignPrinter(sel.id, p.printer, startTime);
                                    }
                                }

                                return (
                                    <div key={p.id}
                                        className={`mc ${p.status === "printing" ? "running" : p.status === "maintenance" || p.status === "offline" ? "maintenance" : "idle"}`}
                                        style={{ cursor: busy ? "default" : "pointer", outline: isSelectedForCurrent ? "2px solid var(--accent)" : assignedProjectId && assignedProjectId !== sel.id ? "2px solid var(--green)" : "none", outlineOffset: 2 }}
                                        onClick={handlePrinterClick}>
                                        <div className="rowsb mb6">
                                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700 }}>{p.printer}</div>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <TB tech={p.tech} />
                                                <SB s={p.status === "printing" ? "running" : p.status} />
                                            </div>
                                        </div>
                                        {p.job
                                            ? <><div className="tiny mb4" style={{ color: "var(--text2)" }}>{p.job}</div><Prog pct={65} h={4} /></>
                                            : p.status === "maintenance"
                                                ? <div className="tiny" style={{ color: "var(--yellow)" }}>Under maintenance</div>
                                                : p.status === "offline"
                                                    ? <div className="tiny" style={{ color: "var(--red)" }}>Offline</div>
                                                    : null}
                                        <div className="tiny mt6" style={{ color: busy ? "var(--text3)" : "var(--green)", fontFamily: "var(--fm)", fontWeight: busy ? 400 : 600 }}>
                                            {busy
                                                ? `Available: ${isNextDay ? "Tomorrow " : ""}${nextTime}`
                                                : `✓ Start now · ${nextTime}`}
                                        </div>
                                        {isSelectedForCurrent && <div className="tiny mt4" style={{ color: "var(--accent)", fontWeight: 700 }}>✓ Selected for current</div>}
                                        {assignedProjectId && assignedProjectId !== sel.id && (
                                            <div className="tiny mt4" style={{ color: "var(--green)", fontWeight: 600 }}>✓ Assigned to another</div>
                                        )}
                                        {p.job && <div className="tiny mt4" style={{ color: "var(--text3)" }}>▷ View print log</div>}
                                    </div>
                                );
                            })}
                        </div>

                        {slotPrinter
                            ? <div className="astrip info" style={{ marginBottom: 0 }}>
                                ✓ Allotted to <strong>{slotPrinter}</strong>
                                {slotStartTime ? ` · Starts ${slotStartTime}` : ""}
                                {sel.estHrs || sel.estMin ? ` · Est. ${sel.estHrs || 0}h ${sel.estMin || 0}m` : ""}
                            </div>
                            : <div className="astrip warn" style={{ marginBottom: 0 }}>Click an available printer above to allot this request.</div>}

                        {/* ── Auto Confirm Modal ── */}
                        {jaShowAutoConfirm && (() => {
                            // avail = absolute end-of-job hour (e.g. job ends at 14:00 → avail=14.25 for 15min buffer)
                            // idle printers → available at current time + 1hr setup buffer
                            const now = new Date();
                            const currentHour = now.getHours() + now.getMinutes() / 60;
                            const sameTech = seedScheduleJobs.filter(p => (p.tech || "").toUpperCase() === (jaShowAutoConfirm.tech || sel?.tech || "").toUpperCase());
                            const candidates = (sameTech.length > 0 ? sameTech : seedScheduleJobs).filter(p => p.status !== "maintenance" && p.status !== "offline");
                            const withTime = candidates.map(p => {
                                let avail;
                                if (p.status === "printing" && p.start != null && p.dur > 0) {
                                    // job end time (absolute hour) + 15min buffer
                                    avail = p.start + p.dur + 0.25;
                                } else if (p.status === "waiting") {
                                    // job start + 1hr setup buffer (relative to schedule day start 06:00)
                                    avail = 6 + (p.start || 0) + 1;
                                } else {
                                    // idle → available at current time + 1hr setup buffer
                                    avail = currentHour + 1;
                                }
                                return { ...p, availH: avail };
                            });
                            const best = withTime.sort((a, b) => a.availH - b.availH)[0];
                            const eh = Math.floor(best.availH);
                            const em = Math.round((best.availH % 1) * 60);
                            const isNextDay = best.availH >= 24;
                            const timeStr = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                            const labelStr = `${isNextDay ? "Tomorrow" : "Today"} ${timeStr}`;
                            return (
                                <Modal title="Confirm Auto-Assignment" onClose={() => setJaShowAutoConfirm(null)} footer={(
                                    <><button className="btn btg bts" onClick={() => setJaShowAutoConfirm(null)}>✕ Cancel</button>
                                        <button className="btn btp bts" onClick={() => {
                                            assignPrinter(jaShowAutoConfirm.id, best.printer, labelStr, jaShowAutoConfirm.groupIndex ?? null);
                                            setJaShowAutoConfirm(null);
                                        }}>✓ Confirm &amp; Assign</button></>
                                )}>
                                    <div className="astrip info mb12">
                                        {jaShowAutoConfirm.groupIndex !== undefined ? `Grp ${jaShowAutoConfirm.groupIndex + 1} — ` : ""}
                                        Earliest available {jaShowAutoConfirm.tech || sel?.tech} printer found. Review and confirm.
                                    </div>
                                    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14 }}>
                                        <div className="tiny mb8" style={{ color: "var(--text3)", fontFamily: "var(--fm)", letterSpacing: "1px" }}>ASSIGNMENT DETAILS</div>
                                        <div className="rowsb mb8">
                                            <span className="tiny">Project</span>
                                            <span style={{ fontSize: 12, fontWeight: 600 }}>{jaShowAutoConfirm.name}</span>
                                        </div>
                                        <div className="rowsb mb8">
                                            <span className="tiny">Assigned Printer</span>
                                            <div className="row" style={{ gap: 6 }}>
                                                <span style={{ fontSize: 12, fontWeight: 600 }}>{best.printer}</span>
                                                <TB tech={best.tech} />
                                                <SB s={best.status === "printing" ? "running" : best.status} />
                                            </div>
                                        </div>
                                        <div className="rowsb mb8">
                                            <span className="tiny">Current Status</span>
                                            <span style={{ fontSize: 12 }}>{best.status === "idle" ? "Idle — available now" : best.job ? `Printing ${best.job}` : best.status}</span>
                                        </div>
                                        <div className="rowsb">
                                            <span className="tiny">Earliest Start</span>
                                            <span style={{ fontSize: 13, fontFamily: "var(--fm)", fontWeight: 700, color: "var(--green)" }}>{labelStr}</span>
                                        </div>
                                    </div>
                                </Modal>
                            );
                        })()}

                        {/* ── Manual Assign Modal ── */}
                        {jaShowManual && (() => {
                            const now = new Date();
                            const currentHour = now.getHours() + now.getMinutes() / 60;
                            const targetTech = (jaShowManual.tech || sel?.tech || "").toUpperCase();
                            const selectable = seedScheduleJobs
                                .filter(p => {
                                    if (p.status === "maintenance" || p.status === "offline") return false;
                                    if (targetTech && (p.tech || "").toUpperCase() !== targetTech) return false;
                                    return true;
                                })
                                .map(p => {
                                    let avail;
                                    if (p.status === "printing" && p.start != null && p.dur > 0) avail = p.start + p.dur + 0.25;
                                    else if (p.status === "waiting") avail = 6 + (p.start || 0) + 1;
                                    else avail = currentHour + 1;
                                    const eh = Math.floor(avail);
                                    const em = Math.round((avail % 1) * 60);
                                    const isNextDay = avail >= 24;
                                    const timeStr = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                                    return { ...p, availH: avail, nextSlot: `${isNextDay ? "Tomorrow " : "Today "}${timeStr}` };
                                })
                                .sort((a, b) => a.availH - b.availH);
                            return (
                                <Modal title={jaShowManual.groupIndex !== undefined ? `Manual Assignment — Group ${jaShowManual.groupIndex + 1}` : "Manual Project Assignment"} onClose={() => { setJaShowManual(null); setJaCustomDate(""); setJaCustomTime(""); }} footer={(
                                    <><button className="btn btg bts" onClick={() => { setJaShowManual(null); setJaCustomDate(""); setJaCustomTime(""); }}>Cancel</button>
                                        <button className="btn btp bts"
                                            disabled={!slotPrinter}
                                            onClick={() => {
                                                const chosen = selectable.find(p => p.printer === slotPrinter);
                                                if (chosen) {
                                                    const finalTime = jaCustomDate && jaCustomTime ? `${jaCustomDate} ${jaCustomTime}` : chosen.nextSlot;
                                                    assignPrinter(jaShowManual.id, slotPrinter, finalTime, jaShowManual.groupIndex ?? null);
                                                }
                                                setJaShowManual(null);
                                                setJaCustomDate("");
                                                setJaCustomTime("");
                                            }}>✓ Assign to Selected Printer</button></>
                                )}>
                                    <div className="tiny mb12" style={{ color: "var(--text2)" }}>
                                        Showing only <strong style={{ color: "var(--accent)" }}>{targetTech || "all"}</strong> printers — idle, printing, or waiting. Sorted by earliest available slot.
                                    </div>
                                    <div style={{ marginBottom: 16, padding: "12px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)" }}>
                                        <div className="tiny mb8" style={{ color: "var(--text3)", fontFamily: "var(--fm)", letterSpacing: "1px" }}>CUSTOM START TIME (OPTIONAL)</div>
                                        <div className="row" style={{ gap: 10 }}>
                                            <div style={{ flex: 1 }}>
                                                <label className="tiny" style={{ display: "block", marginBottom: 4 }}>Date</label>
                                                <input type="date" className="fi" value={jaCustomDate} onChange={e => setJaCustomDate(e.target.value)} style={{ width: "100%" }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label className="tiny" style={{ display: "block", marginBottom: 4 }}>Time</label>
                                                <input type="time" className="fi" value={jaCustomTime} onChange={e => setJaCustomTime(e.target.value)} style={{ width: "100%" }} />
                                            </div>
                                        </div>
                                        {(jaCustomDate || jaCustomTime) && (
                                            <div className="tiny mt6" style={{ color: "var(--accent)" }}>
                                                Custom start: {jaCustomDate && jaCustomTime ? `${jaCustomDate} ${jaCustomTime}` : jaCustomDate ? `${jaCustomDate} — select time` : "— select date"}
                                            </div>
                                        )}
                                    </div>
                                    {selectable.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)" }}>
                                            No available printers for <strong>{targetTech}</strong> at this time.
                                        </div>
                                    ) : selectable.map(p => {
                                        const isChosen = slotPrinter === p.printer;
                                        const queueLen = p.status === "printing" ? 3 : p.status === "waiting" ? 1 : 0;
                                        const isCustom = isChosen && jaCustomDate && jaCustomTime;
                                        return (
                                            <div key={p.id} onClick={() => { setSlotPrinter(p.printer); setSlotStartTime(isCustom ? `${jaCustomDate} ${jaCustomTime}` : p.nextSlot); }}
                                                style={{ background: isChosen ? "var(--adim)" : "var(--bg3)", border: `1.5px solid ${isChosen ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--r2)", padding: "12px 14px", cursor: "pointer", transition: "all .12s", marginBottom: 8 }}>
                                                <div className="rowsb mb4">
                                                    <div className="row" style={{ gap: 8 }}>
                                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.status === "printing" ? "var(--green)" : "var(--border2)", flexShrink: 0 }} />
                                                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.printer}</span>
                                                    </div>
                                                    <div className="row" style={{ gap: 6 }}>
                                                        <TB tech={p.tech} />
                                                        <SB s={p.status === "printing" ? "running" : p.status} />
                                                        {isChosen && <span style={{ color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>✓</span>}
                                                    </div>
                                                </div>
                                                <div className="rowsb">
                                                    <div className="tiny">
                                                        {p.status === "printing"
                                                            ? <>{p.job} · {queueLen} job{queueLen !== 1 ? "s" : ""} in queue</>
                                                            : p.status === "waiting" ? "Waiting in queue" : "No active job"}
                                                    </div>
                                                    {isCustom ? (
                                                        <div style={{ fontFamily: "var(--fm)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                                                            {jaCustomDate} {jaCustomTime}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontFamily: "var(--fm)", fontSize: 11, fontWeight: 700, color: p.status === "idle" ? "var(--green)" : "var(--text2)" }}>
                                                            {p.nextSlot}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Modal>
                            );
                        })()}

                        {/* ── Print Log Modal ── */}
                        {jaShowPrintLog && (() => {
                            const printerName = jaShowPrintLog.printer;
                            // Get scheduled jobs for this printer
                            const scheduledJobs = seedScheduleJobs.filter(j => j.printer === printerName && j.job);
                            // Get allotted jobs for this printer
                            const allottedForPrinter = Object.entries(printerAssignments)
                                .filter(([, a]) => a.printer === printerName)
                                .map(([projectId, assignment]) => {
                                    const project = lcProjects.find(p => p.id === projectId) || assignment.projectData;
                                    const durHrs = ((project?.estHrs ?? 4) + (project?.estMin ?? 0) / 60) * 1.05;
                                    return {
                                        job: project?.name || projectId,
                                        projectNo: projectId,
                                        start: assignment.startTime || "Today 10:00",
                                        dur: `${Math.ceil(durHrs)}h`,
                                        imageUrl: project?.imageUrl || "",
                                        tech: project?.tech || "FDM",
                                        material: project?.material || "",
                                        isAllotted: true,
                                    };
                                });
                            const allPrinterJobs = [...scheduledJobs.map(j => ({ ...j, isAllotted: false })), ...allottedForPrinter];
                            return (
                                <Modal title={`Print Log — ${printerName}`} onClose={() => setJaShowPrintLog(null)}>
                                    {allPrinterJobs.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)" }}>No jobs scheduled for this printer.</div>
                                    ) : (
                                        <>
                                            {jaShowPrintLog.imageUrl && (
                                                <div style={{ marginBottom: 14, aspectRatio: "16 / 9", maxHeight: 200, overflow: "hidden", borderRadius: "var(--r2)", border: "1px solid var(--border)", background: "#f0f0f0" }}>
                                                    <img src={jaShowPrintLog.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                                </div>
                                            )}
                                            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14, marginBottom: 14 }}>
                                                <div className="tiny mb6" style={{ color: "var(--text3)", fontFamily: "var(--fm)", letterSpacing: "1px" }}>SELECTED JOB DETAILS</div>
                                                <div className="rowsb mb4">
                                                    <span className="tiny">Project</span>
                                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{jaShowPrintLog.job}</span>
                                                </div>
                                                <div className="rowsb mb4">
                                                    <span className="tiny">Project No.</span>
                                                    <span style={{ fontSize: 12 }}>{jaShowPrintLog.projectNo}</span>
                                                </div>
                                                <div className="rowsb">
                                                    <span className="tiny">Technology</span>
                                                    <span style={{ fontSize: 12 }}>{jaShowPrintLog.tech}</span>
                                                </div>
                                            </div>
                                            <div className="tiny mb8" style={{ color: "var(--text2)" }}>All jobs for this printer:</div>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead><tr><th>Project</th><th>Start Time</th><th>Duration</th><th>Status</th></tr></thead>
                                                <tbody>
                                                    {allPrinterJobs.map((j, i) => (
                                                        <tr key={i}>
                                                            <td>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    {j.imageUrl && <img src={j.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }} />}
                                                                    <div>
                                                                        <div style={{ fontSize: 12, fontWeight: 500 }}>{j.job}</div>
                                                                        <div className="tiny">{j.projectNo}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="mono">{j.start}</td>
                                                            <td className="mono">{j.dur}</td>
                                                            <td>
                                                                {j.isAllotted ? (
                                                                    <span style={{ fontSize: 9, background: "var(--adim)", color: "var(--accent)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>SCHEDULED</span>
                                                                ) : (
                                                                    <span style={{ fontSize: 9, background: "rgba(15,155,106,.1)", color: "var(--green)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>ACTIVE</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </>
                                    )}
                                </Modal>
                            );
                        })()}
                    </div>
                );
            })()}

            {/* ── TAB: MATERIAL ── */}
            {reviewTab === "material" && (() => {
                const allInv = sel.tech === "FDM" ? seedRawFilaments : sel.tech === "SLA" ? seedRawResins : seedRawPowders;
                const unit = sel.tech === "SLA" ? "L" : sel.tech === "SLS" ? "kg" : "spools";

                // Build list of materials needed from the print request groups
                const projectMats = [];
                (sel.groups || []).forEach((grp, gi) => {
                    (grp.materials || []).forEach((mat, mi) => {
                        const cat = MAT_CATALOG[sel.tech] || MAT_CATALOG.FDM;
                        const isCustom = mat.custom;
                        const name = isCustom ? (mat.customName || mat.matType || "Custom") : (mat.matName || mat.matType || sel.material || "—");

                        // For standard materials, look up the color hex from catalog
                        let colorHex = null;
                        let colorDisplayName = null;
                        if (!isCustom && mat.matType && mat.finish && mat.matName) {
                            const colorEntry = (cat.colors[`${mat.matType}|${mat.finish}`] || []).find(c => c.name === mat.matName);
                            if (colorEntry) {
                                colorHex = colorEntry.hex;
                                colorDisplayName = colorEntry.name;
                            }
                        } else if (isCustom && mat.customHex) {
                            colorHex = mat.customHex;
                            colorDisplayName = mat.customName || mat.customHex;
                        }

                        const grams = mat.grams ? +mat.grams * +grp.qty : null;
                        projectMats.push({
                            key: `${gi}-${mi}`,
                            name,
                            type: mat.matType,
                            color: colorHex,
                            colorName: colorDisplayName || "",
                            finish: mat.finish,
                            grams,
                            grpQty: grp.qty,
                            grpLabel: `Group ${gi + 1}`,
                            custom: isCustom
                        });
                    });
                });
                // If no groups saved (seed data), fall back to single material row
                if (projectMats.length === 0) projectMats.push({ key: "0", name: sel.material || "—", type: sel.material, grams: null, grpQty: sel.qty, grpLabel: "All items", custom: false });

                return (
                    <ReviewSection num="2" title="Material Availability" status={tabStatus.material}>
                        {/* Project reference image */}
                        {sel.imageUrl && (
                            <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                <img
                                    src={sel.imageUrl}
                                    alt={sel.name}
                                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel.name}</div>
                                    <div className="tiny" style={{ color: "var(--text2)" }}>{sel.tech} · {sel.material} · {sel.qty} pcs</div>
                                </div>
                            </div>
                        )}

                        {/* Materials needed from this project - with confirmation checkmarks */}
                        <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>
                            Materials Required for This Project — Confirm Availability
                        </div>
                        <div className="card mb16" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                            <div className="tw">
                                <table>
                                    <thead><tr><th></th><th>Group</th><th>Color</th><th>Material</th><th>Type / Finish</th><th>g / item</th><th>Total (g)</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {projectMats.map(m => {
                                            // Check if this material is confirmed in inventory
                                            const invMatch = allInv.find(inv =>
                                                (m.name || "").toLowerCase().includes(inv.name.toLowerCase()) ||
                                                inv.name.toLowerCase().includes((m.type || m.name || "").toLowerCase())
                                            );
                                            const isCustom = m.custom;
                                            const matId = isCustom ? `custom-${m.key}` : (invMatch?.id || null);
                                            const isConfirmed = matId ? !!matConfirmedIds[matId] : false;
                                            const invStatus = invMatch ? invMatch.status : null;

                                            return (
                                                <tr key={m.key} style={{ background: isConfirmed ? "rgba(15,155,106,.03)" : "" }}>
                                                    <td style={{ width: 40 }}>
                                                        <div onClick={() => {
                                                            if (matId) {
                                                                setMatConfirmedIds(prev => ({ ...prev, [matId]: !prev[matId] }));
                                                                if (!isConfirmed) {
                                                                    setMatStatus(isCustom ? "low" : (invMatch?.status === "ok" ? "ok" : "low"));
                                                                }
                                                            }
                                                        }}
                                                            style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${isConfirmed ? "var(--green)" : "var(--border2)"}`, background: isConfirmed ? "var(--green)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .12s" }}>
                                                            {isConfirmed && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                                                        </div>
                                                    </td>
                                                    <td className="tiny">{m.grpLabel}<br /><span style={{ color: "var(--text3)" }}>{m.grpQty} pcs</span></td>
                                                    <td>
                                                        {m.color
                                                            ? <div className="row" style={{ gap: 6 }}>
                                                                <div style={{ width: 20, height: 20, borderRadius: "50%", background: m.color, border: "1px solid rgba(0,0,0,.15)", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
                                                                <span className="tiny">{m.colorName || m.color}</span>
                                                            </div>
                                                            : <span className="tiny" style={{ color: "var(--text3)" }}>—</span>}
                                                    </td>
                                                    <td style={{ fontWeight: 600, fontSize: 12 }}>{m.name}</td>
                                                    <td className="tdim">{[m.type, m.finish].filter(Boolean).join(" · ") || "—"}</td>
                                                    <td>
                                                        <span style={{ fontFamily: "var(--fd)", fontWeight: 700, color: m.grams != null ? "var(--text)" : "var(--text3)" }}>
                                                            {m.grams != null ? `${(m.grams / m.grpQty).toFixed(0)} g` : "—"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 13, color: m.grams ? "var(--accent)" : "var(--text3)" }}>
                                                            {m.grams != null ? `${m.grams.toLocaleString()} g` : "—"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isConfirmed
                                                            ? <span className="b" style={{ fontSize: 9, background: "rgba(15,155,106,.1)", color: "var(--green)", border: "1px solid rgba(15,155,106,.3)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>✓ Confirmed</span>
                                                            : isCustom
                                                                ? <span className="b" style={{ fontSize: 9, background: "var(--golddim)", color: "var(--gold)", border: "1px solid rgba(184,134,11,.3)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Custom Order</span>
                                                                : invMatch
                                                                    ? <span className={`b ${RMI_STATUS_BADGE[invStatus]}`} style={{ fontSize: 9 }}>{RMI_STATUS_LBL[invStatus]}</span>
                                                                    : <span className="b" style={{ fontSize: 9, background: "var(--rdim)", color: "var(--red)", border: "1px solid rgba(220,38,38,.3)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Not in Stock</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Custom color requests — order section */}
                        {projectMats.filter(pm => pm.custom && matConfirmedIds[`custom-${pm.key}`]).length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--gold)", marginBottom: 10 }}>
                                    ⚠ Custom Colors to Order
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                                    {projectMats.filter(pm => pm.custom && matConfirmedIds[`custom-${pm.key}`]).map(pm => (
                                        <div key={`custom-${pm.key}`} style={{ background: "var(--bg2)", border: "1.5px solid rgba(184,134,11,.4)", borderRadius: "var(--r3)", padding: 14, position: "relative", boxShadow: "var(--shadow)" }}>
                                            <div style={{ position: "absolute", top: 8, right: 8, background: "var(--golddim)", border: "1px solid rgba(184,134,11,.3)", borderRadius: 10, padding: "1px 7px", fontSize: 9, color: "var(--gold)", fontFamily: "var(--fm)", fontWeight: 700 }}>TO ORDER</div>
                                            <div className="row mb6" style={{ gap: 8, paddingRight: 72 }}>
                                                <div style={{ width: 16, height: 16, borderRadius: "50%", background: pm.color || "var(--text4)", border: "1px solid rgba(0,0,0,.12)", flexShrink: 0 }} />
                                                <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pm.name}</div>
                                            </div>
                                            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                                                {pm.type}{pm.finish ? ` · ${pm.finish}` : ""}{pm.colorName ? ` · ${pm.colorName}` : ""}
                                            </div>
                                            <div className="rowsb mb4">
                                                <span className="tiny">Quantity Needed</span>
                                                <span style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>{pm.grams ? `${pm.grams.toLocaleString()} g` : "—"}</span>
                                            </div>
                                            <div className="rowsb mb10">
                                                <span className="tiny">{pm.grpLabel} · {pm.grpQty} pcs</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Standard inventory cards — reference only, no confirm buttons */}
                        {projectMats.filter(pm => !pm.custom).length > 0 && (() => {
                            // Show only materials that are needed (matched to project materials)
                            const neededInv = allInv.filter(inv =>
                                projectMats.some(pm => !pm.custom && (
                                    (pm.name || "").toLowerCase().includes(inv.name.toLowerCase()) ||
                                    inv.name.toLowerCase().includes((pm.type || pm.name || "").toLowerCase())
                                ))
                            );

                            return neededInv.length > 0 ? (
                                <>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>
                                        {sel.tech} Inventory Status (Reference)
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
                                        {neededInv.map(m => {
                                            const pct = Math.min((m.qty / Math.max((m.minQty || 1) * 3, 1)) * 100, 100);
                                            const barCol = m.status === "ok" ? "var(--green)" : m.status === "low" ? "var(--gold)" : "var(--red)";
                                            return (
                                                <div key={m.id} style={{ background: "var(--bg2)", border: `1.5px solid ${m.status === "critical" ? "rgba(220,38,38,.35)" : m.status === "low" ? "rgba(184,134,11,.3)" : "var(--border)"}`, borderRadius: "var(--r3)", padding: 14, boxShadow: "var(--shadow)" }}>
                                                    <div className="row mb6" style={{ gap: 8 }}>
                                                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: m.color, border: "1px solid rgba(0,0,0,.12)", flexShrink: 0 }} />
                                                        <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                                                    </div>
                                                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>
                                                        {m.brand}{(m.type || m.material) ? ` · ${m.type || m.material}` : ""}{m.colorName ? ` · ${m.colorName}` : ""}
                                                    </div>
                                                    <div className="rowsb mb4">
                                                        <span className="tiny">{unit === "spools" ? "Spools" : unit === "L" ? "Available" : "Remaining"}</span>
                                                        <span style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, color: barCol }}>{m.qty} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text3)" }}>{m.unit || unit}</span></span>
                                                    </div>
                                                    <div style={{ background: "var(--bg4)", borderRadius: 3, height: 7, overflow: "hidden", marginBottom: 6 }}>
                                                        <div style={{ width: `${pct}%`, background: barCol, height: 7, borderRadius: 3 }} />
                                                    </div>
                                                    <div className="rowsb">
                                                        <span className="tiny">Min: <strong>{m.minQty} {m.unit || unit}</strong></span>
                                                        <span className={`b ${RMI_STATUS_BADGE[m.status]}`} style={{ fontSize: 9 }}>{RMI_STATUS_LBL[m.status]}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : null;
                        })()}

                        {/* Request new / extra material — auto-fills for custom colors */}
                        <div style={{ border: "1px solid var(--border2)", borderRadius: "var(--r2)", overflow: "hidden" }}>
                            <div style={{ padding: "8px 14px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>⊕ Request New / Extra Material</span>
                                <span className="tiny" style={{ marginLeft: "auto" }}>Material not in stock or new variant needed</span>
                            </div>
                            <div style={{ padding: 14 }}>
                                {(() => {
                                    // Auto-fill form with confirmed custom color material
                                    const confirmedCustom = projectMats.find(pm => pm.custom && matConfirmedIds[`custom-${pm.key}`]);
                                    return (
                                        <>
                                            <div className="frow">
                                                <div className="fg"><label className="fl">Material Name</label><input className="fi" placeholder="e.g. PA12 GF, PETG-CF" defaultValue={confirmedCustom ? confirmedCustom.name : ""} /></div>
                                                <div className="fg"><label className="fl">Technology</label><select className="fsel" defaultValue={sel.tech}><option>FDM</option><option>SLA</option><option>SLS</option></select></div>
                                                <div className="fg"><label className="fl">Type</label><input className="fi" placeholder="e.g. Engineering, Standard" defaultValue={confirmedCustom ? confirmedCustom.type : ""} /></div>
                                            </div>
                                            <div className="frow">
                                                <div className="fg"><label className="fl">Finish</label><input className="fi" placeholder="e.g. Matte, Glossy, Silk" defaultValue={confirmedCustom ? confirmedCustom.finish : ""} /></div>
                                                <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{ padding: "4px 8px", height: 38 }} defaultValue={confirmedCustom ? confirmedCustom.color : "#2563EB"} /></div>
                                                <div className="fg"><label className="fl">Qty Required (g)</label><input type="number" className="fi" placeholder="grams needed" defaultValue={confirmedCustom && confirmedCustom.grams ? confirmedCustom.grams : ""} /></div>
                                            </div>
                                            {confirmedCustom && (
                                                <div className="astrip info mb12" style={{ fontSize: 10, padding: "6px 10px" }}>
                                                    ✓ Auto-filled from custom color request: {confirmedCustom.colorName || confirmedCustom.name} ({confirmedCustom.grpLabel})
                                                </div>
                                            )}
                                            <div className="fg mb12"><label className="fl">Supplier / Notes</label><textarea className="fta" style={{ minHeight: 48 }} placeholder="Supplier, lead time, urgency, substitution notes…" /></div>
                                            <button className="btn btp bts" style={{ fontSize: 11 }} onClick={() => toast("Material request raised — pending procurement", "i")}>↑ Raise Material Request</button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {matStatus === "low" && <div className="astrip warn" style={{ marginTop: 12, marginBottom: 0 }}>⚠️ Confirmed material is low — verify quantity is sufficient before approving.</div>}
                        {matStatus === "ok" && <div className="astrip info" style={{ marginTop: 12, marginBottom: 0 }}>✓ Material confirmed available. Ready to proceed.</div>}
                    </ReviewSection>
                );
            })()}

            {/* ── TAB: SPARES ── */}
            {reviewTab === "spares" && (
                <ReviewSection num="3" title="Spare Parts & Consumables" status={spareListConfirmed ? "ok" : spareRequired.length > 0 ? "ok" : null}>
                    <div style={{ background: spareListConfirmed ? "rgba(15,155,106,.04)" : "var(--bg3)", border: `1px solid ${spareListConfirmed ? "rgba(15,155,106,.3)" : "var(--border2)"}`, borderRadius: "var(--r2)", padding: 12, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)" }}>
                                Spare Parts Required for This Job
                            </div>
                            <button
                                className={`btn ${spareListConfirmed ? "btp" : spareRequired.length > 0 ? "btp" : "btg"} bts`}
                                style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                                onClick={() => {
                                    if (spareRequired.length === 0) {
                                        toast("Please add at least one spare part before confirming", "w");
                                        return;
                                    }
                                    setSpareListConfirmed(true);
                                    toast("Spares list confirmed for this job", "s");
                                }}
                            >
                                <span style={{ fontSize: 14 }}>{spareListConfirmed ? "✓" : "○"}</span>
                                {spareListConfirmed ? "Confirmed" : "Confirm List"}
                            </button>
                        </div>
                        <div className="tiny mb10" style={{ color: "var(--text2)" }}>Add parts needed with quantity. Inventory availability shown automatically.</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
                            <div style={{ flex: 1 }}>
                                <label className="fl" style={{ fontSize: 10 }}>Select Part</label>
                                <select className="fsel" style={{ fontSize: 11 }} value={sparePartSelect} onChange={e => setSparePartSelect(e.target.value)}>
                                    <option value="">Choose a spare part...</option>
                                    {seedSpareSeed.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.location})</option>))}
                                </select>
                            </div>
                            <div style={{ width: 100 }}>
                                <label className="fl" style={{ fontSize: 10 }}>Qty Needed</label>
                                <input className="fi" type="number" min={1} value={sparePartQty} onChange={e => setSparePartQty(parseInt(e.target.value) || 1)} style={{ fontSize: 11, textAlign: "center" }} />
                            </div>
                            <button className="btn btp bts" style={{ fontSize: 10, padding: "5px 12px" }} onClick={() => { if (sparePartSelect && sparePartQty > 0) { const exists = spareRequired.find(p => p.partId === sparePartSelect); if (!exists) { setSpareRequired(p => [...p, { partId: sparePartSelect, qty: sparePartQty }]); } setSparePartSelect(""); setSparePartQty(1); } }}>+ Add</button>
                        </div>
                        {spareRequired.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                                {spareRequired.map((sp, idx) => {
                                    const part = seedSpareSeed.find(s => s.id === sp.partId);
                                    if (!part) return null;
                                    const sufficient = part.qty >= sp.qty;
                                    return (
                                        <div key={sp.partId} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: "8px 10px", background: sufficient ? "var(--bg2)" : "rgba(220,38,38,.04)", border: `1px solid ${sufficient ? "rgba(15,155,106,.3)" : "rgba(220,38,38,.3)"}`, borderRadius: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", flexShrink: 0 }}>#{idx + 1}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{part.name}</div>
                                                <div className="tiny" style={{ color: "var(--text3)" }}>{part.location} · <strong style={{ color: sufficient ? "var(--green)" : "var(--red)" }}>In Stock: {part.qty}</strong> · <strong style={{ color: "var(--accent)" }}>Need: {sp.qty}</strong></div>
                                            </div>
                                            <span className={`b ${sufficient ? "brun" : "berr"}`} style={{ fontSize: 9 }}>{sufficient ? "✓ Available" : "⚠ Short"}</span>
                                            <button onClick={() => setSpareRequired(p => p.filter(x => x.partId !== sp.partId))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px" }}>×</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="fg mt10">
                            <label className="fl">Additional Parts/Notes for This Job</label>
                            <textarea className="fta" style={{ minHeight: 56 }} placeholder="Any extra parts, consumables, or special instructions for this job…" value={spareNote} onChange={e => setSpareNote(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r2)", overflow: "hidden" }}>
                        <div style={{ padding: "8px 14px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700 }}>CHECK INVENTORY — CONFIRM AVAILABILITY</span>
                            <span className="tiny" style={{ color: "var(--text3)", fontWeight: 400 }}>Reference only</span>
                        </div>
                        <div style={{ padding: 12 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                                {seedSpareSeed.map(s => {
                                    const cat = SPARE_CATEGORIES.find(c => c.id === s.cat);
                                    const barCol = s.status === "ok" ? "var(--green)" : s.status === "low" ? "var(--gold)" : "var(--red)";
                                    const isInRequired = spareRequired.find(p => p.partId === s.id);
                                    return (
                                        <div key={s.id} style={{ background: isInRequired ? "rgba(37,99,235,.04)" : "var(--bg2)", border: `1px solid ${isInRequired ? "rgba(37,99,235,.3)" : "var(--border)"}`, borderRadius: "var(--r2)", padding: 10, position: "relative" }}>
                                            {isInRequired && <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
                                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{s.name}</div>
                                            <div className="tiny" style={{ color: "var(--text3)", marginBottom: 4 }}>{s.desc}</div>
                                            <div className="tiny" style={{ color: "var(--text3)", marginBottom: 6 }}>📍 {s.location}</div>
                                            <div className="rowsb" style={{ marginBottom: 4 }}>
                                                <span style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800, color: barCol }}>{s.qty}</span>
                                                <span className="tiny" style={{ color: "var(--text3)" }}>min: {s.minStock}</span>
                                            </div>
                                            <div style={{ background: "var(--bg4)", borderRadius: 2, height: 5, overflow: "hidden", marginBottom: 6 }}>
                                                <div style={{ width: `${Math.min((s.qty / Math.max(s.minStock * 2, 1)) * 100, 100)}%`, background: barCol, height: 5, borderRadius: 2 }} />
                                            </div>
                                            <span className={`b ${SPARE_STATUS_BADGE[s.status]}`} style={{ fontSize: 9 }}>{SPARE_STATUS_LABEL[s.status]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div style={{ border: "1px solid var(--border2)", borderRadius: "var(--r2)", overflow: "hidden", marginTop: 16 }}>
                        <div style={{ padding: "8px 14px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700 }}>⊕ Request New / Extra Inventory</span>
                            <span className="tiny" style={{ color: "var(--text3)", fontWeight: 400 }}>Order parts not in stock or additional quantity</span>
                        </div>
                        <div style={{ padding: 12 }}>
                            {spareRequests.map((rq, idx) => (
                                <div key={idx} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 10, marginBottom: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <span style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>REQUEST #{idx + 1}</span>
                                        <button onClick={() => setSpareRequests(p => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Part Name *</label>
                                            <input className="fi" style={{ fontSize: 11 }} placeholder="e.g. Nozzle 0.4mm" value={rq.name || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], name: e.target.value }; setSpareRequests(n); }} />
                                        </div>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Category *</label>
                                            <select className="fsel" style={{ fontSize: 11 }} value={rq.category || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], category: e.target.value }; setSpareRequests(n); }}>
                                                <option value="">Select…</option>
                                                {SPARE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Quantity to Order *</label>
                                            <input className="fi" type="number" min={1} style={{ fontSize: 11 }} value={rq.qty || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], qty: parseInt(e.target.value) || 1 }; setSpareRequests(n); }} />
                                        </div>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Urgency</label>
                                            <select className="fsel" style={{ fontSize: 11 }} value={rq.urgency || "Standard"} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], urgency: e.target.value }; setSpareRequests(n); }}>
                                                <option>Standard</option>
                                                <option>Urgent</option>
                                                <option>Rush</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Supplier / Vendor</label>
                                            <input className="fi" style={{ fontSize: 11 }} placeholder="e.g. Creality, Formlabs" value={rq.supplier || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], supplier: e.target.value }; setSpareRequests(n); }} />
                                        </div>
                                        <div>
                                            <label className="fl" style={{ fontSize: 10 }}>Est. Cost (AED)</label>
                                            <input className="fi" type="number" style={{ fontSize: 11 }} placeholder="0" value={rq.cost || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], cost: e.target.value }; setSpareRequests(n); }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="fl" style={{ fontSize: 10 }}>Notes / Part Specs</label>
                                        <textarea className="fta" style={{ fontSize: 11, minHeight: 40 }} placeholder="Part specifications, substitution notes, urgency…" value={rq.notes || ""} onChange={e => { const n = [...spareRequests]; n[idx] = { ...n[idx], notes: e.target.value }; setSpareRequests(n); }} />
                                    </div>
                                </div>
                            ))}
                            <button className="btn btg bts" style={{ fontSize: 11, width: "100%" }} onClick={() => setSpareRequests(p => [...p, { name: "", category: "", qty: 1, urgency: "Standard", supplier: "", cost: "", notes: "" }])}>⊕ Add New Request</button>
                            {spareRequests.length > 0 && (
                                <button className="btn btp bts" style={{ fontSize: 11, width: "100%", marginTop: 8 }} onClick={() => {
                                    // TODO: Implement save to purchase_orders table in backend
                                    toast(`Inventory request raised for ${spareRequests.length} part(s) — pending stores team`, "i");
                                    setSpareRequests([]);
                                }}>↑ Submit All Order Requests</button>
                            )}
                        </div>
                    </div>
                </ReviewSection>
            )}

            {/* ── TAB: EXTRA COST ── */}
            {reviewTab === "cost" && (
                <ReviewSection num="4" title="Extra Cost Approval" status={tabStatus.cost}>
                    <div className="tiny mb12" style={{ color: "var(--text2)" }}>If this job incurs costs beyond the standard department budget, log them here for approval.</div>
                    <div className="row mb12" style={{ gap: 10 }}>
                        <button onClick={() => setExtraCost(false)} style={{ padding: "8px 16px", border: `1.5px solid ${!extraCost ? "rgba(15,155,106,.4)" : "var(--border2)"}`, borderRadius: "var(--r2)", background: !extraCost ? "rgba(15,155,106,.07)" : "var(--bg2)", color: !extraCost ? "var(--green)" : "var(--text2)", fontSize: 12, cursor: "pointer", transition: "all .12s" }}>✓ No extra cost</button>
                        <button onClick={() => setExtraCost(true)} style={{ padding: "8px 16px", border: `1.5px solid ${extraCost ? "rgba(184,134,11,.4)" : "var(--border2)"}`, borderRadius: "var(--r2)", background: extraCost ? "var(--golddim)" : "var(--bg2)", color: extraCost ? "var(--gold)" : "var(--text2)", fontSize: 12, cursor: "pointer", transition: "all .12s" }}>⚠ Extra cost required</button>
                    </div>
                    {extraCost && (
                        <div>
                            <div className="tiny mb8">Cost Line Items (AED)</div>
                            {costItems.map((ci, i) => (
                                <div key={i} className="frow mb8" style={{ alignItems: "center" }}>
                                    <div className="fg"><input className="fi" placeholder="Description (e.g. Rush material order)" value={ci.desc} onChange={e => setCostItems(p => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} /></div>
                                    <div style={{ width: 120 }}><input className="fi" placeholder="AED amount" type="number" value={ci.amount} onChange={e => setCostItems(p => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} /></div>
                                    {costItems.length > 1 && <button className="btn btg bts" style={{ fontSize: 11, color: "var(--red)" }} onClick={() => setCostItems(p => p.filter((_, j) => j !== i))}>✕</button>}
                                </div>
                            ))}
                            <button className="btn btg bts" style={{ fontSize: 11 }} onClick={() => setCostItems(p => [...p, { desc: "", amount: "" }])}>⊕ Add Line</button>
                            <div className="sep" />
                            <div className="rowsb">
                                <span className="tiny">Total Extra Cost</span>
                                <span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 800, color: "var(--gold)" }}>AED {costItems.reduce((s, c) => s + (+c.amount || 0), 0).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </ReviewSection>
            )}

            {/* ── TAB: POST-PROC & QC ── */}
            {/* ── TAB: POST-PROCESSING ── */}
            {reviewTab === "pp" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <ReviewSection num="5" title="Post-Processing Steps" status={Object.values(postProc).some(Boolean) ? "ok" : null}>
                        {/* Project reference image */}
                        {sel.imageUrl && (
                            <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                <img
                                    src={sel.imageUrl}
                                    alt={sel.name}
                                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel.name}</div>
                                    <div className="tiny" style={{ color: "var(--text2)" }}>{sel.tech} · {sel.material} · {sel.qty} pcs</div>
                                </div>
                            </div>
                        )}

                        <div className="tiny mb12" style={{ color: "var(--text2)" }}>
                            Select the post-processing steps required for this job. Add instructions for the operator on each step.
                        </div>
                        {/* Step selector chips */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                            {[...(POST_PROCESS_OPTS[sel.tech] || []), ...customPostProc].map(opt => (
                                <ChipToggle key={opt} label={opt} active={!!postProc[opt]}
                                    onToggle={() => setPostProc(p => ({ ...p, [opt]: !p[opt] }))}
                                    onRemove={customPostProc.includes(opt) ? () => removeCustomPostProc(opt) : null} />
                            ))}
                        </div>
                    </ReviewSection>

                    {/* Add custom — outside ReviewSection to avoid re-render focus loss */}
                    <div style={{ display: "flex", gap: 6, padding: "0 0 16px" }}>
                        <input className="fi" placeholder="Add custom post-processing step…" value={newPostProc}
                            onChange={e => setNewPostProc(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addCustomPostProc()}
                            style={{ fontSize: 11 }} />
                        <button type="button" className="btn btp bts" onClick={addCustomPostProc} style={{ fontSize: 11, flexShrink: 0 }}>⊕ Add Step</button>
                    </div>

                    {/* Operator instructions — steps with AM instructions only */}
                    {Object.keys(postProc).filter(k => postProc[k]).length > 0 && (
                        <div>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>
                                Post-Processing Instructions — {Object.keys(postProc).filter(k => postProc[k]).length} steps
                            </div>
                            {Object.keys(postProc).filter(k => postProc[k]).map((step, i) => {
                                return (
                                    <div key={step} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                            {/* Step number */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--adim)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fm)", fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>{i + 1}</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{step}</div>
                                                {/* AM instruction field */}
                                                <div className="tiny mb4" style={{ color: "var(--text3)" }}>AM Instructions</div>
                                                <textarea className="fta" style={{ fontSize: 11, minHeight: 60, resize: "vertical" }}
                                                    placeholder={`Instructions for operator on ${step}…`}
                                                    value={ppInstructions[step] || ""}
                                                    onChange={e => setPpInstructions(p => ({ ...p, [step]: e.target.value }))} />
                                            </div>
                                            <button type="button" onClick={() => setPostProc(p => ({ ...p, [step]: false }))}
                                                style={{ background: "none", border: "none", color: "var(--text4)", fontSize: 16, cursor: "pointer", flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>×</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* Overall PP sign-off */}
                            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 12, marginTop: 4 }}>
                                <div className="tiny mb6" style={{ color: "var(--text3)" }}>Overall Post-Processing Notes</div>
                                <textarea className="fta" style={{ fontSize: 11, minHeight: 52 }} placeholder="General notes or sign-off comments from post-processing team…" />
                            </div>
                        </div>
                    )}
                    {Object.keys(postProc).filter(k => postProc[k]).length === 0 && (
                        <div className="astrip info">Select steps above to build the operator checklist.</div>
                    )}
                </div>
            )}

            {/* ── TAB: QC INSPECTION ── */}
            {reviewTab === "qc" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    <ReviewSection num="6" title="QC Inspection Checks" status={Object.values(qcChecks).some(Boolean) ? "ok" : null}>
                        {/* Project reference image */}
                        {sel.imageUrl && (
                            <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                <img
                                    src={sel.imageUrl}
                                    alt={sel.name}
                                    style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel.name}</div>
                                    <div className="tiny" style={{ color: "var(--text2)" }}>{sel.tech} · {sel.material} · {sel.qty} pcs</div>
                                </div>
                            </div>
                        )}

                        <div className="tiny mb12" style={{ color: "var(--text2)" }}>
                            Select the QC checks required for this job. Add pass criteria for each check.
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                            {[...(QC_CHECKS[sel.tech] || []), ...customQC].map(opt => (
                                <ChipToggle key={opt} label={opt} active={!!qcChecks[opt]}
                                    onToggle={() => setQcChecks(p => ({ ...p, [opt]: !p[opt] }))}
                                    color="var(--gold)" dimColor="var(--golddim)"
                                    onRemove={customQC.includes(opt) ? () => removeCustomQC(opt) : null} />
                            ))}
                        </div>
                    </ReviewSection>

                    {/* Add custom — outside ReviewSection */}
                    <div style={{ display: "flex", gap: 6, padding: "0 0 16px" }}>
                        <input className="fi" placeholder="Add custom QC check…" value={newQC}
                            onChange={e => setNewQC(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addCustomQC()}
                            style={{ fontSize: 11 }} />
                        <button type="button" className="btn btp bts" onClick={addCustomQC} style={{ fontSize: 11, flexShrink: 0 }}>⊕ Add Check</button>
                    </div>

                    {/* QC instructions — checks with pass criteria only */}
                    {Object.keys(qcChecks).filter(k => qcChecks[k]).length > 0 && (
                        <div>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 10 }}>
                                QC Inspection Criteria — {Object.keys(qcChecks).filter(k => qcChecks[k]).length} checks
                            </div>
                            {Object.keys(qcChecks).filter(k => qcChecks[k]).map((check, i) => {
                                return (
                                    <div key={check} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                            {/* Check number */}
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--golddim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fm)", fontSize: 10, fontWeight: 700, color: "var(--gold)" }}>{i + 1}</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{check}</div>
                                                <div className="tiny mb4" style={{ color: "var(--text3)" }}>Pass Criteria / Instructions</div>
                                                <textarea className="fta" style={{ fontSize: 11, minHeight: 60, resize: "vertical" }}
                                                    placeholder={`Pass criteria or measurement spec for ${check}…`}
                                                    value={qcInstructions[check] || ""}
                                                    onChange={e => setQcInstructions(p => ({ ...p, [check]: e.target.value }))} />
                                            </div>
                                            <button type="button" onClick={() => setQcChecks(p => ({ ...p, [check]: false }))}
                                                style={{ background: "none", border: "none", color: "var(--text4)", fontSize: 16, cursor: "pointer", flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>×</button>
                                        </div>
                                    </div>
                                );
                            })}
                            {/* QC sign-off */}
                            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 12, marginTop: 4 }}>
                                <div className="tiny mb6" style={{ color: "var(--text3)" }}>QC Sign-off Notes</div>
                                <textarea className="fta" style={{ fontSize: 11, minHeight: 52 }} placeholder="Overall QC result, inspector sign-off, disposition of parts…" />
                            </div>
                        </div>
                    )}
                    {Object.keys(qcChecks).filter(k => qcChecks[k]).length === 0 && (
                        <div className="astrip info">Select checks above to build the QC checklist.</div>
                    )}
                </div>
            )}

            {/* ── TAB: WORK ORDER ── */}
            {reviewTab === "wo" && (
                <ReviewSection num="7" title="Work Order Creation" status={tabStatus.wo}>
                    {/* Project reference image */}
                    {sel.imageUrl && (
                        <div style={{ display: "flex", gap: 12, marginBottom: 14, padding: 10, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                            <img
                                src={sel.imageUrl}
                                alt={sel.name}
                                style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel.name}</div>
                                <div className="tiny" style={{ color: "var(--text2)" }}>{sel.tech} · {sel.material} · {sel.qty} pcs</div>
                            </div>
                        </div>
                    )}

                    <div className="tiny mb12" style={{ color: "var(--text2)" }}>Fields are auto-filled from the review. Adjust if needed, then approve to send to production.</div>

                    {/* WO number — custom editable */}
                    <div className="frow">
                        <div className="fg">
                            <label className="fl">Work Order Number *</label>
                            <div className="row" style={{ gap: 0 }}>
                                <div style={{ padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRight: "none", borderRadius: "var(--r) 0 0 var(--r)", fontFamily: "var(--fm)", fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>WO-</div>
                                <input className="fi" style={{ borderRadius: "0 var(--r) var(--r) 0", fontFamily: "var(--fm)" }}
                                    value={woCustomNum}
                                    onChange={e => setWoCustomNum(e.target.value)}
                                    placeholder={String(2060 + lcProjects.length)} />
                            </div>
                        </div>
                        <div className="fg">
                            <label className="fl">Operator</label>
                            <select className="fsel" value={woOperator} onChange={e => setWoOperator(e.target.value)}>
                                {["Marco R.", "Yuki T.", "Arjun S.", "Marie D.", "Alex R."].map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Machine — auto from slot, editable */}
                    <div className="frow">
                        <div className="fg">
                            <label className="fl">Assign Machine * <span className="tiny" style={{ color: "var(--accent)", fontWeight: 400 }}>{slotPrinter ? "· auto from Job Allotment" : "· select in Job Allotment first"}</span></label>
                            <select className="fsel" value={woMachine || slotPrinter || ""} onChange={e => setWoMachine(e.target.value)}>
                                <option value="">— Select machine —</option>
                                {(printersByTech.length > 0 ? printersByTech : seedScheduleJobs).map(p => <option key={p.id} value={p.printer}>{p.printer} ({p.tech})</option>)}
                            </select>
                        </div>
                        <div className="fg">
                            <label className="fl">Scheduled Start <span className="tiny" style={{ color: "var(--accent)", fontWeight: 400 }}>{slotStartTime ? "· auto from Job Allotment" : ""}</span></label>
                            <input className="fi" style={{ fontFamily: "var(--fm)" }}
                                value={woSched || slotStartTime || ""}
                                onChange={e => setWoSched(e.target.value)}
                                placeholder="e.g. Today 14:15" />
                        </div>
                    </div>

                    {/* Post-proc + QC read-only summary */}
                    <div className="frow">
                        <div className="fg">
                            <label className="fl">Post-Processing</label>
                            <div className="fi" style={{ minHeight: 32, background: "var(--bg3)", color: "var(--text2)", fontSize: 11 }}>
                                {Object.keys(postProc).filter(k => postProc[k]).join(", ") || "None selected"}
                            </div>
                        </div>
                        <div className="fg">
                            <label className="fl">QC Checks</label>
                            <div className="fi" style={{ minHeight: 32, background: "var(--bg3)", color: "var(--text2)", fontSize: 11 }}>
                                {Object.keys(qcChecks).filter(k => qcChecks[k]).join(", ") || "None selected"}
                            </div>
                        </div>
                    </div>

                    {/* Notes — auto-populated from request note, editable */}
                    <div className="fg mb14">
                        <label className="fl">Work Order Notes <span className="tiny" style={{ color: "var(--accent)", fontWeight: 400 }}>{sel.requestNote ? "· pre-filled from request" : ""}</span></label>
                        <textarea className="fta" style={{ minHeight: 70 }}
                            placeholder="Special instructions, material handling notes…"
                            value={woNotes || sel.requestNote || ""}
                            onChange={e => setWoNotes(e.target.value)} />
                    </div>

                    {/* WO preview strip */}
                    <div style={{ background: "var(--adim)", border: "1px solid rgba(37,99,235,.15)", borderRadius: "var(--r2)", padding: "10px 14px", marginBottom: 14 }}>
                        <div className="tiny" style={{ color: "var(--accent)", fontFamily: "var(--fm)", marginBottom: 6 }}>WORK ORDER PREVIEW</div>
                        <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
                            <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>WO-{woCustomNum || (2060 + lcProjects.length)}</span>
                            <span className="tiny">{sel.name}</span>
                            <TB tech={sel.tech} />
                            <span className="tiny">{sel.qty} pcs</span>
                            {(woMachine || slotPrinter) && <span className="tiny">→ {woMachine || slotPrinter}</span>}
                            {(woSched || slotStartTime) && <span className="tiny" style={{ color: "var(--green)", fontFamily: "var(--fm)" }}>⏱ {woSched || slotStartTime}</span>}
                        </div>
                    </div>

                    {!slotPrinter && !woMachine && <div className="astrip warn" style={{ marginBottom: 8 }}>⚠️ Go to ① Job Allotment to assign a printer before approving.</div>}
                    <div className="rowsb">
                        <button className="btn btg bts" onClick={reject} style={{ color: "var(--red)", borderColor: "rgba(220,38,38,.3)" }}>✕ Return to Requester</button>
                        <button className="btn btp" onClick={approve} disabled={!slotPrinter || !matStatus || !(woMachine || slotPrinter)}>
                            ✓ Approve &amp; Create Work Order
                        </button>
                    </div>
                </ReviewSection>
            )}
        </div>
    );
}

