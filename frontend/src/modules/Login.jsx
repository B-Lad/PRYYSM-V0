import React, { useState } from "react";
import { api } from "../services/api";

export function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
        <div style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", 
            backgroundImage: "url('/bg.png')", backgroundSize: "cover", backgroundPosition: "center",
            position: "relative", padding: "0 20px"
        }}>
            {/* Subtle dark overlay for better contrast */}
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)" }} />
            
            <div style={{ 
                position: "relative", width: "100%", maxWidth: 400, background: "rgba(255, 255, 255, 0.9)", 
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 16, padding: "40px 30px", 
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
            }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <img src="/logo.svg" alt="Pryysm Logo" style={{ width: 180, marginBottom: 16 }} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>
                        Welcome back! 👋
                    </h2>
                    <div style={{ fontSize: 13, color: "#475569" }}>
                        Step into the future of manufacturing operations.
                    </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#334155" }}>Email Address</label>
                        <input 
                            style={{ 
                                width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", 
                                borderRadius: 8, fontSize: 14, background: "rgba(255,255,255,0.7)",
                                outline: "none", transition: "border-color 0.2s"
                            }}
                            type="email" 
                            placeholder="admin@pryysm.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#334155" }}>
                            <span>Password</span>
                            <span 
                                style={{ fontSize: 11, color: "#2563eb", cursor: "pointer", fontWeight: 500 }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </span>
                        </label>
                        <input 
                            style={{ 
                                width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", 
                                borderRadius: 8, fontSize: 14, background: "rgba(255,255,255,0.7)",
                                outline: "none", transition: "border-color 0.2s"
                            }}
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, textAlign: "center", background: "#fef2f2", padding: "8px", borderRadius: 6 }}>{error}</div>}
                    
                    <button 
                        style={{ 
                            width: "100%", padding: "12px", background: "#2563eb", color: "#fff", 
                            border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, 
                            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1,
                            transition: "background 0.2s, transform 0.1s"
                        }}
                        disabled={loading}
                    >
                        {loading ? "Authenticating..." : "Sign In to Workspace"}
                    </button>
                </form>
                
                <div style={{ marginTop: 28, textAlign: "center", fontSize: 12, color: "#64748b" }}>
                    Demo Credentials: <strong>admin@pryysm.com</strong> / <strong>password</strong>
                </div>
            </div>
        </div>
    );
}
