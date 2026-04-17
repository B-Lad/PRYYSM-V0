import React, { useEffect, useState } from 'react';
import CSS from './styles.js';
import { NAV } from './data/nav.js';
import { useLive } from './hooks/useLive.js';
import { useRealtimeNotifications } from './hooks/useNotifications.js';
import { api } from './services/api.js';
import { Modal } from './components/atoms.jsx';
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
    const [session, setSession] = useState(null);
    const [lcProjects, setLcProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const machines = useLive();

    useRealtimeNotifications();

    useEffect(() => {
        bootstrap();
    }, []);

    const allowedSections = session?.allowed_tabs?.length
        ? session.allowed_tabs
        : NAV.map(item => item.id);

    const visibleNav = NAV.filter(item => allowedSections.includes(item.id));

    useEffect(() => {
        if (!visibleNav.length) return;
        if (!allowedSections.includes(section)) {
            setSection(visibleNav[0].id);
        }
    }, [allowedSections, section, visibleNav]);

    async function bootstrap() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setLoading(false);
            setIsAuthenticated(false);
            setSession(null);
            return;
        }

        setLoading(true);
        try {
            const me = await api.getMe();
            localStorage.setItem("user_role", me.role || "");
            localStorage.setItem("tenant_id", me.tenant_id || "");
            localStorage.setItem("user_id", me.id || "");
            setSession(me);
            setIsAuthenticated(true);
            await fetchData(me);
        } catch (err) {
            console.error(err);
            handleLogout({ quiet: true });
        } finally {
            setLoading(false);
        }
    }

    async function fetchData(currentSession = session) {
        const canLoadProjectData = (currentSession?.allowed_tabs || []).some(tab =>
            ["requests", "amreview", "projects", "repository"].includes(tab)
        );
        if (!canLoadProjectData) {
            setLcProjects([]);
            return;
        }
        try {
            const data = await api.getProjects();
            const mapped = data.map(p => ({ ...p, id: p.custom_id || p.id, stage: p.status === 'active' ? 'review' : 'closed', printPct: 0 }));
            setLcProjects(mapped);
        } catch (err) {
            console.warn("Backend not reachable.");
            setLcProjects([]);
        }
    }

    function handleLogin() {
        bootstrap();
    }

    function handleLogout(options = {}) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("tenant_id");
        localStorage.removeItem("user_id");
        setIsAuthenticated(false);
        setSession(null);
        setLcProjects([]);
        setShowPasswordModal(false);
        if (!options.quiet) {
            setLoading(false);
        }
    }

    function toast(msg, type = "i") {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    }

    async function handleChangePassword() {
        if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
            toast("Fill in all password fields.", "e");
            return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast("New password and confirm password must match.", "e");
            return;
        }
        try {
            await api.changePassword({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
            setShowPasswordModal(false);
            toast("Password updated successfully.", "s");
        } catch (err) {
            toast(err.message || "Failed to update password.", "e");
        }
    }

    if (loading) return <div style={{ background: "var(--bg1)", height: "100vh" }} />;
    if (!isAuthenticated) return <Login onLogin={handleLogin} />;

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
        admin: <Admin session={session} onSessionRefresh={bootstrap} />,
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
                            {visibleNav.map(item => (
                                <button key={item.id} className={`nav-btn ${section === item.id ? "act" : ""}`} onClick={() => setSection(item.id)}>
                                    <span className="nav-icon">{item.icon}</span>
                                    {open && <span style={{ flex: 1 }}>{item.label}</span>}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <div className="main">
                        <TopBar onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} session={session} />
                        <main className="page">
                            <div className="pinner">{sections[section] || <div className="card"><div className="cb">You do not have access to this section.</div></div>}</div>
                        </main>
                    </div>
                </div>

                {showPasswordModal && (
                    <Modal
                        title="Reset Password"
                        onClose={() => setShowPasswordModal(false)}
                        footer={<><button className="btn btg bts" onClick={() => setShowPasswordModal(false)}>Cancel</button><button className="btn btp bts" onClick={handleChangePassword}>Update Password</button></>}
                    >
                        <div className="fg mb8">
                            <label className="fl">Current Password</label>
                            <input className="fi" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                        </div>
                        <div className="fg mb8">
                            <label className="fl">New Password</label>
                            <input className="fi" type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
                        </div>
                        <div className="fg">
                            <label className="fl">Confirm Password</label>
                            <input className="fi" type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
                        </div>
                    </Modal>
                )}
            </>
        </ErrorBoundary>
    );
}
