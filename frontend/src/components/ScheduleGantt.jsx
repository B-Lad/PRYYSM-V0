import React, { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Wrench } from 'lucide-react';

export const DAY_START = 0;
export const DAY_END = 24;
export const TOTAL_COLS = DAY_END - DAY_START;

export function getDurationColor(dur) {
    if (dur <= 2) return "var(--green)";
    if (dur <= 4) return "#22c55e";
    if (dur <= 6) return "#3b82f6";
    if (dur <= 8) return "#8b5cf6";
    if (dur <= 10) return "#f59e0b";
    if (dur <= 12) return "#ef4444";
    if (dur <= 15) return "#dc2626";
    return "#991b1b";
}

export function getJobsForDate(jobs, date) {
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

export function getJobBarForDate(job, date) {
    const jobBaseDate = job.startDate ? new Date(job.startDate) : new Date("2026-04-23");
    const jobStartDate = new Date(jobBaseDate);
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

export function ScheduleGantt({
    jobs,
    currentDate,
    onDateChange,
    view = "day",
    onViewChange,
    techFilter,
    onTechFilterChange,
    onJobClick,
    selectedPrinter,
    showDurationLegend = true,
    compact = false
}) {
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
        onDateChange(prev);
    }

    function goToNextDay() {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 1);
        onDateChange(next);
    }

    function goToToday() {
        onDateChange(new Date());
    }

    const filteredJobs = techFilter === "all" ? jobs : jobs.filter(j => j.tech === techFilter);

    function getBarStyle(start, dur) {
        const colPct = 100 / TOTAL_COLS;
        const leftPct = start * colPct;
        const widthPct = dur * colPct;
        return {
            position: "absolute",
            top: 6, height: compact ? 24 : 30,
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            borderRadius: 4,
            display: "flex", alignItems: "center", paddingLeft: 6,
            fontSize: compact ? 8 : 10, fontWeight: 600,
            color: "#fff",
            zIndex: 2,
            overflow: "hidden",
        };
    }

    return (
        <div className="card mb16">
            <div className="ch">
                <span className="ct">Printing Schedule</span>
                <div className="row" style={{ gap: 8 }}>
                    <div className="row" style={{ gap: 4 }}>
                        {["day", "week", "month"].map(v => (
                            <button key={v} className={`btn bts ${view === v ? "btp" : "btg"}`} style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => onViewChange(v)}>
                                {v.charAt(0).toUpperCase() + v.slice(1)}
                            </button>
                        ))}
                    </div>
                    <select className="fsel" style={{ fontSize: 11, padding: "4px 10px", width: 160 }} value={techFilter} onChange={e => onTechFilterChange(e.target.value)}>
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
                                onChange={e => onDateChange(new Date(e.target.value))}
                                style={{ padding: "4px 8px", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }}
                            />
                        </div>
                        {showDurationLegend && (
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
                        )}
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
                            <div key={row.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", minHeight: compact ? 38 : 44, position: "relative", minWidth: 900 }}>
                                <div style={{ width: 160, padding: "8px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : isMaintenance ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                </div>
                                <div style={{ display: "flex", flex: 1, position: "relative" }}>
                                    {HOURS.map(h => (
                                        <div key={h} style={{ flex: 1, borderRight: h < HOURS.length - 1 ? "1px solid var(--border)" : "none" }} />
                                    ))}
                                    {jobBar && (
                                        <div
                                            style={{ ...getBarStyle(jobBar.start, jobBar.dur), background: barColor }}
                                            onClick={() => onJobClick && onJobClick(row)}
                                        >
                                            {row.confirmed ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                    <span style={{ fontSize: 11 }}>✓✓</span>
                                                    <span style={{ marginRight: 6, cursor: "pointer" }}>{row.projectNo}</span>
                                                </span>
                                            ) : row.isAllotted ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                    <span style={{ fontSize: 11 }}>✓</span>
                                                    <span style={{ marginRight: 6, cursor: "pointer" }}>{row.projectNo}</span>
                                                </span>
                                            ) : (
                                                <span style={{ marginRight: 6, cursor: "pointer" }}>{row.projectNo}</span>
                                            )}
                                            <span style={{ fontSize: 9, opacity: 0.85, background: "rgba(0,0,0,0.25)", padding: "1px 5px", borderRadius: 3 }}>{jobBar.dur}h</span>
                                        </div>
                                    )}
                                    {isMaintenance && !jobBar && (
                                        <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: compact ? 24 : 30, background: "repeating-linear-gradient(45deg,rgba(184,134,11,.08),rgba(184,134,11,.08) 4px,transparent 4px,transparent 10px)", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 10, color: "var(--gold)", fontWeight: 600, gap: 6 }}>
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
    );
}
