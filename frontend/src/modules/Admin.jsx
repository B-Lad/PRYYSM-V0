import React, { useState, useEffect } from "react";
import { Tabs, Modal } from '../components/atoms.jsx';
import { api } from '../services/api.js';

export function Admin() {
    // 1. Get role from storage
    const storedRole = localStorage.getItem("user_role");
    const [userRole, setUserRole] = useState(storedRole);
    
    // 2. Set default tab based on role
    const [tab, setTab] = useState(userRole === 'super_admin' ? "companies" : "users");
    
    const [users, setUsers] = useState([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateCompany, setShowCreateCompany] = useState(false);

    const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "operator" });
    const [newCompany, setNewCompany] = useState({ name: "", slug: "", contact_email: "", admin_email: "", admin_password: "", max_users: 5, max_machines: 2 });

    useEffect(() => {
        api.getUsers().then(setUsers).catch(console.error);
    }, []);

    async function handleCreateUser() {
        try {
            await api.createUser(newUser);
            setUsers([...users, newUser]);
            setShowCreateUser(false);
            setNewUser({ email: "", full_name: "", password: "", role: "operator" });
        } catch (err) {
            alert("Failed to create user.");
        }
    }

    async function handleUpdateRole(userId, newRole, isActive) {
        try {
            await api.updateUser(userId, { role: newRole, is_active: isActive });
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, is_active: isActive } : u));
        } catch (err) {
            alert("Failed to update user");
        }
    }

    async function handleCreateCompany() {
        try {
            await api.createTenant(newCompany);
            setShowCreateCompany(false);
            setNewCompany({ name: "", slug: "", contact_email: "", admin_email: "", admin_password: "", max_users: 5, max_machines: 2 });
            alert("Company created successfully!");
        } catch (err) {
            alert("Failed to create company");
        }
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin Panel</h1></div>
            
            {/* 🟡 DEBUG BOX: Shows your current role */}
            <div style={{ background: "#fbbf24", color: "black", padding: 12, marginBottom: 16, borderRadius: 8, fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
                <span>🔍 DEBUG: Your Role is: {userRole || "NOT SET"}</span>
                <span style={{fontSize: 12}}>Must be "super_admin" to see Companies</span>
            </div>
            
            {/* 🏢 Companies Tab (Only for Super Admin) */}
            {userRole === 'super_admin' && (
                <Tabs tabs={[{id:"companies", label:"🏢 Companies"}, {id:"users", label:"👥 Global Users"}]} active={tab} onChange={setTab} />
            )}

            {tab === "companies" && userRole === 'super_admin' && (
                <div className="card mb16">
                    <div className="ch"><span className="ct">Manage Companies</span><button className="btn btp bts" onClick={() => setShowCreateCompany(true)}>+ New Company</button></div>
                    <div className="tw">
                        <p style={{padding: 20, textAlign: "center", color: "var(--text3)"}}>Super Admin Company Management UI</p>
                    </div>
                </div>
            )}

            {/* 👥 Users Tab */}
            {tab === "users" && (
                <div className="card">
                    <div className="ch"><span className="ct">User Management</span><button className="btn btp bts" onClick={() => setShowCreateUser(true)}>+ Add User</button></div>
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

            {/* Create User Modal */}
            {showCreateUser && (
                <Modal title="Add User" onClose={() => setShowCreateUser(false)} footer={<><button className="btn btg bts" onClick={()=>setShowCreateUser(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateUser}>Create</button></>}>
                    <div className="fg mb8"><label className="fl">Name</label><input className="fi" value={newUser.full_name} onChange={e=>setNewUser({...newUser, full_name:e.target.value})}/></div>
                    <div className="fg mb8"><label className="fl">Email</label><input className="fi" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})}/></div>
                    <div className="fg mb8"><label className="fl">Password</label><input className="fi" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})}/></div>
                    <div className="fg mb8"><label className="fl">Role</label>
                        <select className="fsel" value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})}>
                            <option value="operator">Operator</option><option value="manager">Manager</option><option value="admin">Admin</option>
                        </select>
                    </div>
                </Modal>
            )}

            {/* Create Company Modal (Super Admin Only) */}
            {showCreateCompany && (
                <Modal title="New Company" onClose={() => setShowCreateCompany(false)} footer={<><button className="btn btg bts" onClick={()=>setShowCreateCompany(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateCompany}>Create Company</button></>}>
                    <div className="fg mb6"><label className="fl">Company Name</label><input className="fi" value={newCompany.name} onChange={e=>setNewCompany({...newCompany, name:e.target.value})}/></div>
                    <div className="fg mb6"><label className="fl">Slug (URL-safe)</label><input className="fi" value={newCompany.slug} onChange={e=>setNewCompany({...newCompany, slug:e.target.value})}/></div>
                    <div className="fg mb6"><label className="fl">Admin Email</label><input className="fi" value={newCompany.admin_email} onChange={e=>setNewCompany({...newCompany, admin_email:e.target.value})}/></div>
                    <div className="fg mb6"><label className="fl">Admin Password</label><input className="fi" type="password" value={newCompany.admin_password} onChange={e=>setNewCompany({...newCompany, admin_password:e.target.value})}/></div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Max Users</label><input className="fi" type="number" value={newCompany.max_users} onChange={e=>setNewCompany({...newCompany, max_users:parseInt(e.target.value)})}/></div>
                        <div className="fg"><label className="fl">Max Machines</label><input className="fi" type="number" value={newCompany.max_machines} onChange={e=>setNewCompany({...newCompany, max_machines:parseInt(e.target.value)})}/></div>
                    </div>
                </Modal>
            )}
        </div>
    );
}``