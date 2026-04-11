import React, { useState, useEffect } from 'react';
import CSS from './styles.js';
import { NAV } from './data/nav.js';
import { LC_SEED } from './data/seed.jsx';
import { useLive } from './hooks/useLive.js';
import { api } from './services/api.js'; // Import our new API service
import { TB, SB } from './components/atoms.jsx';
import { Overview } from './modules/Overview.jsx';
import { PrintRequests } from './modules/PrintRequests.jsx';
import { AMReview } from './modules/AMReview.jsx';
import { Projects } from './modules/Projects.jsx';
import { PrinterFleet } from './modules/PrinterFleet.jsx';
import { PrintSchedule } from './modules/PrintSchedule.jsx';
import { JobAllotment } from './modules/JobAllotment.jsx';
import { RawMaterialInventory } from './modules/RawMaterialInventory.jsx';
import { SpareStores } from './modules/SpareStores.jsx';
import { PostPosingQC } from './modules/PostPosingQC.jsx';
import { Flow } from './modules/Flow.jsx';
import { Config } from './modules/Config.jsx';
import { Admin } from './modules/Admin.jsx';
import { Repository } from './modules/Repository.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(e) { return { error: e }; }
    render() {
        if (this.state.error) return (
            <div style={{ padding: 32, fontFamily: "monospace", background: "#fff", color: "#dc2626" }}>
                <h2 style={{ marginBottom: 16 }}>⚠ Runtime Error</h2>
                <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{this.state.error?.message}</pre>
                <pre style={{ fontSize: 11, color: "#666", marginTop: 12, whiteSpace: "pre-wrap" }}>{this.state.error?.stack}</pre>
            </div>
        );
        return this.props.children;
    }
}

export default function App() {
    const [section, setSection] = useState("overview");
    const [open, setOpen] = useState(true);
    const [lcProjects, setLcProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const machines = useLive();

    // Fetch Data from API on Load
    useEffect(() => {
        api.getProjects()
            .then(data => {
                // Map API response to the format the UI expects
                const mapped = data.map(p => ({
                    ...p,
                    id: p.custom_id || p.id,
                    stage: p.status === 'active' ? 'review' : 'closed', // Simplified mapping
                    printPct: 0,
                    woId: null,
                    machine: null,
                    history: []
                }));
                setLcProjects(mapped);
            })
            .catch(err => {
                console.warn("Backend not available, using Seed data.", err);
                setLcProjects(LC_SEED); // Fallback to local data
            })
            .finally(() => setLoading(false));
    }, []);

    const errCount = machines.filter(m => m.status === "error").length;
    const pendingCount = lcProjects.filter(p => ["submitted", "review"].includes(p.stage)).length;
    const current = NAV.find(n => n.id === section);

    function toast(msg, type = "i") {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }

    // Update Project in Backend
    function handleProjectUpdate(updatedProject) {
        // 1. Optimistic UI update (instant feel)
        setLcProjects(prev => {
            const idx = prev.findIndex(p => p.id === updatedProject.id);
            if (idx === -1) return [updatedProject, ...prev]; // Add new
            const newList = [...prev];
            newList[idx] = updatedProject;
            return newList;
        });

        // 2. Sync with Backend
        // In a real scenario, we would POST/PUT here. 
        // For now, we rely on the local state for the demo flow.
        // api.createProject(updatedProject).catch(console.error);
    }

    const sections = {
        overview: <Overview machines={machines} setSection={setSection} />,
        requests: <PrintRequests lcProjects={lcProjects} onLcProjectsChange={setLcProjects} toast={toast} />,
        amreview: <AMReview lcProjects={lcProjects} onLcProjectsChange={setLcProjects} toast={toast} />,
        projects: <Projects lcProjects={lcProjects} onLcProjectsChange={setLcProjects} toast={toast} setSection={setSection} />,
        fleet: <PrinterFleet />,
        schedule: <PrintSchedule />,
        allotment: <JobAllotment />,
        rawmat: <RawMaterialInventory />,
        spares: <SpareStores />,
        postposing: <PostPosingQC />,
        flow: <Flow />,
        config: <Config />,
        admin: <Admin />,
        repository: <Repository lcProjects={lcProjects} />,
    };
    let lastGroup = "";
    return (
        <ErrorBoundary>
            <>
                <style>{CSS}</style>
                <div className="toast-wrap">
                    {toasts.map(t => <div key={t.id} className={`toast t${t.type}`}><span>{t.type === "s" ? "✓" : t.type === "e" ? "✗" : "ℹ"}</span>{t.msg}</div>)}
                </div>
                <div className="app">
                    <aside className={`sb ${open ? "open" : "col"}`}>
                        <div className="sb-brand" onClick={() => setOpen(p => !p)}>
                            <div className="sb-mark" style={{ fontFamily: "var(--fd)", fontSize: 15, letterSpacing: "-1px" }}>Pr</div>
                            {open && <div><div className="sb-name">Pryy<span>sm</span></div><div className="sb-sub">AM Operations</div></div>}
                        </div>
                        <nav className="sb-nav">
                            {NAV.map(item => {
                                const showGroup = item.group !== lastGroup;
                                lastGroup = item.group;
                                return (
                                    <div key={item.id}>
                                        {showGroup && open && <div className="nav-grp">{item.group}</div>}
                                        <button className={`nav-btn ${section === item.id ? "act" : ""}`} onClick={() => setSection(item.id)} title={!open ? item.label : ""}>
                                            <span className="nav-icon">{item.icon}</span>
                                            {open && <span style={{ flex: 1 }}>{item.label}</span>}
                                            {item.id === "requests" && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                                            {item.id === "amreview" && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                                            {item.id === "overview" && errCount > 0 && <span className="nav-badge">{errCount}</span>}
                                        </button>
                                    </div>
                                );
                            })}
                        </nav>
                        {open && <div className="sb-foot">
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "var(--fm)", marginBottom: 3 }}>
                                <span className="pd g" />System Online
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "var(--fm)", letterSpacing: ".5px" }}>v3.0 · Dubai · Shift 1</div>
                        </div>}
                    </aside>

                    <div className="main">
                        <header className="topbar">
                            <div className="tb-l">
                                <span className="tb-icon">{current?.icon}</span>
                                <h1 className="tb-title">{current?.label}</h1>
                            </div>
                            <div className="tb-r">
                                <div className="live-ind"><span className="pd g" />Live</div>
                                {pendingCount > 0 && <div className="tb-alert" onClick={() => setSection("requests")}>⊕ {pendingCount} Pending Review</div>}
                                {errCount > 0 && <div className="tb-alert" onClick={() => setSection("overview")}>⚠ {errCount} Machine Error</div>}
                                <div className="tb-chip">Shift 1 · 06:00-14:00 · GST</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text2)" }}>
                                    <div className="uavt">B</div>
                                    <span>Bhavin · AM Admin</span>
                                </div>
                            </div>
                        </header>
                        <main className="page">
                            <div className="pinner">{sections[section]}</div>
                        </main>
                    </div>
                </div>
            </>
        </ErrorBoundary>
    );
}
