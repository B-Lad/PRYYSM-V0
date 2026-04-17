import React, { useEffect, useState } from "react";
import { Tabs, Modal } from '../components/atoms.jsx';
import { api } from '../services/api.js';
import { NAV } from '../data/nav.js';

const EMPTY_USER = {
    email: "",
    full_name: "",
    password: "",
    role: "operator",
    allowed_tabs: ["overview"],
};

const EMPTY_COMPANY = {
    name: "",
    slug: "",
    contact_email: "",
    admin_email: "",
    admin_password: "",
    max_users: 5,
    max_machines: 2,
};

function labelForTab(tabId) {
    return NAV.find(item => item.id === tabId)?.label || tabId;
}

function AccessSummary({ tabs }) {
    if (!tabs?.length) return <span className="tiny">No tab access assigned</span>;
    return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tabs.map(tabId => (
                <span key={tabId} className="b bidle">{labelForTab(tabId)}</span>
            ))}
        </div>
    );
}

function AccessMatrix({ options, value, onToggle }) {
    return (
        <div className="tw">
            <table className="ptbl">
                <thead>
                    <tr>
                        <th style={{ textAlign: "left" }}>Tab</th>
                        <th>Allow</th>
                    </tr>
                </thead>
                <tbody>
                    {options.map(option => (
                        <tr key={option.id}>
                            <td style={{ textAlign: "left" }}>{option.label}</td>
                            <td>
                                <input type="checkbox" checked={value.includes(option.id)} onChange={() => onToggle(option.id)} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Admin({ session, onSessionRefresh }) {
    const [tab, setTab] = useState(session?.role === 'super_admin' ? "companies" : "members");
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [tenant, setTenant] = useState(null);
    const [companyMembers, setCompanyMembers] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showManageCompany, setShowManageCompany] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showAccessEditor, setShowAccessEditor] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [memberTargetTenant, setMemberTargetTenant] = useState(null);
    const [newUser, setNewUser] = useState(EMPTY_USER);
    const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);
    const [accessOptions, setAccessOptions] = useState([]);

    const userRole = session?.role || localStorage.getItem("user_role");
    const tenantId = session?.tenant_id || localStorage.getItem("tenant_id");
    const isSuperAdmin = userRole === 'super_admin';
    const isCompanyAdmin = userRole === 'admin' && tenantId;
    const assignableTabs = accessOptions.length
        ? accessOptions
        : NAV.filter(item => !["admin", "config"].includes(item.id)).map(item => ({ id: item.id, label: item.label }));

    useEffect(() => {
        setTab(userRole === 'super_admin' ? "companies" : "members");
    }, [userRole]);

    useEffect(() => {
        if (!session) return;
        loadData();
    }, [session, tab]);

    async function loadData() {
        try {
            if (isSuperAdmin) {
                const [tenantList, access] = await Promise.all([
                    api.getTenants(),
                    api.getAccessOptions().catch(() => ({ assignable_tabs: [] })),
                ]);
                setCompanies(tenantList);
                setAccessOptions((access.assignable_tabs || []).map(id => ({ id, label: labelForTab(id) })));
                if (tab === "users") {
                    const allUsers = await api.getUsers();
                    setUsers(allUsers);
                }
            } else if (isCompanyAdmin) {
                const [tenantProfile, members, access] = await Promise.all([
                    api.getCompanyProfile(),
                    api.getCompanyMembers(),
                    api.getAccessOptions(),
                ]);
                setTenant(tenantProfile);
                setUsers(members);
                setAccessOptions((access.assignable_tabs || []).map(id => ({ id, label: labelForTab(id) })));
            }
        } catch (err) {
            console.error(err);
        }
    }

    function resetMemberForm(defaultRoleOptions = "operator", allowedTabs = ["overview"]) {
        setNewUser({
            ...EMPTY_USER,
            role: defaultRoleOptions,
            allowed_tabs: allowedTabs,
        });
    }

    function toggleTab(tabId, source, setter) {
        const current = source.allowed_tabs || [];
        const next = current.includes(tabId)
            ? current.filter(item => item !== tabId)
            : [...current, tabId];
        setter({ ...source, allowed_tabs: next.length ? next : ["overview"] });
    }

    function openCreateCompanyModal(company = null) {
        setEditingCompany(company);
        setCompanyForm(company ? {
            name: company.name || "",
            slug: company.slug || "",
            contact_email: company.contact_email || "",
            admin_email: "",
            admin_password: "",
            max_users: company.max_users || 5,
            max_machines: company.max_machines || 2,
        } : EMPTY_COMPANY);
        setShowCompanyModal(true);
    }

    function openCreateMemberModal(targetTenantId, company = null) {
        setMemberTargetTenant(targetTenantId);
        if (company) setSelectedCompany(company);
        resetMemberForm("operator", [assignableTabs[0]?.id || "overview"]);
        setShowMemberModal(true);
    }

    async function handleResetCompanyPassword(company) {
        if (!confirm(`Reset password for ${company.name} admin? A new password will be generated.`)) return;

        try {
            const result = await api.resetCompanyPassword(company.id);
            alert(`Password reset successful! New password: ${result.new_password}\n\nPlease save this password securely.`);
        } catch (err) {
            alert("Failed to reset password: " + err.message);
        }
    }

    async function handleCreateCompany() {
        if (!companyForm.name || !companyForm.slug) {
            alert("Please fill in the company name and slug.");
            return;
        }

        try {
            if (editingCompany) {
                await api.updateTenant(editingCompany.id, {
                    name: companyForm.name,
                    slug: companyForm.slug,
                    contact_email: companyForm.contact_email,
                    max_users: Number(companyForm.max_users),
                    max_machines: Number(companyForm.max_machines),
                });
            } else {
                if (!companyForm.admin_email || !companyForm.admin_password) {
                    alert("Please add the company admin email and password.");
                    return;
                }
                await api.createTenant({
                    ...companyForm,
                    max_users: Number(companyForm.max_users),
                    max_machines: Number(companyForm.max_machines),
                });
            }
            setShowCompanyModal(false);
            setEditingCompany(null);
            setCompanyForm(EMPTY_COMPANY);
            await loadData();
            if (selectedCompany) {
                const refreshed = await api.getTenant(selectedCompany.id);
                setSelectedCompany(refreshed);
            }
        } catch (err) {
            alert("Failed to save company: " + err.message);
        }
    }

        try {
            if (editingCompany) {
                await api.updateTenant(editingCompany.id, {
                    name: companyForm.name,
                    slug: companyForm.slug,
                    contact_email: companyForm.contact_email,
                    max_users: Number(companyForm.max_users),
                    max_machines: Number(companyForm.max_machines),
                });
            } else {
                if (!companyForm.admin_email || !companyForm.admin_password) {
                    alert("Please add the company admin email and password.");
                    return;
                }
                await api.createTenant({
                    ...companyForm,
                    max_users: Number(companyForm.max_users),
                    max_machines: Number(companyForm.max_machines),
                });
            }
            setShowCompanyModal(false);
            setEditingCompany(null);
            setCompanyForm(EMPTY_COMPANY);
            await loadData();
            if (selectedCompany) {
                const refreshed = await api.getTenant(selectedCompany.id);
                setSelectedCompany(refreshed);
            }
        } catch (err) {
            alert(err.message || "Failed to save company.");
        }
    }

    async function handleManageCompany(company) {
        try {
            const [profile, members] = await Promise.all([
                api.getTenant(company.id),
                api.getTenantUsers(company.id),
            ]);
            setSelectedCompany(profile);
            setCompanyMembers(members);
            setShowManageCompany(true);
        } catch (err) {
            alert(err.message || "Failed to load company details.");
        }
    }

    async function handleCreateUser() {
        if (!newUser.email || !newUser.full_name || !newUser.password) {
            alert("Please fill in all user fields.");
            return;
        }
        try {
            await api.createUser({
                ...newUser,
                tenant_id: memberTargetTenant,
            });
            setShowMemberModal(false);
            resetMemberForm("operator", [assignableTabs[0]?.id || "overview"]);
            if (isCompanyAdmin) {
                await loadData();
            }
            if (selectedCompany && memberTargetTenant === selectedCompany.id) {
                const members = await api.getTenantUsers(selectedCompany.id);
                setCompanyMembers(members);
            }
            if (onSessionRefresh) onSessionRefresh();
        } catch (err) {
            alert(err.message || "Failed to create member.");
        }
    }

    async function handleUpdateMember(nextMember) {
        try {
            await api.updateUser(nextMember.id, {
                role: nextMember.role,
                is_active: nextMember.is_active,
                allowed_tabs: nextMember.allowed_tabs || [],
            });
            setShowAccessEditor(false);
            setEditingMember(null);
            if (isCompanyAdmin) {
                await loadData();
            }
            if (selectedCompany) {
                const members = await api.getTenantUsers(selectedCompany.id);
                setCompanyMembers(members);
            }
            if (onSessionRefresh && nextMember.id === session?.id) onSessionRefresh();
        } catch (err) {
            alert(err.message || "Failed to update member.");
        }
    }

    async function handleDeleteUser(member) {
        try {
            await api.updateUser(member.id, {
                role: member.role,
                is_active: false,
                allowed_tabs: member.allowed_tabs || [],
            });
            setShowDeleteConfirm(null);
            if (isCompanyAdmin) {
                await loadData();
            }
            if (selectedCompany) {
                const members = await api.getTenantUsers(selectedCompany.id);
                setCompanyMembers(members);
            }
        } catch (err) {
            alert(err.message || "Failed to deactivate member.");
        }
    }

    function openAccessEditor(member) {
        setEditingMember({
            ...member,
            allowed_tabs: member.allowed_tabs?.length ? member.allowed_tabs : [assignableTabs[0]?.id || "overview"],
        });
        setShowAccessEditor(true);
    }

    const companyRoleOptions = ["operator", "manager", "qa"];
    const superAdminRoleOptions = ["operator", "manager", "qa", "admin"];

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Admin Panel</h1></div>

            {isSuperAdmin && (
                <Tabs tabs={[{ id: "companies", label: "🏢 Companies" }, { id: "users", label: "👥 Global Users" }]} active={tab} onChange={setTab} />
            )}

            {isSuperAdmin && tab === "companies" && (
                <div className="card mb16">
                    <div className="ch">
                        <span className="ct">Manage Companies</span>
                        <button type="button" className="btn btp bts" onClick={() => openCreateCompanyModal()}>+ New Company</button>
                    </div>
                    <div className="tw">
                        {companies.length === 0 ? (
                            <p style={{ textAlign: "center", padding: 20, color: "var(--text3)" }}>No companies found</p>
                        ) : (
                            <table>
                                <thead><tr><th>Company</th><th>Slug</th><th>Contact</th><th>Users</th><th>Printers</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {companies
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(company => (
                                            <tr key={company.id}>
                                                <td>{company.name}</td>
                                                <td>{company.slug}</td>
                                                <td>{company.contact_email || "—"}</td>
                                                <td>{company.max_users}</td>
                                                <td>{company.max_machines}</td>
                                        <td style={{ textAlign: "right" }}>
                                            <button type="button" className="btn btg bts" onClick={() => openCreateCompanyModal(company)}>Edit</button>
                                            <button type="button" className="btn btd bts" style={{ marginLeft: 8 }} onClick={() => handleManageCompany(company)}>Access Control</button>
                                        </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {isSuperAdmin && tab === "users" && (
                <div className="card">
                    <div className="ch"><span className="ct">Global Users</span></div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>Tabs</th><th>Status</th></tr></thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.full_name || "—"}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td>{user.tenant_id || "—"}</td>
                                        <td><AccessSummary tabs={user.allowed_tabs} /></td>
                                        <td><span className={`b ${user.is_active ? "brun" : "bidle"}`}>{user.is_active ? "Active" : "Inactive"}</span></td>
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
                        <span className="ct">👥 Team Members ({users.filter(user => user.is_active).length}{tenant ? ` / ${tenant.max_users}` : ''})</span>
                        <button type="button" className="btn btp bts" onClick={() => openCreateMemberModal(tenantId)}>+ Add Member</button>
                    </div>
                    {tenant && (
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg3)" }}>
                            <div className="rowsb">
                                <div>
                                    <div style={{ fontWeight: 700 }}>{tenant.name}</div>
                                    <div className="tiny">{tenant.contact_email || "No contact email set"}</div>
                                </div>
                                <div className="tiny">Printers allowed: {tenant.max_machines}</div>
                            </div>
                        </div>
                    )}
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tab Access</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.full_name || "—"}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                        <td><AccessSummary tabs={user.allowed_tabs} /></td>
                                        <td><span className={`b ${user.is_active ? "brun" : "bidle"}`}>{user.is_active ? "Active" : "Inactive"}</span></td>
                                        <td style={{ textAlign: "right" }}>
                                            {user.role !== "admin" && (
                                                <button type="button" className="btn btg bts" onClick={() => openAccessEditor(user)}>Access Matrix</button>
                                            )}
                                            {user.role !== "admin" && (
                                                <button type="button" className="btn btd bts" style={{ marginLeft: 8 }} onClick={() => setShowDeleteConfirm(user)}>Deactivate</button>
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
                    <div className="ch"><span className="ct">My Access</span></div>
                    <div className="cb">
                        <p style={{ marginBottom: 12 }}>Your company admin controls which tabs you can use. Your data remains limited to your company profile.</p>
                        <AccessSummary tabs={session?.allowed_tabs || []} />
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <Modal
                    title="Deactivate Member"
                    onClose={() => setShowDeleteConfirm(null)}
                    footer={<><button className="btn btg bts" onClick={() => setShowDeleteConfirm(null)}>Cancel</button><button className="btn btd bts" onClick={() => handleDeleteUser(showDeleteConfirm)}>Deactivate</button></>}
                >
                    <p>Deactivate {showDeleteConfirm.full_name || showDeleteConfirm.email}? Their login will stop working until reactivated.</p>
                </Modal>
            )}

            {showCompanyModal && (
                <Modal
                    title={editingCompany ? `Edit Company: ${editingCompany.name}` : "Create Company"}
                    onClose={() => setShowCompanyModal(false)}
                    backdropClose={false}
                    footer={<><button className="btn btg bts" onClick={() => setShowCompanyModal(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateCompany}>{editingCompany ? "Save Company" : "Create Company"}</button></>}
                >
                    <div className="fg mb8"><label className="fl">Company Name</label><input className="fi" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} /></div>
                    <div className="fg mb8"><label className="fl">Slug</label><input className="fi" value={companyForm.slug} onChange={e => setCompanyForm({ ...companyForm, slug: e.target.value })} /></div>
                    <div className="fg mb8"><label className="fl">Contact Email</label><input className="fi" type="email" value={companyForm.contact_email} onChange={e => setCompanyForm({ ...companyForm, contact_email: e.target.value })} /></div>
                    {editingCompany && (
                        <div className="fg mb8">
                            <label className="fl">Admin Password Reset</label>
                            <button type="button" className="btn btd bts" onClick={() => handleResetCompanyPassword(editingCompany)} style={{ marginRight: 8 }}>Reset Admin Password</button>
                            <span className="tiny">This will generate a new password for the company admin</span>
                        </div>
                    )}
                    {!editingCompany && (
                        <>
                            <div className="fg mb8"><label className="fl">Company Admin Email</label><input className="fi" type="email" value={companyForm.admin_email} onChange={e => setCompanyForm({ ...companyForm, admin_email: e.target.value })} /></div>
                            <div className="fg mb8"><label className="fl">Company Admin Password</label><input className="fi" type="password" value={companyForm.admin_password} onChange={e => setCompanyForm({ ...companyForm, admin_password: e.target.value })} /></div>
                        </>
                    )}
                    <div className="frow">
                        <div className="fg"><label className="fl">Max Users</label><input className="fi" type="number" min="1" value={companyForm.max_users} onChange={e => setCompanyForm({ ...companyForm, max_users: e.target.value })} /></div>
                        <div className="fg"><label className="fl">Max Printers</label><input className="fi" type="number" min="1" value={companyForm.max_machines} onChange={e => setCompanyForm({ ...companyForm, max_machines: e.target.value })} /></div>
                    </div>
                </Modal>
            )}

            {showManageCompany && selectedCompany && (
                <Modal title={`Manage: ${selectedCompany.name}`} onClose={() => setShowManageCompany(false)} wide>
                    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                        <div className="card" style={{ padding: 12, minWidth: 160 }}><div className="tiny">Contact</div><div>{selectedCompany.contact_email || "—"}</div></div>
                        <div className="card" style={{ padding: 12, minWidth: 160 }}><div className="tiny">Max Users</div><div>{selectedCompany.max_users}</div></div>
                        <div className="card" style={{ padding: 12, minWidth: 160 }}><div className="tiny">Max Printers</div><div>{selectedCompany.max_machines}</div></div>
                    </div>
                    <div className="ch" style={{ paddingLeft: 0, paddingRight: 0, background: "transparent", borderBottom: "none" }}>
                        <span className="ct">Company Members</span>
                        <div className="row">
                            <button type="button" className="btn btg bts" onClick={() => openCreateCompanyModal(selectedCompany)}>Edit Limits</button>
                            <button type="button" className="btn btp bts" onClick={() => openCreateMemberModal(selectedCompany.id, selectedCompany)}>+ Add Member</button>
                        </div>
                    </div>
                    <div className="tw">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Tab Access</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {companyMembers.map(member => (
                                    <tr key={member.id}>
                                        <td>{member.full_name || "—"}</td>
                                        <td>{member.email}</td>
                                        <td>{member.role}</td>
                                        <td><AccessSummary tabs={member.allowed_tabs} /></td>
                                        <td><span className={`b ${member.is_active ? "brun" : "bidle"}`}>{member.is_active ? "Active" : "Inactive"}</span></td>
                                        <td style={{ textAlign: "right" }}>
                                            <button type="button" className="btn btg bts" onClick={() => openAccessEditor(member)}>Access Matrix</button>
                                            <button type="button" className="btn btd bts" style={{ marginLeft: 8 }} onClick={() => setShowDeleteConfirm(member)}>Deactivate</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}

            {showMemberModal && (
                <Modal
                    title={selectedCompany && memberTargetTenant === selectedCompany.id ? `Add Member to ${selectedCompany.name}` : "Add Member"}
                    onClose={() => setShowMemberModal(false)}
                    backdropClose={false}
                    footer={<><button className="btn btg bts" onClick={() => setShowMemberModal(false)}>Cancel</button><button className="btn btp bts" onClick={handleCreateUser}>Create Member</button></>}
                    wide
                >
                    <div className="fg mb8"><label className="fl">Full Name</label><input className="fi" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} /></div>
                    <div className="fg mb8"><label className="fl">Email</label><input className="fi" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                    <div className="fg mb8"><label className="fl">Default Password</label><input className="fi" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    <div className="fg mb12">
                        <label className="fl">Role</label>
                        <select className="fsel" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                            {(isSuperAdmin ? superAdminRoleOptions : companyRoleOptions).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    {newUser.role !== "admin" && (
                        <>
                            <div className="fl" style={{ marginBottom: 8 }}>Tab Access Matrix</div>
                            <AccessMatrix options={assignableTabs} value={newUser.allowed_tabs} onToggle={(tabId) => toggleTab(tabId, newUser, setNewUser)} />
                        </>
                    )}
                </Modal>
            )}

            {showAccessEditor && editingMember && (
                <Modal
                    title={`Access Matrix: ${editingMember.full_name || editingMember.email}`}
                    onClose={() => setShowAccessEditor(false)}
                    backdropClose={false}
                    footer={<><button className="btn btg bts" onClick={() => setShowAccessEditor(false)}>Cancel</button><button className="btn btp bts" onClick={() => handleUpdateMember(editingMember)}>Save Access</button></>}
                    wide
                >
                    <div className="fg mb8">
                        <label className="fl">Role</label>
                        <select className="fsel" value={editingMember.role} onChange={e => setEditingMember({ ...editingMember, role: e.target.value })}>
                            {(isSuperAdmin ? superAdminRoleOptions : companyRoleOptions).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="fg mb12">
                        <label className="fl">Status</label>
                        <select className="fsel" value={editingMember.is_active ? "active" : "inactive"} onChange={e => setEditingMember({ ...editingMember, is_active: e.target.value === "active" })}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    {editingMember.role !== "admin" ? (
                        <>
                            <div className="fl" style={{ marginBottom: 8 }}>Tab Access Matrix</div>
                            <AccessMatrix options={assignableTabs} value={editingMember.allowed_tabs || []} onToggle={(tabId) => toggleTab(tabId, editingMember, setEditingMember)} />
                        </>
                    ) : (
                        <div className="card">
                            <div className="cb">Company admins keep full company-level access, but they still cannot see the super-admin company registration list.</div>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
