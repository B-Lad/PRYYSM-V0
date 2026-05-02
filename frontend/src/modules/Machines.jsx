import React, { useState, useEffect, useRef } from "react";
import { WOS, WCS } from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { TB, SB, Ring, Spark, Prog, DB, LiveBadge, Modal } from '../components/atoms.jsx';
import { TECH_C, DT_CODES } from '../data/constants.js';

export function Machines({ machines }) {
    const isDemo = useDemoMode();
    const seedWos = isDemo ? WOS : [];
    const seedWcs = isDemo ? WCS : [];
    const [sel, setSel] = useState(null);
    const [showDT, setShowDT] = useState(false);
    const m = sel ? machines.find(x => x.id === sel) : null;
    return (
        <div className="g g12">
      <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Work Centers & Machines</h1></div>
            <div>
                <div className="card mb16">
                    <div className="ch"><span className="ct">Work Centers</span></div>
                    <div className="tw"><table><thead><tr><th>Center</th><th>Type</th><th>Machines</th><th>Load</th></tr></thead><tbody>
                        {seedWcs.map(wc => <tr key={wc.id}><td style={{ fontWeight: 500 }}>{wc.name}</td><td className="tdim">{wc.type}</td><td><span className="tm">{wc.machines.join(", ") || "—"}</span></td><td style={{ width: 130 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1 }}><Prog pct={(wc.load / wc.cap) * 100} color={wc.load >= wc.cap ? "red" : "green"} /></div><span className="tm" style={{ color: wc.load >= wc.cap ? "var(--red)" : "var(--text2)" }}>{wc.load}/{wc.cap}</span></div></td></tr>)}
                    </tbody></table></div>
                </div>
                <div className="card">
                    <div className="ch"><span className="ct">Machines / Printers</span><LiveBadge /></div>
                    <div className="tw"><table><thead><tr><th>ID</th><th>Name</th><th>Tech</th><th>Status</th><th>Job</th><th>Dept</th><th>Progress</th><th>OEE</th></tr></thead><tbody>
                        {machines.map(m2 => {
                            const wo = seedWos.find(w => w.id === m2.job);
                            return <tr key={m2.id} className="cl" onClick={() => setSel(m2.id)} style={{ background: sel === m2.id ? "var(--bg3)" : undefined }}>
                                <td><span className="tm" style={{ color: "var(--text3)" }}>{m2.id}</span></td>
                                <td style={{ fontWeight: 500, color: sel === m2.id ? "var(--accent)" : undefined }}>{m2.name}</td>
                                <td><TB tech={m2.tech} /></td>
                                <td><SB s={m2.status} /></td>
                                <td><span className="tm">{m2.job}</span></td>
                                <td>{wo ? <DB code={wo.code || wo.dept.slice(0, 3).toUpperCase()} /> : <span className="tiny">—</span>}</td>
                                <td style={{ width: 80 }}>{m2.status === "running" ? <Prog pct={m2.pct} /> : <span className="tiny">—</span>}</td>
                                <td><span className="tm" style={{ fontWeight: 700, color: m2.oee > 80 ? "var(--green)" : m2.oee > 65 ? "var(--yellow)" : "var(--red)" }}>{m2.oee}%</span></td>
                            </tr>;
                        })}
                    </tbody></table></div>
                </div>
            </div>
            <div>
                {m ? (
                    <div className="card" style={{ position: "sticky", top: 20 }}>
                        <div className="ch" style={{ borderTopColor: TECH_C[m.tech], borderTopWidth: 2 }}>
                            <div><div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>{m.name}</div><div className="tiny mt4">{m.model} · {m.wc}</div></div>
                            <div style={{ display: "flex", gap: 6 }}><TB tech={m.tech} /><SB s={m.status} /></div>
                        </div>
                        <div className="cb">
                            {m.status === "running" && <div className="mb16">
                                <div className="tiny mb8">CURRENT JOB</div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{m.job}</div>
                                <div className="tiny mb8">{seedWos.find(w => w.id === m.job)?.part} — {seedWos.find(w => w.id === m.job)?.project}</div>
                                <Prog pct={m.pct} h={6} />
                                <div className="rowsb mt8"><span className="tiny">{Math.round(m.pct)}% complete</span><span className="mono" style={{ fontSize: 14 }}>{m.remaining}</span></div>
                            </div>}
                            {m.status === "error" && <div className="astrip err mb16"><span>⛔</span><div><div style={{ fontSize: 12 }}>Resin feed error — Layer 142 halted</div><div className="tiny mt4">Requires operator + tank inspection</div></div></div>}
                            {m.status === "waiting" && <div className="astrip warn mb16"><span>⚠️</span><div style={{ fontSize: 12 }}>{m.remaining}</div></div>}
                            <div className="sep" />
                            <div className="tiny mb12">OEE BREAKDOWN</div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "space-around", marginBottom: 16 }}>
                                <Ring value={m.avail} color="var(--green)" label="Avail" size={62} />
                                <Ring value={m.perf} color="var(--accent)" label="Perf" size={62} />
                                <Ring value={m.qual} color="var(--purple)" label="Qual" size={62} />
                                <Ring value={m.oee} color="var(--yellow)" label="OEE" size={62} />
                            </div>
                            <div className="sep" />
                            <div className="tiny mb8">7-DAY THROUGHPUT</div>
                            <Spark data={[11, 9, 14, 13, m.oee - 5, m.oee, m.oee + 1]} color="var(--accent)" h={36} />
                            <div className="sep" />
                            <div className="tiny mb8">RECENT DOWNTIME</div>
                            {[{ t: "Jam / filament tangle", time: "Yesterday 14:22", c: "var(--red)" }, { t: "Scheduled maintenance", time: "2 days ago 08:00", c: "var(--yellow)" }, { t: "Waiting material", time: "3 days ago 11:15", c: "var(--orange)" }].map((e, i, arr) => (
                                <div key={i} className="tli">{i < arr.length - 1 && <div className="tlline" />}<div className="tldot" style={{ background: e.c }} /><div><div style={{ fontSize: 12, fontWeight: 500 }}>{e.t}</div><div className="tiny">{e.time}</div></div></div>
                            ))}
                            <div className="sep" />
                            <div style={{ display: "flex", gap: 8 }}>
                                <button className="btn btg bts" onClick={() => setShowDT(true)}>Log Downtime</button>
                                <button className="btn btg bts">Maintenance Task</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><div style={{ textAlign: "center", color: "var(--text3)" }}><div style={{ fontSize: 40, marginBottom: 10 }}>⬡</div><div>Select a machine to view details</div></div></div>
                )}
            </div>
            {showDT && m && <Modal title={`Log Downtime — ${m.name}`} onClose={() => setShowDT(false)} footer={(<><button className="btn btg bts" onClick={() => setShowDT(false)}>Cancel</button><button className="btn btp bts" onClick={() => setShowDT(false)}>Save</button></>)}><div className="frow"><div className="fg"><label className="fl">Reason</label><select className="fsel">{DT_CODES.map(c => <option key={c}>{c}</option>)}</select></div><div className="fg"><label className="fl">Work Order</label><input className="fi" defaultValue={m.job !== "—" ? m.job : ""} /></div></div><div className="frow"><div className="fg"><label className="fl">Start</label><input type="datetime-local" className="fi" /></div><div className="fg"><label className="fl">End</label><input type="datetime-local" className="fi" /></div></div><div className="fg"><label className="fl">Notes</label><textarea className="fta" placeholder="Describe the issue…"></textarea></div></Modal>}
        </div>
    );
}

