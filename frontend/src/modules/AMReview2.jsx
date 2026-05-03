import React, { useState, useEffect, useRef } from "react";
import {
    SCHEDULE_JOBS, ALLOT_QUEUE,
    RAW_FILAMENTS, RAW_RESINS, RAW_POWDERS,
    SPARE_CATEGORIES, SPARE_SEED
} from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { usePrinterFleet } from '../hooks/usePrinterFleet.js';
import { MAT_CATALOG } from '../data/matCatalog.js';
import { TB, SB, DB, Modal, Prog, AStrip, Tabs } from '../components/atoms.jsx';
import { RMI_STATUS_BADGE, RMI_STATUS_LBL } from './RawMaterialInventory.jsx';
import { SPARE_STATUS_BADGE, SPARE_STATUS_LABEL } from './SpareStores.jsx';

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

function ReviewSection({ num, title, status, children }) {
    const dot = status === "ok" ? "var(--green)" : status === "warn" ? "var(--gold)" : status === "err" ? "var(--red)" : "var(--border2)";
    return (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r3)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 16px", background: "var(--bg3)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "var(--fm)", fontWeight: 700, color: "var(--text3)", flexShrink: 0 }}>{num}</div>
                <span style={{ fontFamily: "var(--fd)", fontSize: 12.5, fontWeight: 700, flex: 1 }}>{title}</span>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
            </div>
            <div style={{ padding: 14 }}>{children}</div>
        </div>
    );
}

/* ── Phase wrapper with sub-tabs ── */
function Phase({ title, subtitle, tabs, activeTab, onChangeTab, children, status }) {
    const dot = status === "ok" ? "var(--green)" : status === "warn" ? "var(--gold)" : status === "err" ? "var(--red)" : "var(--border2)";
    return (
        <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r3)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "14px 16px", background: "var(--bg3)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: dot, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{status === "ok" ? "✓" : status === "warn" ? "⚠" : "○"}</div>
                    <div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>{title}</div>
                        {subtitle && <div className="tiny" style={{ color: "var(--text3)" }}>{subtitle}</div>}
                    </div>
                </div>
                {tabs && tabs.length > 1 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => onChangeTab(t.id)} style={{ padding: "5px 14px", borderRadius: 16, border: `1.5px solid ${activeTab === t.id ? "var(--accent)" : "var(--border2)"}`, background: activeTab === t.id ? "var(--adim)" : "var(--bg2)", color: activeTab === t.id ? "var(--accent)" : "var(--text2)", fontSize: 11, fontWeight: activeTab === t.id ? 700 : 500, cursor: "pointer", transition: "all .12s", fontFamily: "var(--fd)" }}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div style={{ padding: 16 }}>{children}</div>
        </div>
    );
}

