import React, { useState, useEffect, useRef } from "react";
import { DEPARTMENTS, PROJECTS, WOS, LIFECYCLE_STAGES } from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { TB, SB, DB, Tabs, Spark, Prog, BudgetBar } from '../components/atoms.jsx';

export function DeptCost({ lcProjects }) {
    const isDemo = useDemoMode();
    const seedDepartments = isDemo ? seedDepartments : [];
    const seedProjects = isDemo ? seedProjects : [];
    const seedWos = isDemo ? seedWos : [];
    const [selDept, setSelDept] = useState(null);
    const [tab, setTab] = useState("overview");
    return (
        <div>
      <div className="pg-hd"><span className="pg-eyebrow">BUSINESS</span><h1 className="pg-title">Departments & Cost</h1></div>
            <Tabs tabs={[{ id: "overview", label: "Department Overview" }, { id: "chargeback", label: "Cost Chargeback" }, { id: "utilisation", label: "AM Utilisation" }]} active={tab} onChange={setTab} />
            {tab === "overview" && (
                <div>
                    <div className="g g4 mb16">
                        {seedDepartments.map(d => {
                            const pct = Math.round(d.spent / d.budget * 100);
                            return (
                                <div key={d.id} className="kpi" style={{ cursor: "pointer", borderTopColor: d.color, borderTopWidth: 2 }} onClick={() => setSelDept(d)}>
                                    <div className="kl">{d.name}</div>
                                    <div className="kv" style={{ color: d.color, fontSize: 24 }}>{d.code}</div>
                                    <div className="ks">{d.head}</div>
                                    <div className="sep" />
                                    <BudgetBar spent={d.spent} budget={d.budget} color={d.color} />
                                </div>
                            );
                        })}
                    </div>
                    {selDept && (
                        <div className="card">
                            <div className="ch" style={{ borderTopColor: selDept.color, borderTopWidth: 2 }}>
                                <div><div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>{selDept.name}</div><div className="tiny mt4">Dept head: {selDept.head}</div></div>
                                <button className="mclose" onClick={() => setSelDept(null)}>×</button>
                            </div>
                            <div className="cb">
                                <div className="g g3 mb16">
                                    <div><div className="tiny mb4">ACTIVE seedProjects</div><div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800 }}>{seedProjects.filter(p => p.dept === selDept.name && p.status === "active").length}</div></div>
                                    <div><div className="tiny mb4">WORK ORDERS MTD</div><div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800 }}>{seedWos.filter(w => w.dept === selDept.name).length}</div></div>
                                    <div><div className="tiny mb4">PENDING REQUESTS</div><div style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800, color: "var(--yellow)" }}>{lcProjects.filter(p => p.dept === selDept.code && ["submitted", "review"].includes(p.stage)).length}</div></div>
                                </div>
                                <div className="sep" />
                                <div className="tiny mb8">ACTIVE seedProjects</div>
                                {seedProjects.filter(p => p.dept === selDept.name).map(p => (
                                    <div key={p.id} className="ii">
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: selDept.color, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</div><div className="tiny">{p.id} · {p.wos} WOs · Due {p.due}</div></div>
                                        <div style={{ textAlign: "right" }}><SB s={p.status} /><div className="tiny mt4">{Math.round(p.spent / p.budget * 100)}% budget</div></div>
                                    </div>
                                ))}
                                <div className="sep" />
                                <div className="tiny mb8">LIFECYCLE REQUESTS</div>
                                {lcProjects.filter(p => p.dept === selDept.code).map(p => (
                                    <div key={p.id} className="ii">
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: selDept.color, flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.name}</div><div className="tiny">{p.id} · {p.tech} · {p.material}</div></div>
                                        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                                            {p.priority === "urgent" && <SB s="urgent" />}
                                            <span className="b bsched" style={{ fontSize: 9 }}>{LIFECYCLE_STAGES.find(s => s.id === p.stage)?.label || p.stage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {tab === "chargeback" && (
                <div>
                    <div className="card mb16">
                        <div className="ch"><span className="ct">Internal Cost Chargeback — July 2025</span><span className="tiny">AED · machine time + material + labor</span></div>
                        <div className="tw"><table><thead><tr><th>Department</th><th>Machine Time</th><th>Material</th><th>Labor</th><th>Total Charged</th><th>Budget</th><th>Remaining</th></tr></thead><tbody>
                            {seedDepartments.map(d => {
                                const machTime = Math.round(d.spent * .38);
                                const mat = Math.round(d.spent * .32);
                                const labor = Math.round(d.spent * .30);
                                const remain = d.budget - d.spent;
                                return <tr key={d.id}>
                                    <td><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /><span style={{ fontWeight: 600 }}>{d.name}</span></div></td>
                                    <td><span className="tm">AED {machTime.toLocaleString()}</span></td>
                                    <td><span className="tm">AED {mat.toLocaleString()}</span></td>
                                    <td><span className="tm">AED {labor.toLocaleString()}</span></td>
                                    <td><span className="tm" style={{ fontWeight: 700, color: d.color }}>AED {d.spent.toLocaleString()}</span></td>
                                    <td><span className="tm">AED {d.budget.toLocaleString()}</span></td>
                                    <td><span className="tm" style={{ color: remain < 0 ? "var(--red)" : "var(--green)" }}>AED {remain.toLocaleString()}</span></td>
                                </tr>;
                            })}
                        </tbody></table></div>
                    </div>
                    <div className="g g2">
                        <div className="card"><div className="ch"><span className="ct">Spend by Department</span></div><div className="cb">
                            {seedDepartments.map(d => <div key={d.id} className="mb12"><div className="rowsb mb4"><span style={{ fontSize: 12 }}>{d.name}</span><span className="mono" style={{ color: d.color }}>AED {d.spent.toLocaleString()}</span></div><Prog pct={d.spent / d.budget * 100} color="cyan" h={6} /></div>)}
                        </div></div>
                        <div className="card"><div className="ch"><span className="ct">Cost Category Split</span></div><div className="cb">
                            {[{ l: "Machine Time (38%)", v: 38, c: "var(--accent)" }, { l: "Material (32%)", v: 32, c: "var(--green)" }, { l: "Labor (30%)", v: 30, c: "var(--purple)" }].map(s => <div key={s.l} className="mb12"><div className="rowsb mb4"><span style={{ fontSize: 12 }}>{s.l}</span></div><div className="prog" style={{ height: 8, borderRadius: 4 }}><div className="pf" style={{ width: `${s.v}%`, background: s.c, height: 8, borderRadius: 4 }} /></div></div>)}
                        </div></div>
                    </div>
                </div>
            )}
            {tab === "utilisation" && (
                <div className="g g2">
                    <div className="card"><div className="ch"><span className="ct">Printer Hours by Department (MTD)</span></div><div className="cb">
                        {seedDepartments.map(d => {
                            const hrs = [22, 41, 18, 38, 28][seedDepartments.indexOf(d)];
                            return <div key={d.id} className="mb12"><div className="rowsb mb4"><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /><span style={{ fontSize: 12 }}>{d.name}</span></div><span className="mono">{hrs}h</span></div><Prog pct={hrs / 50 * 100} color="cyan" h={6} /></div>;
                        })}
                    </div></div>
                    <div className="card"><div className="ch"><span className="ct">Jobs by Technology per Dept</span></div><div className="cb">
                        <div className="tw"><table><thead><tr><th>Dept</th><th>FDM</th><th>SLA</th><th>SLS</th><th>Total</th></tr></thead><tbody>
                            {seedDepartments.map(d => {
                                const fdm = seedWos.filter(w => w.dept === d.name && w.tech === "FDM").length;
                                const sla = seedWos.filter(w => w.dept === d.name && w.tech === "SLA").length;
                                const sls = seedWos.filter(w => w.dept === d.name && w.tech === "SLS").length;
                                return <tr key={d.id}><td><div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: d.color }} />{d.name}</div></td><td className="tm" style={{ color: "var(--fdm)" }}>{fdm}</td><td className="tm" style={{ color: "var(--sla)" }}>{sla}</td><td className="tm" style={{ color: "var(--sls)" }}>{sls}</td><td className="tm">{fdm + sla + sls}</td></tr>;
                            })}
                        </tbody></table></div>
                    </div></div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════════
   PERFORMANCE
══════════════════════════════════════════════════════════════════ */
