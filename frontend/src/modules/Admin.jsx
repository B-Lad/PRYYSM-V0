import React, { useState, useEffect } from "react";
import { Tabs, Modal } from '../components/atoms.jsx';
import { api } from '../services/api.js';

export function Admin() {
    const [users, setUsers] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newUser, setNewUser] = useState({ email: "", full_name: "", password: "", role: "operator" });

    useEffect(() => {
        api.getUsers().then(setUsers).catch(console.error);
    }, []);

    async function handleCreateUser() {
        try {
            const created = await api.createUser(newUser);
            setUsers([...users, created]);
            setShowCreate(false);
            setNewUser({ email: "", full_name: "", password: "", role: "operator" });
        } catch (err) {
            alert("Failed to create user. Email might be taken.");
        }
    }

    async function handleUpdateRole(userId, newRole, isActive) {
        try {
            const updated = await api.updateUser(userId, { role: newRole, is_active: isActive });
            setUsers(users.map(u => u.id === userId ? updated : u));
        } catch (err) {
            console.error("Failed to update user");
        }
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin & User Management</h1></div>

            <div className="card mb16">
                <div className="ch">
                    <span className="ct">System Users</span>
                    <button className="btn btp bts" onClick={() => setShowCreate(true)}>+ Add User</button>
                </div>
                <div className="tw">
                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>Name / Email</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>Role</th>
                                <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>Status</th>
                                <th style={{ textAlign: "right", padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "10px 12px" }}>
                                        <div style={{ fontWeight: 600, fontSize: 12 }}>{u.full_name || "No Name"}</div>
                                        <div className="tiny" style={{ color: "var(--text3)" }}>{u.email}</div>
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <select
                                            value={u.role}
                                            onChange={e => handleUpdateRole(u.id, e.target.value, u.is_active)}
                                            className="fsel"
                                            style={{ fontSize: 11, padding: "4px 8px", width: 130 }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="operator">Operator</option>
                                            <option value="manager">Manager</option>
                                            <option value="qa">QA Inspector</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: "10px 12px" }}>
                                        <span className={`b ${u.is_active ? "brun" : "bidle"}`}>{u.is_active ? "Active" : "Inactive"}</span>
                                    </td>
                                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                        <button
                                            onClick={() => handleUpdateRole(u.id, u.role, !u.is_active)}
                                            className="btn btg bts"
                                            style={{ fontSize: 10 }}
                                        >
                                            {u.is_active ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr><td colSpan="4" style={{ padding: 20, textAlign: "center", color: "var(--text3)" }}>No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <Modal title="Add New User" onClose={() => setShowCreate(false)} footer={(
                    <>
                        <button className="btn btg bts" onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className="btn btp bts" onClick={handleCreateUser}>Create User</button>
                    </>
                )}>
                    <div className="fg mb12"><label className="fl">Full Name</label><input className="fi" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} /></div>
                    <div className="fg mb12"><label className="fl">Email</label><input className="fi" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                    <div className="fg mb12"><label className="fl">Password</label><input className="fi" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    <div className="fg mb12">
                        <label className="fl">Role</label>
                        <select className="fsel" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            <option value="operator">Operator</option>
                            <option value="manager">Manager</option>
                            <option value="qa">QA Inspector</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </Modal>
            )}
        </div>
    );
}
