import React, { useState, useMemo } from "react";
import { LIFECYCLE_STAGES } from '../data/seed.jsx';
import { TB, SB, DB, Modal, Tabs } from '../components/atoms.jsx';

const PAGE_SIZE = 15;

export function Repository({ lcProjects }) {
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterTech, setFilterTech] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortDir, setSortDir] = useState("desc");
    const [page, setPage] = useState(0);
    const [selProject, setSelProject] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    // Aggregate stats
    const total = lcProjects?.length || 0;
    const completed = lcProjects?.filter(p => p.stage === "closed").length || 0;
    const inProgress = lcProjects?.filter(p => p.stage !== "closed").length || 0;
    const totalWO = lcProjects?.filter(p => p.woId).length || 0;

    // Filter & sort
    const filtered = useMemo(() => {
        let list = (lcProjects || []).filter(p => {
            const matchesSearch = search === "" || p.id.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()) || (p.woId || "").toLowerCase().includes(search.toLowerCase());
            const matchesStatus = filterStatus === "all" || (filterStatus === "completed" ? p.stage === "closed" : p.stage !== "closed");
            const matchesTech = filterTech === "all" || p.tech === filterTech;
            return matchesSearch && matchesStatus && matchesTech;
        });

        list.sort((a, b) => {
            let va, vb;
            if (sortBy === "date") { va = a.created || ""; vb = b.created || ""; }
            else if (sortBy === "name") { va = a.name; vb = b.name; }
            else if (sortBy === "wo") { va = a.woId || ""; vb = b.woId || ""; }
            else { va = a.id; vb = b.id; }
            if (va < vb) return sortDir === "asc" ? -1 : 1;
            if (va > vb) return sortDir === "asc" ? 1 : -1;
            return 0;
        });

        return list;
    }, [lcProjects, search, filterStatus, filterTech, sortBy, sortDir]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    function handleSort(field) {
        if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortBy(field); setSortDir("asc"); }
    }

    function SortIcon({ field }) {
        if (sortBy !== field) return <span style={{ color: "var(--text4)", marginLeft: 4, fontSize: 10 }}>⇅</span>;
        return <span style={{ color: "var(--accent)", marginLeft: 4, fontSize: 10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
    }

    function downloadPDF(project) {
        const printWindow = window.open('', '_blank');
        const history = (project.history || []).filter(h => h.done);
        const html = `<!DOCTYPE html><html><head><title>Project Report - ${project.id}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0 0 4px; font-size: 22px; color: #1e3a5f; }
            .header .meta { font-size: 12px; color: #64748b; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-right: 6px; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            .badge-green { background: #d1fae5; color: #065f46; }
            .badge-purple { background: #ede9fe; color: #6d28d9; }
            .section { margin-bottom: 24px; }
            .section h2 { font-size: 14px; color: #2563eb; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .grid-item { padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
            .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; }
            .value { font-size: 12px; font-weight: 500; }
            .timeline { margin: 12px 0; }
            .timeline-item { display: flex; gap: 10px; padding: 6px 0; border-left: 2px solid #e2e8f0; padding-left: 14px; margin-left: 4px; position: relative; }
            .timeline-item::before { content: ''; position: absolute; left: -5px; top: 10px; width: 8px; height: 8px; border-radius: 50%; background: #2563eb; }
            .timeline-item:last-child::before { background: #10b981; }
            .tl-stage { font-size: 11px; font-weight: 600; min-width: 120px; }
            .tl-time { font-size: 10px; color: #64748b; font-family: monospace; }
            .tl-note { font-size: 10px; color: #475569; margin-top: 2px; }
            .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
            @media print { body { padding: 20px; } }
        </style></head><body>
        <div class="header">
            <h1>${project.name}</h1>
            <div class="meta">${project.id} · Generated: ${new Date().toLocaleString("en-GB")}</div>
        </div>
        <div class="section">
            <span class="badge badge-blue">${project.tech}</span>
            ${project.woId ? `<span class="badge badge-purple">${project.woId}</span>` : ''}
        </div>
        <div class="section">
            <h2>Project Overview</h2>
            <div class="grid">
                <div class="grid-item"><div class="label">Owner</div><div class="value">${project.owner || "—"}</div></div>
                <div class="grid-item"><div class="label">Technology</div><div class="value">${project.tech || "—"}</div></div>
                <div class="grid-item"><div class="label">Material</div><div class="value">${project.material || "—"}</div></div>
                <div class="grid-item"><div class="label">Quantity</div><div class="value">${project.qty || "—"} pcs</div></div>
                <div class="grid-item"><div class="label">Machine Used</div><div class="value">${project.machine || "—"}</div></div>
                <div class="grid-item"><div class="label">Created</div><div class="value">${project.created || "—"}</div></div>
                <div class="grid-item"><div class="label">Due Date</div><div class="value">${project.due || "—"}</div></div>
                <div class="grid-item"><div class="label">Status</div><div class="value">${project.stage === "closed" ? "✓ Completed" : project.stage}</div></div>
            </div>
        </div>
        ${project.requestNote ? `<div class="section"><h2>Request Notes</h2><p style="font-size:12px;color:#475569;font-style:italic;">"${project.requestNote}"</p></div>` : ''}
        <div class="section">
            <h2>Project Timeline</h2>
            <div class="timeline">
                ${history.map(h => `<div class="timeline-item"><div><div class="tl-stage">${LIFECYCLE_STAGES.find(s => s.id === h.stage)?.label || h.stage}</div><div class="tl-time">${h.time || "—"}</div>${h.note ? `<div class="tl-note">${h.note}</div>` : ''}</div></div>`).join('')}
            </div>
        </div>
        ${project.extraInfo ? `<div class="section"><h2>Additional Information</h2><p style="font-size:12px;color:#475569;">${project.extraInfo}</p></div>` : ''}
        <div class="footer">Pryysm MES v3.0 · Project Docket Report · ${project.id}</div>
        <script>window.onload = function() { window.print(); }</script></body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">SYSTEM</span><h1 className="pg-title">Repository</h1></div>

            {/* Stats Cards */}
            <div className="g g4 mb16">
                <div className="kpi cb2"><div className="kl">Total Projects</div><div className="kv">{total}</div><div className="ks">all records</div></div>
                <div className="kpi cg"><div className="kl">Completed</div><div className="kv">{completed}</div><div className="ks">{total > 0 ? Math.round(completed / total * 100) : 0}% completion rate</div></div>
                <div className="kpi cy"><div className="kl">In Progress</div><div className="kv">{inProgress}</div><div className="ks">active projects</div></div>
                <div className="kpi cc"><div className="kl">Work Orders</div><div className="kv">{totalWO}</div><div className="ks">with WO assigned</div></div>
            </div>

            {/* Filters Bar */}
            <div className="card mb16">
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input className="fi" placeholder="🔍 Search by ID, name, or WO…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ flex: 1, minWidth: 180, fontSize: 11 }} />
                    <select className="fsel" style={{ fontSize: 11, width: 120 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="active">In Progress</option>
                    </select>
                    <select className="fsel" style={{ fontSize: 11, width: 100 }} value={filterTech} onChange={e => { setFilterTech(e.target.value); setPage(0); }}>
                        <option value="all">All Tech</option>
                        <option value="FDM">FDM</option>
                        <option value="SLA">SLA</option>
                        <option value="SLS">SLS</option>
                    </select>
                    <span className="tiny" style={{ color: "var(--text3)", marginLeft: 4 }}>{filtered.length} of {total}</span>
                </div>
            </div>

            {/* Data Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                            <tr style={{ background: "var(--bg3)", borderBottom: "2px solid var(--border)" }}>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => handleSort("id")}>Project<SortIcon field="id" /></th>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => handleSort("name")}>Name<SortIcon field="name" /></th>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)" }}>Tech</th>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)", cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => handleSort("wo")}>WO<SortIcon field="wo" /></th>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)" }}>Status</th>
                                <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)" }}>Machine</th>
                                <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No Projects Found</div>
                                    <div className="tiny">Completed projects will appear here after going through the full lifecycle.</div>
                                </td></tr>
                            ) : (
                                <>
                                    {paged.map(p => (
                                        <React.Fragment key={p.id}>
                                            <tr style={{ borderBottom: "1px solid var(--border)", background: expandedId === p.id ? "var(--bg3)" : "transparent", cursor: "pointer" }} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                                                <td style={{ padding: "8px 12px" }}><span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{p.id}</span></td>
                                                <td style={{ padding: "8px 12px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    <div style={{ fontWeight: 600, fontSize: 11.5 }}>{p.name}</div>
                                                    <div className="tiny" style={{ color: "var(--text3)" }}>{p.owner || "—"} · {p.created || "—"}</div>
                                                </td>
                                                <td style={{ padding: "8px 12px" }}><TB tech={p.tech} /></td>
                                                <td style={{ padding: "8px 12px" }}><span className="mono" style={{ fontSize: 11 }}>{p.woId || "—"}</span></td>
                                                <td style={{ padding: "8px 12px" }}>{p.stage === "closed" ? <span className="b" style={{ fontSize: 9, background: "var(--gdim)", color: "var(--green)" }}>✓ Done</span> : <SB s={p.stage} />}</td>
                                                <td style={{ padding: "8px 12px" }}><span className="tiny">{p.machine || "—"}</span></td>
                                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                                        <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); setSelProject(p); }}>Docket</button>
                                                        <button className="btn btp bts" style={{ fontSize: 10, padding: "3px 8px" }} onClick={e => { e.stopPropagation(); downloadPDF(p); }}>📥 PDF</button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedId === p.id && (
                                                <tr>
                                                    <td colSpan={8} style={{ padding: "12px 16px 16px", background: "var(--bg3)" }}>
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
                                                            {[["Material", p.material], ["Qty", p.qty + " pcs"], ["Due", p.due], ["Priority", p.priority], ["Created", p.created]].map(([k, v]) => (
                                                                <div key={k}><div className="tiny" style={{ color: "var(--text3)" }}>{k}</div><div style={{ fontSize: 11, fontWeight: 600 }}>{v || "—"}</div></div>
                                                            ))}
                                                        </div>
                                                        {p.requestNote && <div className="tiny mb8" style={{ fontStyle: "italic", color: "var(--text2)" }}>"{p.requestNote}"</div>}
                                                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                            {(p.history || []).filter(h => h.done).map(h => (
                                                                <span key={h.stage} className="b" style={{ fontSize: 9, background: "var(--gdim)", color: "var(--green)" }}>{LIFECYCLE_STAGES.find(s => s.id === h.stage)?.label || h.stage}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg3)" }}>
                        <span className="tiny" style={{ color: "var(--text3)" }}>Page {page + 1} of {totalPages} · Showing {(page * PAGE_SIZE) + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 10px" }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
                                const pageNum = startPage + i;
                                if (pageNum >= totalPages) return null;
                                return <button key={pageNum} className={`btn bts ${page === pageNum ? "btp" : "btg"}`} style={{ fontSize: 10, padding: "3px 8px", minWidth: 28 }} onClick={() => setPage(pageNum)}>{pageNum + 1}</button>;
                            })}
                            <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 10px" }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Project Docket Modal */}
            {selProject && (
                <Modal title={`Project Docket — ${selProject.id}`} onClose={() => setSelProject(null)} footer={(
                    <>
                        <button className="btn btg bts" onClick={() => setSelProject(null)}>Close</button>
                        <button className="btn btp bts" onClick={() => downloadPDF(selProject)}>📥 Download PDF Report</button>
                    </>
                )}>
                    <div style={{ background: "var(--bg3)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                            <TB tech={selProject.tech} />
                            {selProject.woId && <span className="b" style={{ fontSize: 9, background: "var(--adim)", color: "var(--accent)" }}>{selProject.woId}</span>}
                            {selProject.stage === "closed" ? <span className="b" style={{ fontSize: 9, background: "var(--gdim)", color: "var(--green)" }}>✓ Completed</span> : <SB s={selProject.stage} />}
                        </div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{selProject.name}</div>
                        <div className="tiny" style={{ color: "var(--text3)" }}>{selProject.id}{selProject.created ? ` · Created: ${selProject.created}` : ''}</div>
                    </div>

                    <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)", marginBottom: 16 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 10, textTransform: "uppercase" }}>Project Details</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                                ["Owner", selProject.owner], ["Technology", selProject.tech],
                                ["Material", selProject.material],
                                ["Quantity", selProject.qty + " pcs"], ["Machine", selProject.machine],
                                ["Due Date", selProject.due], ["Priority", selProject.priority],
                            ].map(([k, v]) => (
                                <div key={k}><div className="tiny" style={{ color: "var(--text3)" }}>{k}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{v || "—"}</div></div>
                            ))}
                        </div>
                    </div>

                    {selProject.requestNote && (
                        <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", padding: 12, border: "1px solid var(--border)", marginBottom: 16 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>REQUEST NOTES</div>
                            <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>"{selProject.requestNote}"</div>
                        </div>
                    )}
                    {selProject.extraInfo && (
                        <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", padding: 12, border: "1px solid var(--border)", marginBottom: 16 }}>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 6 }}>ADDITIONAL INFORMATION</div>
                            <div style={{ fontSize: 12, color: "var(--text2)" }}>{selProject.extraInfo}</div>
                        </div>
                    )}

                    <div style={{ background: "var(--bg2)", borderRadius: "var(--r2)", padding: 14, border: "1px solid var(--border)" }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 11, fontWeight: 700, color: "var(--text3)", marginBottom: 12, textTransform: "uppercase" }}>Complete Project Timeline</div>
                        {(selProject.history || []).map((h, i) => {
                            const stage = LIFECYCLE_STAGES.find(s => s.id === h.stage);
                            return (
                                <div key={h.stage} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < (selProject.history || []).length - 1 ? 10 : 0, paddingBottom: 10, borderBottom: i < (selProject.history || []).length - 1 ? "1px solid var(--border)" : "none" }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: h.done ? "var(--green)" : "var(--bg3)", border: `2px solid ${h.done ? "var(--green)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: h.done ? "#fff" : "var(--text3)" }}>
                                            {h.done ? "✓" : stage?.icon || i + 1}
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: h.done ? "var(--text)" : "var(--text3)" }}>{stage?.label || h.stage}</span>
                                            <span className="mono" style={{ fontSize: 10, color: h.done ? "var(--green)" : "var(--text3)" }}>{h.time || "Pending"}</span>
                                        </div>
                                        {h.note && <div className="tiny" style={{ color: "var(--text2)" }}>{h.note}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Modal>
            )}
        </div>
    );
}
