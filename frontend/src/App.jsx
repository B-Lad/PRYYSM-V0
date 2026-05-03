import React, { useEffect, useState, Suspense, lazy } from 'react';
import CSS from './styles.js';
import { NAV } from './data/nav.js';
import { useLive } from './hooks/useLive.js';
import { useRealtimeNotifications } from './hooks/useNotifications.js';
import { DemoModeContext } from './hooks/useDemoMode.js';
import { MaterialsContext } from './hooks/useMaterials.js';
import { PrinterFleetContext } from './hooks/usePrinterFleet.js';
import { api } from './services/api.js';
import { Modal } from './components/atoms.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { RAW_FILAMENTS, RAW_RESINS, RAW_POWDERS, FLEET_DATA, SCHEDULE_JOBS, CONFIRM_QUEUE } from './data/seed.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Overview = lazy(() => import('./modules/Overview.jsx').then(m => ({ default: m.Overview })));
const PrintRequests = lazy(() => import('./modules/PrintRequests.jsx').then(m => ({ default: m.PrintRequests })));
const AMReview = lazy(() => import('./modules/AMReview/index.jsx').then(m => ({ default: m.AMReview })));
const Projects = lazy(() => import('./modules/Projects.jsx').then(m => ({ default: m.Projects })));
const PrinterFleet = lazy(() => import('./modules/PrinterFleet.jsx').then(m => ({ default: m.PrinterFleet })));
const PrintSchedule = lazy(() => import('./modules/PrintSchedule.jsx').then(m => ({ default: m.PrintSchedule })));
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
    const [lcProjects, setLcProjects] = useState(() => {
        try {
            const saved = localStorage.getItem("lc_projects");
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
    const [printerAssignments, setPrinterAssignments] = useState(() => {
        try {
            const saved = localStorage.getItem("printer_assignments");
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [sharedFilaments, setSharedFilaments] = useState([]);
    const [sharedResins, setSharedResins] = useState([]);
    const [sharedPowders, setSharedPowders] = useState([]);
    const materialsValue = { filaments: sharedFilaments, resins: sharedResins, powders: sharedPowders, setFilaments: setSharedFilaments, setResins: setSharedResins, setPowders: setSharedPowders };
    const [sharedPrinters, setSharedPrinters] = useState([]);
    const [sharedScheduleJobs, setSharedScheduleJobs] = useState([]);
    const [sharedConfirmQueue, setSharedConfirmQueue] = useState([]);
    const printerFleetValue = { printers: sharedPrinters, scheduleJobs: sharedScheduleJobs, confirmQueue: sharedConfirmQueue, setPrinters: setSharedPrinters, setScheduleJobs: setSharedScheduleJobs, setConfirmQueue: setSharedConfirmQueue };
    const machines = useLive();

    useRealtimeNotifications();

    useEffect(() => {
        // Warm up Render free tier backend before real requests
        warmBackend();
        bootstrap();

        // Keep-alive ping every 10 min to prevent Render spin-down
        const keepAlive = setInterval(() => {
            warmBackend();
        }, 10 * 60 * 1000);
        return () => clearInterval(keepAlive);
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

    useEffect(() => {
        localStorage.setItem("lc_projects", JSON.stringify(lcProjects));
    }, [lcProjects]);

    useEffect(() => {
        localStorage.setItem("printer_assignments", JSON.stringify(printerAssignments));
    }, [printerAssignments]);

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
            const previousTenantId = localStorage.getItem("tenant_id");
            const newTenantId = me.tenant_id || "";
            if (previousTenantId && previousTenantId !== newTenantId) {
                localStorage.removeItem("lc_projects");
                localStorage.removeItem("printer_assignments");
                setLcProjects([]);
                setPrinterAssignments({});
            }
            localStorage.setItem("user_role", me.role || "");
            localStorage.setItem("tenant_id", newTenantId);
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
            const backendProjects = data.map(p => ({
                ...p,
                id: p.custom_id || p.id,
                stage: p.status === 'active' ? 'review' : 'closed',
                printPct: 0,
            }));
            // Merge with localStorage projects (local rich data takes priority)
            setLcProjects(prev => {
                const localById = new Map(prev.map(p => [p.id, p]));
                backendProjects.forEach(bp => {
                    if (!localById.has(bp.id)) {
                        localById.set(bp.id, bp);
                    }
                });
                return Array.from(localById.values());
            });
        } catch (err) {
            console.warn("Backend not reachable.");
        }
    }

    async function warmBackend() {
        // Fire a lightweight ping to wake up Render free tier
        const healthUrl = API_URL.replace('/api/v1', '/health');
        try {
            await fetch(healthUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' });
        } catch (e) {
            // Ignore errors — this is just a wake-up call
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

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ full_name: "", email: "", avatar_url: "" });

    function handleOpenProfile() {
        setProfileForm({
            full_name: session?.full_name || "",
            email: session?.email || "",
            avatar_url: session?.avatar_url || ""
        });
        setShowProfileModal(true);
    }

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast("Image must be less than 2MB.", "e");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileForm(prev => ({ ...prev, avatar_url: reader.result }));
        };
        reader.readAsDataURL(file);
    }

    async function handleUpdateProfile() {
        if (!profileForm.full_name || !profileForm.email) {
            toast("Please fill in both name and email.", "e");
            return;
        }
        try {
            const updated = await api.updateMe({
                full_name: profileForm.full_name,
                email: profileForm.email,
                avatar_url: profileForm.avatar_url || null
            });
            setSession({ ...session, ...updated });
            setShowProfileModal(false);
            toast("Profile updated successfully.", "s");
        } catch (err) {
            toast(err.message || "Failed to update profile.", "e");
        }
    }

    if (loading) return <div style={{ background: "var(--bg1)", height: "100vh" }} />;
    if (!isAuthenticated) return (
        <Suspense fallback={<div style={{ height: "100vh", background: "var(--bg1)" }} />}>
            <Login onLogin={handleLogin} />
        </Suspense>
    );

    const handleWOIssued = (woId, project, gIdx, woData) => {
        // Sync Work Order data to the Print Schedule's assignment tracking
        setPrinterAssignments(prev => ({
            ...prev,
            [`${project.id}-grp${gIdx}`]: {
                printer: woData.machine,
                operator: woData.operator,
                startTime: woData.sched, // e.g., YYYY-MM-DD
                confirmed: woData.confirmed,
                projectData: project,
                woData: woData
            }
        }));

        setLcProjects(prev => prev.map(p => {
            if (p.id !== project.id) return p;
            const now = new Date();
            const ts = now.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
            const nextStage = "planning";
            const newHist = p.history.map(h => {
                if (h.stage === p.stage) return { ...h, done: true, time: ts, note: `AM Review complete. WO ${woId} issued.` };
                if (h.stage === nextStage) return { ...h, time: ts };
                return h;
            });
            return { ...p, stage: nextStage, woId, machine: woData.machine, history: newHist };
        }));
        toast(`Work Order ${woId} issued`, "s");
    };

    const sections = {
        overview: <Overview machines={machines} setSection={setSection} />,
        requests: <PrintRequests lcProjects={lcProjects} onLcProjectsChange={setLcProjects} toast={toast} />,
        amreview: <AMReview
            lcProjects={lcProjects}
            onLcProjectsChange={setLcProjects}
            onWOIssued={handleWOIssued}
            toast={toast}
            printerAssignments={printerAssignments}
            onPrinterAssignmentsChange={setPrinterAssignments}
        />,
        projects: <Projects lcProjects={lcProjects} onLcProjectsChange={setLcProjects} toast={toast} setSection={setSection} />,
        fleet: <PrinterFleet />,
        schedule: <PrintSchedule lcProjects={lcProjects} printerAssignments={printerAssignments} onPrinterAssignmentsChange={setPrinterAssignments} />,
        rawmat: <RawMaterialInventory printerAssignments={printerAssignments} />,
        spares: <SpareStores printerAssignments={printerAssignments} />,
        postposing: <PostPosingQC />,
        flow: <Flow lcProjects={lcProjects} />,
        config: <Config />,
        admin: <Admin session={session} onSessionRefresh={bootstrap} />,
        repository: <Repository lcProjects={lcProjects} />,
    };

    return (
        <ErrorBoundary>
            <DemoModeContext.Provider value={session?.demo_mode === true}>
                <MaterialsContext.Provider value={materialsValue}>
                    <PrinterFleetContext.Provider value={printerFleetValue}>
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
                            <TopBar onLogout={handleLogout} onChangePassword={() => setShowPasswordModal(true)} onChangeProfile={handleOpenProfile} session={session} toggleSidebar={() => setOpen(p => !p)} />
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

                {showProfileModal && (
                    <Modal
                        title="Profile Settings"
                        onClose={() => setShowProfileModal(false)}
                        footer={<><button className="btn btg bts" onClick={() => setShowProfileModal(false)}>Cancel</button><button className="btn btp bts" onClick={handleUpdateProfile}>Save Changes</button></>}
                    >
                        <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                {profileForm.avatar_url ? (
                                    <img src={profileForm.avatar_url} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: 24, color: "var(--text3)" }}>👤</span>
                                )}
                            </div>
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <label className="fl" style={{ marginBottom: 8 }}>Profile Photo</label>
                                <label className="btn btg bts" style={{ width: "fit-content", cursor: "pointer", fontSize: 11 }}>
                                    Upload from Desktop
                                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                                </label>
                                <div className="tiny mt4" style={{ color: "var(--text3)" }}>Max 2MB (JPEG, PNG).</div>
                            </div>
                        </div>

                        <div className="fg mb12">
                            <label className="fl">Full Name</label>
                            <input className="fi" type="text" value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="E.g., Jane Doe" />
                        </div>
                        <div className="fg">
                            <label className="fl">Email Address</label>
                            <input className="fi" type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="jane@example.com" />
                        </div>
                    </Modal>
)}
                    </PrinterFleetContext.Provider>
                </MaterialsContext.Provider>
            </DemoModeContext.Provider>
        </ErrorBoundary>
    );
}
