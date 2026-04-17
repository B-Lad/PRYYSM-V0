import React, { useState } from "react";
import { api } from "../services/api";

export function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await api.login({ email, password });
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user_role", data.role || "admin");
            localStorage.setItem("tenant_id", data.tenant_id || "");
            localStorage.setItem("user_id", data.user_id || "");
            onLogin();
        } catch (err) {
            setError(err.message || "Invalid email or password. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
            <div style={{ width: 360, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 32, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: 24, fontWeight: 800, color: "#2563eb", marginBottom: 8 }}>Pryysm MES</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Sign in to continue</div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#334155" }}>Email</label>
                        <input 
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                            type="email" 
                            placeholder="admin@pryysm.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#334155" }}>Password</label>
                        <input 
                            style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 14 }}
                            type="password" 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
                    
                    <button 
                        style={{ width: "100%", padding: 10, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
                
                <div style={{ marginTop: 20, textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
                    Use <strong>admin@pryysm.com</strong> / <strong>password</strong>
                </div>
            </div>
        </div>
    );
}
