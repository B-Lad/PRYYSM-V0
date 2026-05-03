import React, { useState, useEffect, useRef } from "react";
import { TB, SB, Ring, Spark, Prog, AStrip, Modal, Tabs } from '../components/atoms.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { usePrinterFleet } from '../hooks/usePrinterFleet.js';

const FLEET_DATA = [
    {
        id: "PF01", name: "Prusa i3 MK3S+", code: "PRUSA01", model: "MK3S+", location: "Lab 1", type: "FDM", status: "printing", job: "Job 1 for PRUSA01", pct: 39, init: "2023-01-15",
        maintLog: [{ date: "2024-11-10", reason: "Extruder clog", notes: "Cleared blockage, test print passed", by: "Marco R.", result: "Resolved" }, { date: "2025-02-14", reason: "Belt tension", notes: "Re-tensioned X/Y belts", by: "Arjun S.", result: "Resolved" }]
    },
    { id: "PF02", name: "Creality Ender 3 Pro", code: "ENDER01", model: "Ender 3 Pro", location: "Lab 2", type: "FDM", status: "idle", job: null, pct: 0, init: "2022-03-22", maintLog: [] },
    {
        id: "PF03", name: "Ultimaker S5", code: "ULT01", model: "S5", location: "Design Studio", type: "FDM", status: "printing", job: "Job 1 for ULT01", pct: 42, init: "2022-10-05",
        maintLog: [{ date: "2025-01-08", reason: "Printhead replacement", notes: "Replaced printhead AA 0.4", by: "Lena K.", result: "Resolved" }]
    },
    {
        id: "PF04", name: "Anycubic Mega X", code: "ANYC01", model: "Mega X", location: "Workshop", type: "FDM", status: "maintenance", job: null, pct: 0, init: "2021-06-01",
        maintLog: [{ date: "2025-03-15", reason: "Bed levelling failure", notes: "Auto-levelling sensor replaced", by: "Marco R.", result: "In Progress" }, { date: "2024-08-20", reason: "Z-axis binding", notes: "Lubricated lead screw", by: "Arjun S.", result: "Resolved" }]
    },
    { id: "PF05", name: "Bambu Lab A1 mini", code: "BAMB01", model: "A1 mini", location: "Lab 3", type: "FDM", status: "idle", job: null, pct: 0, init: "2023-09-18", maintLog: [] },
    { id: "PF06", name: "Prusa MINI+", code: "PRUSA02", model: "MINI+", location: "Lab 1", type: "FDM", status: "idle", job: null, pct: 0, init: "2023-09-30", maintLog: [] },
    { id: "PF07", name: "EOS Formiga P 110", code: "EOS01", model: "P 110", location: "Lab 2", type: "SLS", status: "idle", job: null, pct: 0, init: "2023-11-01", maintLog: [] },
    {
        id: "PF08", name: "HP Jet Fusion 5200", code: "HPJF01", model: "5200", location: "Prototyping Center", type: "SLS", status: "maintenance", job: null, pct: 0, init: "2023-07-15",
        maintLog: [{ date: "2025-03-10", reason: "Powder feed system", notes: "Cleaning powder paths and valves", by: "Yuki T.", result: "In Progress" }]
    },
    { id: "PF09", name: "Creality K1", code: "CREA02", model: "K1", location: "Lab 1", type: "FDM", status: "offline", job: null, pct: 0, init: "2024-01-20", maintLog: [] },
    { id: "PF10", name: "Formlabs Fuse 1", code: "FUSE01", model: "Fuse 1", location: "SLS Room", type: "SLS", status: "idle", job: null, pct: 0, init: "2023-12-19", maintLog: [] },
    { id: "PF11", name: "Raise3D Pro3", code: "RAISE01", model: "Pro3", location: "Lab 0", type: "FDM", status: "offline", job: null, pct: 0, init: "2022-12-12", maintLog: [] },
    { id: "PF12", name: "Anycubic Photon M3", code: "ANYC02", model: "Photon M3", location: "Design Studio", type: "SLA", status: "idle", job: null, pct: 0, init: "2024-03-31", maintLog: [] },
];

const MAINT_REASONS = ["Extruder / Nozzle Clog", "Bed Levelling Issue", "Belt Tension", "Z-axis Binding", "Printhead Replacement", "Sensor Failure", "Firmware Update", "Powder Feed System", "Resin Vat Cleaning", "Routine Inspection", "Other"];

