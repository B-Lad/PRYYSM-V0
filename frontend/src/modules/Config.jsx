import React, { useState } from "react";
import { INTEGRATIONS } from '../data/seed.jsx';
import { Tabs } from '../components/atoms.jsx';
import { DT_CODES } from '../data/constants.js';

export function IntegrationRow({ item }) {
    const color = item.status === "connected" ? "var(--green)" : item.status === "pending" ? "var(--yellow)" : "var(--text3)";
    const dotStyle = { width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 };
    const badgeCls = item.status === "connected" ? "bcomp" : item.status === "pending" ? "bpend" : "bidle";
    return (
        <div className="ii">
            <div style={dotStyle} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{item.name}</div>
            </div>
            <span className={`b ${badgeCls}`}>{item.status}</span>
            <button className="btn btg bts">{item.status === "connected" ? "Config" : "Connect"}</button>
        </div>
    );
}

export function Config() {
    const [editSettings, setEditSettings] = useState(false);
    const [settings, setSettings] = useState({
        company: "Pryysm Industries",
        site: "Dubai Manufacturing Campus, Building 4",
        timezone: "GST +4 (Asia/Dubai)",
        shifts: "06:00-14:00 / 14:00-22:00 / 22:00-06:00",
        workdays: "Sunday to Thursday",
        wipPolicy: "Hard alert at limit, block at limit+1",
        oeeTarget: "80% fleet average minimum",
        currency: "AED",
    });
    const [draft, setDraft] = useState(settings);
    const setD = (k, v) => setDraft(p => ({ ...p, [k]: v }));

    const [dtCodes, setDtCodes] = useState([...DT_CODES]);
    const [newCode, setNewCode] = useState("");
    const [addingCode, setAddingCode] = useState(false);

    const TECH_DEFS = [
        { tech: "FDM", params: "Layer: 0.1-0.3mm · Temps: 180-300°C · Infill: 15-100%", color: "var(--fdm)" },
        { tech: "SLA", params: "Layer: 0.025-0.1mm · UV 405nm · Post: IPA wash + UV cure", color: "var(--sla)" },
        { tech: "SLS", params: "Layer: 0.1mm · Temp: 170°C · Cooldown: 12h minimum", color: "var(--sls)" },
    ];

    const SETTING_LABELS = {
        company: "Company", site: "Site", timezone: "Timezone", shifts: "Shifts",
        workdays: "Working Days", wipPolicy: "WIP Limit Policy", oeeTarget: "OEE Target", currency: "Cost Currency"
    };

    const [activeTab, setActiveTab] = useState("general");
    const tabs = [
        { id: "general", label: "General" },
        { id: "downtime", label: "Downtime Codes" },
        { id: "technology", label: "Technology" },
        { id: "integrations", label: "Integrations" },
        { id: "notifications", label: "Notifications" },
    ];

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Configuration</h1></div>

            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

            {/* General Settings Tab */}
            {activeTab === "general" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">Factory Configuration</span>
                        {editSettings
                            ? <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn btg bts" onClick={() => { setEditSettings(false); setDraft(settings); }}>Cancel</button>
                                <button className="btn btp bts" onClick={() => { setSettings(draft); setEditSettings(false); }}>Save Changes</button>
                            </div>
                            : <button className="btn btg bts" onClick={() => { setDraft(settings); setEditSettings(true); }}>Edit</button>
                        }
                    </div>
                    <div className="cb">
                        {Object.entries(SETTING_LABELS).map(([k, label]) => (
                            <div key={k} className="rowsb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 16 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, flexShrink: 0, width: 140 }}>{label}</span>
                                {editSettings
                                    ? <input className="fi" style={{ flex: 1, padding: "6px 10px", fontSize: 12 }} value={draft[k]} onChange={e => setD(k, e.target.value)} />
                                    : <span style={{ fontSize: 12, textAlign: "right", color: "var(--text2)" }}>{settings[k]}</span>
                                }
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Downtime Codes Tab */}
            {activeTab === "downtime" && (
                <div className="card">
                    <div className="ch">
                        <span className="ct">Downtime Reason Codes</span>
                        <button className="btn btp bts" onClick={() => setAddingCode(true)}>+ Add Code</button>
                    </div>
                    <div className="cb">
                        {dtCodes.map((code, i) => (
                            <div key={code} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", fontSize: 12, display: "flex", gap: 10, alignItems: "center" }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
                                <span style={{ flex: 1, fontWeight: 500 }}>{code}</span>
                                <button onClick={() => setDtCodes(c => c.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 6px" }}>×</button>
                            </div>
                        ))}
                        {addingCode && (
                            <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                                <input className="fi" style={{ flex: 1, padding: "6px 10px", fontSize: 12 }} placeholder="Enter new reason code..." value={newCode} onChange={e => setNewCode(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCode.trim()) { setDtCodes(c => [...c, newCode.trim()]); setNewCode(""); setAddingCode(false); } }} />
                                <button className="btn btp bts" onClick={() => { if (newCode.trim()) { setDtCodes(c => [...c, newCode.trim()]); setNewCode(""); setAddingCode(false); } }}>Add</button>
                                <button className="btn btg bts" onClick={() => { setAddingCode(false); setNewCode(""); }}>Cancel</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Technology Tab */}
            {activeTab === "technology" && (
                <div className="card">
                    <div className="ch"><span className="ct">Technology Definitions</span></div>
                    <div className="cb">
                        {TECH_DEFS.map(t => (
                            <div key={t.tech} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                                    <span style={{ fontWeight: 700, fontSize: 14, color: t.color, fontFamily: "var(--fd)" }}>{t.tech}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{t.params}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
                <div className="card">
                    <div className="ch"><span className="ct">System Integrations</span></div>
                    <div className="cb">
                        {INTEGRATIONS.map(item => <IntegrationRow key={item.name} item={item} />)}
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
                <div className="card">
                    <div className="ch"><span className="ct">Notification Rules</span></div>
                    <div className="cb">
                        {[
                            { ev: "Machine error", ch: "Email + Pryysm dashboard", on: true },
                            { ev: "Budget threshold (80%)", ch: "Email to dept manager", on: true },
                            { ev: "QA fail / NCR created", ch: "Email to QA + PM", on: true },
                            { ev: "WIP limit breach", ch: "Pryysm dashboard only", on: true },
                            { ev: "Print complete", ch: "Pryysm dashboard only", on: false },
                            { ev: "Resin/material low", ch: "Email to AM coordinator", on: true },
                        ].map((r, i) => (
                            <div key={i} className="rowsb" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>{r.ev}</div>
                                    <div style={{ fontSize: 11, color: "var(--text3)" }}>{r.ch}</div>
                                </div>
                                <div style={{ width: 34, height: 18, borderRadius: 9, background: r.on ? "var(--green)" : "var(--bg4)", border: "1px solid", borderColor: r.on ? "var(--green)" : "var(--border2)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                                    <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 1, left: r.on ? 17 : 1, transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.15)" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
