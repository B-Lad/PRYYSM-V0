import React from "react";

export function TopBar({ onLogout, onChangePassword, session, toggleSidebar }) {
    const initials = (session?.full_name || session?.email || "A").trim().charAt(0).toUpperCase();
    const label = session?.full_name || session?.email || "Admin User";

    return (
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button className="mobile-menu-btn" onClick={toggleSidebar} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#0f172a", padding: "0 4px" }}>☰</button>
                <span className="desktop-icon" style={{ fontSize: 20 }}>⌂</span>
                <h1 className="hide-mobile" style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>Pryysm MES</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 11, padding: "4px 8px", background: "#ecfdf5", color: "#059669", borderRadius: 4 }}>Live Data</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>{initials}</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                    <button onClick={onChangePassword} style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", cursor: "pointer" }}>Reset Password</button>
                    <button onClick={onLogout} style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", cursor: "pointer" }}>Logout</button>
                </div>
            </div>
        </header>
    );
}
