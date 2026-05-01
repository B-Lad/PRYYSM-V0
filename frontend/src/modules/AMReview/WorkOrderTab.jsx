import { useState, useEffect } from "react";
import { ReviewSection } from "./shared/ReviewSection";
import { GroupSelector } from "./shared/GroupSelector";
import { TB } from "../../components/atoms";

const MACHINES = {
    FDM: ["Prusa MK4", "Bambu X1C", "Ender Pro 1", "Ender Pro 2"],
    SLA: ["Form 4 Alpha", "Form 4 Beta"],
    SLS: ["EOS P396", "Fuse 1+"],
};
const OPERATORS = ["Marco R.", "Dr. Priya N.", "Lena K.", "Arjun S.", "Yuki T."];

export function WorkOrderTab({ sel, groups, groupIndex, setGroupIndex, printerAssignments, reviewData, updateReviewData, onStatusChange, onWOIssued }) {
    const currentGroup = groups?.[groupIndex] || { qty: sel?.qty || 0 };
    const grpAssignment = printerAssignments?.[`${sel?.id}-grp${groupIndex}`];

    const saved = reviewData?.[groupIndex]?.wo || {};
    const [machine, setMachine] = useState(saved.machine || grpAssignment?.printer || "");
    const [operator, setOperator] = useState(saved.operator || "Marco R.");
    const [sched, setSched] = useState(saved.sched || new Date().toISOString().split("T")[0]);
    const [printTime, setPrintTime] = useState(saved.printTime || `${parseInt(sel?.estHrs) || 0}h ${parseInt(sel?.estMin) || 0}m`);
    const [notes, setNotes] = useState(saved.notes || "");
    const [woCreated, setWoCreated] = useState(saved.woId || null);

    useEffect(() => {
        const s = reviewData?.[groupIndex]?.wo || {};
        setMachine(s.machine || grpAssignment?.printer || "");
        setOperator(s.operator || "Marco R.");
        setSched(s.sched || new Date().toISOString().split("T")[0]);
        setPrintTime(s.printTime || `${parseInt(sel?.estHrs) || 0}h ${parseInt(sel?.estMin) || 0}m`);
        setNotes(s.notes || "");
        setWoCreated(s.woId || null);
    }, [groupIndex]);

    const matData = reviewData?.[groupIndex]?.material;
    const sparesData = reviewData?.[groupIndex]?.spares;
    const ppData = reviewData?.[groupIndex]?.pp;
    const qcData = reviewData?.[groupIndex]?.qc;

    const readyChecks = [
        { label: "Material availability confirmed", ok: !!matData?.confirmed },
        { label: "Spares & consumables confirmed", ok: !!sparesData?.confirmed },
        { label: "Post-processing steps set", ok: !!ppData?.confirmed },
        { label: "QC checks configured", ok: !!qcData?.confirmed },
        { label: "Machine assigned", ok: !!machine },
    ];
    const isReadyToGenerate = readyChecks.every(c => c.ok);

    function generateWO() {
        if (!machine) return;
        const woId = `WO-${(sel?.id || "PRJ-000").replace("PRJ-", "")}-G${groupIndex + 1}`;
        const woData = {
            woId, machine, operator, sched, printTime, notes, confirmed: true,
            ppSteps: ppData?.stepsList || [],
            qcChecks: qcData?.checksList || [],
            materials: matData?.rows || [],
            spares: sparesData?.items || [],
        };
        setWoCreated(woId);
        updateReviewData(groupIndex, "wo", woData);
        if (onStatusChange) onStatusChange("ok");
        if (onWOIssued) onWOIssued(woId, sel, groupIndex, woData);
    }

    function clearWO() {
        setWoCreated(null);
        updateReviewData(groupIndex, "wo", {});
        if (onStatusChange) onStatusChange(null);
    }

    const allGroupsWO = groups?.every((_, i) => reviewData?.[i]?.wo?.woId) || (!groups && woCreated);

    return (
        <ReviewSection num="7" title="Work Order Creation" status={allGroupsWO ? "ok" : woCreated ? "warn" : null}>
            <GroupSelector groups={groups} selectedIndex={groupIndex} onSelect={setGroupIndex} project={sel} />

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, padding: 12, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                {sel?.imageUrl && <img src={sel.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover" }} />}
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>{sel?.name}</div>
                    <div className="tiny" style={{ color: "var(--text2)" }}>Group {groupIndex + 1} · <TB tech={sel?.tech} /> · ×{currentGroup.qty || 0} pcs</div>
                </div>
            </div>

            {!woCreated && (
                <div style={{ padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)", marginBottom: 14 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>
                        Readiness Check — Group {groupIndex + 1}
                    </div>
                    {readyChecks.map((c, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < readyChecks.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <span style={{ fontSize: 14, color: c.ok ? "var(--green)" : "var(--text3)" }}>{c.ok ? "✓" : "○"}</span>
                            <span style={{ fontSize: 12, color: c.ok ? "var(--text)" : "var(--text3)", fontWeight: c.ok ? 500 : 400 }}>{c.label}</span>
                            {!c.ok && <span className="b bidle" style={{ fontSize: 9, marginLeft: "auto" }}>Pending</span>}
                        </div>
                    ))}
                    {!isReadyToGenerate && (
                        <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--ydim)", borderRadius: 6, fontSize: 11, color: "var(--yellow)" }}>
                            ⚠ Complete all tabs above before generating the Work Order
                        </div>
                    )}
                </div>
            )}

            {!woCreated && (ppData?.stepsList?.length > 0 || qcData?.checksList?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {ppData?.stepsList?.length > 0 && (
                        <div style={{ padding: "10px 12px", background: "var(--adim)", border: "1px solid rgba(45,212,191,.2)", borderRadius: "var(--r2)" }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--accent)", marginBottom: 6 }}>Post-Processing Steps ({ppData.stepsList.length})</div>
                            {ppData.stepsList.map(s => <div key={s.id} className="tiny" style={{ marginBottom: 2 }}>• {s.label}</div>)}
                        </div>
                    )}
                    {qcData?.checksList?.length > 0 && (
                        <div style={{ padding: "10px 12px", background: "rgba(15,155,106,.05)", border: "1px solid rgba(15,155,106,.2)", borderRadius: "var(--r2)" }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>QC Checks ({qcData.checksList.length})</div>
                            {qcData.checksList.map(c => <div key={c.id} className="tiny" style={{ marginBottom: 2 }}>• {c.label}</div>)}
                        </div>
                    )}
                </div>
            )}

            {woCreated ? (
                <div style={{ background: "rgba(15,155,106,.06)", border: "1px solid rgba(15,155,106,.3)", borderRadius: "var(--r2)", padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--fm)", color: "var(--green)" }}>{woCreated}</span>
                        <span className="b bsucc">✓ Work Order Created</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 14 }}>
                        {[["Machine", machine], ["Operator", operator], ["Scheduled", sched], ["Est. Time", printTime]].map(([k, v]) => (
                            <div key={k}><span className="tiny">{k.toUpperCase()}</span><div style={{ fontWeight: 600 }}>{v}</div></div>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {ppData?.stepsList?.length > 0 && (
                            <div style={{ padding: "8px 10px", background: "var(--adim)", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>POST-PROCESSING ({ppData.stepsList.length})</div>
                                {ppData.stepsList.map(s => <div key={s.id} className="tiny">• {s.label}</div>)}
                            </div>
                        )}
                        {qcData?.checksList?.length > 0 && (
                            <div style={{ padding: "8px 10px", background: "rgba(15,155,106,.06)", borderRadius: 6 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", marginBottom: 4 }}>QC CHECKS ({qcData.checksList.length})</div>
                                {qcData.checksList.map(c => <div key={c.id} className="tiny">• {c.label}</div>)}
                            </div>
                        )}
                    </div>
                    <button className="btn btg bts mt12" style={{ fontSize: 11 }} onClick={clearWO}>Clear & Recreate</button>
                </div>
            ) : (
                <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: 14 }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 12 }}>
                        Work Order Details — Group {groupIndex + 1}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <div>
                            <label className="fl">Machine / Printer</label>
                            <select className="fsel" value={machine} onChange={e => setMachine(e.target.value)}>
                                <option value="">Select machine...</option>
                                {grpAssignment && <option value={grpAssignment.printer}>{grpAssignment.printer} (assigned)</option>}
                                {(MACHINES[sel?.tech] || MACHINES.FDM).map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="fl">Operator</label>
                            <select className="fsel" value={operator} onChange={e => setOperator(e.target.value)}>
                                {OPERATORS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="fl">Scheduled Date</label>
                            <input type="date" className="fi" value={sched} onChange={e => setSched(e.target.value)} />
                        </div>
                        <div>
                            <label className="fl">Est. Print Time</label>
                            <input className="fi" value={printTime} onChange={e => setPrintTime(e.target.value)} placeholder="e.g. 4h 00m" />
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label className="fl">Notes</label>
                        <textarea className="fta" style={{ minHeight: 56 }} placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                    <button className="btn btp bts" style={{ fontSize: 12, padding: "10px 20px", width: "100%" }} onClick={generateWO} disabled={!machine}>
                        {isReadyToGenerate ? "🚀 Generate Work Order" : "⚠ Complete Review Tabs First"}
                    </button>
                </div>
            )}

            {groups?.length > 1 && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text3)", marginBottom: 8 }}>All Groups — Work Order Status</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {groups.map((g, i) => {
                            const gWO = reviewData?.[i]?.wo?.woId;
                            return (
                                <div key={i} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${gWO ? "var(--green)" : "var(--border)"}`, background: gWO ? "rgba(15,155,106,.08)" : "var(--bg2)", display: "flex", gap: 8, alignItems: "center" }}>
                                    <span style={{ fontWeight: 700, fontSize: 11 }}>G{i + 1}</span>
                                    <span style={{ fontSize: 10, color: gWO ? "var(--green)" : "var(--text3)", fontWeight: gWO ? 700 : 400 }}>{gWO || "Not created"}</span>
                                </div>
                            );
                        })}
                    </div>
                    {allGroupsWO && <div className="astrip success mt12">✓ All Work Orders created — project ready for Planning</div>}
                </div>
            )}
        </ReviewSection>
    );
}