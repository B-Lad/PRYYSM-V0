import { useState } from "react";
import { TB, SB, Modal } from "../../components/atoms";
import { ScheduleGantt } from "../../components/ScheduleGantt";
import { SCHEDULE_JOBS } from "../../data/seed";
import { useDemoMode } from "../../hooks/useDemoMode";
import { usePrinterFleet } from "../../hooks/usePrinterFleet";

function Prog({ pct, h = 6 }) {
    return (
        <div style={{ width: "100%", height: h, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "var(--green)" : "var(--accent)", transition: "width .3s" }} />
        </div>
    );
}

export function JobAllotment({
    sel,
    lcProjects,
    printerAssignments,
    onPrinterAssignmentsChange,
    tabStatus,
    setTabStatus,
}) {
    const isDemo = useDemoMode();
    const { printers: sharedPrinters, scheduleJobs: sharedScheduleJobs } = usePrinterFleet();
    const allPrinters = isDemo ? SCHEDULE_JOBS : (sharedScheduleJobs.length > 0 ? sharedScheduleJobs : sharedPrinters.map(p => ({ id: p.id, printer: p.name, printerCode: p.code, job: p.job, tech: p.type, status: p.status })));
    const seedScheduleJobs = allPrinters;
    const [ganttFilter, setGanttFilter] = useState("all");
    const [ganttDate, setGanttDate] = useState(new Date("2026-04-23"));
    const [ganttView, setGanttView] = useState("day");
    const [slotPrinter, setSlotPrinter] = useState(null);
    const [slotStartTime, setSlotStartTime] = useState("");
    const [jaShowAutoConfirm, setJaShowAutoConfirm] = useState(null);
    const [jaShowManual, setJaShowManual] = useState(null);
    const [jaShowPrintLog, setJaShowPrintLog] = useState(null);
    const [jaCustomDate, setJaCustomDate] = useState("");
    const [jaCustomTime, setJaCustomTime] = useState("");
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

    const groupCount = sel?.groups?.length || 1;
    const currentGroupAssignment = printerAssignments[`${sel?.id}-grp${selectedGroupIndex}`];

    const toast = (msg, type = "s") => {
        if (typeof window !== "undefined" && window.toast) window.toast(msg, type);
    };

    function assignPrinter(projectId, printer, startTime, groupIndex = null) {
        const fullId = groupIndex !== null ? `${projectId}-grp${groupIndex}` : projectId;
        const project = lcProjects.find(p => p.id === projectId);
        onPrinterAssignmentsChange(prev => ({ ...prev, [fullId]: { printer, startTime, projectData: project, confirmed: false, groupIndex } }));
        toast(`Assigned to ${printer}${groupIndex !== null ? ` (Grp ${groupIndex + 1})` : ""}`, "s");
    }

    function unassignPrinter(projectId, groupIndex = null) {
        const fullId = groupIndex !== null ? `${projectId}-grp${groupIndex}` : projectId;
        onPrinterAssignmentsChange(prev => {
            const next = { ...prev };
            delete next[fullId];
            return next;
        });
    }

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
            if (todayTomorrowMatch[1] === "Tomorrow") startDate = new Date("2026-04-24");
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

    const allJobs = [...seedScheduleJobs, ...allottedJobs];

    const groups = sel?.groups?.length > 0 ? sel.groups : [{ qty: sel?.qty || 0, estHrs: sel?.estHrs, estMin: sel?.estMin }];

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
                showDurationLegend={true}
            />

            {/* ── Group Selector ── */}
            {groups.length > 1 && (
                <div className="mb14" style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text3)", marginBottom: 8 }}>Select Group to Assign</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {groups.map((g, i) => {
                            const grpAssignment = printerAssignments[`${sel.id}-grp${i}`];
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedGroupIndex(i)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        border: `1.5px solid ${selectedGroupIndex === i ? "var(--accent)" : grpAssignment ? "var(--green)" : "var(--border)"}`,
                                        background: selectedGroupIndex === i ? "var(--adim)" : grpAssignment ? "rgba(15,155,106,.06)" : "var(--bg2)",
                                        color: selectedGroupIndex === i ? "var(--accent)" : grpAssignment ? "var(--green)" : "var(--text2)",
                                        fontFamily: "var(--fd)",
                                        fontSize: 12,
                                        fontWeight: selectedGroupIndex === i ? 700 : 500,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: grpAssignment ? "var(--green)" : (selectedGroupIndex === i ? "var(--accent)" : "var(--border2)") }} />
                                    G{i + 1}
                                    <span style={{ color: "var(--text3)", fontWeight: 400 }}>({g.qty || 0} pcs)</span>
                                    {grpAssignment && <span style={{ fontSize: 10 }}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Current Request Pending Allotment ── */}
            <div className="card mb16">
                <div className="ch">
                    <div><span className="ct">Request Pending Allotment</span></div>
                </div>
                <div className="tw">
                    <table>
                        <thead><tr><th>#</th><th>Project / Group</th><th>Est. Time (w/5%)</th><th>Qty</th><th>Priority</th><th>Technology</th><th>Deadline</th><th>Assigned To</th><th style={{ textAlign: "right", minWidth: 140 }}>Actions</th></tr></thead>
                        <tbody>
                            {groups.map((g, gi) => {
                                const grpAssignment = printerAssignments[`${sel.id}-grp${gi}`];
                                const groupEstHrs = parseInt(g.estHrs) || parseInt(sel.estHrs) || 4;
                                const groupEstMin = parseInt(g.estMin) || parseInt(sel.estMin) || 0;
                                const rawMin = (groupEstHrs * 60 + groupEstMin) * 1.05;
                                const timeWithBuffer = `${Math.floor(rawMin / 60)}h ${Math.round(rawMin % 60)}m`;
                                const priorityBadge = { low: "bnorm", medium: "bwait", high: "burgent", normal: "bnorm" };

                                return (
                                    <tr key={`${sel.id}-grp${gi}`} style={{ background: grpAssignment ? "rgba(15,155,106,.05)" : "rgba(37,99,235,.03)" }}>
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
                                            {grpAssignment ? (
                                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>✓ {grpAssignment.printer}</span>
                                            ) : (
                                                <span className="tiny" style={{ color: "var(--text3)" }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            {grpAssignment ? (
                                                <button className="btn btg bts" style={{ fontSize: 10, padding: "6px 12px" }} onClick={() => unassignPrinter(sel.id, gi)}>✕ Unassign</button>
                                            ) : (
                                                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                    <button className="btn btp" style={{ fontSize: 11, padding: "6px 14px", fontWeight: 600 }} onClick={() => setJaShowAutoConfirm({ ...sel, groupIndex: gi })}>⚡ Auto</button>
                                                    <button className="btn btg" style={{ fontSize: 11, padding: "6px 14px" }} onClick={() => setJaShowManual({ ...sel, groupIndex: gi })}>✎ Manual</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
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
                        let nextH = currentH + 1;
                        let nextMin = now.getMinutes();
                        if (p.status === "maintenance" || p.status === "offline") { nextH = 14; nextMin = 0; }
                        else if (p.status === "printing" && p.start != null && p.dur > 0) { nextH = p.start + p.dur; nextMin = 15; }
                        else if (p.status === "waiting") { nextH = 6 + (p.start || 0) + 1; nextMin = 0; }
                        if (nextH >= 24) { nextH = 8; nextMin = 0; }
                        const nextTime = `${String(nextH).padStart(2, "0")}:${String(nextMin).padStart(2, "0")}`;
                        const isNextDay = p.start != null && p.dur > 0 && (p.start + p.dur) >= 24;

                        function handlePrinterClick() {
                            if (p.job) {
                                setJaShowPrintLog(p);
                            } else if (!busy) {
                                const startTime = `${isNextDay ? "Tomorrow " : "Today "}${nextTime}`;
                                assignPrinter(sel.id, p.printer, startTime, selectedGroupIndex);
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
                                    : p.status === "maintenance" ? <div className="tiny" style={{ color: "var(--yellow)" }}>Under maintenance</div>
                                    : p.status === "offline" ? <div className="tiny" style={{ color: "var(--red)" }}>Offline</div>
                                    : null}
                                <div className="tiny mt6" style={{ color: busy ? "var(--text3)" : "var(--green)", fontFamily: "var(--fm)", fontWeight: busy ? 400 : 600 }}>
                                    {busy ? `Available: ${isNextDay ? "Tomorrow " : ""}${nextTime}` : `✓ Start now · ${nextTime}`}
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
                    ✓ Allotted to <strong>{slotPrinter}</strong>{slotStartTime ? ` · Starts ${slotStartTime}` : ""}
                </div>
                : <div className="astrip warn" style={{ marginBottom: 0 }}>Click an available printer above to allot this request.</div>}

            {/* ── Auto Confirm Modal ── */}
            {jaShowAutoConfirm && (() => {
                const now = new Date();
                const currentHour = now.getHours() + now.getMinutes() / 60;
                const sameTech = seedScheduleJobs.filter(p => (p.tech || "").toUpperCase() === (jaShowAutoConfirm.tech || sel?.tech || "").toUpperCase());
                const candidates = (sameTech.length > 0 ? sameTech : seedScheduleJobs).filter(p => p.status !== "maintenance" && p.status !== "offline");
                const withTime = candidates.map(p => {
                    let avail;
                    if (p.status === "printing" && p.start != null && p.dur > 0) avail = p.start + p.dur + 0.25;
                    else if (p.status === "waiting") avail = 6 + (p.start || 0) + 1;
                    else avail = currentHour + 1;
                    return { ...p, availH: avail };
                });
                const best = withTime.sort((a, b) => a.availH - b.availH)[0];
                if (!best) return null;
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
                            Earliest available {jaShowAutoConfirm.tech || sel?.tech} printer found.
                        </div>
                        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14 }}>
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
                            <button className="btn btp bts" disabled={!slotPrinter} onClick={() => {
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
                            Showing only <strong style={{ color: "var(--accent)" }}>{targetTech || "all"}</strong> printers — idle, printing, or waiting.
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
                                            {p.status === "printing" ? <>{p.job}</> : p.status === "waiting" ? "Waiting in queue" : "No active job"}
                                        </div>
                                        {isCustom ? (
                                            <div style={{ fontFamily: "var(--fm)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{jaCustomDate} {jaCustomTime}</div>
                                        ) : (
                                            <div style={{ fontFamily: "var(--fm)", fontSize: 11, fontWeight: 700, color: p.status === "idle" ? "var(--green)" : "var(--text2)" }}>{p.nextSlot}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </Modal>
                );
            })()}

            {/* ── Print Log Modal ── */}
            {jaShowPrintLog && (
                <Modal title={`Print Log — ${jaShowPrintLog.printer}`} onClose={() => setJaShowPrintLog(null)} footer={<button className="btn btg bts" onClick={() => setJaShowPrintLog(null)}>Close</button>}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="rowsb"><span className="tiny">Machine</span><span style={{ fontSize: 13, fontWeight: 600 }}>{jaShowPrintLog.printer}</span></div>
                        <div className="rowsb"><span className="tiny">Technology</span><TB tech={jaShowPrintLog.tech} /></div>
                        <div className="rowsb"><span className="tiny">Status</span><SB s={jaShowPrintLog.status === "printing" ? "running" : jaShowPrintLog.status} /></div>
                        {jaShowPrintLog.job && <div className="rowsb"><span className="tiny">Current Job</span><span style={{ fontSize: 12 }}>{jaShowPrintLog.job}</span></div>}
                        {jaShowPrintLog.start != null && <div className="rowsb"><span className="tiny">Started</span><span style={{ fontSize: 12, fontFamily: "var(--fm)" }}>{jaShowPrintLog.start}:00</span></div>}
                        {jaShowPrintLog.dur && <div className="rowsb"><span className="tiny">Duration</span><span style={{ fontSize: 12, fontFamily: "var(--fm)" }}>{jaShowPrintLog.dur}h</span></div>}
                    </div>
                </Modal>
            )}
        </div>
    );
}