import React, { useState, useEffect, useRef } from "react";
import { ROUTES_DATA, INTEGRATIONS, DEPARTMENTS } from '../data/seed.js';
import { TB, SB, Tabs, AStrip, Modal } from '../components/atoms.jsx';

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

function Config() {
    const [apiVis, setApiVis] = useState(false);
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
    const WEBHOOKS = ["request.created", "request.approved", "wo.status_change", "machine.error", "budget.threshold"];
    const [webhooks, setWebhooks] = useState(WEBHOOKS);
    const [newHook, setNewHook] = useState("");

    const SETTING_LABELS = {
        company: "Company", site: "Site", timezone: "Timezone", shifts: "Shifts",
        workdays: "Working Days", wipPolicy: "WIP Limit Policy", oeeTarget: "OEE Target", currency: "Cost Currency"
    };

    return (
        <div className="g g2">
      <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Configuration</h1></div>
            <div>
                <div className="card mb16">
                    <div className="ch">
                        <span className="ct">Factory Configuration</span>
                        {editSettings
                            ? <div style={{ display: "flex", gap: 6 }}>
                                <button className="btn btg bts" onClick={() => { setEditSettings(false); setDraft(settings); }}>Cancel</button>
                                <button className="btn btp bts" onClick={() => { setSettings(draft); setEditSettings(false); }}>Save</button>
                            </div>
                            : <button className="btn btg bts" onClick={() => { setDraft(settings); setEditSettings(true); }}>Edit</button>
                        }
                    </div>
                    <div className="cb">
                        {Object.entries(SETTING_LABELS).map(([k, label]) => (
                            <div key={k} className="rowsb" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                                <span className="tiny" style={{ flexShrink: 0, width: 120 }}>{label}</span>
                                {editSettings
                                    ? <input className="fi" style={{ flex: 1, padding: "4px 8px", fontSize: 11 }} value={draft[k]} onChange={e => setD(k, e.target.value)} />
                                    : <span style={{ fontSize: 12, textAlign: "right" }}>{settings[k]}</span>
                                }
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card mb16">
                    <div className="ch"><span className="ct">Downtime Reason Codes</span><button className="btn btg bts" onClick={() => setAddingCode(true)}>+ Add</button></div>
                    <div className="cb">
                        {dtCodes.map((code, i) => (
                            <div key={code} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12, display: "flex", gap: 8, alignItems: "center" }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
                                <span style={{ flex: 1 }}>{code}</span>
                                <button onClick={() => setDtCodes(c => c.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "0 4px" }}>×</button>
                            </div>
                        ))}
                        {addingCode && (
                            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                                <input className="fi" style={{ flex: 1, padding: "5px 8px", fontSize: 11 }} placeholder="New reason code..." value={newCode} onChange={e => setNewCode(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCode.trim()) { setDtCodes(c => [...c, newCode.trim()]); setNewCode(""); setAddingCode(false); } }} />
                                <button className="btn btp bts" onClick={() => { if (newCode.trim()) { setDtCodes(c => [...c, newCode.trim()]); setNewCode(""); setAddingCode(false); } }} >Add</button>
                                <button className="btn btg bts" onClick={() => { setAddingCode(false); setNewCode(""); }}>×</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="ch"><span className="ct">Technology Definitions</span></div>
                    <div className="cb">
                        {TECH_DEFS.map(t => (
                            <div key={t.tech} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                                    <span style={{ fontWeight: 700, fontSize: 13, color: t.color, fontFamily: "var(--fd)" }}>{t.tech}</span>
                                </div>
                                <div className="tiny">{t.params}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <div className="card mb16">
                    <div className="ch"><span className="ct">System Integrations</span></div>
                    <div className="cb">
                        {INTEGRATIONS.map(item => <IntegrationRow key={item.name} item={item} />)}
                    </div>
                </div>

                <div className="card mb16">
                    <div className="ch"><span className="ct">API & Webhooks</span></div>
                    <div className="cb">
                        <div className="fg mb12">
                            <label className="fl">API Key</label>
                            <div style={{ display: "flex", gap: 8 }}>
                                <input className="fi" readOnly value={apiVis ? "pry_live_k8f2j9x1m3n7q0w5t4r6" : "pry_live_k\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"} style={{ flex: 1, fontFamily: "var(--fm)", fontSize: 11 }} />
                                <button className="btn btg bts" onClick={() => setApiVis(p => !p)}>{apiVis ? "Hide" : "Show"}</button>
                                <button className="btn btg bts">Rotate</button>
                            </div>
                        </div>
                        <div className="tiny mb8">ACTIVE WEBHOOKS</div>
                        {webhooks.map((ev, i) => (
                            <div key={ev} className="ii">
                                <span className="b bcomp" style={{ fontSize: 9 }}>POST</span>
                                <div style={{ flex: 1, fontFamily: "var(--fm)", fontSize: 11 }}>{ev}</div>
                                <span className="b bcomp" style={{ fontSize: 9 }}>active</span>
                                <button onClick={() => setWebhooks(h => h.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 14, padding: "0 4px" }}>×</button>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <input className="fi" style={{ flex: 1, padding: "5px 8px", fontSize: 11, fontFamily: "var(--fm)" }} placeholder="event.name" value={newHook} onChange={e => setNewHook(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newHook.trim()) { setWebhooks(h => [...h, newHook.trim()]); setNewHook(""); } }} />
                            <button className="btn btp bts" onClick={() => { if (newHook.trim()) { setWebhooks(h => [...h, newHook.trim()]); setNewHook(""); } }}>+ Add</button>
                        </div>
                    </div>
                </div>

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
                            <div key={i} className="rowsb" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.ev}</div>
                                    <div className="tiny">{r.ch}</div>
                                </div>
                                <div style={{ width: 30, height: 16, borderRadius: 8, background: r.on ? "var(--green)" : "var(--bg4)", border: "1px solid", borderColor: r.on ? "var(--green)" : "var(--border2)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: 6, background: "#fff", position: "absolute", top: 1, left: r.on ? 15 : 1, transition: "left .15s" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN
══════════════════════════════════════════════════════════════════ */
function Admin() {