export function PrinterDetailPanel({ dp, CYCLE, SC, SB, SL, age, onClose, onMaint, onResolve, onReset, onEdit }) {
    const a = age(dp);
    const infoCards = [
        { l: "Location", v: dp.location, mono: false },
        { l: "Technology", v: dp.type, mono: false },
        { l: "Initialized", v: dp.init, mono: false },
        { l: "Age (days)", v: a, mono: false, color: a >= CYCLE ? "var(--red)" : a > 200 ? "var(--gold)" : "var(--green)" },
        { l: "Code", v: dp.code, mono: true },
        { l: "Maint. Records", v: (dp.maintLog || []).length + " entries", mono: false, color: (dp.maintLog || []).length > 0 ? "var(--gold)" : "var(--text2)" },
    ];
    return (
        <div className="mback" style={{ zIndex: 1000 }} onClick={onClose}>
            <div className="mod wide" style={{ width: 680, maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: "18px 24px 0", flexShrink: 0 }}>
                    <div className="rowsb mb4">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 5, height: 28, borderRadius: 3, background: SC[dp.status], flexShrink: 0 }} />
                            <div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 17, fontWeight: 800 }}>{dp.name}</div>
                                <div className="tiny mt2" style={{ color: "var(--text3)" }}>{dp.model} · {dp.code} · {dp.location}</div>
                            </div>
                        </div>
                        <button className="mclose" onClick={onClose}>×</button>
                    </div>
                    <div className="row" style={{ gap: 6, marginTop: 12, marginBottom: 16 }}>
                        <span className={`b ${SB[dp.status]}`}>{SL[dp.status]}</span>
                        <span className={`b b${dp.type.toLowerCase()}`}>{dp.type}</span>
                        {a >= CYCLE && <span className="b berr" style={{ fontSize: 9 }}>⚠ Due for Replacement</span>}
                    </div>
                    <div style={{ height: 1, background: "var(--border)" }} />
                </div>
                {/* Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
                    {/* Info cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {infoCards.map(card => (
                            <div key={card.l} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", minHeight: 68, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                <div style={{ fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase", color: "var(--text3)", marginBottom: 6 }}>{card.l}</div>
                                <div style={{ fontFamily: card.mono ? "var(--fm)" : "var(--fd)", fontSize: card.mono ? 11 : 14, fontWeight: card.mono ? 500 : 700, color: card.color || "var(--text)", background: card.mono ? "var(--bg4)" : undefined, padding: card.mono ? "3px 7px" : undefined, borderRadius: card.mono ? 3 : undefined, display: card.mono ? "inline-block" : undefined }}>{card.v}</div>
                            </div>
                        ))}
                    </div>
                    {/* Active job */}
                    {dp.status === "printing" && dp.job && (
                        <div style={{ background: "rgba(15,155,106,.06)", border: "1px solid rgba(15,155,106,.2)", borderRadius: "var(--r2)", padding: "12px 16px", marginBottom: 16 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>● Currently Printing</div>
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{dp.job}</div>
                            <Prog pct={dp.pct} color="green" h={7} />
                            <div className="rowsb mt6"><span className="tiny">{dp.pct}% complete</span><span className="tiny" style={{ color: "var(--green)" }}>In progress</span></div>
                        </div>
                    )}
                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                        {dp.status !== "printing" && dp.status !== "maintenance" && (
                            <button className="btn btg bts" style={{ fontSize: 11 }} onClick={onMaint}>⟳ Set Maintenance</button>
                        )}
                        {dp.status === "maintenance" && (
                            <button className="btn bts" style={{ fontSize: 11, background: "rgba(15,155,106,.08)", color: "var(--green)", border: "1px solid rgba(15,155,106,.25)" }} onClick={onResolve}>✓ Resolve &amp; Set Idle</button>
                        )}
                        {dp.status === "offline" && (
                            <button className="btn bts" style={{ fontSize: 11, background: "rgba(15,155,106,.08)", color: "var(--green)", border: "1px solid rgba(15,155,106,.25)" }} onClick={onReset}>▷ Reset to Idle</button>
                        )}
                        <button className="btn btg bts" style={{ fontSize: 11, marginLeft: "auto" }} onClick={onEdit}>✎ Edit Info</button>
                    </div>
                    {/* History */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>Maintenance &amp; Test History</div>
                        <span className="tiny">{(dp.maintLog || []).length} record{(dp.maintLog || []).length !== 1 ? "s" : ""}</span>
                    </div>
                    {(dp.maintLog || []).length === 0 ? (
                        <div style={{ textAlign: "center", padding: 28, color: "var(--text3)", fontSize: 12, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px dashed var(--border2)" }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>No maintenance records yet.
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(dp.maintLog || []).map((entry, i) => {
                                const ac = entry.result === "Resolved" || entry.result === "Pass" ? "var(--green)" : entry.result === "Fail" ? "var(--red)" : entry.result === "In Progress" ? "var(--gold)" : "var(--accent)";
                                const rb = entry.result === "Resolved" || entry.result === "Pass" ? "brun" : entry.result === "Fail" ? "berr" : "bwait";
                                return (
                                    <div key={i} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", borderLeft: `3px solid ${ac}` }}>
                                        <div style={{ padding: "12px 14px" }}>
                                            <div className="rowsb mb6">
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ fontSize: 11, fontFamily: "var(--fd)", fontWeight: 700 }}>{entry.reason}</span>
                                                    <span className={`b ${rb}`} style={{ fontSize: 9 }}>{entry.result}</span>
                                                </div>
                                                <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{entry.date}</span>
                                            </div>
                                            {entry.notes && <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, lineHeight: 1.5 }}>{entry.notes}</div>}
                                            {entry.by && <div className="tiny" style={{ color: "var(--text3)" }}>By: <span style={{ color: "var(--text2)", fontWeight: 500 }}>{entry.by}</span></div>}
                                            {entry.resolveNotes && (
                                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                                                    <div className="tiny mb2" style={{ color: "var(--green)" }}>✓ Resolution</div>
                                                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{entry.resolveNotes}</div>
                                                    {entry.resolvedBy && <div className="tiny mt2">By: <span style={{ fontWeight: 500 }}>{entry.resolvedBy}</span> · {entry.resolvedDate}</div>}
                                                </div>
                                            )}
                                            {entry.result === "In Progress" && dp.status === "maintenance" && (
                                                <button className="btn bts" style={{ marginTop: 8, fontSize: 10, background: "rgba(15,155,106,.08)", color: "var(--green)", border: "1px solid rgba(15,155,106,.25)" }} onClick={onResolve}>✓ Mark as Resolved</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PrinterFleet() {
    const isDemo = useDemoMode();
    const { printers: sharedPrinters, setPrinters: setSharedPrinters } = usePrinterFleet();
    const [tab, setTab] = useState("fleet");
    const [techFilter, setTechFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [printers, setPrinters] = useState(() => isDemo ? FLEET_DATA : (sharedPrinters.length > 0 ? sharedPrinters : []));
    const [showAdd, setShowAdd] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(null);
    const [confirmRemove2, setConfirmRemove2] = useState(null);
    const [maintModal, setMaintModal] = useState(null);    // printer being put into maint
    const [maintForm, setMaintForm] = useState({ reason: "", notes: "", by: "" });
    const [detailPrinter, setDetailPrinter] = useState(null); // printer detail panel
    const [testModal, setTestModal] = useState(null);      // kept for internal use
    const [testForm, setTestForm] = useState({ result: "Pass", notes: "", by: "" });
    const [resolveModal, setResolveModal] = useState(null);
    const [editPrinterModal, setEditPrinterModal] = useState(null);
    const [resolveForm, setResolveForm] = useState({ res: "Resolved", notes: "", by: "" });
    const [form, setForm] = useState({ name: "", model: "", code: "", location: "Lab 1", type: "FDM", capacity: "Standard", material: "PLA", init: new Date().toISOString().split("T")[0] });
    const sf = k => v => setForm(p => ({ ...p, [k]: v }));

    const CYCLE = 365;
    const today = new Date("2026-03-19");
    const todayStr = today.toISOString().split("T")[0];
    const age = p => { const d = new Date(p.init); return Math.round((today - d) / (1000 * 60 * 60 * 24)); };

    const filtered = printers.filter(p => {
        if (techFilter !== "all" && p.type !== techFilter) return false;
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        return true;
    });

    const SC = { printing: "var(--green)", idle: "var(--accent)", maintenance: "var(--gold)", offline: "var(--red)" };
    const SB = { printing: "brun", idle: "bsched", maintenance: "bwait", offline: "berr" };
    const SL = { printing: "Printing", idle: "Idle", maintenance: "Maintenance", offline: "Offline" };

    const stats = { total: printers.length, printing: printers.filter(p => p.status === "printing").length, idle: printers.filter(p => p.status === "idle").length, maintenance: printers.filter(p => p.status === "maintenance").length, offline: printers.filter(p => p.status === "offline").length };

    function addPrinter() {
        const np = { id: "PF" + (printers.length + 10), name: form.name, code: form.code, model: form.model, location: form.location, type: form.type, status: "idle", job: null, pct: 0, init: form.init, maintLog: [] };
        setPrinters(p => [...p, np]);
        if (!isDemo) setSharedPrinters(p => [...p, np]);
        setShowAdd(false);
        setForm({ name: "", model: "", code: "", location: "Lab 1", type: "FDM", capacity: "Standard", material: "PLA", init: new Date().toISOString().split("T")[0] });
    }

    function confirmMaintenance() {
        const entry = { date: todayStr, reason: maintForm.reason || "Routine Inspection", notes: maintForm.notes, by: maintForm.by || "Operator", result: "In Progress" };
        setPrinters(p => p.map(x => x.id === maintModal.id ? { ...x, status: "maintenance", maintLog: [entry, ...(x.maintLog || [])] } : x));
        // update detail panel if open
        if (detailPrinter?.id === maintModal.id) setDetailPrinter(prev => ({ ...prev, status: "maintenance", maintLog: [entry, ...(prev.maintLog || [])] }));
        setMaintModal(null); setMaintForm({ reason: "", notes: "", by: "" });
    }

    function saveEditPrinter(updated) {
        setPrinters(p => p.map(x => x.id === updated.id ? { ...x, ...updated } : x));
        if (detailPrinter?.id === updated.id) setDetailPrinter(prev => ({ ...prev, ...updated }));
        setEditPrinterModal(null);
    }

    function resetPrinter(id) {
        // For offline printers — direct reset. For maintenance — use resolveModal
        setPrinters(p => p.map(x => x.id === id ? { ...x, status: "idle", job: null, pct: 0 } : x));
        if (detailPrinter?.id === id) setDetailPrinter(prev => ({ ...prev, status: "idle", job: null, pct: 0 }));
    }

    function confirmResolve(printer, resolution, notes, by) {
        // Mark latest In Progress log entry as Resolved, then set idle
        setPrinters(p => p.map(x => {
            if (x.id !== printer.id) return x;
            const log = [...(x.maintLog || [])];
            const idx = log.findIndex(e => e.result === "In Progress");
            if (idx >= 0) log[idx] = { ...log[idx], result: resolution, resolveNotes: notes, resolvedBy: by, resolvedDate: todayStr };
            return { ...x, status: "idle", job: null, pct: 0, maintLog: log };
        }));
        if (detailPrinter?.id === printer.id) {
            setDetailPrinter(prev => {
                const log = [...(prev.maintLog || [])];
                const idx = log.findIndex(e => e.result === "In Progress");
                if (idx >= 0) log[idx] = { ...log[idx], result: resolution, resolveNotes: notes, resolvedBy: by, resolvedDate: todayStr };
                return { ...prev, status: "idle", job: null, pct: 0, maintLog: log };
            });
        }
        setResolveModal(null);
    }

    function addTestLog() {
        const entry = { date: todayStr, reason: "Test Print", notes: testForm.notes, by: testForm.by || "Operator", result: testForm.result };
        setPrinters(p => p.map(x => x.id === testModal.id ? { ...x, maintLog: [entry, ...(x.maintLog || [])] } : x));
        if (detailPrinter?.id === testModal.id) setDetailPrinter(prev => ({ ...prev, maintLog: [entry, ...(prev.maintLog || [])] }));
        setTestModal(null); setTestForm({ result: "Pass", notes: "", by: "" });
    }

    function setOffline(id) { setPrinters(p => p.map(x => x.id === id ? { ...x, status: "offline" } : x)); }
    function doRemove(id) { setPrinters(p => p.filter(x => x.id !== id)); setConfirmRemove2(null); if (detailPrinter?.id === id) setDetailPrinter(null); }

    // sync detail panel when printers update
    const dueReplace = printers.filter(p => age(p) >= CYCLE).sort((a, b) => age(b) - age(a));

    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Printer Fleet</h1></div>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                {[{ id: "fleet", label: "Manage Fleet" }, { id: "replace", label: "Replacement Analysis" }].map(t =>
                    <button key={t.id} className={`tab ${tab === t.id ? "act" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
                )}
            </div>

            {tab === "fleet" && (
                <div>
                    {/* KPI strip */}
                    <div className="g g4 mb16" style={{ gap: 10 }}>
                        {[
                            { l: "Total Printers", v: stats.total, c: "cc" },
                            { l: "Printing", v: stats.printing, c: "cg" },
                            { l: "Maintenance", v: stats.maintenance, c: "cy" },
                            { l: "Offline", v: stats.offline, c: "cr" },
                        ].map(k => (
                            <div key={k.l} className={`kpi ${k.c}`} style={{ padding: "12px 16px" }}>
                                <div className="kl">{k.l}</div>
                                <div className="kv" style={{ fontSize: 26 }}>{k.v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters + Add */}
                    <div className="rowsb mb14" style={{ flexWrap: "wrap", gap: 10 }}>
                        {/* Tech filter buttons */}
                        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                            <span className="tiny" style={{ marginRight: 4 }}>Technology:</span>
                            {["all", "FDM", "SLA", "SLS"].map(t => (
                                <button key={t} onClick={() => setTechFilter(t)} style={{
                                    padding: "5px 14px", borderRadius: 20, border: "1.5px solid", fontSize: 11, fontFamily: "var(--fm)", cursor: "pointer", transition: "all .12s",
                                    background: techFilter === t ? (t === "FDM" ? "var(--accent)" : t === "SLA" ? "var(--purple)" : t === "SLS" ? "var(--gold)" : "var(--text)") : "transparent",
                                    color: techFilter === t ? "#fff" : "var(--text2)",
                                    borderColor: techFilter === t ? (t === "FDM" ? "var(--accent)" : t === "SLA" ? "var(--purple)" : t === "SLS" ? "var(--gold)" : "var(--border3)") : "var(--border2)"
                                }}>
                                    {t === "all" ? "All" : t}
                                </button>
                            ))}
                            <div style={{ width: 1, height: 20, background: "var(--border2)", margin: "0 4px" }} />
                            <span className="tiny" style={{ marginRight: 4 }}>Status:</span>
                            {["all", "printing", "idle", "maintenance", "offline"].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)} style={{
                                    padding: "5px 12px", borderRadius: 20, border: "1.5px solid", fontSize: 11, fontFamily: "var(--fm)", cursor: "pointer", transition: "all .12s",
                                    background: statusFilter === s ? "var(--bg4)" : "transparent",
                                    color: statusFilter === s ? "var(--text)" : "var(--text3)",
                                    borderColor: statusFilter === s ? "var(--border3)" : "var(--border)"
                                }}>
                                    {s === "all" ? "All" : SL[s]}
                                </button>
                            ))}
                        </div>
                        <button className="btn btp bts" onClick={() => setShowAdd(true)}>⊕ Add Printer</button>
                    </div>

                    {/* Fleet count */}
                    <div className="tiny mb12" style={{ color: "var(--text3)" }}>
                        Showing <span style={{ fontWeight: 600, color: "var(--text)" }}>{filtered.length}</span> of {printers.length} printers
                        {(techFilter !== "all" || statusFilter !== "all") && <span> — filtered</span>}
                    </div>

                    {/* Printer grid */}
                    <div className="g g4" style={{ gap: 12 }}>
                        {filtered.map(p => {
                            const isRunning = p.status === "printing";
                            const isConfirmPending = confirmRemove === p.id;
                            const livePrinter = printers.find(x => x.id === p.id) || p;
                            return (
                                <div key={p.id} style={{ background: "var(--bg2)", border: `1px solid ${isRunning ? "rgba(15,155,106,.25)" : "var(--border)"}`, borderRadius: "var(--r3)", overflow: "hidden", boxShadow: "var(--shadow)", transition: "box-shadow .15s", cursor: "pointer" }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow2)"}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = "var(--shadow)"}>
                                    {/* Status bar */}
                                    <div style={{ height: 4, background: SC[p.status] || "var(--border2)" }} />

                                    {/* Card body — click opens detail */}
                                    <div style={{ padding: "14px 16px" }} onClick={() => setDetailPrinter(livePrinter)}>
                                        <div className="rowsb mb8">
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                                                <div className="tiny mt2">{p.model}</div>
                                            </div>
                                            <span className={`b ${SB[p.status] || "bidle"}`} style={{ fontSize: 9, marginLeft: 8, flexShrink: 0 }}>{SL[p.status] || p.status}</span>
                                        </div>
                                        <div className="row mb10" style={{ gap: 6, flexWrap: "wrap" }}>
                                            <span className={`b b${p.type.toLowerCase()}`} style={{ fontSize: 9 }}>{p.type}</span>
                                            <span className="tiny">📍 {p.location}</span>
                                        </div>
                                        {isRunning && p.job && (
                                            <div style={{ background: "rgba(15,155,106,.06)", border: "1px solid rgba(15,155,106,.2)", borderRadius: "var(--r)", padding: "8px 10px", marginBottom: 10 }}>
                                                <div className="tiny mb4" style={{ color: "var(--green)", fontWeight: 600 }}>● {p.job}</div>
                                                <Prog pct={p.pct} color="green" h={5} />
                                                <div className="tiny mt4" style={{ color: "var(--text2)" }}>{p.pct}% complete</div>
                                            </div>
                                        )}
                                        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginBottom: 10 }}>
                                            <div className="rowsb">
                                                <span className="tiny">Code</span>
                                                <span className="mono" style={{ fontSize: 10, background: "var(--bg4)", padding: "1px 6px", borderRadius: 3 }}>{p.code}</span>
                                            </div>
                                            <div className="rowsb mt4">
                                                <span className="tiny">Added</span>
                                                <span className="tiny" style={{ color: "var(--text2)" }}>{p.init}</span>
                                            </div>
                                            {(p.maintLog || []).length > 0 && <div className="rowsb mt4"><span className="tiny">Maint. records</span><span className="tiny" style={{ color: "var(--gold)" }}>{(p.maintLog || []).length} entries</span></div>}
                                        </div>
                                    </div>

                                    {/* Actions — stop propagation so click on card doesn't open detail */}
                                    <div style={{ padding: "0 16px 14px" }} onClick={e => e.stopPropagation()}>
                                        {isRunning ? (
                                            <div style={{ background: "rgba(15,155,106,.05)", border: "1px solid rgba(15,155,106,.15)", borderRadius: "var(--r)", padding: "6px 10px", textAlign: "center" }}>
                                                <span style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--fm)" }}>● Active — no actions available</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                <div className="row" style={{ gap: 6 }}>
                                                    {p.status !== "maintenance" && (
                                                        <button className="btn btg bts" style={{ flex: 1, justifyContent: "center", fontSize: 10 }} onClick={() => { setMaintModal(p); setMaintForm({ reason: "", notes: "", by: "" }); }}>⟳ Maintenance</button>
                                                    )}
                                                    {p.status !== "offline" && (
                                                        <button className="btn btg bts" style={{ flex: 1, justifyContent: "center", fontSize: 10 }} onClick={() => setOffline(p.id)}>⏻ Set Offline</button>
                                                    )}
                                                    {p.status === "maintenance" && (
                                                        <button className="btn bts" style={{ flex: 1, justifyContent: "center", fontSize: 10, background: "rgba(15,155,106,.08)", color: "var(--green)", border: "1px solid rgba(15,155,106,.25)" }} onClick={() => { setResolveForm({ res: "Resolved", notes: "", by: "" }); setResolveModal(p); }}>✓ Resolve &amp; Idle</button>
                                                    )}
                                                    {p.status === "offline" && (
                                                        <button className="btn bts" style={{ flex: 1, justifyContent: "center", fontSize: 10, background: "rgba(15,155,106,.08)", color: "var(--green)", border: "1px solid rgba(15,155,106,.25)" }} onClick={() => resetPrinter(p.id)}>▷ Set Idle</button>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn bts"
                                                    style={{ width: "100%", justifyContent: "center", fontSize: 10, background: isConfirmPending ? "var(--rdim)" : "transparent", color: isConfirmPending ? "var(--red)" : "var(--text3)", border: `1px solid ${isConfirmPending ? "rgba(220,38,38,.35)" : "var(--border)"}`, transition: "all .15s" }}
                                                    onClick={() => { if (isConfirmPending) { setConfirmRemove2(p); setConfirmRemove(null); } else { setConfirmRemove(p.id); } }}
                                                    onBlur={() => setTimeout(() => setConfirmRemove(null), 200)}>
                                                    {isConfirmPending ? "⚠ Confirm Remove?" : "⊖ Remove Printer"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: "var(--text3)" }}>No printers match the selected filters.</div>
                        )}
                    </div>

                    {/* ── Maintenance Reason Modal ── */}
                    {maintModal && (
                        <Modal title={`Set Maintenance — ${maintModal.name}`} onClose={() => setMaintModal(null)} zIndex={1200} footer={(
                            <><button className="btn btg bts" onClick={() => setMaintModal(null)}>Cancel</button>
                                <button className="btn btp bts" onClick={confirmMaintenance} disabled={!maintForm.reason}>Confirm Maintenance</button></>
                        )}>
                            <div style={{ background: "var(--ydim)", border: "1px solid rgba(184,134,11,.25)", borderRadius: "var(--r2)", padding: "10px 14px", marginBottom: 14, fontSize: 11, color: "var(--gold)" }}>
                                ⚠ This will lock the printer from new jobs until reset to Idle.
                            </div>
                            <div className="mb12">
                                <label className="fl">Reason for Maintenance *</label>
                                <select className="fsel" value={maintForm.reason} onChange={e => setMaintForm(p => ({ ...p, reason: e.target.value }))}>
                                    <option value="">Select reason…</option>
                                    {MAINT_REASONS.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="mb12">
                                <label className="fl">Notes / Details</label>
                                <textarea className="fta" style={{ minHeight: 80 }} placeholder="Describe the issue or work to be done…" value={maintForm.notes} onChange={e => setMaintForm(p => ({ ...p, notes: e.target.value }))}></textarea>
                            </div>
                            <div className="mb12">
                                <label className="fl">Technician / Operator</label>
                                <input className="fi" placeholder="Full name" value={maintForm.by} onChange={e => setMaintForm(p => ({ ...p, by: e.target.value }))} />
                            </div>
                        </Modal>
                    )}
                    {detailPrinter && <PrinterDetailPanel dp={printers.find(x => x.id === detailPrinter.id) || detailPrinter} CYCLE={CYCLE} SC={SC} SB={SB} SL={SL} age={age} onClose={() => setDetailPrinter(null)} onMaint={() => { const dp = printers.find(x => x.id === detailPrinter.id) || detailPrinter; setMaintModal(dp); setMaintForm({ reason: "", notes: "", by: "" }); }} onResolve={() => { const dp = printers.find(x => x.id === detailPrinter.id) || detailPrinter; setResolveForm({ res: "Resolved", notes: "", by: "" }); setResolveModal(dp); }} onReset={() => resetPrinter(detailPrinter.id)} onEdit={() => { const dp = printers.find(x => x.id === detailPrinter.id) || detailPrinter; setEditPrinterModal({ ...dp }); }} />}

                    {/* ── Test Log Modal ── */}
                    {testModal && (
                        <Modal title={`Add Test Log — ${testModal.name}`} onClose={() => setTestModal(null)} footer={(
                            <><button className="btn btg bts" onClick={() => setTestModal(null)}>Cancel</button>
                                <button className="btn btp bts" onClick={addTestLog}>Save Test Log</button></>
                        )}>
                            <div className="mb12">
                                <label className="fl">Test Result</label>
                                <div className="row" style={{ gap: 8 }}>
                                    {["Pass", "Fail", "Partial"].map(r => (
                                        <button key={r} onClick={() => setTestForm(p => ({ ...p, result: r }))} style={{ flex: 1, padding: "7px 0", borderRadius: "var(--r)", border: `1.5px solid ${testForm.result === r ? (r === "Pass" ? "var(--green)" : r === "Fail" ? "var(--red)" : "var(--gold)") : "var(--border2)"}`, background: testForm.result === r ? (r === "Pass" ? "rgba(15,155,106,.08)" : r === "Fail" ? "var(--rdim)" : "var(--ydim)") : "transparent", color: testForm.result === r ? (r === "Pass" ? "var(--green)" : r === "Fail" ? "var(--red)" : "var(--gold)") : "var(--text2)", fontWeight: testForm.result === r ? 600 : 400, fontSize: 12, cursor: "pointer", transition: "all .12s" }}>
                                            {r === "Pass" ? "✓ Pass" : r === "Fail" ? "✕ Fail" : "~ Partial"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb12">
                                <label className="fl">Notes</label>
                                <textarea className="fta" style={{ minHeight: 80 }} placeholder="Describe what was tested and observations…" value={testForm.notes} onChange={e => setTestForm(p => ({ ...p, notes: e.target.value }))}></textarea>
                            </div>
                            <div>
                                <label className="fl">Technician / Operator</label>
                                <input className="fi" placeholder="Full name" value={testForm.by} onChange={e => setTestForm(p => ({ ...p, by: e.target.value }))} />
                            </div>
                        </Modal>
                    )}

                    {/* ── Resolve Maintenance Modal ── */}
                    {resolveModal && (
                        <Modal title={`Resolve Maintenance — ${resolveModal.name}`} onClose={() => setResolveModal(null)} zIndex={1200} footer={(
                            <><button className="btn btg bts" onClick={() => setResolveModal(null)}>Cancel</button>
                                <button className="btn btp bts" onClick={() => confirmResolve(resolveModal, resolveForm.res, resolveForm.notes, resolveForm.by)}>✓ Confirm &amp; Set Idle</button></>
                        )}>
                            <div style={{ background: "rgba(184,134,11,.06)", border: "1px solid rgba(184,134,11,.2)", borderRadius: "var(--r2)", padding: "10px 14px", marginBottom: 14, fontSize: 11, color: "var(--gold)" }}>
                                ⟳ Before returning this printer to Idle, please confirm the issue has been addressed.
                            </div>
                            <div className="mb12">
                                <label className="fl">Was the issue resolved?</label>
                                <div className="row" style={{ gap: 8 }}>
                                    {["Resolved", "Partially Resolved", "Not Resolved — Escalate"].map(r => (
                                        <button key={r} onClick={() => setResolveForm(p => ({ ...p, res: r }))} style={{ flex: 1, padding: "7px 4px", borderRadius: "var(--r)", border: `1.5px solid ${resolveForm.res === r ? (r === "Resolved" ? "var(--green)" : r.includes("Not") ? "var(--red)" : "var(--gold)") : "var(--border2)"}`, background: resolveForm.res === r ? (r === "Resolved" ? "rgba(15,155,106,.08)" : r.includes("Not") ? "var(--rdim)" : "var(--ydim)") : "transparent", color: resolveForm.res === r ? (r === "Resolved" ? "var(--green)" : r.includes("Not") ? "var(--red)" : "var(--gold)") : "var(--text2)", fontWeight: resolveForm.res === r ? 600 : 400, fontSize: 10, cursor: "pointer", transition: "all .12s", textAlign: "center" }}>
                                            {r === "Resolved" ? "✓ Resolved" : r === "Partially Resolved" ? "~ Partial" : "✕ Escalate"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="mb12">
                                <label className="fl">Resolution Notes</label>
                                <textarea className="fta" style={{ minHeight: 80 }} placeholder="Describe what was done to fix the issue…" value={resolveForm.notes} onChange={e => setResolveForm(p => ({ ...p, notes: e.target.value }))}></textarea>
                            </div>
                            <div>
                                <label className="fl">Resolved By</label>
                                <input className="fi" placeholder="Technician name" value={resolveForm.by} onChange={e => setResolveForm(p => ({ ...p, by: e.target.value }))} />
                            </div>
                        </Modal>
                    )}

                    {/* ── Edit Printer Modal ── */}
                    {editPrinterModal && (
                        <Modal title={`Edit Printer — ${editPrinterModal.name}`} onClose={() => setEditPrinterModal(null)} zIndex={1200} footer={(
                            <><button className="btn btg bts" onClick={() => setEditPrinterModal(null)}>Cancel</button>
                                <button className="btn btp bts" onClick={() => saveEditPrinter(editPrinterModal)}>Save Changes</button></>
                        )}>
                            <div className="frow">
                                <div className="fg"><label className="fl">Printer Name</label><input className="fi" value={editPrinterModal.name} onChange={e => setEditPrinterModal(p => ({ ...p, name: e.target.value }))} /></div>
                                <div className="fg"><label className="fl">Model</label><input className="fi" value={editPrinterModal.model || ""} onChange={e => setEditPrinterModal(p => ({ ...p, model: e.target.value }))} /></div>
                            </div>
                            <div className="frow">
                                <div className="fg"><label className="fl">Code</label><input className="fi" value={editPrinterModal.code} onChange={e => setEditPrinterModal(p => ({ ...p, code: e.target.value }))} /></div>
                                <div className="fg"><label className="fl">Location</label><input className="fi" value={editPrinterModal.location} onChange={e => setEditPrinterModal(p => ({ ...p, location: e.target.value }))} /></div>
                            </div>
                            <div className="frow">
                                <div className="fg"><label className="fl">Technology</label><select className="fsel" value={editPrinterModal.type} onChange={e => setEditPrinterModal(p => ({ ...p, type: e.target.value }))}><option>FDM</option><option>SLA</option><option>SLS</option></select></div>
                                <div className="fg"><label className="fl">Initialization Date</label><input type="date" className="fi" value={editPrinterModal.init} onChange={e => setEditPrinterModal(p => ({ ...p, init: e.target.value }))} /></div>
                            </div>
                        </Modal>
                    )}

                    {/* Add Printer Modal */}
                    {showAdd && (
                        <Modal title="Add New Printer" onClose={() => setShowAdd(false)} footer={(
                            <><button className="btn btg bts" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button className="btn btp bts" onClick={addPrinter} disabled={!form.name || !form.code}>Add Printer</button></>
                        )}>
                            <div className="frow"><div className="fg"><label className="fl">Printer Name *</label><input className="fi" placeholder="e.g. Prusa i3 MK3S+" value={form.name} onChange={e => sf("name")(e.target.value)} /></div></div>
                            <div className="frow">
                                <div className="fg"><label className="fl">Model</label><input className="fi" placeholder="e.g. i3 MK3S+" value={form.model} onChange={e => sf("model")(e.target.value)} /></div>
                                <div className="fg"><label className="fl">Code Name *</label><input className="fi" placeholder="e.g. PRUSA03" value={form.code} onChange={e => sf("code")(e.target.value)} /></div>
                            </div>
                            <div className="frow"><div className="fg"><label className="fl">Location</label><input className="fi" placeholder="e.g. Lab 1" value={form.location} onChange={e => sf("location")(e.target.value)} /></div></div>
                            <div className="frow">
                                <div className="fg"><label className="fl">Technology</label><select className="fsel" value={form.type} onChange={e => sf("type")(e.target.value)}><option>FDM</option><option>SLA</option><option>SLS</option></select></div>
                                <div className="fg"><label className="fl">Capacity</label><select className="fsel" value={form.capacity} onChange={e => sf("capacity")(e.target.value)}><option>Standard</option><option>Large</option><option>Industrial</option></select></div>
                            </div>
                            <div className="frow">
                                <div className="fg"><label className="fl">Default Material</label><input className="fi" placeholder="e.g. PLA" value={form.material} onChange={e => sf("material")(e.target.value)} /></div>
                                <div className="fg"><label className="fl">Initialization Date</label><input type="date" className="fi" value={form.init} onChange={e => sf("init")(e.target.value)} /></div>
                            </div>
                        </Modal>
                    )}

                    {/* Second confirmation modal */}
                    {confirmRemove2 && (
                        <Modal title="Remove Printer — Final Confirmation" onClose={() => setConfirmRemove2(null)} footer={(
                            <><button className="btn btg bts" onClick={() => setConfirmRemove2(null)}>Cancel</button>
                                <button className="btn bts" style={{ background: "var(--red)", color: "#fff", border: "1px solid var(--red)", fontWeight: 600 }} onClick={() => doRemove(confirmRemove2.id)}>Yes, Remove Permanently</button></>
                        )}>
                            <div style={{ background: "var(--rdim)", border: "1px solid rgba(220,38,38,.25)", borderRadius: "var(--r2)", padding: "12px 14px", marginBottom: 12 }}>
                                <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--red)", marginBottom: 4 }}>⚠ This action cannot be undone</div>
                                <div style={{ fontSize: 12, color: "var(--text2)" }}>You are about to permanently remove <strong>{confirmRemove2.name}</strong> ({confirmRemove2.code}) from the fleet.</div>
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text2)" }}>All associated data including maintenance history and print logs for this printer will be removed. Are you sure you want to proceed?</div>
                        </Modal>
                    )}
                </div>
            )}

            {tab === "replace" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">Replacement Analysis</span>
                        <div className="tiny">Identify printers due for replacement based on age.</div>
                    </div>
                    <div className="cb">
                        <div className="row mb12" style={{ gap: 10 }}>
                            <label className="fl" style={{ margin: 0 }}>Replacement Cycle (Days)</label>
                            <input type="number" className="fi" style={{ width: 120 }} defaultValue={365} />
                            <span className="tiny">Set expected lifecycle duration in days.</span>
                        </div>
                        <div className="tw">
                            <table>
                                <thead><tr><th>Printer Name</th><th>Code</th><th>Model</th><th>Technology</th><th>Initialized On</th><th>Age (Days)</th><th>Status</th></tr></thead>
                                <tbody>
                                    {dueReplace.length > 0 && <tr><td colSpan={7}><span className="b berr" style={{ fontSize: 10 }}>⚠ Due for Replacement ({dueReplace.length})</span></td></tr>}
                                    {[...printers].sort((a, b) => age(b) - age(a)).map(p => {
                                        const a = age(p), due = a >= CYCLE;
                                        return (
                                            <tr key={p.id} style={{ background: due ? "rgba(220,38,38,.04)" : "" }}>
                                                <td style={{ fontWeight: due ? 600 : 400, color: due ? "var(--red)" : "var(--text)" }}>{p.name}</td>
                                                <td className="mono">{p.code}</td>
                                                <td className="tdim">{p.model}</td>
                                                <td><span className={`b b${p.type.toLowerCase()}`} style={{ fontSize: 9 }}>{p.type}</span></td>
                                                <td className="tdim">{p.init}</td>
                                                <td><span style={{ fontFamily: "var(--fm)", fontSize: 11, color: due ? "var(--red)" : a > 200 ? "var(--gold)" : "var(--green)" }}>{a}</span></td>
                                                <td><span className={`b ${SB[p.status]}`} style={{ fontSize: 9 }}>{SL[p.status]}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
