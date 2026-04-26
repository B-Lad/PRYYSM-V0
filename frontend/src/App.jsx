import React, { useEffect, useState, Suspense, lazy } from 'react';
import CSS from './styles.js';
import { NAV } from './data/nav.js';
import { useLive } from './hooks/useLive.js';
import { useRealtimeNotifications } from './hooks/useNotifications.js';
import { api } from './services/api.js';
import { Modal } from './components/atoms.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const Overview = lazy(() => import('./modules/Overview.jsx').then(m => ({ default: m.Overview })));
const PrintRequests = lazy(() => import('./modules/PrintRequests.jsx').then(m => ({ default: m.PrintRequests })));
const AMReview = lazy(() => import('./modules/AMReview.jsx').then(m => ({ default: m.AMReview })));
const Projects = lazy(() => import('./modules/Projects.jsx').then(m => ({ default: m.Projects })));
const PrinterFleet = lazy(() => import('./modules/PrinterFleet.jsx').then(m => ({ default: m.PrinterFleet })));
const PrintSchedule = lazy(() => import('./modules/PrintSchedule.jsx').then(m => ({ default: m.PrintSchedule })));
const JobAllotment = lazy(() => import('./modules/JobAllotment.jsx').then(m => ({ default: m.JobAllotment })));
const RawMaterialInventory = lazy(() => import('./modules/RawMaterialInventory.jsx').then(m => ({ default: m.RawMaterialInventory })));
const SpareStores = lazy(() => import('./modules/SpareStores.jsx').then(m => ({ default: m.SpareStores })));
const PostPosingQC = lazy(() => import('./modules/PostPosingQC.jsx').then(m => ({ default: m.PostPosingQC })));
const Flow = lazy(() => import('./modules/Flow.jsx').then(m => ({ default: m.Flow })));
const Config = lazy(() => import('./modules/Config.jsx').then(m => ({ default: m.Config })));
const Admin = lazy(() => import('./modules/Admin.jsx').then(m => ({ default: m.Admin })));
const Repository = lazy(() => import('./modules/Repository.jsx').then(m => ({ default: m.Repository })));
const Login = lazy(() => import('./modules/Login.jsx').then(m => ({ default: m.Login })));
const TopBar = lazy(() => import('./modules/TopBar.jsx').then(m => ({ default: m.TopBar })));

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
        const canAdminSetDirectly = ["super_admin", "admin"].includes(session?.role);
        if (!canAdminSetDirectly && !passwordForm.current_password) {
            toast("Enter your current password.", "e");
            return;
        }
        if (!passwordForm.new_password || !passwordForm.confirm_password) {
            toast("Fill in all password fields.", "e");
            return;
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            toast("New password and confirm password must match.", "e");
            return;
        }
        try {
            if (canAdminSetDirectly) {
                await api.setUserPassword(session.id, {
                    new_password: passwordForm.new_password,
                });
            } else {
                await api.changePassword({
                    current_password: passwordForm.current_password,
                    new_password: passwordForm.new_password,
                });
            }
            setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
            setShowPasswordModal(false);
            toast("Password updated successfully.", "s");
        } catch (err) {
            toast(err.message || "Failed to update password.", "e");
        }
    }

    if (loading) return <div style={{ background: "var(--bg1)", height: "100vh" }} />;
    if (!isAuthenticated) return (
        <Suspense fallback={<div style={{ height: "100vh", background: "var(--bg1)" }} />}>
            <Login onLogin={handleLogin} />
        </Suspense>
    );

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
                            <img 
                                src={open ? "/logo-light.svg" : "/favicon.svg"} 
                                alt="Pryysm Logo" 
                                style={{ 
                                    width: open ? "160px" : "32px",
                                    height: "auto",
                                    transition: "all .2s"
                                }} 
                            />
                        </div>
                        <nav className="sb-nav">
                            {visibleNav.map(item => (
                                <button key={item.id} className={`nav-btn ${section === item.id ? "act" : ""}`} onClick={() => { setSection(item.id); if(window.innerWidth <= 800) setOpen(false); }}>
                                    <span className="nav-icon">{item.icon}</span>
                                    {open && <span style={{ flex: 1 }}>{item.label}</span>}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    {open && <div className="mobile-menu-btn" style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1999}} onClick={() => setOpen(false)}></div>}

                    <div className="main">
                        <Suspense fallback={<header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e2e8f0" }} />}>
                            <TopBar onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} session={session} toggleSidebar={() => setOpen(p => !p)} />
                        </Suspense>
                        <main className="page">
                            <div className="pinner">
                                <ErrorBoundary>
                                    <Suspense fallback={<div style={{ padding: 24, color: "var(--text3)", fontFamily: "var(--fm)", fontSize: 11 }}>LOADING MODULE...</div>}>
                                        {sections[section] || <div className="card"><div className="cb">You do not have access to this section.</div></div>}
                                    </Suspense>
                                </ErrorBoundary>
                            </div>
                        </main>
                    </div>
                </div>

                {showPasswordModal && (
                    <Modal
                        title="Reset Password"
                        onClose={() => setShowPasswordModal(false)}
                        footer={<><button className="btn btg bts" onClick={() => setShowPasswordModal(false)}>Cancel</button><button className="btn btp bts" onClick={handleChangePassword}>Update Password</button></>}
                    >
                        {!["super_admin", "admin"].includes(session?.role) && (
                            <div className="fg mb8">
                                <label className="fl">Current Password</label>
                                <input className="fi" type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                            </div>
                        )}
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
