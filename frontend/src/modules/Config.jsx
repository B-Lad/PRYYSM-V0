import React, { useState } from "react";
import { DT_CODES as SEED_DT_CODES, INTEGRATIONS } from '../data/seed.jsx';
import { Tabs } from '../components/atoms.jsx';

// ── Helpers ───────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
    return (
        <div onClick={onChange} style={{ width: 36, height: 20, borderRadius: 10, background: on ? "var(--green)" : "var(--bg4)", border: "1px solid", borderColor: on ? "var(--green)" : "var(--border2)", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: on ? 18 : 2, transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
        </div>
    );
}

function Card({ title, subtitle, actions, children }) {
    return (
        <div className="card" style={{ marginBottom: 16 }}>
            <div className="ch">
                <div>
                    <span className="ct">{title}</span>
                    {subtitle && <div className="tiny" style={{ marginTop: 2 }}>{subtitle}</div>}
                </div>
                {actions}
            </div>
            <div className="cb">{children}</div>
        </div>
    );
}

function Row({ label, hint, children }) {
    return (
        <div style={{ display: "flex", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                {hint && <div className="tiny" style={{ marginTop: 2 }}>{hint}</div>}
            </div>
            {children}
        </div>
    );
}

// ── Tab: Factory Settings ──────────────────────────────────────────
function FactoryTab({ settings, saveSettings }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState({});
    const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
    const s = editing ? { ...settings, ...draft } : settings;

    const FIELDS = [
        { key: "company", label: "Company Name", hint: "Legal company name on all documents" },
        { key: "site", label: "Site / Facility", hint: "Current physical location" },
        { key: "timezone", label: "Timezone", type: "select", options: ["GST +4 (Asia/Dubai)", "UTC +0 (London)", "EST -5 (New York)", "PST -8 (Los Angeles)", "CET +1 (Berlin)", "JST +9 (Tokyo)", "IST +5:30 (Mumbai)", "AEST +10 (Sydney)"] },
        { key: "workdays", label: "Working Days", hint: "e.g. Sunday to Thursday" },
        { key: "currency", label: "Cost Currency", type: "select", options: ["AED", "USD", "EUR", "GBP", "CNY", "JPY", "INR"] },
        { key: "oeeTarget", label: "Fleet OEE Target", hint: "e.g. 80%" },
        { key: "bufferPct", label: "Print Time Buffer %", hint: "Auto-added to all print time estimates", type: "number" },
        { key: "autoCloseDays", label: "Auto-Close Completed (days)", hint: "Days after handoff before project auto-closes", type: "number" },
    ];

    return (
        <Card title="Factory Settings" subtitle="Core facility and operational defaults"
            actions={!editing
                ? <button className="btn btp bts" onClick={() => { setDraft({}); setEditing(true); }}>Edit Settings</button>
                : <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btg bts" onClick={() => { setEditing(false); setDraft({}); }}>Cancel</button>
                    <button className="btn btp bts" onClick={() => { saveSettings({ ...settings, ...draft }); setEditing(false); setDraft({}); }}>Save Changes</button>
                </div>}>
            {FIELDS.map(f => {
                const val = (s && s[f.key] !== undefined) ? s[f.key] : "";
                return (
                    <Row key={f.key} label={f.label} hint={f.hint}>
                        {editing ? (
                            f.type === "select"
                                ? <select className="fsel" style={{ width: 200, fontSize: 12 }} value={val} onChange={e => set(f.key, e.target.value)}>
                                    {f.options.map(o => <option key={o}>{o}</option>)}
                                </select>
                                : <input className="fi" type={f.type === "number" ? "number" : "text"} value={val} onChange={e => set(f.key, e.target.value)} style={{ width: 200, fontSize: 12 }} />
                        ) : (
                            <span style={{ fontSize: 12, color: "var(--text2)", textAlign: "right" }}>{val || "—"}</span>
                        )}
                    </Row>
                );
            })}
        </Card>
    );
}

// ── Tab: Technologies ──────────────────────────────────────────────
function TechnologiesTab({ techs, saveTechs }) {
    const [adding, setAdding] = useState(false);
    const [newT, setNewT] = useState({ tech: "", params: "", color: "var(--fdm)" });
    const COLORS = [{ label: "FDM", value: "var(--fdm)" }, { label: "SLA", value: "var(--sla)" }, { label: "SLS", value: "var(--sls)" }, { label: "Accent", value: "var(--accent)" }, { label: "Purple", value: "var(--purple)" }];

    function addTech() {
        if (!newT.tech.trim()) return;
        saveTechs([...techs, { ...newT, tech: newT.tech.trim() }]);
        setNewT({ tech: "", params: "", color: "var(--fdm)" });
        setAdding(false);
    }

    return (
        <Card title="Print Technologies" subtitle="Active AM technologies and their parameters"
            actions={<button className="btn btp bts" onClick={() => setAdding(true)}>+ Add Tech</button>}>
            {techs.map((t, i) => (
                <div key={t.tech + i} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: t.color, fontFamily: "var(--fd)", flex: 1 }}>{t.tech}</span>
                        <button onClick={() => saveTechs(techs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, paddingLeft: 20 }}>{t.params || "—"}</div>
                </div>
            ))}
            {adding && (
                <div style={{ marginTop: 14, padding: 14, background: "var(--bg3)", borderRadius: "var(--r2)", border: "1px solid var(--border2)" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <input className="fi" style={{ flex: 1, fontSize: 12 }} placeholder="Tech code (e.g. MJF)" value={newT.tech} onChange={e => setNewT(t => ({ ...t, tech: e.target.value }))} />
                        <select className="fsel" style={{ fontSize: 12 }} value={newT.color} onChange={e => setNewT(t => ({ ...t, color: e.target.value }))}>
                            {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <textarea className="fta" rows={2} style={{ fontSize: 12, marginBottom: 10 }} placeholder="Parameters (e.g. Layer: 0.08mm · Temp: N/A · Post: Depowdering)" value={newT.params} onChange={e => setNewT(t => ({ ...t, params: e.target.value }))} />
                    <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btp bts" onClick={addTech}>Add Technology</button>
                        <button className="btn btg bts" onClick={() => setAdding(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </Card>
    );
}

// ── Tab: Workflow ──────────────────────────────────────────────────
function WorkflowTab({ settings, saveSettings, dtCodes, saveDtCodes }) {
    const [newCode, setNewCode] = useState("");
    const [addingCode, setAddingCode] = useState(false);

    const WORKFLOW_FIELDS = [
        { key: "autoAssignWO", label: "Auto-assign WO on Approval", hint: "Create work orders automatically when requests are approved", type: "toggle" },
        { key: "requireImage", label: "Require Image for Print Requests", hint: "Block submission if no reference image is uploaded", type: "toggle" },
        { key: "requireQAOnUrgent", label: "Mandatory QA for Urgent Jobs", hint: "All urgent jobs must pass QA before handoff", type: "toggle" },
        { key: "autoSchedule", label: "Auto-Schedule on WO Creation", hint: "Assign a machine slot when a work order is created", type: "toggle" },
        { key: "allowOverbook", label: "Allow Overbooking", hint: "Allow scheduling beyond machine capacity", type: "toggle" },
        { key: "blockAtLimit", label: "Block New Jobs at WIP Limit", hint: "Prevent starting jobs when WIP limit is reached", type: "toggle" },
        { key: "wipLimitPrinting", label: "WIP Limit — Printing", hint: "Max simultaneous print jobs", type: "number" },
        { key: "wipLimitPostProc", label: "WIP Limit — Post-Processing", type: "number" },
        { key: "wipLimitQA", label: "WIP Limit — QA Inspection", type: "number" },
        { key: "maxQueuePerPrinter", label: "Max Queued Jobs per Printer", type: "number" },
        { key: "scheduleHorizon", label: "Schedule Horizon (days)", hint: "How far ahead to plan machine schedules", type: "number" },
    ];

    function toggle(key) { saveSettings({ ...settings, [key]: !settings[key] }); }
    function update(key, val) { saveSettings({ ...settings, [key]: val }); }

    return (
        <>
            <Card title="Workflow & Approvals" subtitle="Controls for request approval and job scheduling">
                {WORKFLOW_FIELDS.map(f => (
                    <Row key={f.key} label={f.label} hint={f.hint}>
                        {f.type === "toggle"
                            ? <Toggle on={!!settings[f.key]} onChange={() => toggle(f.key)} />
                            : <input className="fi" type="number" value={settings[f.key] ?? ""} onChange={e => update(f.key, e.target.value)} style={{ width: 80, fontSize: 12, textAlign: "center" }} />}
                    </Row>
                ))}
            </Card>

            <Card title="Downtime Reason Codes" subtitle="Used when logging machine downtime events"
                actions={<button className="btn btp bts" onClick={() => setAddingCode(true)}>+ Add Code</button>}>
                {dtCodes.map((code, i) => (
                    <div key={code + i} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", gap: 10 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{code}</span>
                        <button onClick={() => saveDtCodes(dtCodes.filter(c => c !== code))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                ))}
                {addingCode && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                        <input className="fi" style={{ flex: 1, fontSize: 12 }} placeholder="Enter downtime reason..." value={newCode} onChange={e => setNewCode(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCode.trim()) { saveDtCodes([...dtCodes, newCode.trim()]); setNewCode(""); setAddingCode(false); } }} />
                        <button className="btn btp bts" onClick={() => { if (newCode.trim()) { saveDtCodes([...dtCodes, newCode.trim()]); setNewCode(""); setAddingCode(false); } }}>Add</button>
                        <button className="btn btg bts" onClick={() => { setAddingCode(false); setNewCode(""); }}>Cancel</button>
                    </div>
                )}
            </Card>
        </>
    );
}

// ── Tab: Integrations ──────────────────────────────────────────────
function IntegrationsTab({ integrations, onToggle }) {
    const STATUS_COLOR = { connected: "var(--green)", pending: "var(--yellow)", disconnected: "var(--red)" };
    const STATUS_BG = { connected: "var(--gdim)", pending: "var(--ydim)", disconnected: "var(--rdim)" };

    return (
        <Card title="External Integrations" subtitle="Connected systems and API endpoints">
            {integrations.map((int, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{int.name}</div>
                        <div className="tiny" style={{ marginTop: 2 }}>{int.status === "connected" ? "Connected and syncing" : int.status === "pending" ? "Awaiting configuration" : "Not connected"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: STATUS_BG[int.status], color: STATUS_COLOR[int.status] }}>{int.status.toUpperCase()}</span>
                        <button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => onToggle(i)}>
                            {int.status === "connected" ? "Disconnect" : "Configure"}
                        </button>
                    </div>
                </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, background: "var(--adim)", borderRadius: "var(--r2)", border: "1px solid rgba(45,212,191,.2)", fontSize: 12 }}>
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>ℹ API Documentation</span>
                <span style={{ color: "var(--text2)", marginLeft: 8 }}>Contact your Pryysm administrator to configure new integration endpoints.</span>
            </div>
        </Card>
    );
}

// ── Tab: Notifications ─────────────────────────────────────────────
function NotificationsTab({ rules, saveRules }) {
    return (
        <Card title="Alert & Notification Rules" subtitle="Control when and how the system sends alerts">
            {rules.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{r.ev}</div>
                        <div className="tiny" style={{ marginTop: 2 }}>{r.ch}</div>
                    </div>
                    <Toggle on={r.on} onChange={() => saveRules(rules.map((x, j) => j === i ? { ...x, on: !x.on } : x))} />
                </div>
            ))}
        </Card>
    );
}

// ── Main Config ────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
    company: "Pryysm Industries", site: "Dubai Manufacturing Campus, Building 4",
    timezone: "GST +4 (Asia/Dubai)", workdays: "Sunday to Thursday", currency: "AED",
    oeeTarget: "80%", bufferPct: "5", autoCloseDays: "30",
    autoAssignWO: false, requireImage: false, requireQAOnUrgent: true,
    autoSchedule: true, allowOverbook: false, blockAtLimit: true,
    wipLimitPrinting: "10", wipLimitPostProc: "5", wipLimitQA: "5",
    maxQueuePerPrinter: "5", scheduleHorizon: "14",
};

const DEFAULT_TECHS = [
    { tech: "FDM", params: "Layer: 0.1–0.3mm · Temps: 180–300°C · Infill: 15–100% · Supports: PVA/Breakaway", color: "var(--fdm)" },
    { tech: "SLA", params: "Layer: 0.025–0.1mm · UV 405nm · Post: IPA wash 15min + UV cure 30min", color: "var(--sla)" },
    { tech: "SLS", params: "Layer: 0.1mm · Bed temp: 170°C · Cooldown: 12h min · Refresh rate: 50%", color: "var(--sls)" },
];

const DEFAULT_NOTIFS = [
    { ev: "Machine error / fault", ch: "Email + Pryysm dashboard alert", on: true },
    { ev: "Budget threshold reached (80%)", ch: "Email to project owner and AM coordinator", on: true },
    { ev: "QA fail / NCR created", ch: "Email to QA lead + project manager", on: true },
    { ev: "WIP limit breached", ch: "Pryysm dashboard only", on: true },
    { ev: "Material / resin low", ch: "Email to AM coordinator", on: true },
    { ev: "Print job complete", ch: "Pryysm dashboard only", on: false },
    { ev: "New print request submitted", ch: "Email to AM coordinator", on: true },
    { ev: "Urgent request approved", ch: "Email + dashboard to assigned operator", on: true },
];

function load(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object") return fallback;
        // Merge with fallback so new keys always have defaults
        return Array.isArray(fallback) ? parsed : { ...fallback, ...parsed };
    } catch { return fallback; }
}

export function Config() {
    const [tab, setTab] = useState("factory");
    const [settings, setSettings] = useState(() => load("pr_config", DEFAULT_SETTINGS));
    const [techs, setTechs] = useState(() => load("pr_techs", DEFAULT_TECHS));
    const [dtCodes, setDtCodes] = useState(() => load("pr_dt_codes", [...SEED_DT_CODES]));
    const [notifs, setNotifs] = useState(() => load("pr_notif", DEFAULT_NOTIFS));
    const [integrations, setIntegrations] = useState(() => load("pr_integrations", INTEGRATIONS));
    const [saved, setSaved] = useState(false);

    function persist(key, setter, val) {
        setter(val);
        localStorage.setItem(key, JSON.stringify(val));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const TABS = [
        { id: "factory", label: "🏭 Factory" },
        { id: "technologies", label: "⚙️ Technologies" },
        { id: "workflow", label: "🔄 Workflow" },
        { id: "integrations", label: "🔗 Integrations" },
        { id: "notifications", label: "🔔 Notifications" },
    ];

    return (
        <div>
            <div className="pg-hd" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <span className="pg-eyebrow">SYSTEM</span>
                    <h1 className="pg-title">Configuration</h1>
                </div>
                {saved && (
                    <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        ✓ Settings saved
                    </div>
                )}
            </div>

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === "factory" && (
                <FactoryTab settings={settings} saveSettings={v => persist("pr_config", setSettings, v)} />
            )}
            {tab === "technologies" && (
                <TechnologiesTab techs={techs} saveTechs={v => persist("pr_techs", setTechs, v)} />
            )}
            {tab === "workflow" && (
                <WorkflowTab
                    settings={settings} saveSettings={v => persist("pr_config", setSettings, v)}
                    dtCodes={dtCodes} saveDtCodes={v => persist("pr_dt_codes", setDtCodes, v)}
                />
            )}
            {tab === "integrations" && (
                <IntegrationsTab
                    integrations={integrations}
                    onToggle={i => persist("pr_integrations", setIntegrations, integrations.map((x, j) => j === i ? { ...x, status: x.status === "connected" ? "disconnected" : "connected" } : x))}
                />
            )}
            {tab === "notifications" && (
                <NotificationsTab rules={notifs} saveRules={v => persist("pr_notif", setNotifs, v)} />
            )}
        </div>
    );
}