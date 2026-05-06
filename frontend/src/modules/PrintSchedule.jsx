import React, { useState } from "react";
import { SCHEDULE_JOBS, CONFIRM_QUEUE } from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { usePrinterFleet } from '../hooks/usePrinterFleet.js';
import { TB, SB, Prog } from '../components/atoms.jsx';
import { ScheduleGantt } from '../components/ScheduleGantt.jsx';
import { Printer, AlertTriangle, CheckCircle, Clock, Settings, Download, X, MapPin, User, Layers, Wrench, FileBox, Image, AlertCircle } from 'lucide-react';

export function PrintSchedule({ lcProjects = [], printerAssignments = {}, onPrinterAssignmentsChange }) {
    const isDemo = useDemoMode();
    const { printers: sharedPrinters, scheduleJobs: sharedScheduleJobs } = usePrinterFleet();
    const allPrinters = isDemo ? SCHEDULE_JOBS : (sharedScheduleJobs.length > 0 ? sharedScheduleJobs : sharedPrinters.map(p => ({ id: p.id, printer: p.name, printerCode: p.code, job: p.job, tech: p.type, status: p.status })));
    const seedScheduleJobs = allPrinters;
    const seedConfirmQueue = isDemo ? CONFIRM_QUEUE : [];

    const DEMO_FLEET_STATUS_MAP = {
        "PRUSA01": { status: "printing", location: "Lab 1" },
        "ENDER01": { status: "idle", location: "Lab 2" },
        "ULT01": { status: "printing", location: "Design Studio" },
        "ANYC01": { status: "maintenance", location: "Workshop" },
        "BAMB01": { status: "idle", location: "Lab 3" },
        "PRUSA02": { status: "idle", location: "Lab 1" },
        "EOS01": { status: "idle", location: "Lab 2" },
        "HPJF01": { status: "maintenance", location: "Prototyping Center" },
        "ANYC02": { status: "idle", location: "Design Studio" },
    };
    const fleetStatusMap = isDemo ? DEMO_FLEET_STATUS_MAP : sharedPrinters.reduce((acc, p) => ({ ...acc, [p.code]: { status: p.status, location: p.location } }), {});

    const [view, setView] = useState("day");
    const [selPrinter, setSelPrinter] = useState(sharedPrinters.length > 0 ? sharedPrinters[0].code : "PRUSA01");
    const [techFilter, setTechFilter] = useState("all");
    const [queue, setQueue] = useState(seedConfirmQueue);
    const [currentDate, setCurrentDate] = useState(new Date("2026-04-23"));
    const [selectedJob, setSelectedJob] = useState(null);

    const enrichedJobs = seedScheduleJobs.map(j => ({
        ...j,
        status: fleetStatusMap[j.printerCode]?.status || j.status,
        location: fleetStatusMap[j.printerCode]?.location || "Unknown",
    }));

    // Build allotted jobs from shared printerAssignments
    const allottedJobs = Object.entries(printerAssignments).map(([key, assignment]) => {
        // key might be `PRJ-XYZ` or `PRJ-XYZ-grp0`
        const projectId = key.split("-grp")[0];
        const project = lcProjects.find(p => p.id === projectId) || assignment.projectData;
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
            const customDateMatch = assignment.startTime?.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}):(\d{2}))?/);
            if (customDateMatch) {
                startDate = new Date(customDateMatch[1]);
                startHour = customDateMatch[2] ? parseInt(customDateMatch[2]) : 9; // Default to 9 AM if no time provided
            }
        }
        
        const durHrs = ((project?.estHrs ?? 4) + (project?.estMin ?? 0) / 60) * 1.05;
        const mainMaterial = assignment.woData?.materials?.[0] 
            ? (assignment.woData.materials[0].custom ? assignment.woData.materials[0].customName : assignment.woData.materials[0].matName)
            : (project?.material || "");

        return {
            id: assignment.woData?.woId || `ALLOT-${key}`,
            printer: assignment.printer,
            printerCode: printerData?.printerCode || assignment.printer,
            job: project?.name || projectId,
            projectNo: assignment.woData?.woId || projectId,
            start: startHour,
            startDate: startDate.toISOString().split("T")[0],
            dur: Math.ceil(durHrs),
            tech: project?.tech || "FDM",
            status: "scheduled",
            client: project?.owner || "",
            material: mainMaterial,
            imageUrl: project?.imageUrl || "",
            modelName: project?.fileName || project?.modelName || "Model.stl",
            isAllotted: true,
            confirmed: assignment.confirmed || false,
            woData: assignment.woData
        };
    });

    const allJobs = [...enrichedJobs, ...allottedJobs];
    const filteredJobs = techFilter === "all" ? allJobs : allJobs.filter(j => j.tech === techFilter);
    const stats = {
        printing: enrichedJobs.filter(j => j.status === "printing").length,
        idle: enrichedJobs.filter(j => j.status === "idle").length,
        maintenance: enrichedJobs.filter(j => j.status === "maintenance").length,
        offline: enrichedJobs.filter(j => j.status === "offline").length,
    };

    const activePrinters = enrichedJobs.filter(j => j.status !== "maintenance");
    const maintenancePrinters = enrichedJobs.filter(j => j.status === "maintenance");

    const selPrinterData = enrichedJobs.find(p => p.printerCode === selPrinter);
    const selQueue = queue.filter(j => j.code.includes(selPrinter));
    const pendingJobs = selQueue.filter(j => j.status === "pending");
    const confirmedJobs = selQueue.filter(j => j.status === "confirmed");

    function getPendingCount(printerCode) {
        return queue.filter(j => j.code.includes(printerCode) && j.status === "pending").length;
    }

    function confirmJob(id) {
        setQueue(prev => prev.map(j => j.id === id ? { ...j, status: "confirmed" } : j));
        const job = queue.find(j => j.id === id);
        if (job && onPrinterAssignmentsChange) {
            const projectId = job.projectNo;
            if (printerAssignments[projectId]) {
                onPrinterAssignmentsChange(prev => ({
                    ...prev,
                    [projectId]: { ...prev[projectId], confirmed: true }
                }));
            }
        }
    }

    function downloadModel(modelName) {
        const link = document.createElement("a");
        link.href = "#";
        link.download = modelName;
        link.click();
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Print Schedule</h1></div>

            {/* KPI strip */}
            <div className="g g4 mb16">
                {[["Printing", stats.printing, "var(--green)"], ["Idle", stats.idle, "var(--text3)"], ["Maintenance", stats.maintenance, "var(--yellow)"], ["Offline", stats.offline, "var(--red)"]].map(([l, v, c]) => (
                    <div key={l} className="card"><div className="cb" style={{ padding: "12px 16px" }}>
                        <div className="kl">{l}</div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 28, fontWeight: 800, color: c, lineHeight: 1 }}>{v}</div>
                    </div></div>
                ))}
            </div>

            {/* Gantt card */}
            <ScheduleGantt
                jobs={filteredJobs}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                view={view}
                onViewChange={setView}
                techFilter={techFilter}
                onTechFilterChange={setTechFilter}
                onJobClick={(job) => {
                    if (job.isAllotted) {
                        const assignment = printerAssignments[job.projectNo];
                        const project = lcProjects.find(p => p.id === job.projectNo) || assignment?.projectData;
                        setSelectedJob({ ...job, name: project?.name || job.job, projectData: project });
                    } else {
                        setSelectedJob(job);
                    }
                }}
                showDurationLegend={true}
            />

            {/* Job Confirmation */}
            <div className="g g21" style={{ flexWrap: "wrap" }}>
                <div className="card" style={{ minWidth: "280px", flex: "1 1 300px" }}>
                    <div className="ch">
                        <span className="ct">Job Confirmation</span>
                        <span className="tiny">Select a printer to view its queue</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {/* Printer list */}
                        <div style={{ padding: "8px 0", maxHeight: "300px", overflowY: "auto" }}>
                            <div className="tiny" style={{ padding: "4px 14px", marginBottom: 4 }}>Active Printers ({activePrinters.length})</div>
                            {activePrinters.map(p => {
                                const pendingCount = getPendingCount(p.printerCode);
                                const isSelected = selPrinter === p.printerCode;
                                return (
                                    <div key={p.id} onClick={() => setSelPrinter(p.printerCode)} style={{ padding: "10px 14px", cursor: "pointer", background: isSelected ? "var(--bg3)" : "", borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            {p.status === "printing" && <span className="pd g" style={{ flexShrink: 0 }} />}
                                            {p.status === "idle" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                                            <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? "var(--text)" : "var(--text2)" }}>{p.printer}</span>
                                        </div>
                                        {pendingCount > 0 && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                                <span className="blink-dot" />
                                                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)" }}>{pendingCount}</span>
                                            </span>
                                        )}
                                    </div>
                                );
                            })}

                            {maintenancePrinters.length > 0 && (
                                <>
                                    <div className="tiny" style={{ padding: "12px 14px 4px", marginBottom: 4, color: "var(--gold)", display: "flex", alignItems: "center", gap: 6 }}><Wrench size={14} strokeWidth={2.5} /> Maintenance ({maintenancePrinters.length})</div>
                                    {maintenancePrinters.map(p => {
                                        const pendingCount = getPendingCount(p.printerCode);
                                        const isSelected = selPrinter === p.printerCode;
                                        return (
                                            <div key={p.id} onClick={() => setSelPrinter(p.printerCode)} style={{ padding: "10px 14px", cursor: "pointer", background: isSelected ? "rgba(184,134,11,.08)" : "", borderLeft: `3px solid ${isSelected ? "var(--gold)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Wrench size={14} strokeWidth={2.5} style={{ color: "var(--gold)", flexShrink: 0 }} />
                                                    <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? "var(--gold)" : "var(--text3)" }}>{p.printer}</span>
                                                </div>
                                                {pendingCount > 0 && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                                        <span className="blink-dot" />
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)" }}>{pendingCount}</span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Queue panel — filtered to selected printer */}
                <div className="card" style={{ minWidth: "280px", flex: "2 1 400px" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Printer size={18} strokeWidth={2.5} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{selPrinterData?.printer || selPrinter}</span>
                        <span className="tiny" style={{ fontWeight: 400 }}>{selPrinterData?.tech}</span>
                        <span className="tiny" style={{ color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} strokeWidth={2.5} /> {selPrinterData?.location}</span>
                    </div>

                    <div style={{ padding: 14, maxHeight: "400px", overflowY: "auto" }}>
                        {selPrinterData?.status === "maintenance" && (
                            <div style={{ background: "rgba(184,134,11,.08)", border: "1px solid rgba(184,134,11,.25)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <Wrench size={18} strokeWidth={2.5} style={{ color: "var(--gold)", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: "var(--gold)" }}>This printer is currently under maintenance. No jobs can be assigned.</span>
                            </div>
                        )}

                        {pendingJobs.length > 0 && (
                            <div className="mb12">
                                <div className="tiny mb8" style={{ color: "var(--yellow)", display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={14} strokeWidth={2.5} /> Pending Confirmation ({pendingJobs.length})</div>
                                {pendingJobs.map(j => (
                                    <div key={j.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px", marginBottom: 8 }}>
                                        <div className="rowsb mb6" style={{ flexWrap: "wrap", gap: 8 }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{j.name}</div>
                                                <div className="tiny">{j.code} · Starts: {j.start}</div>
                                            </div>
                                            <button className="btn btp bts" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }} onClick={() => confirmJob(j.id)}><CheckCircle size={12} strokeWidth={2.5} /> Confirm</button>
                                        </div>
                                        <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                            {j.imageUrl && (
                                                <img src={j.imageUrl} alt={j.name} style={{ width: 40, height: 40, borderRadius: "var(--r2)", objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                                            )}
                                            {j.modelName && (
                                                <div className="row" style={{ gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                                    <span className="tiny" style={{ color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}><FileBox size={12} strokeWidth={2.5} /> {j.modelName}</span>
                                                    <button className="btn btg bts" style={{ fontSize: 9, padding: "3px 8px", display: "flex", alignItems: "center", gap: 3 }} onClick={() => downloadModel(j.modelName)}><Download size={10} strokeWidth={2.5} /> Download</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {confirmedJobs.length > 0 ? <>
                            <div className="tiny mb8" style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={14} strokeWidth={2.5} /> Confirmed Queue ({confirmedJobs.length})</div>
                            {confirmedJobs.map(j => (
                                <div key={j.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px", marginBottom: 6 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{j.name}</div>
                                    <div className="tiny">{j.code} · Starts: {j.start}</div>
                                </div>
                            ))}
                        </> : pendingJobs.length === 0 && (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontSize: 12 }}>No jobs queued for this printer.</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .blink-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--gold);
                    animation: blink 1s ease-in-out infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }
            `}</style>

            {/* Project Detail Modal */}
            {selectedJob && (
                <div className="mback" style={{ zIndex: 1000 }} onClick={() => setSelectedJob(null)}>
                    <div className="mod" style={{ width: 500, maxWidth: "90vw" }} onClick={e => e.stopPropagation()}>
                        <div className="rowsb" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                                    <Image size={24} strokeWidth={2} style={{ color: "var(--accent)" }} />
                                </div>
                                <div>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 700 }}>{selectedJob.projectNo}</div>
                                    <div className="tiny" style={{ color: "var(--text3)" }}>{selectedJob.job}</div>
                                </div>
                            </div>
                            <button className="mclose" onClick={() => setSelectedJob(null)} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><X size={22} strokeWidth={2.5} /></button>
                        </div>
                        <div style={{ padding: 20 }}>
                            {selectedJob.imageUrl && (
                                <div style={{ position: "relative", marginBottom: 16, aspectRatio: "16 / 9", maxHeight: 200, overflow: "hidden", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <img
                                        src={selectedJob.imageUrl}
                                        alt={selectedJob.job}
                                        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "var(--r2)" }}
                                    />
                                    <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "4px 8px", display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 10 }}>
                                        <Image size={12} strokeWidth={2.5} /> Project Image
                                    </div>
                                </div>
                            )}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Printer size={14} strokeWidth={2.5} /> Printer</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.printer}</div>
                                </div>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4 }}>Technology</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.tech}</div>
                                </div>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} strokeWidth={2.5} /> Duration</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.dur} hours</div>
                                </div>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} strokeWidth={2.5} /> Start Time</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{String(selectedJob.start).padStart(2, '0')}:00</div>
                                </div>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><User size={14} strokeWidth={2.5} /> Client</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.client || "—"}</div>
                                </div>
                                <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                    <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><Layers size={14} strokeWidth={2.5} /> Material</div>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.material || "—"}</div>
                                </div>
                            </div>
                            <div style={{ background: "var(--bg3)", padding: 12, borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                                <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><MapPin size={14} strokeWidth={2.5} /> Location</div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedJob.location}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

