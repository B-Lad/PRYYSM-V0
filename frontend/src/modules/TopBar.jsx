import React from "react";

export function TopBar({ onLogout }) {
    return (
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>⌂</span>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Pryysm MES</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 11, padding: "4px 8px", background: "#ecfdf5", color: "#059669", borderRadius: 4 }}>Live Data</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>A</div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Admin User</span>
                    <button onClick={onLogout} style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #cbd5e1", borderRadius: 4, background: "#fff", cursor: "pointer" }}>Logout</button>
                </div>
            </div>
        </header>
    );
}
