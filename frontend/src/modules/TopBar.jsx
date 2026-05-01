import React, { useState, useRef, useEffect } from "react";

export function TopBar({ onLogout, onChangePassword, onChangeProfile, session, toggleSidebar }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16, 185, 129, 0.1)", color: "var(--green)", padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)", animation: "pu 2s infinite" }}></div>
                    Live Data
                </div>
                
                <div ref={dropdownRef} style={{ position: "relative" }}>
                    <div onClick={() => setDropdownOpen(!dropdownOpen)} style={{ display: "flex", alignItems: "center", gap: 10, background: dropdownOpen ? "var(--bg3)" : "var(--bg2)", padding: "4px 12px 4px 4px", borderRadius: 30, border: "1px solid var(--border)", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => {if(!dropdownOpen) e.currentTarget.style.background = "var(--bg3)"}} onMouseLeave={e => {if(!dropdownOpen) e.currentTarget.style.background = "var(--bg2)"}}>
                        <div style={{ position: "relative" }}>
                            {session?.avatar_url ? (
                                <img src={session.avatar_url} alt="Profile" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", boxShadow: "var(--shadow)" }} />
                            ) : (
                                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, boxShadow: "var(--shadow)" }}>{initials}</div>
                            )}
                            <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: isOnline ? "var(--green)" : "var(--text3)", border: "2px solid #fff", zIndex: 2 }}></div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{label}</span>
                        <span style={{ fontSize: 10, color: "var(--text3)", marginRight: 4, transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                    </div>
                    
                    {dropdownOpen && (
                        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", borderRadius: "var(--r3)", border: "1px solid var(--border)", boxShadow: "var(--shadow2)", width: 200, padding: 8, zIndex: 100, animation: "su 0.15s ease" }}>
                            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border2)", marginBottom: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                                <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "capitalize" }}>{session?.role || "Administrator"}</div>
                            </div>
                            
                            <button onClick={() => { setDropdownOpen(false); onChangeProfile(); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 12px", fontSize: 12, color: "var(--text2)", cursor: "pointer", borderRadius: "var(--r)", transition: "all 0.1s", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <span style={{ fontSize: 14 }}>⚙️</span> Profile Settings
                            </button>
                            
                            <button onClick={() => { setDropdownOpen(false); onChangePassword(); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 12px", fontSize: 12, color: "var(--text2)", cursor: "pointer", borderRadius: "var(--r)", transition: "all 0.1s", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg3)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <span style={{ fontSize: 14 }}>🔑</span> Reset Password
                            </button>
                            
                            <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }}></div>
                            
                            <button onClick={() => { setDropdownOpen(false); onLogout(); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "8px 12px", fontSize: 12, color: "var(--red)", fontWeight: 600, cursor: "pointer", borderRadius: "var(--r)", transition: "all 0.1s", display: "flex", alignItems: "center", gap: 8 }} onMouseEnter={e => e.currentTarget.style.background = "var(--rdim)"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                <span style={{ fontSize: 14 }}>⎋</span> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
