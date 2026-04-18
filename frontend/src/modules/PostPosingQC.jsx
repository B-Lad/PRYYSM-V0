import React, { useState } from "react";
import { Tabs } from '../components/atoms.jsx';
import { WOS, LC_SEED, PROJECTS } from '../data/seed.jsx';

function getProjectForWO(wo) {
    if (!wo) return null;
    const lc = LC_SEED.find(p => p.id === wo.project);
    if (lc) return lc;
    const proj = PROJECTS.find(p => p.id === wo.project);
    if (proj) return { ...proj, imageUrl: null };
    return null;
}

function TechImage({ tech, size = 80 }) {
    const colors = {
        FDM: { bg: "3B82F6", text: "FDM" },
        SLA: { bg: "8B5CF6", text: "SLA" },
        SLS: { bg: "10B981", text: "SLS" },
    };
    const c = colors[tech] || { bg: "6B7280", text: tech || "?" };
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: "var(--r2)",
            background: `linear-gradient(135deg, ${c.bg}dd 0%, ${c.bg}88 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            border: "1px solid var(--border)",
            flexShrink: 0
        }}>
            <span style={{ fontSize: size * 0.35, marginBottom: 2 }}>🏭</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "var(--fm)" }}>{c.text}</span>
        </div>
    );
}

const POST_PROCESSING_TASKS = {
    FDM: [
        { id: "fdm_support", label: "Support Removal", required: true },
        { id: "fdm_sanding", label: "Sanding & Surface Smoothing", required: true },
        { id: "fdm_priming", label: "Priming", required: false },
        { id: "fdm_painting", label: "Painting / Coating", required: false },
        { id: "fdm_acetone", label: "Acetone Vapor Smoothing", required: false },
        { id: "fdm_inspect", label: "Visual Inspection", required: true },
    ],
    SLA: [
        { id: "sla_wash", label: "IPA Washing", required: true },
        { id: "sla_uv", label: "UV Curing", required: true },
        { id: "sla_support", label: "Support Removal", required: true },
        { id: "sla_sanding", label: "Sanding & Finishing", required: false },
        { id: "sla_painting", label: "Painting / Coating", required: false },
        { id: "sla_inspect", label: "Visual Inspection", required: true },
    ],
    SLS: [
        { id: "sls_depowder", label: "Depowdering", required: true },
        { id: "sls_blast", label: "Media Blasting", required: true },
        { id: "sls_dye", label: "Dyeing", required: false },
        { id: "sls_coat", label: "Coating / Sealing", required: false },
        { id: "sls_inspect", label: "Visual Inspection", required: true },
    ],
};

const QC_INSPECTION_TASKS = {
    FDM: [
        { id: "fdm_dimensional", label: "Dimensional Accuracy Check", required: true },
        { id: "fdm_layer", label: "Layer Adhesion Check", required: true },
        { id: "fdm_surface", label: "Surface Finish Quality", required: true },
        { id: "fdm_fit", label: "Fit & Assembly Test", required: true },
        { id: "fdm_weight", label: "Weight Verification", required: false },
        { id: "fdm_document", label: "Documentation & Photos", required: true },
    ],
    SLA: [
        { id: "sla_dimensional", label: "Dimensional Accuracy Check", required: true },
        { id: "sla_surface_quality", label: "Surface Quality & Defects", required: true },
        { id: "sla_transparency", label: "Transparency / Clarity Check", required: false },
        { id: "sla_fit", label: "Fit & Assembly Test", required: true },
        { id: "sla_mechanical", label: "Mechanical Properties Test", required: false },
        { id: "sla_document", label: "Documentation & Photos", required: true },
    ],
    SLS: [
        { id: "sls_dimensional", label: "Dimensional Accuracy Check", required: true },
        { id: "sls_powder", label: "Powder Residue Check", required: true },
        { id: "sls_surface", label: "Surface Finish Quality", required: true },
        { id: "sls_tensile", label: "Tensile Strength Test", required: false },
        { id: "sls_weight", label: "Weight Verification", required: false },
        { id: "sls_document", label: "Documentation & Photos", required: true },
    ],
};

function TaskRow({ task, index, isDone, onToggle, comment, onCommentChange, completedAt, disabled }) {
    return (
        <div 
            style={{ 
                background: isDone ? "rgba(15,155,106,.04)" : "var(--bg2)", 
                border: `1px solid ${isDone ? "rgba(15,155,106,.3)" : "var(--border)"}`, 
                borderRadius: "var(--r2)", 
                padding: "14px 16px", 
                marginBottom: 10,
                transition: "all .15s",
                opacity: disabled ? 0.6 : (isDone ? 0.85 : 1),
                pointerEvents: disabled ? "none" : "auto"
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Task number + checkbox */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <div style={{ 
                        width: 26, 
                        height: 26, 
                        borderRadius: "50%", 
                        background: isDone ? "var(--green)" : "var(--bg3)", 
                        border: `2px solid ${isDone ? "var(--green)" : "var(--border2)"}`, 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontFamily: "var(--fm)", 
                        fontSize: 11, 
                        fontWeight: 700, 
                        color: isDone ? "#fff" : "var(--text3)"
                    }}>
                        {index + 1}
                    </div>
                    <div 
                        onClick={disabled ? undefined : onToggle}
                        style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: 5, 
                            border: `2px solid ${isDone ? "var(--green)" : "var(--border2)"}`, 
                            background: isDone ? "var(--green)" : "transparent", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: disabled ? "not-allowed" : "pointer", 
                            transition: "all .12s" 
                        }}
                    >
                        {isDone && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                </div>

                {/* Task details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                        fontFamily: "var(--fd)", 
                        fontSize: 13.5, 
                        fontWeight: 700, 
                        color: isDone ? "var(--green)" : "var(--text)", 
                        marginBottom: 4,
                        textDecoration: isDone ? "line-through" : "none"
                    }}>
                        {task.label}
                        {task.required && (
                            <span style={{ 
                                marginLeft: 8, 
                                fontSize: 9, 
                                padding: "2px 6px", 
                                borderRadius: 3, 
                                background: "var(--adim)", 
                                color: "var(--accent)",
                                fontFamily: "var(--fm)",
                                fontWeight: 600
                            }}>
                                REQUIRED
                            </span>
                        )}
                    </div>

                    {/* Comment field */}
                    <div style={{ marginTop: 8 }}>
                        <div className="tiny mb4" style={{ color: "var(--text3)" }}>
                            {isDone ? "Completion Notes" : "Add Comment (Optional)"}
                        </div>
                        <textarea 
                            className="fta" 
                            style={{ 
                                fontSize: 11, 
                                minHeight: 50, 
                                resize: "vertical",
                                background: isDone ? "var(--bg3)" : "var(--bg2)"
                            }}
                            placeholder={isDone ? "Add completion notes, observations, or issues..." : "Optional notes..."}
                            value={comment || ""}
                            onChange={e => onCommentChange(e.target.value)}
                            disabled={disabled || (!isDone && !comment)}
                        />
                    </div>

                    {/* Completion timestamp */}
                    {isDone && completedAt && (
                        <div style={{ 
                            marginTop: 8, 
                            fontSize: 10.5, 
                            color: "var(--green)", 
                            fontFamily: "var(--fm)",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4
                        }}>
                            <span style={{ fontSize: 11 }}>✓</span>
                            Completed: {completedAt}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PostPosingQC() {
    const [activeTab, setActiveTab] = useState("postposing");
    const [selectedWOId, setSelectedWOId] = useState("");
    
    // Filter WOs that are in postproc or qa stage
    const postProcWOs = WOS.filter(w => w.status === "postproc" || w.status === "printing");
    const qcWOs = WOS.filter(w => w.status === "qa" || w.status === "postproc");

    // Get selected WO object from ID
    const selectedWO = selectedWOId ? WOS.find(w => w.id === selectedWOId) : null;

    // Post-posing state
    const [ppTasks, setPpTasks] = useState({}); // { woId: { taskId: { done: bool, comment: string, completedAt: string } } }
    
    // QC state
    const [qcTasks, setQcTasks] = useState({}); // { woId: { taskId: { done: bool, comment: string, completedAt: string } } }

    // Completed/submitted tracking
    const [ppSubmitted, setPpSubmitted] = useState({}); // { woId: true }
    const [qcSubmitted, setQcSubmitted] = useState({}); // { woId: true }

    // Compute per-tab stats
    const ppPending = postProcWOs.filter(w => !ppSubmitted[w.id]).length;
    const ppDone = postProcWOs.filter(w => ppSubmitted[w.id]).length;
    const qcPending = qcWOs.filter(w => !qcSubmitted[w.id]).length;
    const qcDone = qcWOs.filter(w => qcSubmitted[w.id]).length;
    
    const activePending = activeTab === "postposing" ? ppPending : qcPending;
    const activeDone = activeTab === "postposing" ? ppDone : qcDone;
    const activeTotal = activeTab === "postposing" ? postProcWOs.length : qcWOs.length;

    // Get tasks for selected WO
    const currentTasks = activeTab === "postposing" 
        ? (POST_PROCESSING_TASKS[selectedWO?.tech] || [])
        : (QC_INSPECTION_TASKS[selectedWO?.tech] || []);

    const currentTaskState = activeTab === "postposing" 
        ? (ppTasks[selectedWOId] || {})
        : (qcTasks[selectedWOId] || {});

    const isSubmitted = activeTab === "postposing" 
        ? (ppSubmitted[selectedWOId] || false)
        : (qcSubmitted[selectedWOId] || false);

    function toggleTask(taskId) {
        if (isSubmitted) return; // Can't modify submitted tasks
        
        const now = new Date().toLocaleString("en-GB", { 
            day: "numeric", 
            month: "short", 
            hour: "2-digit", 
            minute: "2-digit" 
        });

        if (activeTab === "postposing") {
            setPpTasks(prev => {
                const woTasks = prev[selectedWOId] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWOId]: {
                        ...woTasks,
                        [taskId]: {
                            ...taskData,
                            done: !taskData.done,
                            completedAt: !taskData.done ? now : ""
                        }
                    }
                };
            });
        } else {
            setQcTasks(prev => {
                const woTasks = prev[selectedWOId] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWOId]: {
                        ...woTasks,
                        [taskId]: {
                            ...taskData,
                            done: !taskData.done,
                            completedAt: !taskData.done ? now : ""
                        }
                    }
                };
            });
        }
    }

    function updateComment(taskId, comment) {
        if (isSubmitted) return;
        if (activeTab === "postposing") {
            setPpTasks(prev => {
                const woTasks = prev[selectedWOId] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWOId]: {
                        ...woTasks,
                        [taskId]: { ...taskData, comment }
                    }
                };
            });
        } else {
            setQcTasks(prev => {
                const woTasks = prev[selectedWOId] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWOId]: {
                        ...woTasks,
                        [taskId]: { ...taskData, comment }
                    }
                };
            });
        }
    }

    function getProgress() {
        const done = Object.values(currentTaskState).filter(t => t.done).length;
        const total = currentTasks.length;
        return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    }

    function getRequiredProgress() {
        const requiredTasks = currentTasks.filter(t => t.required);
        const done = requiredTasks.filter(t => currentTaskState[t.id]?.done).length;
        const total = requiredTasks.length;
        return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    }

    function handleSubmit() {
        if (activeTab === "postposing") {
            setPpSubmitted(prev => ({ ...prev, [selectedWOId]: true }));
        } else {
            setQcSubmitted(prev => ({ ...prev, [selectedWOId]: true }));
        }
        alert(`${activeTab === "postposing" ? "Post-Processing" : "QC Inspection"} submitted for ${selectedWOId}!`);
    }

    function handleReset() {
        if (activeTab === "postposing") {
            setPpTasks(prev => {
                const newState = { ...prev };
                delete newState[selectedWOId];
                return newState;
            });
            setPpSubmitted(prev => {
                const newState = { ...prev };
                delete newState[selectedWOId];
                return newState;
            });
        } else {
            setQcTasks(prev => {
                const newState = { ...prev };
                delete newState[selectedWOId];
                return newState;
            });
            setQcSubmitted(prev => {
                const newState = { ...prev };
                delete newState[selectedWOId];
                return newState;
            });
        }
    }

    const progress = getProgress();

    return (
        <div>
            {/* Page Header */}
            <div className="pg-hd">
                <span className="pg-eyebrow">OPERATIONS</span>
                <h1 className="pg-title">Post Posing & QC Inspection</h1>
            </div>

            {/* Summary Cards */}
            <div className="g g4 mb16">
                <div className="kpi cy">
                    <div className="kl">Post Posing Pending</div>
                    <div className="kv" style={{ color: ppPending > 0 ? "var(--yellow)" : "var(--green)" }}>{ppPending}</div>
                </div>
                <div className="kpi cc">
                    <div className="kl">QC Pending</div>
                    <div className="kv" style={{ color: qcPending > 0 ? "var(--yellow)" : "var(--green)" }}>{qcPending}</div>
                </div>
                <div className="kpi cb">
                    <div className="kl">PP Completed</div>
                    <div className="kv" style={{ color: ppDone > 0 ? "var(--green)" : undefined }}>{ppDone}</div>
                </div>
                <div className="kpi cg">
                    <div className="kl">QC Completed</div>
                    <div className="kv" style={{ color: qcDone > 0 ? "var(--green)" : undefined }}>{qcDone}</div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs 
                tabs={[
                    { id: "postposing", label: `① Post Posing (${ppPending} pending, ${ppDone} done)` }, 
                    { id: "qc", label: `② QC Inspection (${qcPending} pending, ${qcDone} done)` }
                ]} 
                active={activeTab} 
                onChange={setActiveTab} 
            />

            {/* Work Order Selector */}
            <div className="card mb16" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                        Select Work Order {activeTab === "postposing" ? "(Post Posing)" : "(QC Inspection)"}
                    </div>
                    <select 
                        className="fsel" 
                        value={selectedWOId} 
                        onChange={e => {
                            setSelectedWOId(e.target.value);
                        }}
                        style={{ width: "100%", maxWidth: 600 }}
                    >
                        <option value="">-- Choose a Work Order --</option>
                        {(activeTab === "postposing" ? postProcWOs : qcWOs).map(wo => {
                            const isSubmitted = activeTab === "postposing" ? ppSubmitted[wo.id] : qcSubmitted[wo.id];
                            const taskState = activeTab === "postposing" ? ppTasks[wo.id] : qcTasks[wo.id];
                            const doneCount = taskState ? Object.values(taskState).filter(t => t.done).length : 0;
                            const totalTasks = activeTab === "postposing" 
                                ? (POST_PROCESSING_TASKS[wo.tech]?.length || 0)
                                : (QC_INSPECTION_TASKS[wo.tech]?.length || 0);
                            return (
                                <option key={wo.id} value={wo.id} style={{ color: isSubmitted ? "var(--green)" : undefined }}>
                                    {wo.id} - {wo.part} ({wo.tech}) {isSubmitted ? "✓ Submitted" : doneCount > 0 ? `[${doneCount}/${totalTasks}]` : ""}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>

            {/* Task List */}
            {selectedWO ? (
                <div>
                    {/* WO Info Strip with Project Image */}
                    <div style={{ 
                        background: "var(--bg3)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "var(--r2)", 
                        padding: "12px 16px", 
                        marginBottom: 16,
                        display: "flex",
                        gap: 20,
                        flexWrap: "wrap",
                        alignItems: "flex-start"
                    }}>
                        {/* Project Image */}
                        <TechImage tech={selectedWO.tech} size={80} />
                        
                        {/* WO and Project Info */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                                {[
                                    ["WO", selectedWO.id],
                                    ["Part", selectedWO.part],
                                    ["Tech", selectedWO.tech],
                                    ["Qty", selectedWO.qty + " pcs"],
                                    ["Status", selectedWO.status],
                                    ["Due", selectedWO.due]
                                ].map(([k, v]) => (
                                    <div key={k}>
                                        <div className="tiny mb2" style={{ color: "var(--text3)" }}>{k}</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                            {(() => {
                                const proj = getProjectForWO(selectedWO);
                                return proj ? (
                                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                                        <div className="tiny mb2" style={{ color: "var(--text3)" }}>Project</div>
                                        <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{proj.name}</div>
                                        <div className="tiny" style={{ color: "var(--text2)" }}>👤 {proj.owner}{proj.dept ? ` · ${proj.dept}` : ""}</div>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    </div>

                    {/* Progress Bar + Status */}
                    <div style={{ 
                        background: isSubmitted ? "rgba(15,155,106,.08)" : "var(--bg2)", 
                        border: `1px solid ${isSubmitted ? "var(--green)" : "var(--border)"}`, 
                        borderRadius: "var(--r2)", 
                        padding: "12px 16px", 
                        marginBottom: 16
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <span style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>
                                {activeTab === "postposing" ? "Post-Processing" : "QC Inspection"} Progress
                            </span>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                {isSubmitted && (
                                    <span style={{ 
                                        fontFamily: "var(--fm)", 
                                        fontSize: 11, 
                                        fontWeight: 700, 
                                        color: "var(--green)",
                                        background: "var(--gdim)",
                                        padding: "3px 10px",
                                        borderRadius: 10
                                    }}>
                                        ✓ SUBMITTED
                                    </span>
                                )}
                                <span style={{ 
                                    fontFamily: "var(--fm)", 
                                    fontSize: 13, 
                                    fontWeight: 700, 
                                    color: isSubmitted ? "var(--green)" : progress.pct === 100 ? "var(--green)" : "var(--accent)"
                                }}>
                                    {progress.done} / {progress.total} tasks ({progress.pct}%)
                                </span>
                            </div>
                        </div>
                        <div style={{ 
                            background: "var(--bg4)", 
                            borderRadius: 4, 
                            height: 10, 
                            overflow: "hidden" 
                        }}>
                            <div style={{ 
                                width: `${progress.pct}%`, 
                                background: isSubmitted ? "var(--green)" : progress.pct === 100 ? "var(--green)" : "var(--accent)", 
                                height: 10, 
                                borderRadius: 4,
                                transition: "width .3s ease"
                            }} />
                        </div>
                        {progress.pct > 0 && progress.pct < 100 && (
                            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)" }}>
                                Required tasks: {getRequiredProgress().done} / {getRequiredProgress().total} complete
                            </div>
                        )}
                    </div>

                    {/* Submit Button Area */}
                    {progress.pct > 0 && !isSubmitted && (
                        <div style={{ 
                            background: "var(--bg3)", 
                            border: "1px solid var(--border)", 
                            borderRadius: "var(--r2)", 
                            padding: "16px", 
                            marginBottom: 16,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 12
                        }}>
                            <div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                                    {progress.pct === 100 ? "✓ All Tasks Complete!" : "⚠ Partially Complete"}
                                </div>
                                <div className="tiny" style={{ color: "var(--text2)" }}>
                                    {progress.pct === 100 
                                        ? "Ready to submit. All tasks have been checked." 
                                        : `${getRequiredProgress().total - getRequiredProgress().done} required tasks remaining.`}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button 
                                    className="btn btg bts" 
                                    onClick={handleReset}
                                    style={{ fontSize: 12 }}
                                >
                                    Reset
                                </button>
                                <button 
                                    className="btn btp bts" 
                                    onClick={handleSubmit}
                                    disabled={getRequiredProgress().pct < 100}
                                    style={{ fontSize: 12 }}
                                >
                                    {progress.pct === 100 ? "Submit Complete" : "Submit Partial"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Task Checklist */}
                    <div>
                        <div style={{ 
                            fontFamily: "var(--fd)", 
                            fontSize: 13, 
                            fontWeight: 700, 
                            marginBottom: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            {activeTab === "postposing" ? "Post-Processing Tasks" : "QC Inspection Checklist"}
                            {isSubmitted ? (
                                <span className="tiny" style={{ color: "var(--green)", fontWeight: 600 }}>
                                    — Submitted
                                </span>
                            ) : (
                                <span className="tiny" style={{ color: "var(--text3)", fontWeight: 400 }}>
                                    — Check off each task as completed
                                </span>
                            )}
                        </div>

                        {currentTasks.length > 0 ? (
                            currentTasks.map((task, index) => {
                                const taskData = currentTaskState[task.id] || { done: false, comment: "", completedAt: "" };
                                return (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        isDone={taskData.done}
                                        onToggle={() => toggleTask(task.id)}
                                        comment={taskData.comment}
                                        onCommentChange={val => updateComment(task.id, val)}
                                        completedAt={taskData.completedAt}
                                        disabled={isSubmitted}
                                    />
                                );
                            })
                        ) : (
                            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                                No tasks defined for this technology type.
                            </div>
                        )}

                        {/* Completion Summary */}
                        {isSubmitted && (
                            <div className="astrip success" style={{ marginTop: 16, marginBottom: 0 }}>
                                ✓ {activeTab === "postposing" ? "Post-Processing" : "QC Inspection"} submitted for {selectedWO.id}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--text3)" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>
                        {activeTab === "postposing" ? "⚙" : "✓"}
                    </div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                        Select a Work Order to Begin
                    </div>
                    <div className="tiny">
                        Choose a work order from the dropdown above to view the {activeTab === "postposing" ? "post-processing" : "QC inspection"} tasks.
                    </div>
                </div>
            )}
        </div>
    );
}
