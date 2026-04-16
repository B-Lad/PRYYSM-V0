import React, { useState, useEffect } from "react";
import { Tabs, Modal } from '../components/atoms.jsx';
import { api } from '../services/api.js';

export function Admin() {
    const storedRole = localStorage.getItem("user_role");
    const storedTenantId = localStorage.getItem("tenant_id");
    const [userRole, setUserRole] = useState(storedRole);
    const [tenantId, setTenantId] = useState(storedTenantId);
    const [tab, setTab] = useState(userRole === 'super_admin' ? "companies" : "members");
    const [users, setUsers] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateCompany, setShowCreateCompany] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "operator" });
    const [newCompany, setNewCompany] = useState({ name: "", slug: "", contact_email: "", admin_email: "", admin_password: "", max_users: 5, max_machines: 2 });

    useEffect(() => {
        if (userRole === 'super_admin') {
            api.getTenants().then(setUsers).catch(console.error);
        } else if (tenantId) {
            api.getTenant(tenantId).then(setTenant).catch(console.error);
            api.getTenantUsers(tenantId).then(setUsers).catch(console.error);
        } else {
            api.getUsers().then(setUsers).catch(console.error);
        }
    }, [userRole, tenantId]);

    async function handleCreateUser() {
        if (!newUser.email || !newUser.full_name || !newUser.password) {
            alert("Please fill in all fields");
            return;
        }
        if (tenant && users.length >= tenant.max_users) {
            alert(`Your plan allows only ${tenant.max_users} users. Contact super admin to upgrade.`);
            return;
        }
        try {
            await api.createUser({ ...newUser, tenant_id: tenantId });
            const updated = await api.getTenantUsers(tenantId);
            setUsers(updated);
            setShowCreateUser(false);
            setNewUser({ email: "", full_name: "", password: "", role: "operator" });
            alert("Member added successfully!");
        } catch (err) {
            alert("Failed to add member: " + err.message);
        }
    }

    async function handleDeleteUser(userId) {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.updateUser(userId, { role: "operator", is_active: false });
            const updated = await api.getTenantUsers(tenantId);
            setUsers(updated);
            setShowDeleteConfirm(null);
            alert("Member removed.");
        } catch (err) {
            alert("Failed to remove member.");
        }
    }

    async function handleUpdateRole(userId, newRole, isActive) {
        try {
            await api.updateUser(userId, { role: newRole, is_active: isActive });
            if (tenantId) {
                const updated = await api.getTenantUsers(tenantId);
                setUsers(updated);
            } else {
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, is_active: isActive } : u));
            }
        } catch (err) {
            alert("Failed to update role");
        }
    }

    async function handleCreateCompany() {
        if (!newCompany.name || !newCompany.slug || !newCompany.admin_email || !newCompany.admin_password) {
            alert("Please fill in all required fields");
            return;
        }
        try {
            await api.createTenant(newCompany);
            const tenants = await api.getTenants();
            setUsers(tenants);
            setShowCreateCompany(false);
            setNewCompany({ name: "", slug: "", contact_email: "", admin_email: "", admin_password: "", max_users: 5, max_machines: 2 });
            alert("Company created successfully!");
        } catch (err) {
            alert("Failed to create company: " + err.message);
        }
    }

    const isSuperAdmin = userRole === 'super_admin';
    const isCompanyAdmin = userRole === 'admin' && tenantId;

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin Panel</h1></div>

            {isSuperAdmin && (
                <>
                    <Tabs tabs={[{id:"companies", label:"🏢 Companies"}, {id:"users", label:"👥 Global Users"}]} active={tab} onChange={setTab} />
                </>
            )}

            {isSuperAdmin && tab === "companies" && (
                <div className="card mb16">
                    <div className="ch"><span className="ct">Manage Companies</span><button className="btn btp bts" onClick={() => setShowCreateCompany(true)}>+ New Company</button></div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Company</th><th>Slug</th><th>Max Users</th><th>Max Machines</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(c => (
                                    <tr key={c.id} style={{borderBottom: "1px solid var(--border)"}}>
                                        <td style={{padding: "10px 12px", fontWeight: "bold"}}>{c.name}</td>
                                        <td style={{padding: "10px 12px", color: "var(--text3)"}}>{c.slug}</td>
                                        <td style={{padding: "10px 12px"}}>{c.max_users || 5}</td>
                                        <td style={{padding: "10px 12px"}}>{c.max_machines || 2}</td>
                                        <td style={{padding: "10px 12px", textAlign: "right"}}>
                                            <button className="btn btd bts" style={{fontSize:10}}>Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isSuperAdmin && tab === "users" && (
                <div className="card">
                    <div className="ch"><span className="ct">Global Users</span></div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{borderBottom: "1px solid var(--border)"}}>
                                        <td style={{padding: "10px 12px"}}>{u.full_name || "—"}</td>
                                        <td style={{padding: "10px 12px"}}>{u.email}</td>
                                        <td style={{padding: "10px 12px"}}>
                                            <select className="fsel" style={{fontSize:11}} value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value, u.is_active)}>
                                                <option value="operator">Operator</option>
                                                <option value="manager">Manager</option>
                                                <option value="qa">QA</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </td>
                                        <td style={{padding: "10px 12px"}}><span className={`b ${u.is_active ? "brun" : "bidle"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                                        <td style={{padding: "10px 12px", textAlign: "right"}}>
                                            <button className="btn btg bts" style={{fontSize:10}} onClick={() => handleUpdateRole(u.id, u.role, !u.is_active)}>
                                                {u.is_active ? "Deactivate" : "Activate"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isCompanyAdmin && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">👥 Team Members ({users.length}{tenant ? ` / ${tenant.max_users}` : ''})</span>
                        {(!tenant || users.length < tenant.max_users) && (
                            <button className="btn btp bts" onClick={() => setShowCreateUser(true)}>+ Add Member</button>
                        )}
                    </div>
                    {tenant && users.length >= tenant.max_users && (
                        <div style={{padding: "8px 16px", background: "#fef3c7", color: "#92400e", fontSize: 12, borderBottom: "1px solid var(--border)"}}>
                            ⚠️ You've reached your limit of {tenant.max_users} members. Contact super admin to upgrade.
                        </div>
                    )}
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{borderBottom: "1px solid var(--border)"}}>
                                        <td style={{padding: "10px 12px"}}>{u.full_name || "—"}</td>
                                        <td style={{padding: "10px 12px"}}>{u.email}</td>
                                        <td style={{padding: "10px 12px"}}>
                                            <select className="fsel" style={{fontSize:11}} value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value, u.is_active)}>
                                                <option value="operator">Operator</option>
                                                <option value="manager">Manager</option>
                                                <option value="qa">QA</option>
                                            </select>
                                        </td>
                                        <td style={{padding: "10px 12px"}}><span className={`b ${u.is_active ? "brun" : "bidle"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                                        <td style={{padding: "10px 12px", textAlign: "right"}}>
                                            {u.role !== 'admin' && (
                                                <button className="btn btd bts" style={{fontSize:10}} onClick={() => setShowDeleteConfirm(u.id)}>Remove</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isSuperAdmin && !isCompanyAdmin && (
                <div className="card">
                    <div className="ch"><span className="ct">User Management</span></div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{borderBottom: "1px solid var(--border)"}}>
                                        <td style={{padding: "10px 12px"}}>{u.full_name || "—"}</td>
                                        <td style={{padding: "10px 12px"}}>{u.email}</td>
                                        <td style={{padding: "10px 12px"}}>{u.role}</td>
                                        <td style={{padding: "10px 12px"}}><span className={`b ${u.is_active ? "brun" : "bidle"}`}>{u.is_active ? "Active" : "Inactive"}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showCreateUser && (
                <Modal title="Add Member" onClose={() => setShowCreateUser(false)} footer={<><button className="btn btg bts" onClick={()=>setShowCreateUser(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateUser}>Add Member</button></>}>
                    <div className="fg mb8"><label className="fl">Name</label><input className="fi" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name:e.target.value})} placeholder="Full name"/></div>
                    <div className="fg mb8"><label className="fl">Email</label><input className="fi" type="email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} placeholder="email@company.com"/></div>
                    <div className="fg mb8"><label className="fl">Password</label><input className="fi" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} placeholder="Temporary password"/></div>
                    <div className="fg mb8"><label className="fl">Role</label>
                        <select className="fsel" value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
                            <option value="operator">Operator</option>
                            <option value="manager">Manager</option>
                            <option value="qa">QA</option>
                        </select>
                    </div>
                </Modal>
            )}

            {showCreateCompany && (
                <Modal title="New Company" onClose={() => setShowCreateCompany(false)} footer={<><button className="btn btg bts" onClick={()=>setShowCreateCompany(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateCompany}>Create Company</button></>}>
                    <div className="fg mb6"><label className="fl">Company Name</label><input className="fi" value={newCompany.name} onChange={e=>setNewCompany({...newCompany, name:e.target.value})} placeholder="Acme Corp"/></div>
                    <div className="fg mb6"><label className="fl">Slug (URL-safe)</label><input className="fi" value={newCompany.slug} onChange={e=>setNewCompany({...newCompany, slug:e.target.value})} placeholder="acme-corp"/></div>
                    <div className="fg mb6"><label className="fl">Admin Email</label><input className="fi" type="email" value={newCompany.admin_email} onChange={e=>setNewCompany({...newCompany, admin_email:e.target.value})} placeholder="admin@acme.com"/></div>
                    <div className="fg mb6"><label className="fl">Admin Password</label><input className="fi" type="password" value={newCompany.admin_password} onChange={e=>setNewCompany({...newCompany, admin_password:e.target.value})} placeholder="Create password"/></div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Max Users</label><input className="fi" type="number" value={newCompany.max_users} onChange={e=>setNewCompany({...newCompany, max_users:parseInt(e.target.value)||5})}/></div>
                        <div className="fg"><label className="fl">Max Machines</label><input className="fi" type="number" value={newCompany.max_machines} onChange={e=>setNewCompany({...newCompany, max_machines:parseInt(e.target.value)||2})}/></div>
                    </div>
                </Modal>
            )}

            {showDeleteConfirm && (
                <Modal title="Remove Member" onClose={() => setShowDeleteConfirm(null)} footer={<><button className="btn btg bts" onClick={()=>setShowDeleteConfirm(null)}>Cancel</button><button className="btn btd bts" onClick={()=>handleDeleteUser(showDeleteConfirm)}>Remove</button></>}>
                    <p>Are you sure you want to remove this member? They will be deactivated but not deleted.</p>
                </Modal>
            )}
        </div>
    );
}