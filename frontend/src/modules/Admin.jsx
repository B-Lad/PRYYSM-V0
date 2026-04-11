import React, { useState } from "react";
import { DEPARTMENTS } from '../data/seed.jsx';
import { Tabs, Modal } from '../components/atoms.jsx';

export function Admin() {
    const [activeTab, setActiveTab] = useState("permissions");
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Dept Requestor");
    const [inviteDept, setInviteDept] = useState("ENG");
    const [exportDone, setExportDone] = useState(false);
    const [editPermModal, setEditPermModal] = useState(null);
    const [editPermValue, setEditPermValue] = useState(false);

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

    const [perms, setPerms] = useState(PERMS);

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

    const tabs = [
        { id: "permissions", label: "Permissions" },
        { id: "users", label: `Users (${users.filter(u => u.status === "active").length})` },
        { id: "audit", label: "Audit Log" },
        { id: "system", label: "System Info" },
    ];

    function toggleUser(id) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "active" ? "inactive" : "active" } : u));
        const u = users.find(x => x.id === id);
        const now = new Date();
        const t = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        setAudit(prev => [{ t, u: "Bhavin", a: u.status === "active" ? "User deactivated" : "User reactivated", e: u.name + " · " + u.role }, ...prev]);
    }

    function openPermEdit(permIdx, roleIdx) {
        setEditPermModal({ permIdx, roleIdx });
        setEditPermValue(perms[permIdx].a[roleIdx] === 1);
    }

    function savePermEdit() {
        if (!editPermModal) return;
        const { permIdx, roleIdx } = editPermModal;
        const now = new Date();
        const t = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

        setPerms(prev => {
            const updated = [...prev];
            updated[permIdx] = {
                ...updated[permIdx],
                a: updated[permIdx].a.map((val, i) => i === roleIdx ? (editPermValue ? 1 : 0) : val)
            };
            return updated;
        });

        setAudit(prev => [{
            t,
            u: "Bhavin",
            a: "Permission updated",
            e: `${ROLES[roleIdx]} - ${PERMS[permIdx].n}: ${editPermValue ? "Granted" : "Revoked"}`
        }, ...prev]);

        setEditPermModal(null);
        setEditPermValue(false);
    }

    function handleInvite() {
        if (!inviteEmail.trim()) return;
        const now = new Date(), t = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const name = inviteEmail.split("@")[0];
        setUsers(prev => [...prev, { id: Date.now(), name, role: inviteRole, status: "active", dept: inviteDept, last: "Just now", initials: name.slice(0, 2).toUpperCase() }]);
        setAudit(prev => [{ t, u: "Bhavin", a: "User invited", e: inviteEmail + " · " + inviteRole }, ...prev]);
        setInviteEmail("");
        setShowInvite(false);
    }

    function doExport() {
        setExportDone(true);
        setTimeout(() => setExportDone(false), 2500);
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin & Security</h1></div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* Permissions Tab */}
            {activeTab === "permissions" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">Role Permissions Matrix</span>
                        <span className="tiny" style={{ color: "var(--text3)", fontWeight: 400 }}>Click any cell to edit</span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="ptbl">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", minWidth: 160 }}>Permission</th>
                                    {ROLES.map(r => (
                                        <th key={r} title={r} style={{ whiteSpace: "nowrap", fontSize: 9, maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {r.split(" ")[0]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {perms.map((p, permIdx) => (
                                    <tr key={p.n}>
                                        <td style={{ textAlign: "left", fontWeight: 500 }}>{p.n}</td>
                                        {p.a.map((v, roleIdx) => (
                                            <td key={roleIdx}>
                                                <div
                                                    onClick={() => openPermEdit(permIdx, roleIdx)}
                                                    style={{
                                                        cursor: "pointer",
                                                        padding: "4px 8px",
                                                        borderRadius: 4,
                                                        transition: "all .15s",
                                                        background: v ? "rgba(15,155,106,.1)" : "transparent",
                                                        border: v ? "1px solid rgba(15,155,106,.3)" : "1px solid transparent"
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = v ? "rgba(15,155,106,.2)" : "var(--bg3)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = v ? "rgba(15,155,106,.1)" : "transparent"}
                                                >
                                                    {v ? <span className="pck">✓</span> : <span className="px">–</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">User Management</span>
                        <button className="btn btp bts" onClick={() => setShowInvite(p => !p)}>+ Invite User</button>
                    </div>
                    <div className="cb">
                        {showInvite && (
                            <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, marginBottom: 16, border: "1px solid var(--border)" }}>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, marginBottom: 10, color: "var(--text3)" }}>INVITE NEW USER</div>
                                <div className="frow">
                                    <div className="fg">
                                        <label className="fl">Email *</label>
                                        <input className="fi" placeholder="staff@pryysm.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                                    </div>
                                </div>
                                <div className="frow">
                                    <div className="fg">
                                        <label className="fl">Role</label>
                                        <select className="fsel" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                                            {ROLES.map(r => <option key={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div className="fg">
                                        <label className="fl">Department</label>
                                        <select className="fsel" value={inviteDept} onChange={e => setInviteDept(e.target.value)}>
                                            {DEPARTMENTS.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
                                {u.name !== "Bhavin" && (
                                    <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => toggleUser(u.id)}>
                                        {u.status === "active" ? "Deactivate" : "Reactivate"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === "audit" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">Audit Trail</span>
                        <button className="btn btg bts" onClick={doExport}>{exportDone ? "✓ Exported" : "Export CSV"}</button>
                    </div>
                    <div className="tw">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audit.map((r, i) => (
                                    <tr key={i}>
                                        <td><span className="tm">{r.t}</span></td>
                                        <td style={{ fontWeight: 500 }}>{r.u}</td>
                                        <td className="tdim">{r.a}</td>
                                        <td style={{ fontSize: 11, color: "var(--text2)" }}>{r.e}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* System Info Tab */}
            {activeTab === "system" && (
                <div className="card">
                    <div className="ch"><span className="ct">System Information</span></div>
                    <div className="cb">
                        {[
                            ["Product", "Pryysm MES v3.0"],
                            ["Build", "2025-07-14-stable"],
                            ["Database", "PostgreSQL 16.2"],
                            ["Instance", "Pryysm Dubai · On-Premise"],
                            ["Last backup", "Today 03:00 GST"],
                            ["Uptime", "14d 6h 22m"],
                            ["Active sessions", users.filter(u => u.status === "active").length + ""]
                        ].map(([k, v]) => (
                            <div key={k} className="rowsb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ fontSize: 12, fontWeight: 600 }}>{k}</span>
                                <span className="mono" style={{ fontSize: 12 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Permission Modal */}
            {editPermModal && (
                <Modal
                    title="Edit Permission"
                    onClose={() => { setEditPermModal(null); setEditPermValue(false); }}
                    footer={(
                        <>
                            <button className="btn btg bts" onClick={() => { setEditPermModal(null); setEditPermValue(false); }}>Cancel</button>
                            <button className="btn btp bts" onClick={savePermEdit}>Save Change</button>
                        </>
                    )}
                >
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)" }}>
                        <div className="rowsb mb8">
                            <span className="tiny" style={{ color: "var(--text3)" }}>Role</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{ROLES[editPermModal.roleIdx]}</span>
                        </div>
                        <div className="rowsb mb8">
                            <span className="tiny" style={{ color: "var(--text3)" }}>Permission</span>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{PERMS[editPermModal.permIdx].n}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <div className="tiny mb8" style={{ color: "var(--text3)" }}>Permission Status</div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                className={`btn bts ${editPermValue ? "btp" : "btg"}`}
                                style={{ flex: 1 }}
                                onClick={() => setEditPermValue(true)}
                            >
                                ✓ Grant Permission
                            </button>
                            <button
                                className={`btn bts ${!editPermValue ? "btd" : "btg"}`}
                                style={{ flex: 1 }}
                                onClick={() => setEditPermValue(false)}
                            >
                                ✕ Revoke Permission
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: 16, padding: 12, background: "var(--ydim)", border: "1px solid rgba(245,158,11,.2)", borderRadius: "var(--r2)", fontSize: 11 }}>
                        <div style={{ fontFamily: "var(--fd)", fontWeight: 700, color: "var(--yellow)", marginBottom: 4 }}>⚠️ Note</div>
                        <div style={{ color: "var(--text2)" }}>
                            Changes to permissions are logged in the audit trail. This will immediately affect user access for this role.
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
