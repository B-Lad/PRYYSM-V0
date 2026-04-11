import React, { useState, useEffect, useRef } from "react";
import { SCHEDULE_JOBS, CONFIRM_QUEUE } from '../data/seed.js';
import { TB, SB, Prog } from '../components/atoms.jsx';

export function PrintSchedule() {
    const [view, setView] = useState("day");
    const [selPrinter, setSelPrinter] = useState("PRUSA01");
    const [techFilter, setTechFilter] = useState("all");
    // queue state so confirm actions actually mutate the list
    const [queue, setQueue] = useState(CONFIRM_QUEUE);

    const HOURS = Array.from({ length: 17 }, (_, i) => i);
    const WEEK_DAYS = ["Mon 24", "Tue 25", "Wed 26", "Thu 27", "Fri 28", "Sat 29", "Sun 30"];
    const MONTH_WEEKS = ["Week 1 (Mar 1–7)", "Week 2 (Mar 8–14)", "Week 3 (Mar 15–21)", "Week 4 (Mar 22–28)", "Week 5 (Mar 29–31)"];

    const filteredJobs = techFilter === "all" ? SCHEDULE_JOBS : SCHEDULE_JOBS.filter(j => j.tech === techFilter);
    const stats = {
        printing: SCHEDULE_JOBS.filter(j => j.status === "printing").length,
        idle: SCHEDULE_JOBS.filter(j => j.status === "idle").length,
        maintenance: SCHEDULE_JOBS.filter(j => j.status === "maintenance").length,
        offline: 0,
    };

    // Queue filtered to the selected printer, derived from live queue state
    const selPrinterData = SCHEDULE_JOBS.find(p => p.printerCode === selPrinter);
    const selQueue = queue.filter(j => j.code.includes(selPrinter));
    const pendingJobs = selQueue.filter(j => j.status === "pending");
    const confirmedJobs = selQueue.filter(j => j.status === "confirmed");

    function confirmJob(id) {
        setQueue(prev => prev.map(j => j.id === id ? { ...j, status: "confirmed" } : j));
    }

    // Gantt bar: left offset and width both relative to the 17-column area only
    function barStyle(start, dur, status) {
        const colPct = 100 / 17;
        return {
            position: "absolute",
            top: 8, height: 28,
            left: `calc(160px + ${start * colPct}%)`,
            width: `${dur * colPct}%`,
            background: status === "printing" ? "var(--green)" : "var(--accent)",
            borderRadius: "var(--r)",
            display: "flex", alignItems: "center", paddingLeft: 8,
            fontSize: 10, fontWeight: 600,
            color: status === "printing" ? "#fff" : "#fff",
            zIndex: 2, cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap",
        };
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
                    {/* ── Day view: hourly Gantt ── */}
                    {view === "day" && <>
                        <div style={{ display: "grid", gridTemplateColumns: "160px repeat(17,1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 700 }}>
                            <div style={{ padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1.2px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)" }}>Printer</div>
                            {HOURS.map(h => (
                                <div key={h} style={{ padding: "8px 2px", fontFamily: "var(--fm)", fontSize: 9, color: "var(--text3)", textAlign: "center", borderRight: "1px solid var(--border)" }}>{String(h + 6).padStart(2,"0")}:00</div>
                            ))}
                        </div>
                        {filteredJobs.map(row => (
                            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "160px repeat(17,1fr)", borderBottom: "1px solid var(--border)", minHeight: 44, position: "relative", minWidth: 700 }}>
                                <div style={{ padding: "10px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : row.status === "maintenance" ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: row.status === "maintenance" ? "var(--yellow)" : "var(--text)" }}>{row.printer}</div>
                                </div>
                                {HOURS.map(h => (
                                    <div key={h} style={{ borderRight: "1px solid var(--border)", background: h === 4 ? "rgba(37,99,235,.03)" : "" }} />
                                ))}
                                {row.job && row.dur > 0 && (
                                    <div style={barStyle(row.start, row.dur, row.status)}>
                                        {row.job}
                                    </div>
                                )}
                                {row.status === "maintenance" && (
                                    <div style={{ position: "absolute", top: 8, height: 28, left: "160px", right: 0, background: "repeating-linear-gradient(45deg,rgba(184,134,11,.08),rgba(184,134,11,.08) 4px,transparent 4px,transparent 10px)", borderRadius: "var(--r)", display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 10, color: "var(--gold)", fontWeight: 600 }}>
                                        ⚙ Maintenance
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredJobs.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--text3)" }}>No printers match the selected technology filter.</div>}
                    </>}

                    {/* ── Week view ── */}
                    {view === "week" && <>
                        <div style={{ display: "grid", gridTemplateColumns: "160px repeat(7,1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 600 }}>
                            <div style={{ padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1.2px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)" }}>Printer</div>
                            {WEEK_DAYS.map(d => (
                                <div key={d} style={{ padding: "8px 4px", fontFamily: "var(--fm)", fontSize: 9, color: d.startsWith("Wed") ? "var(--accent)" : "var(--text3)", textAlign: "center", borderRight: "1px solid var(--border)", fontWeight: d.startsWith("Wed") ? 700 : 400 }}>{d}</div>
                            ))}
                        </div>
                        {filteredJobs.map(row => (
                            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "160px repeat(7,1fr)", borderBottom: "1px solid var(--border)", minHeight: 44, minWidth: 600 }}>
                                <div style={{ padding: "10px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : row.status === "maintenance" ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                </div>
                                {WEEK_DAYS.map((d, di) => (
                                    <div key={d} style={{ borderRight: "1px solid var(--border)", padding: 6, background: d.startsWith("Wed") ? "rgba(37,99,235,.03)" : "" }}>
                                        {row.job && di === 2 && (
                                            <div style={{ background: row.status === "printing" ? "var(--green)" : "var(--adim)", borderRadius: "var(--r)", padding: "3px 6px", fontSize: 9, fontWeight: 600, color: row.status === "printing" ? "#fff" : "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                        <div style={{ display: "grid", gridTemplateColumns: "160px repeat(5,1fr)", borderBottom: "1px solid var(--border)", background: "var(--bg3)", minWidth: 600 }}>
                            <div style={{ padding: "8px 14px", fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1.2px", color: "var(--text3)", textTransform: "uppercase", borderRight: "1px solid var(--border)" }}>Printer</div>
                            {MONTH_WEEKS.map(w => (
                                <div key={w} style={{ padding: "8px 4px", fontFamily: "var(--fm)", fontSize: 9, color: "var(--text3)", textAlign: "center", borderRight: "1px solid var(--border)" }}>{w}</div>
                            ))}
                        </div>
                        {filteredJobs.map(row => (
                            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "160px repeat(5,1fr)", borderBottom: "1px solid var(--border)", minHeight: 44, minWidth: 600 }}>
                                <div style={{ padding: "10px 14px", borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "printing" ? "var(--green)" : row.status === "maintenance" ? "var(--yellow)" : "var(--border2)", flexShrink: 0 }} />
                                    <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.printer}</div>
                                </div>
                                {MONTH_WEEKS.map((w, wi) => (
                                    <div key={w} style={{ borderRight: "1px solid var(--border)", padding: 6 }}>
                                        {row.job && wi === 3 && (
                                            <div style={{ background: row.status === "printing" ? "var(--green)" : "var(--adim)", borderRadius: "var(--r)", padding: "3px 6px", fontSize: 9, fontWeight: 600, color: row.status === "printing" ? "#fff" : "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr" }}>
                        {/* Printer list */}
                        <div style={{ borderRight: "1px solid var(--border)", padding: "8px 0" }}>
                            <div className="tiny" style={{ padding: "4px 14px", marginBottom: 4 }}>Active Printers ({SCHEDULE_JOBS.length})</div>
                            {SCHEDULE_JOBS.map(p => (
                                <div key={p.id} onClick={() => setSelPrinter(p.printerCode)} style={{ padding: "8px 14px", cursor: "pointer", background: selPrinter === p.printerCode ? "var(--bg3)" : "", borderLeft: `2px solid ${selPrinter === p.printerCode ? "var(--accent)" : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: selPrinter === p.printerCode ? "var(--text)" : "var(--text2)" }}>{p.printer}</span>
                                    {p.status === "printing" && <span className="pd g" style={{ flexShrink: 0 }} />}
                                    {p.status === "maintenance" && <span className="pd y" style={{ flexShrink: 0 }} />}
                                </div>
                            ))}
                        </div>
                        {/* Queue panel — filtered to selected printer */}
                        <div style={{ padding: 14 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                                {selPrinterData?.printer || selPrinter}
                                <span className="tiny" style={{ marginLeft: 8, fontWeight: 400 }}>{selPrinterData?.tech}</span>
                            </div>

                            {pendingJobs.length > 0 && (
                                <div className="mb12">
                                    <div className="tiny mb8" style={{ color: "var(--yellow)" }}>⚠ Pending Confirmation ({pendingJobs.length})</div>
                                    {pendingJobs.map(j => (
                                        <div key={j.id} className="rowsb mb8" style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px" }}>
                                            <div>
                                                <div style={{ fontSize: 12, fontWeight: 600 }}>{j.name}</div>
                                                <div className="tiny">{j.code} · Starts: {j.start}</div>
                                            </div>
                                            <button className="btn btp bts" style={{ fontSize: 10 }} onClick={() => confirmJob(j.id)}>↑ Confirm</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {confirmedJobs.length > 0 ? <>
                                <div className="tiny mb8" style={{ color: "var(--green)" }}>✓ Confirmed Queue ({confirmedJobs.length})</div>
                                {confirmedJobs.map(j => (
                                    <div key={j.id} className="mb6" style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "10px 12px" }}>
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
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   JOB ALLOTMENT
══════════════════════════════════════════════════════════════════ */
const ALLOT_QUEUE = [
