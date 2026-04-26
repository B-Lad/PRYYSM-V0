import React, { useState } from "react";
import { SCHEDULE_JOBS, CONFIRM_QUEUE } from '../data/seed.jsx';
import { TB, SB, Prog } from '../components/atoms.jsx';
import { ChevronLeft, ChevronRight, CalendarDays, Printer, AlertTriangle, CheckCircle, Clock, Settings, Download, X, MapPin, User, Layers, Wrench, FileBox, Image, AlertCircle } from 'lucide-react';

const FLEET_STATUS_MAP = {
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

const DAY_START = 0;
const DAY_END = 24;
const TOTAL_COLS = DAY_END - DAY_START;

function getDurationColor(dur) {
    if (dur <= 2) return "var(--green)";
    if (dur <= 4) return "#22c55e";
    if (dur <= 6) return "#3b82f6";
    if (dur <= 8) return "#8b5cf6";
    if (dur <= 10) return "#f59e0b";
    if (dur <= 12) return "#ef4444";
    if (dur <= 15) return "#dc2626";
    return "#991b1b";
}

function getJobsForDate(jobs, date) {
    const dateStr = date.toISOString().split("T")[0];
    return jobs.filter(job => {
        if (!job.job || job.dur === 0) return false;
        const jobStartDate = new Date("2026-04-23");
        jobStartDate.setHours(job.start);
        const jobEndDate = new Date(jobStartDate);
        jobEndDate.setHours(jobEndDate.getHours() + job.dur);
        const viewDateStart = new Date(date);
        viewDateStart.setHours(0, 0, 0, 0);
        const viewDateEnd = new Date(date);
        viewDateEnd.setHours(23, 59, 59, 999);
        return jobStartDate <= viewDateEnd && jobEndDate >= viewDateStart;
    });
}

function getJobBarForDate(job, date) {
    const jobStartDate = new Date("2026-04-23");
    jobStartDate.setHours(job.start);
    const jobEndDate = new Date(jobStartDate);
    jobEndDate.setHours(jobEndDate.getHours() + job.dur);
    const viewDateStart = new Date(date);
    viewDateStart.setHours(0, 0, 0, 0);
    const viewDateEnd = new Date(date);
    viewDateEnd.setHours(23, 59, 59, 999);
    if (jobStartDate > viewDateEnd || jobEndDate < viewDateStart) return null;
    let startHour = jobStartDate < viewDateStart ? viewDateStart.getHours() : jobStartDate.getHours();
    let endHour = jobEndDate > viewDateEnd ? 24 : jobEndDate.getHours();
    if (jobEndDate > viewDateEnd && jobEndDate.getHours() === 0) endHour = 24;
    return { start: startHour, dur: endHour - startHour };
}

export function PrintSchedule() {
    const [view, setView] = useState("day");
    const [selPrinter, setSelPrinter] = useState("PRUSA01");
    const [techFilter, setTechFilter] = useState("all");
    const [queue, setQueue] = useState(CONFIRM_QUEUE);
    const [currentDate, setCurrentDate] = useState(new Date("2026-04-23"));
    const [selectedJob, setSelectedJob] = useState(null);

    const HOURS_LABELS = [];
    for (let h = DAY_START; h < DAY_END; h++) {
        HOURS_LABELS.push(`${String(h).padStart(2, '0')}:00`);
    }
    const HOURS = Array.from({ length: TOTAL_COLS }, (_, i) => i);
    
    const WEEK_DAYS = ["Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28", "Sat 29", "Sun 30"];
    const MONTH_WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

    const dateLabel = currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    const dateStr = currentDate.toISOString().split("T")[0];

    function goToPrevDay() {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 1);
        setCurrentDate(prev);
    }

    function goToNextDay() {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        setCurrentDate(next);
    }

    function goToToday() {
        setCurrentDate(new Date());
    }

    const enrichedJobs = SCHEDULE_JOBS.map(j => ({
        ...j,
        status: FLEET_STATUS_MAP[j.printerCode]?.status || j.status,
        location: FLEET_STATUS_MAP[j.printerCode]?.location || "Unknown",
    }));

    const filteredJobs = techFilter === "all" ? enrichedJobs : enrichedJobs.filter(j => j.tech === techFilter);
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
    }

    function getBarStyle(start, dur, color) {
        const colPct = 100 / TOTAL_COLS;
        const leftPct = start * colPct;
        const widthPct = dur * colPct;
        return {
            position: "absolute",
            top: 6, height: 30,
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            background: color,
            borderRadius: 4,
            display: "flex", alignItems: "center", paddingLeft: 6,
            fontSize: 10, fontWeight: 600,
            color: "#fff",
            zIndex: 2,
            overflow: "hidden",
        };
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
            <div className="card mb16">
                <div className="ch">
                    <span className="ct">Printing Schedule</span>
                    <div className="row" style={{ gap: 8 }}>
                        <div className="row" style={{ gap: 4 }}>
                            {["day", "week", "month"].map(v => (
                                <button key={v} className={`btn bts ${view === v ? "btp" : "btg"}`} style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => setView(v)}>
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </button>
                            ))}
                        </div>
                        <select className="fsel" style={{ fontSize: 11, padding: "4px 10px", width: 160 }} value={techFilter} onChange={e => setTechFilter(e.target.value)}>
                            <option value="all">All Technologies</option><option>FDM</option><option>SLA</option><option>SLS</option>
                        </select>
                    </div>
                </div>

                <div className="cb" style={{ padding: 0, overflowX: "auto" }}>
                    {/* ── Day view: 24-hour Gantt ── */}
                    {view === "day" && <>
                        {/* Legend + Navigation */}
                        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 14px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", fontSize: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button onClick={goToPrevDay} style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg2)", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronLeft size={20} strokeWidth={2.5} /></button>
                                <button onClick={goToToday} style={{ padding: "4px 12px", border: "1px solid var(--accent)", borderRadius: 4, background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><CalendarDays size={16} strokeWidth={2.5} /> Today</button>
                                <button onClick={goToNextDay} style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg2)", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronRight size={20} strokeWidth={2.5} /></button>
                                <input 
                                    type="date" 
                                    value={dateStr} 
                                    onChange={e => setCurrentDate(new Date(e.target.value))}
                                    style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }}
                                />
                            </div>
                            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ color: "var(--text3)" }}>Duration:</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--green)" }} /> 1-2h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#22c55e" }} /> 3-4h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6" }} /> 5-6h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#8b5cf6" }} /> 7-8h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} /> 9-10h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} /> 11-12h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#dc2626" }} /> 13-15h</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "#991b1b" }} /> 15h+</span>
                            </div>
                        </div>
                        {/* Date Header */}
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 900 }}>
                            <div style={{ width: 160, padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)", flexShrink: 0 }}>Printer</div>
                            <div style={{ display: "flex", flex: 1 }}>
                                <div style={{ flex: 1, padding: "8px 0", fontFamily: "var(--fd)", fontSize: 13, color: "var(--text)", textAlign: "center", borderRight: "1px solid var(--border)", fontWeight: 700 }}>{dateLabel}</div>
                            </div>
                        </div>
                        {/* Hour Headers */}
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg2)", minWidth: 900 }}>
                            <div style={{ width: 160, borderRight: "1px solid var(--border)", flexShrink: 0 }} />
                            <div style={{ display: "flex", flex: 1 }}>
                                {HOURS_LABELS.map((h, i) => (
                                    <div key={h} style={{ 
                                        flex: 1, 
                                        padding: "4px 0", 
                                        fontFamily: "var(--fm)", 
                                        fontSize: 8, 
                                        color: i === 0 ? "var(--accent)" : "var(--text3)", 
                                        textAlign: "center", 
                                        borderRight: i < HOURS_LABELS.length - 1 ? "1px solid var(--border)" : "none",
                                        fontWeight: i === 0 ? 700 : 400
                                    }}>{h}</div>
                                ))}
                            </div>
                        </div>
                        {/* Rows */}
                        {filteredJobs.map(row => {
                            const barColor = getDurationColor(row.dur);
                            const jobBar = getJobBarForDate(row, currentDate);
                            const isMaintenance = row.status === "maintenance";
                            return (
                                <div key={row.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: 44, position: "relative", minWidth: 900 }}>
                                    <div style={{ width: 160, padding: "8px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : isMaintenance ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                        <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                    </div>
                                    <div style={{ display: "flex", flex: 1, position: "relative" }}>
                                        {HOURS.map(h => (
                                            <div key={h} style={{ flex: 1, borderRight: h < TOTAL_COLS - 1 ? "1px solid var(--border)" : "none" }} />
                                        ))}
                                        {jobBar && (
                                            <div style={getBarStyle(jobBar.start, jobBar.dur, barColor)} onClick={() => setSelectedJob(row)}>
                                                <span style={{ marginRight: 6, cursor: "pointer" }}>{row.projectNo}</span>
                                                <span style={{ fontSize: 9, opacity: 0.85, background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}>{jobBar.dur}h</span>
                                            </div>
                                        )}
                                        {isMaintenance && !jobBar && (
                                            <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 30, background: "repeating-linear-gradient(45deg,rgba(184,134,11,.08),rgba(184,134,11,.08) 4px,transparent 4px,transparent 10px)", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 10, color: "var(--gold)", fontWeight: 600, gap: 6 }}>
                                                <Wrench size={16} strokeWidth={2.5} /> Maintenance
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredJobs.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>No printers match the selected filters.</div>}
                    </>}

                    {/* ── Week view ── */}
                    {view === "week" && <>
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 600 }}>
                            <div style={{ width: 160, padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)", flexShrink: 0 }}>Printer</div>
                            <div style={{ display: "flex", flex: 1 }}>
                                {WEEK_DAYS.map((d, i) => (
                                    <div key={d} style={{ flex: 1, padding: "8px 4px", fontFamily: "var(--fm)", fontSize: 9, color: d === "Wed 26" ? "var(--accent)" : "var(--text3)", textAlign: "center", fontWeight: d === "Wed 26" ? 700 : 400, borderRight: i < WEEK_DAYS.length - 1 ? "1px solid var(--border)" : "none" }}>{d}</div>
                                ))}
                            </div>
                        </div>
                        {filteredJobs.map(row => (
                            <div key={row.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: 44, minWidth: 600 }}>
                                <div style={{ width: 160, padding: "8px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : row.status === "maintenance" ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                </div>
                                {WEEK_DAYS.map((d, di) => (
                                    <div key={d} style={{ flex: 1, padding: 6, borderRight: di < WEEK_DAYS.length - 1 ? "1px solid var(--border)" : "none", background: d === "Wed 26" ? "rgba(37,99,235,.03)" : "transparent" }}>
                                        {row.job && di === 2 && (
                                            <div style={{ background: row.status === "printing" ? "var(--green)" : "var(--adim)", borderRadius: 4, padding: "3px 6px", fontSize: 9, fontWeight: 600, color: row.status === "printing" ? "#fff" : "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {row.job}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </>}

                    {/* ── Month view ── */}
                    {view === "month" && <>
                        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 500 }}>
                            <div style={{ width: 160, padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)", flexShrink: 0 }}>Printer</div>
                            <div style={{ display: "flex", flex: 1 }}>
                                {MONTH_WEEKS.map((w, i) => (
                                    <div key={w} style={{ flex: 1, padding: "8px 4px", fontFamily: "var(--fm)", fontSize: 9, color: "var(--text3)", textAlign: "center", borderRight: i < MONTH_WEEKS.length - 1 ? "1px solid var(--border)" : "none" }}>{w}</div>
                                ))}
                            </div>
                        </div>
                        {filteredJobs.map(row => (
                            <div key={row.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: 44, minWidth: 500 }}>
                                <div style={{ width: 160, padding: "8px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : row.status === "maintenance" ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                </div>
                                {MONTH_WEEKS.map((w, wi) => (
                                    <div key={w} style={{ flex: 1, padding: 6, borderRight: wi < MONTH_WEEKS.length - 1 ? "1px solid var(--border)" : "none" }}>
                                        {row.job && wi === 3 && (
                                            <div style={{ background: row.status === "printing" ? "var(--green)" : "var(--adim)", borderRadius: 4, padding: "3px 6px", fontSize: 9, fontWeight: 600, color: row.status === "printing" ? "#fff" : "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {row.job}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </>}
                </div>
            </div>

            {/* Job Confirmation */}
            <div className="g g21">
                <div className="card">
                    <div className="ch">
                        <span className="ct">Job Confirmation</span>
                        <span className="tiny">Select a printer to view its queue</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
                        {/* Printer list */}
                        <div style={{ borderRight: "1px solid var(--border)", padding: "8px 0" }}>
                            <div className="tiny" style={{ padding: "4px 14px", marginBottom: 4 }}>Active Printers ({activePrinters.length})</div>
                            {activePrinters.map(p => {
                                const pendingCount = getPendingCount(p.printerCode);
                                const isSelected = selPrinter === p.printerCode;
                                return (
                                    <div key={p.id} onClick={() => setSelPrinter(p.printerCode)} style={{ padding: "8px 14px", cursor: "pointer", background: isSelected ? "var(--bg3)" : "", borderLeft: `2px solid ${isSelected ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            {p.status === "printing" && <span className="pd g" style={{ flexShrink: 0 }} />}
                                            {p.status === "idle" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
                                            <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? "var(--text)" : "var(--text2)" }}>{p.printer}</span>
                                        </div>
                                        {pendingCount > 0 && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                <span className="blink-dot" />
                                                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)" }}>{pendingCount}</span>
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
                                            <div key={p.id} onClick={() => setSelPrinter(p.printerCode)} style={{ padding: "8px 14px", cursor: "pointer", background: isSelected ? "rgba(184,134,11,.08)" : "", borderLeft: `2px solid ${isSelected ? "var(--gold)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <Wrench size={14} strokeWidth={2.5} style={{ color: "var(--gold)", flexShrink: 0 }} />
                                                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSelected ? "var(--gold)" : "var(--text3)" }}>{p.printer}</span>
                                                </div>
                                                {pendingCount > 0 && (
                                                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <span className="blink-dot" />
                                                        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--gold)" }}>{pendingCount}</span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                        {/* Queue panel — filtered to selected printer */}
                        <div style={{ padding: 14 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <Printer size={20} strokeWidth={2.5} />
                                <span>{selPrinterData?.printer || selPrinter}</span>
                                <span className="tiny" style={{ marginLeft: 8, fontWeight: 400 }}>{selPrinterData?.tech}</span>
                                <span className="tiny" style={{ marginLeft: 8, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} strokeWidth={2.5} /> {selPrinterData?.location}</span>
                            </div>

                            {selPrinterData?.status === "maintenance" && (
                                <div style={{ background: "rgba(184,134,11,.08)", border: "1px solid rgba(184,134,11,.25)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                    <Wrench size={18} strokeWidth={2.5} style={{ color: "var(--gold)" }} />
                                    <span style={{ fontSize: 12, color: "var(--gold)" }}>This printer is currently under maintenance. No jobs can be assigned.</span>
                                </div>
                            )}

                            {pendingJobs.length > 0 && (
                                <div className="mb12">
                                    <div className="tiny mb8" style={{ color: "var(--yellow)", display: "flex", alignItems: "center", gap: 6 }}><AlertCircle size={16} strokeWidth={2.5} /> Pending Confirmation ({pendingJobs.length})</div>
                                    {pendingJobs.map(j => (
                                        <div key={j.id} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px", marginBottom: 8 }}>
                                            <div className="rowsb mb8">
                                                <div>
                                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{j.name}</div>
                                                    <div className="tiny">{j.code} · Starts: {j.start}</div>
                                                </div>
                                                <button className="btn btp bts" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 6 }} onClick={() => confirmJob(j.id)}><CheckCircle size={14} strokeWidth={2.5} /> Confirm</button>
                                            </div>
                                            <div className="row" style={{ gap: 10, alignItems: "center" }}>
                                                {j.imageUrl && (
                                                    <img src={j.imageUrl} alt={j.name} style={{ width: 48, height: 48, borderRadius: "var(--r2)", objectFit: "cover", border: "1px solid var(--border)" }} />
                                                )}
                                                {j.modelName && (
                                                    <div className="row" style={{ gap: 6, alignItems: "center" }}>
                                                        <span className="tiny" style={{ color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}><FileBox size={14} strokeWidth={2.5} /> {j.modelName}</span>
                                                        <button className="btn btg bts" style={{ fontSize: 9, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }} onClick={() => downloadModel(j.modelName)}><Download size={12} strokeWidth={2.5} /> Download</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {confirmedJobs.length > 0 ? <>
                                <div className="tiny mb8" style={{ color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}><CheckCircle size={16} strokeWidth={2.5} /> Confirmed Queue ({confirmedJobs.length})</div>
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
                                <div style={{ position: "relative", marginBottom: 16 }}>
                                    <img 
                                        src={selectedJob.imageUrl} 
                                        alt={selectedJob.job} 
                                        style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "var(--r2)", border: "1px solid var(--border)" }} 
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

