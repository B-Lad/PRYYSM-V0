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

function TaskRow({ task, index, isDone, onToggle, comment, onCommentChange, completedAt }) {
    return (
        <div 
            style={{ 
                background: isDone ? "rgba(15,155,106,.04)" : "var(--bg2)", 
                border: `1px solid ${isDone ? "rgba(15,155,106,.3)" : "var(--border)"}`, 
                borderRadius: "var(--r2)", 
                padding: "14px 16px", 
                marginBottom: 10,
                transition: "all .15s",
                opacity: isDone ? 0.85 : 1
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
                        onClick={onToggle}
                        style={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: 5, 
                            border: `2px solid ${isDone ? "var(--green)" : "var(--border2)"}`, 
                            background: isDone ? "var(--green)" : "transparent", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            cursor: "pointer", 
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
                            disabled={!isDone && !comment}
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
    const [selectedWO, setSelectedWO] = useState("");
    
    // Filter WOs that are in postproc or qa stage
    const postProcWOs = WOS.filter(w => w.status === "postproc" || w.status === "printing");
    const qcWOs = WOS.filter(w => w.status === "qa" || w.status === "postproc");

    // Post-posing state
    const [ppTasks, setPpTasks] = useState({}); // { woId: { taskId: { done: bool, comment: string, completedAt: string } } }
    
    // QC state
    const [qcTasks, setQcTasks] = useState({}); // { woId: { taskId: { done: bool, comment: string, completedAt: string } } }

    // Get tasks for selected WO
    const currentTasks = activeTab === "postposing" 
        ? (POST_PROCESSING_TASKS[selectedWO?.tech] || [])
        : (QC_INSPECTION_TASKS[selectedWO?.tech] || []);

    const currentTaskState = activeTab === "postposing" 
        ? (ppTasks[selectedWO] || {})
        : (qcTasks[selectedWO] || {});

    function toggleTask(taskId) {
        const now = new Date().toLocaleString("en-GB", { 
            day: "numeric", 
            month: "short", 
            hour: "2-digit", 
            minute: "2-digit" 
        });

        if (activeTab === "postposing") {
            setPpTasks(prev => {
                const woTasks = prev[selectedWO] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWO]: {
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
                const woTasks = prev[selectedWO] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWO]: {
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
        if (activeTab === "postposing") {
            setPpTasks(prev => {
                const woTasks = prev[selectedWO] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWO]: {
                        ...woTasks,
                        [taskId]: { ...taskData, comment }
                    }
                };
            });
        } else {
            setQcTasks(prev => {
                const woTasks = prev[selectedWO] || {};
                const taskData = woTasks[taskId] || { done: false, comment: "", completedAt: "" };
                
                return {
                    ...prev,
                    [selectedWO]: {
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
                    <div className="kl">Post-Processing Queue</div>
                    <div className="kv">{postProcWOs.length}</div>
                </div>
                <div className="kpi cc">
                    <div className="kl">QC Inspection Queue</div>
                    <div className="kv">{qcWOs.length}</div>
                </div>
                <div className="kpi cb">
                    <div className="kl">Tasks Completed Today</div>
                    <div className="kv">
                        {Object.values(ppTasks).concat(Object.values(qcTasks))
                            .reduce((sum, woTasks) => 
                                sum + Object.values(woTasks).filter(t => t.done).length, 0
                            )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs 
                tabs={[
                    { id: "postposing", label: `① Post Posing (${postProcWOs.length})` }, 
                    { id: "qc", label: `② QC Inspection (${qcWOs.length})` }
                ]} 
                active={activeTab} 
                onChange={setActiveTab} 
            />

            {/* Work Order Selector */}
            <div className="card mb16" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
                <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                        Select Work Order
                    </div>
                    <select 
                        className="fsel" 
                        value={selectedWO} 
                        onChange={e => {
                            const wo = WOS.find(w => w.id === e.target.value);
                            setSelectedWO(wo || "");
                        }}
                        style={{ width: "100%", maxWidth: 600 }}
                    >
                        <option value="">-- Choose a Work Order --</option>
                        {(activeTab === "postposing" ? postProcWOs : qcWOs).map(wo => (
                            <option key={wo.id} value={wo.id}>
                                {wo.id} - {wo.part} ({wo.tech}, {wo.qty} pcs)
                            </option>
                        ))}
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

                    {/* Progress Bar */}
                    <div style={{ 
                        background: "var(--bg2)", 
                        border: "1px solid var(--border)", 
                        borderRadius: "var(--r2)", 
                        padding: "12px 16px", 
                        marginBottom: 16
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700 }}>
                                {activeTab === "postposing" ? "Post-Processing" : "QC Inspection"} Progress
                            </span>
                            <span style={{ 
                                fontFamily: "var(--fm)", 
                                fontSize: 13, 
                                fontWeight: 700, 
                                color: progress.pct === 100 ? "var(--green)" : "var(--accent)"
                            }}>
                                {progress.done} / {progress.total} tasks ({progress.pct}%)
                            </span>
                        </div>
                        <div style={{ 
                            background: "var(--bg4)", 
                            borderRadius: 4, 
                            height: 10, 
                            overflow: "hidden" 
                        }}>
                            <div style={{ 
                                width: `${progress.pct}%`, 
                                background: progress.pct === 100 ? "var(--green)" : "var(--accent)", 
                                height: 10, 
                                borderRadius: 4,
                                transition: "width .3s ease"
                            }} />
                        </div>
                    </div>

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
                            <span className="tiny" style={{ color: "var(--text3)", fontWeight: 400 }}>
                                — Check off each task as completed
                            </span>
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
                                    />
                                );
                            })
                        ) : (
                            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                                No tasks defined for this technology type.
                            </div>
                        )}

                        {/* Completion Summary */}
                        {progress.pct === 100 && (
                            <div className="astrip info" style={{ marginTop: 16, marginBottom: 0 }}>
                                ✓ All {activeTab === "postposing" ? "post-processing" : "QC inspection"} tasks completed for {selectedWO.id}
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