export function AMReview2({ lcProjects, onLcProjectsChange, toast }) {
    const isDemo = useDemoMode();
    const { printers: sharedPrinters, scheduleJobs: sharedScheduleJobs } = usePrinterFleet();
    const seedScheduleJobs = isDemo ? SCHEDULE_JOBS : (sharedScheduleJobs.length > 0 ? sharedScheduleJobs : sharedPrinters.map(p => ({ id: p.id, printer: p.name, printerCode: p.code, job: p.job, tech: p.type, status: p.status })));
    const seedRawFilaments = isDemo ? RAW_FILAMENTS : [];
    const seedRawResins = isDemo ? RAW_RESINS : [];
    const seedRawPowders = isDemo ? RAW_POWDERS : [];
    const seedSpareSeed = isDemo ? SPARE_SEED : [];
    const pending = lcProjects.filter(p => ["submitted", "review"].includes(p.stage));
    const reviewed = lcProjects.filter(p => !["submitted", "review"].includes(p.stage));

    /* list vs detail view */
    const [sel, setSel] = useState(null);
    const [listTab, setListTab] = useState("pending");

    /* phase state */
    const [activePhase, setActivePhase] = useState("planning");
    /* sub-tabs within phases */
    const [phase1Tab, setPhase1Tab] = useState("slots");
    const [phase2Tab, setPhase2Tab] = useState("material");
    const [phase3Tab, setPhase3Tab] = useState("pp");

    /* per-review state */
    const [slotPrinter, setSlotPrinter] = useState(null);
    const [slotStartTime, setSlotStartTime] = useState("");
    const [ganttFilter, setGanttFilter] = useState("all");
    const [matStatus, setMatStatus] = useState(null);
    const [matConfirmedIds, setMatConfirmedIds] = useState({});
    const [matOrderNote, setMatOrderNote] = useState("");
    const [spareStatus, setSpareStatus] = useState(null);
    const [spareRequired, setSpareRequired] = useState([]);
    const [sparePartSelect, setSparePartSelect] = useState("");
    const [sparePartQty, setSparePartQty] = useState(1);
    const [spareRequestSelect, setSpareRequestSelect] = useState("");
    const [spareRequestQty, setSpareRequestQty] = useState(1);
    const [spareRequests, setSpareRequests] = useState([]);
    const [spareConfirmed, setSpareConfirmed] = useState({});
    const [spareNote, setSpareNote] = useState("");
    const [extraCost, setExtraCost] = useState(false);
    const [costItems, setCostItems] = useState([{ desc: "", amount: "" }]);
    const [postProc, setPostProc] = useState({});
    const [customPostProc, setCustomPostProc] = useState([]);
    const [newPostProc, setNewPostProc] = useState("");
    const [ppInstructions, setPpInstructions] = useState({});
    const [qcChecks, setQcChecks] = useState({});
    const [customQC, setCustomQC] = useState([]);
    const [newQC, setNewQC] = useState("");
    const [qcInstructions, setQcInstructions] = useState({});
    const [woMachine, setWoMachine] = useState("");
    const [woCustomNum, setWoCustomNum] = useState("");
    const [woOperator, setWoOperator] = useState("Marco R.");
    const [woSched, setWoSched] = useState(new Date().toISOString().split("T")[0]);
    const [woPrintTime, setWoPrintTime] = useState("4h 00m");
    const [woNotes, setWoNotes] = useState("");

    const PHASES = [
        { id: "planning", label: "① Planning & Assignment", subtitle: "Schedule the job and assign resources" },
        { id: "resources", label: "② Resources & Costs", subtitle: "Confirm materials, spares, and costs" },
        { id: "quality", label: "③ Quality Plan", subtitle: "Define post-processing and QC checks" },
    ];

    const PHASE1_TABS = [
        { id: "slots", label: "Job Allotment" },
        { id: "wo", label: "Work Order" },
    ];
    const PHASE2_TABS = [
        { id: "material", label: "Materials" },
        { id: "spares", label: "Spares" },
        { id: "cost", label: "Extra Cost" },
    ];
    const PHASE3_TABS = [
        { id: "pp", label: "Post-Processing" },
        { id: "qc", label: "QC Inspection" },
    ];

    function openReview(p) {
        setSel(p);
        setActivePhase("planning");
        setPhase1Tab("slots"); setPhase2Tab("material"); setPhase3Tab("pp");
        setSlotPrinter(null); setSlotStartTime(""); setGanttFilter("all");
        setMatStatus(null); setMatConfirmedIds({}); setMatOrderNote("");
        setSpareStatus(null); setSpareRequired([]); setSparePartSelect(""); setSparePartQty(1);
        setSpareRequestSelect(""); setSpareRequestQty(1); setSpareRequests([]); setSpareConfirmed({}); setSpareNote("");
        setExtraCost(false); setCostItems([{ desc: "", amount: "" }]);
        setPostProc({}); setCustomPostProc([]); setNewPostProc(""); setPpInstructions({});
        setQcChecks({}); setCustomQC([]); setNewQC(""); setQcInstructions({});
        setWoMachine(""); setWoCustomNum(""); setWoOperator("Marco R."); setWoNotes("");
        setWoSched(new Date().toISOString().split("T")[0]);
        setWoPrintTime("4h 00m");
    }

    function addCustomPostProc() { if (newPostProc.trim()) { setCustomPostProc(p => [...p, newPostProc.trim()]); setPostProc(p => ({ ...p, [newPostProc.trim()]: true })); setNewPostProc(""); } }
    function addCustomQC() { if (newQC.trim()) { setCustomQC(p => [...p, newQC.trim()]); setQcChecks(p => ({ ...p, [newQC.trim()]: true })); setNewQC(""); } }
    function removeCustomPostProc(opt) { setCustomPostProc(p => p.filter(x => x !== opt)); setPostProc(p => { const n = { ...p }; delete n[opt]; return n; }); }
    function removeCustomQC(opt) { setCustomQC(p => p.filter(x => x !== opt)); setQcChecks(p => { const n = { ...p }; delete n[opt]; return n; }); }

    /* Phase status */
    const phase1Status = slotPrinter && woMachine ? "ok" : (slotPrinter || woMachine ? "warn" : null);
    const phase2Status = matStatus === "ok" ? "ok" : matStatus ? "warn" : null;
    const phase3Status = (Object.values(postProc).some(Boolean) || Object.values(qcChecks).some(Boolean)) ? "ok" : null;

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
        toast(`Approved — ${woId} created`, "s");
        setSel(null);
    }

    function reject() {
        const updated = lcProjects.filter(p => p.id !== sel.id || p.stage !== "review");
        onLcProjectsChange(updated);
        toast("Returned to requester", "w");
        setSel(null);
    }

    /* Phase 1: Job Allotment content */
    const renderPhase1Content = () => {
        if (phase1Tab === "slots") return renderSlots();
        return renderWorkOrder();
    };

    function renderSlots() {
        const priorityBadge = { low: "bnorm", medium: "bwait", high: "burgent" };
        const printersByTech = seedScheduleJobs.filter(j => j.tech === sel.tech);
        return (
            <div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Assign to Printer</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {(ganttFilter === "all" ? printersByTech : printersByTech.filter(p => p.tech === ganttFilter)).map(p => {
                        const isSelected = slotPrinter === p.printer;
                        const busy = p.status === "printing" || p.status === "maintenance";
                        return (
                            <div key={p.id} className={`mc ${p.status}`} style={{ cursor: busy ? "default" : "pointer", outline: isSelected ? "2px solid var(--accent)" : "none", outlineOffset: 2 }} onClick={() => !busy && setSlotPrinter(p.printer)}>
                                <div className="rowsb mb6">
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700 }}>{p.printer}{isSelected ? " ✓" : ""}</div>
                                    <div className="row" style={{ gap: 4 }}><TB tech={p.tech} /><SB s={p.status === "printing" ? "running" : p.status} /></div>
                                </div>
                                {p.job && <div className="tiny mb4" style={{ color: "var(--text2)" }}>{p.job}</div>}
                                {p.status === "maintenance" ? <div className="tiny" style={{ color: "var(--yellow)" }}>Under maintenance</div> : p.status === "idle" ? <div className="tiny" style={{ color: "var(--green)" }}>✓ Available</div> : <Prog pct={65} h={4} />}
                            </div>
                        );
                    })}
                </div>
                {slotPrinter
                    ? <div className="astrip info" style={{ marginBottom: 0 }}>✓ Allotted to <strong>{slotPrinter}</strong></div>
                    : <div className="astrip.warn" style={{ marginBottom: 0 }}>Click a printer above to assign the job.</div>}
            </div>
        );
    }

    function renderWorkOrder() {
        const printersByTech = seedScheduleJobs.filter(j => j.tech === sel.tech);
        return (
            <div>
                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Work Order Details</div>
                <div className="frow">
                    <div className="fg">
                        <label className="fl">WO Number</label>
                        <div className="row" style={{ gap: 0 }}>
                            <div style={{ padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRight: "none", borderRadius: "var(--r) 0 0 var(--r)", fontFamily: "var(--fm)", fontSize: 12, color: "var(--text2)", flexShrink: 0 }}>WO-</div>
                            <input className="fi" style={{ borderRadius: "0 var(--r) var(--r) 0", fontFamily: "var(--fm)" }} value={woCustomNum} onChange={e => setWoCustomNum(e.target.value)} placeholder={String(2060 + lcProjects.length)} />
                        </div>
                    </div>
                    <div className="fg">
                        <label className="fl">Operator</label>
                        <select className="fsel" value={woOperator} onChange={e => setWoOperator(e.target.value)}>
                            {["Marco R.", "Yuki T.", "Arjun S.", "Marie D."].map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>
                <div className="frow">
                    <div className="fg">
                        <label className="fl">Assign Machine</label>
                        <select className="fsel" value={woMachine || slotPrinter || ""} onChange={e => setWoMachine(e.target.value)}>
                            <option value="">— Select —</option>
                            {printersByTech.map(p => <option key={p.id} value={p.printer}>{p.printer}</option>)}
                        </select>
                    </div>
                    <div className="fg">
                        <label className="fl">Scheduled Start</label>
                        <input className="fi" style={{ fontFamily: "var(--fm)" }} value={woSched} onChange={e => setWoSched(e.target.value)} />
                    </div>
                </div>
                <div className="fg mb12">
                    <label className="fl">Notes</label>
                    <textarea className="fta" style={{ minHeight: 60 }} placeholder="Special instructions…" value={woNotes} onChange={e => setWoNotes(e.target.value)} />
                </div>
            </div>
        );
    }

    /* Phase 2: Resources */
    const renderPhase2Content = () => {
        if (phase2Tab === "material") return renderMaterials();
        if (phase2Tab === "spares") return renderSpares();
        return renderExtraCost();
    };

    function renderMaterials() {
        const allInv = sel.tech === "FDM" ? seedRawFilaments : sel.tech === "SLA" ? seedRawResins : seedRawPowders;
        const projectMats = [{ key: "0", name: sel.material || "—", type: sel.material, grams: null, grpQty: sel.qty, grpLabel: "All items", custom: false }];
        return (
            <div>
                <ReviewSection num="1" title="Material Availability" status={matStatus === "ok" ? "ok" : matStatus ? "warn" : null}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                        {projectMats.map(m => {
                            const invMatch = allInv.find(inv => (m.name || "").toLowerCase().includes(inv.name.toLowerCase()));
                            const matId = invMatch?.id || null;
                            const isConfirmed = matId ? !!matConfirmedIds[matId] : false;
                            return (
                                <div key={m.key} style={{ background: isConfirmed ? "rgba(15,155,106,.04)" : "var(--bg2)", border: `1.5px solid ${isConfirmed ? "rgba(15,155,106,.4)" : "var(--border)"}`, borderRadius: "var(--r2)", padding: 12, cursor: "pointer", transition: "all .12s" }} onClick={() => { if (matId) { setMatConfirmedIds(p => ({ ...p, [matId]: !p[matId] })); setMatStatus(isConfirmed ? null : (invMatch?.status === "ok" ? "ok" : "low")); } }}>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                                    <div className="tiny" style={{ color: "var(--text3)" }}>{m.type}</div>
                                    <div className="rowsb mt8">
                                        <span className="tiny">Needed: {m.grpQty} pcs</span>
                                        {invMatch ? <span className={`b ${RMI_STATUS_BADGE[invMatch.status]}`} style={{ fontSize: 9 }}>{RMI_STATUS_LBL[invMatch.status]}</span> : <span className="b" style={{ fontSize: 9, background: "var(--rdim)", color: "var(--red)" }}>Not in Stock</span>}
                                    </div>
                                    {isConfirmed && <div style={{ marginTop: 6, fontSize: 11, color: "var(--green)", fontWeight: 700 }}>✓ Confirmed</div>}
                                </div>
                            );
                        })}
                    </div>
                </ReviewSection>
            </div>
        );
    }

    function renderSpares() {
        return (
            <div>
                <ReviewSection num="2" title="Spare Parts" status={spareRequired.length > 0 ? "ok" : null}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label className="fl" style={{ fontSize: 10 }}>Select Part</label>
                            <select className="fsel" style={{ fontSize: 11 }} value={sparePartSelect} onChange={e => setSparePartSelect(e.target.value)}>
                                <option value="">Choose…</option>
                                {seedSpareSeed.map(s => (<option key={s.id} value={s.id}>{s.name} ({s.location})</option>))}
                            </select>
                        </div>
                        <div style={{ width: 100 }}>
                            <label className="fl" style={{ fontSize: 10 }}>Qty</label>
                            <input className="fi" type="number" min={1} value={sparePartQty} onChange={e => setSparePartQty(parseInt(e.target.value) || 1)} style={{ fontSize: 11, textAlign: "center" }} />
                        </div>
                        <button className="btn btp bts" style={{ fontSize: 10, padding: "5px 12px" }} onClick={() => { if (sparePartSelect) { if (!spareRequired.find(p => p.partId === sparePartSelect)) { setSpareRequired(p => [...p, { partId: sparePartSelect, qty: sparePartQty }]); } setSparePartSelect(""); setSparePartQty(1); } }}>+ Add</button>
                    </div>
                    {spareRequired.map((sp, idx) => {
                        const part = seedSpareSeed.find(s => s.id === sp.partId);
                        if (!part) return null;
                        const ok = part.qty >= sp.qty;
                        return (
                            <div key={sp.partId} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: "8px 10px", background: ok ? "var(--bg2)" : "rgba(220,38,38,.04)", border: `1px solid ${ok ? "rgba(15,155,106,.3)" : "rgba(220,38,38,.3)"}`, borderRadius: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>#{idx + 1}</span>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{part.name}</div><div className="tiny">{part.location} · <strong style={{ color: ok ? "var(--green)" : "var(--red)" }}>Stock: {part.qty}</strong> · Need: {sp.qty}</div></div>
                                <span className={`b ${ok ? "brun" : "berr"}`} style={{ fontSize: 9 }}>{ok ? "✓" : "⚠"}</span>
                                <button onClick={() => setSpareRequired(p => p.filter(x => x.partId !== sp.partId))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>
                            </div>
                        );
                    })}
                    <div className="fg mt10"><label className="fl">Notes</label><textarea className="fta" style={{ minHeight: 44, fontSize: 11 }} placeholder="Extra parts or instructions…" value={spareNote} onChange={e => setSpareNote(e.target.value)} /></div>
                </ReviewSection>
            </div>
        );
    }

    function renderExtraCost() {
        return (
            <div>
                <ReviewSection num="3" title="Extra Cost" status={extraCost ? "warn" : "ok"}>
                    <div className="row mb12" style={{ gap: 10 }}>
                        <button onClick={() => setExtraCost(false)} style={{ padding: "8px 16px", border: `1.5px solid ${!extraCost ? "rgba(15,155,106,.4)" : "var(--border2)"}`, borderRadius: "var(--r2)", background: !extraCost ? "rgba(15,155,106,.07)" : "var(--bg2)", color: !extraCost ? "var(--green)" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>✓ No extra cost</button>
                        <button onClick={() => setExtraCost(true)} style={{ padding: "8px 16px", border: `1.5px solid ${extraCost ? "rgba(184,134,11,.4)" : "var(--border2)"}`, borderRadius: "var(--r2)", background: extraCost ? "var(--golddim)" : "var(--bg2)", color: extraCost ? "var(--gold)" : "var(--text2)", fontSize: 12, cursor: "pointer" }}>⚠ Extra cost needed</button>
                    </div>
                    {extraCost && costItems.map((ci, i) => (
                        <div key={i} className="frow mb8" style={{ alignItems: "center" }}>
                            <div className="fg"><input className="fi" placeholder="Description" value={ci.desc} onChange={e => setCostItems(p => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))} /></div>
                            <div style={{ width: 120 }}><input className="fi" placeholder="AED" type="number" value={ci.amount} onChange={e => setCostItems(p => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} /></div>
                            {costItems.length > 1 && <button className="btn btg bts" style={{ fontSize: 11, color: "var(--red)" }} onClick={() => setCostItems(p => p.filter((_, j) => j !== i))}>✕</button>}
                        </div>
                    ))}
                    {extraCost && <button className="btn btg bts" style={{ fontSize: 11 }} onClick={() => setCostItems(p => [...p, { desc: "", amount: "" }])}>⊕ Add Line</button>}
                    {extraCost && <div className="rowsb mt12"><span className="tiny">Total</span><span style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 800, color: "var(--gold)" }}>AED {costItems.reduce((s, c) => s + (+c.amount || 0), 0).toLocaleString()}</span></div>}
                </ReviewSection>
            </div>
        );
    }

    /* Phase 3: Quality */
    const renderPhase3Content = () => {
        if (phase3Tab === "pp") return renderPostProc();
        return renderQC();
    };

    function renderPostProc() {
        return (
            <div>
                <ReviewSection num="4" title="Post-Processing" status={Object.values(postProc).some(Boolean) ? "ok" : null}>
                    <div className="tiny mb10" style={{ color: "var(--text2)" }}>Select steps and add instructions.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {[...(POST_PROCESS_OPTS[sel.tech] || []), ...customPostProc].map(opt => (
                            <ChipToggle key={opt} label={opt} active={!!postProc[opt]} onToggle={() => setPostProc(p => ({ ...p, [opt]: !p[opt] }))} onRemove={customPostProc.includes(opt) ? () => removeCustomPostProc(opt) : null} />
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <input className="fi" placeholder="Custom step…" value={newPostProc} onChange={e => setNewPostProc(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomPostProc()} style={{ fontSize: 11 }} />
                        <button className="btn btp bts" onClick={addCustomPostProc} style={{ fontSize: 11 }}>⊕ Add</button>
                    </div>
                    {Object.keys(postProc).filter(k => postProc[k]).map((step, i) => (
                        <div key={step} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--adim)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>{i + 1}</div>
                                <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{step}</div><textarea className="fta" style={{ fontSize: 11, minHeight: 50 }} placeholder={`Instructions for ${step}…`} value={ppInstructions[step] || ""} onChange={e => setPpInstructions(p => ({ ...p, [step]: e.target.value }))} /></div>
                                <button onClick={() => setPostProc(p => ({ ...p, [step]: false }))} style={{ background: "none", border: "none", color: "var(--text4)", fontSize: 16, cursor: "pointer" }}>×</button>
                            </div>
                        </div>
                    ))}
                </ReviewSection>
            </div>
        );
    }

    function renderQC() {
        return (
            <div>
                <ReviewSection num="5" title="QC Inspection" status={Object.values(qcChecks).some(Boolean) ? "ok" : null}>
                    <div className="tiny mb10" style={{ color: "var(--text2)" }}>Select checks and add pass criteria.</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {[...(QC_CHECKS[sel.tech] || []), ...customQC].map(opt => (
                            <ChipToggle key={opt} label={opt} active={!!qcChecks[opt]} onToggle={() => setQcChecks(p => ({ ...p, [opt]: !p[opt] }))} color="var(--gold)" dimColor="var(--golddim)" onRemove={customQC.includes(opt) ? () => removeCustomQC(opt) : null} />
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                        <input className="fi" placeholder="Custom check…" value={newQC} onChange={e => setNewQC(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomQC()} style={{ fontSize: 11 }} />
                        <button className="btn btp bts" onClick={addCustomQC} style={{ fontSize: 11 }}>⊕ Add</button>
                    </div>
                    {Object.keys(qcChecks).filter(k => qcChecks[k]).map((check, i) => (
                        <div key={check} style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "12px 14px", marginTop: 10 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--golddim)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--gold)", flexShrink: 0 }}>{i + 1}</div>
                                <div style={{ flex: 1 }}><div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{check}</div><textarea className="fta" style={{ fontSize: 11, minHeight: 50 }} placeholder={`Pass criteria for ${check}…`} value={qcInstructions[check] || ""} onChange={e => setQcInstructions(p => ({ ...p, [check]: e.target.value }))} /></div>
                                <button onClick={() => setQcChecks(p => ({ ...p, [check]: false }))} style={{ background: "none", border: "none", color: "var(--text4)", fontSize: 16, cursor: "pointer" }}>×</button>
                            </div>
                        </div>
                    ))}
                </ReviewSection>
            </div>
        );
    }

    /* ── LIST VIEW ── */
    if (!sel) return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">AM Review 2 (3 Phases)</h1></div>
            <div className="g g4 mb16">
                {[
                    { l: "Pending", v: pending.length, c: "cy" },
                    { l: "In Planning", v: lcProjects.filter(p => p.stage === "planning").length, c: "cc" },
                    { l: "Completed", v: lcProjects.filter(p => p.stage === "closed").length, c: "cp" },
                ].map(k => <div key={k.l} className={`kpi ${k.c}`}><div className="kl">{k.l}</div><div className="kv">{k.v}</div></div>)}
            </div>
            <Tabs tabs={[{ id: "pending", label: `Pending (${pending.length})` }, { id: "inprogress", label: "In Progress" }]} active={listTab} onChange={setListTab} />
            {listTab === "pending" && pending.map(p => (
                <div key={p.id} className={`req-card ${(p.dept || "eng").toLowerCase()}`} style={{ marginBottom: 10 }}>
                    <div className="rowsb mb6">
                        <span style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                        <div className="row" style={{ gap: 6 }}><TB tech={p.tech} /><button className="btn btp bts" onClick={() => openReview(p)}>Open Review →</button></div>
                    </div>
                    <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>{[["By", p.owner], ["Material", p.material], ["Qty", p.qty]].map(([k, v]) => <span key={k} className="tiny">{k}: <strong>{v}</strong></span>)}</div>
                </div>
            ))}
            {listTab === "inprogress" && reviewed.map(p => (
                <div key={p.id} className="req-card" style={{ marginBottom: 8 }}>
                    <div className="rowsb"><span style={{ fontWeight: 600 }}>{p.name}</span><SB s={p.stage} /></div>
                </div>
            ))}
        </div>
    );

    /* ── DETAIL VIEW ── */
    return (
        <div>
            <div className="rowsb mb16">
                <button className="btn btg bts" onClick={() => setSel(null)}>← Back</button>
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>{sel.name}</div>
                    <div className="tiny">{sel.id} · <TB tech={sel.tech} /> · {sel.owner} · Due {sel.due || "—"}</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                    <button className="btn btg bts" onClick={reject} style={{ color: "var(--red)" }}>✕ Return</button>
                    <button className="btn btp" onClick={approve} disabled={!slotPrinter || !matStatus || !woMachine}>✓ Approve</button>
                </div>
            </div>

            {/* 3 Phase Tabs */}
            {PHASES.map(phase => (
                <Phase key={phase.id} title={phase.label} subtitle={phase.subtitle} status={phase.id === "planning" ? phase1Status : phase.id === "resources" ? phase2Status : phase3Status} tabs={phase.id === "planning" ? PHASE1_TABS : phase.id === "resources" ? PHASE2_TABS : PHASE3_TABS} activeTab={phase.id === "planning" ? phase1Tab : phase.id === "resources" ? phase2Tab : phase3Tab} onChangeTab={phase.id === "planning" ? setPhase1Tab : phase.id === "resources" ? setPhase2Tab : setPhase3Tab}>
                    {phase.id === "planning" && renderPhase1Content()}
                    {phase.id === "resources" && renderPhase2Content()}
                    {phase.id === "quality" && renderPhase3Content()}
                </Phase>
            ))}
        </div>
    );
}
