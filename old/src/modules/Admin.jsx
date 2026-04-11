import React, { useState, useEffect, useRef } from "react";
import { DEPARTMENTS } from '../data/seed.js';
import { Tabs, Modal } from '../components/atoms.jsx';

export function Admin() {
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Dept Requestor");
    const [inviteDept, setInviteDept] = useState("ENG");
    const [exportDone, setExportDone] = useState(false);

    const ROLES = ["AM Admin", "Print Coordinator", "Printer Operator", "Post-proc Operator", "QA Inspector", "Dept Requestor", "Dept Manager", "Finance"];
    const PERMS = [
        { n: "Submit Print Request", a: [1, 1, 0, 0, 0, 1, 1, 0] },
        { n: "Approve Requests", a: [1, 1, 0, 0, 0, 0, 1, 0] },
        { n: "Schedule Work Orders", a: [1, 1, 0, 0, 0, 0, 0, 0] },
        { n: "View All Projects", a: [1, 1, 1, 1, 1, 0, 1, 1] },
        { n: "View Dept Budget", a: [1, 1, 0, 0, 0, 0, 1, 1] },
        { n: "Configure Factory", a: [1, 0, 0, 0, 0, 0, 0, 0] },
        { n: "Analytics & Reports", a: [1, 1, 0, 0, 1, 0, 1, 1] },
        { n: "QA Records", a: [1, 1, 1, 1, 1, 0, 0, 0] },
        { n: "Log Downtime", a: [1, 1, 1, 1, 0, 0, 0, 0] },
        { n: "Manage Users", a: [1, 0, 0, 0, 0, 0, 0, 0] },
    ];
    const [users, setUsers] = useState([
        { id: 1, name: "Bhavin", role: "AM Admin", status: "active", dept: "AM Facility", last: "Just now", initials: "BH" },
        { id: 2, name: "Marco R.", role: "Print Coordinator", status: "active", dept: "MFG", last: "5m ago", initials: "MR" },
        { id: 3, name: "Yuki T.", role: "Dept Requestor", status: "active", dept: "NPI", last: "12m ago", initials: "YT" },
        { id: 4, name: "Marie D.", role: "QA Inspector", status: "active", dept: "AM Facility", last: "30m ago", initials: "MD" },
        { id: 5, name: "Arjun S.", role: "Dept Manager", status: "active", dept: "ENG", last: "1h ago", initials: "AS" },
        { id: 6, name: "Dr. Priya N.", role: "Dept Requestor", status: "active", dept: "R&D", last: "2h ago", initials: "PN" },
        { id: 7, name: "Lena K.", role: "Dept Requestor", status: "inactive", dept: "DES", last: "Yesterday", initials: "LK" },
    ]);
    const [audit, setAudit] = useState([
        { t: "14:32", u: "Marco R.", a: "WO status updated", e: "WO-2041 — In Production" },
        { t: "14:18", u: "System", a: "Alert triggered", e: "M05 error on WO-2039" },
        { t: "13:55", u: "Bhavin", a: "Request approved", e: "PRJ-012 Jig & Fixture Set" },
        { t: "13:20", u: "Marco R.", a: "Downtime logged", e: "M07 — Waiting Material" },
        { t: "12:48", u: "Marie D.", a: "QC record created", e: "QC-220 PASS — WO-2029" },
        { t: "11:30", u: "Bhavin", a: "WIP limit updated", e: "Post-proc 5 → 6 temp override" },
        { t: "10:15", u: "Dr. Priya N.", a: "Request submitted", e: "PRJ-009 Bio Housing v2" },
        { t: "09:00", u: "System", a: "Shift started", e: "Shift 1 · 06:00-14:00 GST" },
    ]);

    function toggleUser(id) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
        const u = users.find(x => x.id === id);
        const now = new Date();
        const t = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        setAudit(prev => [{ t, u: "Bhavin", a: u.status === "active" ? "User deactivated" : "User reactivated", e: u.name + " · " + u.role }, ...prev]);
    }
    function handleInvite() {
        if (!inviteEmail.trim()) return;
        const now = new Date(), t = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const name = inviteEmail.split("@")[0];
        setUsers(prev => [...prev, { id: Date.now(), name, role: inviteRole, status: "active", dept: inviteDept, last: "Just now", initials: name.slice(0, 2).toUpperCase() }]);
        setAudit(prev => [{ t, u: "Bhavin", a: "User invited", e: inviteEmail + " · " + inviteRole }, ...prev]);
        setInviteEmail(""); setShowInvite(false);
    }
    function doExport() {
        setExportDone(true);
        setTimeout(() => setExportDone(false), 2500);
    }

    return (
        <div className="g g21">
      <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin & Security</h1></div>
            <div>
                <div className="card mb16">
                    <div className="ch"><span className="ct">Role Permissions Matrix</span></div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="ptbl">
                            <thead><tr><th style={{ textAlign: "left", minWidth: 160 }}>Permission</th>{ROLES.map(r => <th key={r} title={r} style={{ whiteSpace: "nowrap", fontSize: 9, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>{r.split(" ")[0]}</th>)}</tr></thead>
                            <tbody>{PERMS.map(p => <tr key={p.n}><td style={{ textAlign: "left", fontWeight: 500 }}>{p.n}</td>{p.a.map((v, i) => <td key={i}>{v ? <span className="pck">✓</span> : <span className="px">–</span>}</td>)}</tr>)}</tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <div className="ch">
                        <span className="ct">Audit Log</span>
                        <button className="btn btg bts" onClick={doExport}>{exportDone ? "✓ Exported" : "Export CSV"}</button>
                    </div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th></tr></thead>
                            <tbody>
                                {audit.map((r, i) => <tr key={i}><td><span className="tm">{r.t}</span></td><td style={{ fontWeight: 500 }}>{r.u}</td><td className="tdim">{r.a}</td><td style={{ fontSize: 11, color: "var(--text2)" }}>{r.e}</td></tr>)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div>
                <div className="card mb16">
                    <div className="ch"><span className="ct">Users ({users.filter(u => u.status === "active").length} active)</span><button className="btn btp bts" onClick={() => setShowInvite(p => !p)}>+ Invite</button></div>
                    <div className="cb">
                        {showInvite && (
                            <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 12, marginBottom: 16, border: "1px solid var(--border)" }}>
                                <div className="tiny mb8">INVITE NEW USER</div>
                                <div className="frow">
                                    <div className="fg"><label className="fl">Email *</label><input className="fi" placeholder="staff@pryysm.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} /></div>
                                </div>
                                <div className="frow">
                                    <div className="fg"><label className="fl">Role</label><select className="fsel" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
                                    <div className="fg"><label className="fl">Department</label><select className="fsel" value={inviteDept} onChange={e => setInviteDept(e.target.value)}>{DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}</select></div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="btn btp bts" onClick={handleInvite}>Send Invite</button>
                                    <button className="btn btg bts" onClick={() => setShowInvite(false)}>Cancel</button>
                                </div>
                            </div>
                        )}
                        {users.map(u => (
                            <div key={u.id} className="ii" style={{ opacity: u.status === "inactive" ? .5 : 1, transition: "opacity .2s" }}>
                                <div className="iicon" style={{ background: "var(--bg4)", fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{u.initials}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{u.name}</div>
                                    <div className="tiny">{u.role} · {u.dept} · {u.last}</div>
                                </div>
                                <span className={`b ${u.status === "active" ? "brun" : "bidle"}`}>{u.status}</span>
                                {u.name !== "Bhavin" && <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => toggleUser(u.id)}>{u.status === "active" ? "Deactivate" : "Reactivate"}</button>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="ch"><span className="ct">System</span></div>
                    <div className="cb">
                        {[["Product", "Pryysm MES v3.0"], ["Build", "2025-07-14-stable"], ["Database", "PostgreSQL 16.2"], ["Instance", "Pryysm Dubai · On-Premise"], ["Last backup", "Today 03:00 GST"], ["Uptime", "14d 6h 22m"], ["Active sessions", users.filter(u => u.status === "active").length + ""]].map(([k, v]) => (
                            <div key={k} className="rowsb" style={{ padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                                <span className="tiny">{k}</span>
                                <span className="mono">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
/* ══════════════════════════════════════════════════════════════════
   PRINTER FLEET MANAGEMENT
══════════════════════════════════════════════════════════════════ */const FLEET_DATA = [
    {
        id: "PF01", name: "Prusa i3 MK3S+", code: "PRUSA01", model: "MK3S+", location: "Lab 1", type: "FDM", status: "printing", job: "Job 1 for PRUSA01", pct: 39, init: "2023-01-15",
        maintLog: [{ date: "2024-11-10", reason: "Extruder clog", notes: "Cleared blockage, test print passed", by: "Marco R.", result: "Resolved" }, { date: "2025-02-14", reason: "Belt tension", notes: "Re-tensioned X/Y belts", by: "Arjun S.", result: "Resolved" }]
    },
    { id: "PF02", name: "Creality Ender 3 Pro", code: "ENDER01", model: "Ender 3 Pro", location: "Lab 2", type: "FDM", status: "idle", job: null, pct: 0, init: "2022-03-22", maintLog: [] },
    {
        id: "PF03", name: "Ultimaker S5", code: "ULT01", model: "S5", location: "Design Studio", type: "FDM", status: "printing", job: "Job 1 for ULT01", pct: 42, init: "2022-10-05",
        maintLog: [{ date: "2025-01-08", reason: "Printhead replacement", notes: "Replaced printhead AA 0.4", by: "Lena K.", result: "Resolved" }]
    },
    {
        id: "PF04", name: "Anycubic Mega X", code: "ANYC01", model: "Mega X", location: "Workshop", type: "FDM", status: "maintenance", job: null, pct: 0, init: "2021-06-01",
        maintLog: [{ date: "2025-03-15", reason: "Bed levelling failure", notes: "Auto-levelling sensor replaced", by: "Marco R.", result: "In Progress" }, { date: "2024-08-20", reason: "Z-axis binding", notes: "Lubricated lead screw", by: "Arjun S.", result: "Resolved" }]
    },
    { id: "PF05", name: "Bambu Lab A1 mini", code: "BAMB01", model: "A1 mini", location: "Lab 3", type: "FDM", status: "idle", job: null, pct: 0, init: "2023-09-18", maintLog: [] },
    { id: "PF06", name: "Prusa MINI+", code: "PRUSA02", model: "MINI+", location: "Lab 1", type: "FDM", status: "idle", job: null, pct: 0, init: "2023-09-30", maintLog: [] },
    { id: "PF07", name: "EOS Formiga P 110", code: "EOS01", model: "P 110", location: "Lab 2", type: "SLS", status: "idle", job: null, pct: 0, init: "2023-11-01", maintLog: [] },
    {
        id: "PF08", name: "HP Jet Fusion 5200", code: "HPJF01", model: "5200", location: "Prototyping Center", type: "SLS", status: "maintenance", job: null, pct: 0, init: "2023-07-15",
        maintLog: [{ date: "2025-03-10", reason: "Powder feed system", notes: "Cleaning powder paths and valves", by: "Yuki T.", result: "In Progress" }]
    },
    { id: "PF09", name: "Creality K1", code: "CREA02", model: "K1", location: "Lab 1", type: "FDM", status: "offline", job: null, pct: 0, init: "2024-01-20", maintLog: [] },
    { id: "PF10", name: "Formlabs Fuse 1", code: "FUSE01", model: "Fuse 1", location: "SLS Room", type: "SLS", status: "idle", job: null, pct: 0, init: "2023-12-19", maintLog: [] },
    { id: "PF11", name: "Raise3D Pro3", code: "RAISE01", model: "Pro3", location: "Lab 0", type: "FDM", status: "offline", job: null, pct: 0, init: "2022-12-12", maintLog: [] },
    { id: "PF12", name: "Anycubic Photon M3", code: "ANYC02", model: "Photon M3", location: "Design Studio", type: "SLA", status: "idle", job: null, pct: 0, init: "2024-03-31", maintLog: [] },
];

const MAINT_REASONS = ["Extruder / Nozzle Clog", "Bed Levelling Issue", "Belt Tension", "Z-axis Binding", "Printhead Replacement", "Sensor Failure", "Firmware Update", "Powder Feed System", "Resin Vat Cleaning", "Routine Inspection", "Other"];

