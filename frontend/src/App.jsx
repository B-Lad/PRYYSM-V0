import React, { useState, useEffect } from 'react';
import CSS from './styles.js';
import { NAV } from './data/nav.js';
import { useLive } from './hooks/useLive.js';
import { useRealtimeNotifications } from './hooks/useNotifications.js';
import { api } from './services/api.js';
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
import { Login } from './modules/Login.jsx';
import { TopBar } from './modules/TopBar.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { error: null }; }
    static getDerivedStateFromError(e) { return { error: e }; }
    render() {
        if (this.state.error) return (
            <div style={{ padding: 32, fontFamily: "monospace", background: "#fff", color: "#dc2626" }}>
                <h2>⚠ Runtime Error</h2>
                <pre>{this.state.error?.message}</pre>
            </div>
        );
        return this.props.children;
    }
}

export default function App() {
    const [section, setSection] = useState("overview");
    const [open, setOpen] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // --- ENABLE REALTIME NOTIFICATIONS ---
    useRealtimeNotifications();
    // -------------------------------------

    const [lcProjects, setLcProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const machines = useLive();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            setIsAuthenticated(true);
            fetchData();
        } else {
            setLoading(false);
        }
    }, []);

    async function fetchData() {
        try {
            const data = await api.getProjects();
            const mapped = data.map(p => ({ ...p, id: p.custom_id || p.id, stage: p.status === 'active' ? 'review' : 'closed', printPct: 0 }));
            setLcProjects(mapped);
        } catch (err) {
            console.warn("Backend not reachable.");
        } finally {
            setLoading(false);
        }
    }

    function handleLogin() {
        setIsAuthenticated(true);
        fetchData();
    }

    function handleLogout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        setIsAuthenticated(false);
        setLcProjects([]);
    }

    function toast(msg, type = "i") {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }

    if (loading) return <div style={{ background: "var(--bg1)", height: "100vh" }} />;
    if (!isAuthenticated) return <Login onLogin={handleLogin} />;

    const errCount = machines.filter(m => m.status === "error").length;
    const pendingCount = lcProjects.filter(p => ["submitted", "review"].includes(p.stage)).length;
    const current = NAV.find(n => n.id === section);

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
                            {NAV.map(item => (
                                <button key={item.id} className={`nav-btn ${section === item.id ? "act" : ""}`} onClick={() => setSection(item.id)}>
                                    <span className="nav-icon">{item.icon}</span>
                                    {open && <span style={{ flex: 1 }}>{item.label}</span>}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className="main">
                        <TopBar onLogout={handleLogout} />
                        <main className="page">
                            <div className="pinner">{sections[section]}</div>
                        </main>
                    </div>
                </div>
            </>
        </ErrorBoundary>
    );
}
