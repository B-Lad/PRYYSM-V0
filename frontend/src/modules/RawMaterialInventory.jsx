import React, { useState, useEffect, useRef } from "react";
import { RAW_FILAMENTS, RAW_RESINS, RAW_POWDERS } from '../data/seed.jsx';
import { useDemoMode } from '../hooks/useDemoMode.js';
import { Modal } from '../components/atoms.jsx';
import { ReorderModal } from '../components/ReorderModal.jsx';

export const RMI_STATUS_COLOR = { ok: 'var(--green)', low: 'var(--gold)', critical: 'var(--red)' };
export const RMI_STATUS_BADGE = { ok: 'brun', low: 'bwait', critical: 'berr' };
export const RMI_STATUS_LBL   = { ok: 'In Stock', low: 'Low Stock', critical: 'Critical' };



function MatCard({ item, type, openEdit, setFilaments, setResins, setPowders, computeStatus, openReorderModal }) {
    const pct = Math.min((item.qty / Math.max((item.minQty || 1) * 3, 1)) * 100, 100);
    const barColor = RMI_STATUS_COLOR[item.status];
    const unit = item.unit || (type === "resin" ? "L" : type === "powder" ? "kg" : "spools");
    const qtyLabel = type === "resin" ? "Available" : type === "powder" ? "Remaining (kg)" : "Spools";
    return (
        <div style={{ background: "var(--bg2)", border: `1px solid ${item.status === "critical" ? "rgba(220,38,38,.35)" : item.status === "low" ? "rgba(184,134,11,.3)" : "var(--border)"}`, borderRadius: "var(--r3)", padding: 16, boxShadow: item.status === "critical" ? "0 0 0 1px rgba(220,38,38,.15),var(--shadow)" : "var(--shadow)", transition: "box-shadow .15s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow2)"} onMouseLeave={e => e.currentTarget.style.boxShadow = item.status === "critical" ? "0 0 0 1px rgba(220,38,38,.15),var(--shadow)" : "var(--shadow)"}>
            {item.status === "critical" && <div style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", borderRadius: "var(--r)", padding: "4px 8px", marginBottom: 10, fontSize: 10, color: "var(--red)", display: "flex", alignItems: "center", gap: 5 }}>⚠ Out of stock — reorder immediately</div>}
            <div className="rowsb mb6">
                <div className="row" style={{ gap: 8, minWidth: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: item.color, border: "1px solid rgba(0,0,0,.12)", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.15)" }} />
                    <div style={{ fontFamily: "var(--fd)", fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                </div>
                <span className={`b ${RMI_STATUS_BADGE[item.status]}`} style={{ fontSize: 9, flexShrink: 0 }}>{RMI_STATUS_LBL[item.status]}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6 }}>
                {item.brand && <span>{item.brand}</span>}
                {(item.type || item.material) && <span style={{ color: "var(--text3)" }}> · {item.type || item.material}</span>}
                {item.finish && <span style={{ color: "var(--text3)" }}> · {item.finish}</span>}
            </div>
            <div className="rowsb mb4">
                <span className="tiny">{qtyLabel}</span>
                <span style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, color: barColor }}>{item.qty} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--text3)" }}>{unit}</span></span>
            </div>
            <div style={{ background: "var(--bg4)", borderRadius: 3, height: 7, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${pct}%`, background: barColor, height: 7, borderRadius: 3, transition: "width .5s" }} />
            </div>
            <div className="rowsb mb12" style={{ flexWrap: "wrap", gap: 4 }}>
                <span className="tiny">Min: <span style={{ color: "var(--text2)", fontWeight: 600 }}>{item.minQty || "—"} {unit}</span></span>
                {item.code && <span className="mono" style={{ fontSize: 9, color: "var(--text4)", background: "var(--bg4)", padding: "1px 5px", borderRadius: 3 }}>{item.code}</span>}
            </div>
            <div className="row" style={{ gap: 6 }}>
                <button className="btn btg bts" style={{ flex: 1, justifyContent: "center", fontSize: 10 }} onClick={() => openEdit(type, item)}>✎ Edit / Add Stock</button>
                <button className="btn bts" style={{ fontSize: 10, padding: "3px 10px", background: item.status === "critical" ? "var(--rdim)" : "var(--golddim)", color: item.status === "critical" ? "var(--red)" : "var(--gold)", border: `1px solid ${item.status === "critical" ? "rgba(220,38,38,.3)" : "rgba(184,134,11,.25)"}` }} onClick={() => openReorderModal(item, type)}>⟳ Reorder</button>
            </div>
        </div>
    );
}

function MatTabContent({ items, type, typeLabel, search, setSearch, brandFilter, setBrandFilter, matFilter, setMatFilter, statusFilter, setStatusFilter, openEdit, openAdd, setFilaments, setResins, setPowders, computeStatus, openReorderModal }) {
    const filtered = items.filter(x => {
        if (search && !x.name.toLowerCase().includes(search.toLowerCase()) && !x.brand?.toLowerCase().includes(search.toLowerCase())) return false;
        if (brandFilter !== "all" && x.brand !== brandFilter) return false;
        if (statusFilter === "low" && x.status !== "low") return false;
        if (statusFilter === "critical" && x.status !== "critical") return false;
        if (statusFilter === "ok" && x.status !== "ok") return false;
        return true;
    });
    const brands = [...new Set(items.map(x => x.brand).filter(Boolean))];
    const matTypes = [...new Set(items.map(x => x.type || x.material).filter(Boolean))];
    const qtyLabel = type === "resin" ? "Available (L/bottles)" : type === "powder" ? "Powder Remaining (kg)" : "Spools Remaining";
    const totalQty = items.reduce((a, x) => a + x.qty, 0);
    const critCount = items.filter(x => x.status === "critical").length;
    const unit = items[0]?.unit || "";
    return (
        <div>
            <div className="rowsb mb12" style={{ flexWrap: "wrap", gap: 8 }}>
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>{typeLabel} Groups</div>
                    <div className="tiny">Manage all your {typeLabel.toLowerCase()} materials.</div>
                </div>
                <button className="btn btp bts" style={{ fontSize: 11 }} onClick={openAdd}>⊕ Add {typeLabel.slice(0, -1)}</button>
            </div>
            <div className="g g3 mb14" style={{ gap: 10 }}>
                {[
                    { l: "Total Groups", v: items.length, unit: "", alert: false },
                    { l: qtyLabel, v: totalQty, unit: unit, alert: false },
                    { l: "Critical Stock", v: critCount, unit: "items", alert: true },
                ].map(k => (
                    <div key={k.l} style={{ background: k.alert ? "rgba(220,38,38,.06)" : "var(--bg2)", border: `1px solid ${k.alert ? "rgba(220,38,38,.3)" : "var(--border)"}`, borderRadius: "var(--r2)", padding: "12px 16px", boxShadow: "var(--shadow)", minHeight: 80, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div style={{ fontFamily: "var(--fm)", fontSize: 9, letterSpacing: "1.2px", textTransform: "uppercase", color: k.alert ? "var(--red)" : "var(--text3)", marginBottom: 8 }}>{k.l}</div>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800, lineHeight: 1, color: k.alert ? "var(--red)" : "var(--text)" }}>
                            {k.alert && "⚠ "}{k.v}{k.unit && <span style={{ fontSize: 12, fontWeight: 400, color: k.alert ? "var(--red)" : "var(--text2)", marginLeft: 4 }}>{k.unit}</span>}
                        </div>
                        {k.alert && k.v > 0 && <div style={{ fontSize: 10, color: "var(--red)", marginTop: 4 }}>Immediate reorder needed</div>}
                    </div>
                ))}
            </div>
            <div className="row mb12" style={{ gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                <input className="fi" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 180, fontSize: 11 }} />
                <select className="fsel" style={{ width: 120, fontSize: 11 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                    <option value="all">All Brands</option>
                    {brands.map(b => <option key={b}>{b}</option>)}
                </select>
                <select className="fsel" style={{ width: 130, fontSize: 11 }} value={matFilter} onChange={e => setMatFilter(e.target.value)}>
                    <option value="all">All Materials</option>
                    {matTypes.map(m => <option key={m}>{m}</option>)}
                </select>
                {["all", "ok", "low", "critical"].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "3px 10px", borderRadius: "var(--r)", border: "1px solid", fontSize: 10, fontFamily: "var(--fm)", cursor: "pointer", background: statusFilter === s ? "var(--accent)" : "transparent", color: statusFilter === s ? "#fff" : "var(--text2)", borderColor: statusFilter === s ? "var(--accent)" : "var(--border2)", transition: "all .12s" }}>
                        {{ all: "All", ok: "In Stock", low: "Low Stock", critical: "Critical" }[s]}
                    </button>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
                {filtered.map(item => <MatCard key={item.id} item={item} type={type} openEdit={openEdit} setFilaments={setFilaments} setResins={setResins} setPowders={setPowders} computeStatus={computeStatus} openReorderModal={openReorderModal} />)}
                {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text3)" }}>No items match your filters.</div>}
            </div>
        </div>
    );
}

export function RawMaterialInventory({ printerAssignments = {} }) {
    const isDemo = useDemoMode();
    const [tab, setTab] = useState("dashboard");
    const [matTab, setMatTab] = useState("filaments");
    const [filaments, setFilaments] = useState(isDemo ? RAW_FILAMENTS : []);
    const [resins, setResins] = useState(isDemo ? RAW_RESINS : []);
    const [powders, setPowders] = useState(isDemo ? RAW_POWDERS : []);
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState(null); // {type,item}
    const [search, setSearch] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [matFilter, setMatFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [reorderQueue, setReorderQueue] = useState([]); // { itemId, type, qty, name, unit }
    const [orderHistory, setOrderHistory] = useState([]); // { itemId, name, qty, unit, type, orderedAt }
    const [pendingReorder, setPendingReorder] = useState(null); // { item, type }

    // blank forms
    const blankF = { name: "", brand: "", type: "Standard", color: "#2563EB", code: "", sku: "", qty: 0, minQty: 2, reorder: 5, unit: "spools" };
    const blankR = { name: "", brand: "", material: "ABS-Like", color: "#6366F1", code: "", qty: 0, minQty: 2, unit: "L" };
    const blankP = { name: "", brand: "", material: "Nylon PA12", color: "#B8860B", code: "", qty: 0, minQty: 10, unit: "kg" };
    const [form, setForm] = useState(blankF);
    const sf = k => v => setForm(p => ({ ...p, [k]: v }));

    const all = [...filaments.map(x => ({ ...x, _type: "filament" })), ...resins.map(x => ({ ...x, _type: "resin" })), ...powders.map(x => ({ ...x, _type: "powder" }))];
    const totalItems = all.length;
    const lowStock = all.filter(x => x.status === "low" || x.status === "critical");
    const criticalStock = all.filter(x => x.status === "critical");

    const matProcReqs = Object.values(printerAssignments || {}).flatMap(a => 
        (a.woData?.procReqs || [])
            .filter(req => req.source === 'material')
            .map(req => ({ ...req, project: a.projectData?.name || "Unknown Project", woId: a.woData?.woId }))
    );

    function computeStatus(qty, minQty) { return qty === 0 ? "critical" : qty <= minQty ? "low" : "ok"; }

    function openReorderModal(item, type) {
        setPendingReorder({ item, type });
    }

    function confirmReorder(qty) {
        if (!pendingReorder) return;
        const { item, type } = pendingReorder;
        const unit = item.unit || (type === "resin" ? "L" : type === "powder" ? "kg" : "spools");
        setReorderQueue(prev => {
            if (prev.find(r => r.itemId === item.id)) {
                return prev.map(r => r.itemId === item.id ? { ...r, qty, unit } : r);
            }
            return [...prev, { itemId: item.id, type, qty, name: item.name, unit }];
        });
        setPendingReorder(null);
        setTab("reorder");
    }

    function updateReorderQty(itemId, qty) {
        setReorderQueue(prev => prev.map(r => r.itemId === itemId ? { ...r, qty } : r));
    }

    function removeFromReorderQueue(itemId) {
        setReorderQueue(prev => prev.filter(r => r.itemId !== itemId));
    }

    function placeReorder(itemId) {
        const reorderItem = reorderQueue.find(r => r.itemId === itemId);
        if (!reorderItem) return;
        const add = reorderItem.qty;
        if (reorderItem.type === "filament") {
            setFilaments(p => p.map(x => x.id === itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
        } else if (reorderItem.type === "resin") {
            setResins(p => p.map(x => x.id === itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
        } else {
            setPowders(p => p.map(x => x.id === itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
        }
        const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        setOrderHistory(prev => [...prev, {
            itemId: reorderItem.itemId,
            name: reorderItem.name,
            qty: reorderItem.qty,
            unit: reorderItem.unit,
            type: reorderItem.type,
            orderedAt: now
        }]);
        removeFromReorderQueue(itemId);
    }

    function placeAllReorders() {
        const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        reorderQueue.forEach(r => {
            const add = r.qty;
            if (r.type === "filament") {
                setFilaments(p => p.map(x => x.id === r.itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
            } else if (r.type === "resin") {
                setResins(p => p.map(x => x.id === r.itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
            } else {
                setPowders(p => p.map(x => x.id === r.itemId ? { ...x, qty: x.qty + add, status: computeStatus(x.qty + add, x.minQty) } : x));
            }
            setOrderHistory(prev => [...prev, {
                itemId: r.itemId,
                name: r.name,
                qty: r.qty,
                unit: r.unit,
                type: r.type,
                orderedAt: now
            }]);
        });
        setReorderQueue([]);
    }

    function saveNew() {
        const status = computeStatus(form.qty, form.minQty);
        if (matTab === "filaments") setFilaments(p => [...p, { ...form, id: "RF" + (p.length + 10), status }]);
        else if (matTab === "resins") setResins(p => [...p, { ...form, id: "RR" + (p.length + 10), status, material: form.type }]);
        else setPowders(p => [...p, { ...form, id: "RP" + (p.length + 10), status }]);
        setShowAdd(false);
    }

    function saveEdit() {
        if (!editItem) return;
        const { type, item } = editItem;
        const status = computeStatus(item.qty, item.minQty || item.minQty);
        const updated = { ...item, status };
        if (type === "filament") setFilaments(p => p.map(x => x.id === item.id ? updated : x));
        else if (type === "resin") setResins(p => p.map(x => x.id === item.id ? updated : x));
        else setPowders(p => p.map(x => x.id === item.id ? updated : x));
        setEditItem(null);
    }

    function openEdit(type, item) { setEditItem({ type, item: { ...item } }); }
    function setEf(k, v) { setEditItem(p => ({ ...p, item: { ...p.item, [k]: v } })); }

    function openAdd() {
        if (matTab === "filaments") setForm({ ...blankF });
        else if (matTab === "resins") setForm({ ...blankR });
        else setForm({ ...blankP });
        setShowAdd(true);
    }

    const sharedProps = { openEdit, openAdd, setFilaments, setResins, setPowders, computeStatus, search, setSearch, brandFilter, setBrandFilter, matFilter, setMatFilter, statusFilter, setStatusFilter, openReorderModal };

    // Add modal fields by type
    function AddFields() {
        if (matTab === "filaments") return (
            <>
                <div className="frow"><div className="fg"><label className="fl">Name</label><input className="fi" placeholder="e.g. PLA Black" value={form.name} onChange={e => sf("name")(e.target.value)} /></div></div>
                <div className="frow">
                    <div className="fg"><label className="fl">Brand</label><input className="fi" value={form.brand || ""} onChange={e => sf("brand")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Type</label><select className="fsel" value={form.type} onChange={e => sf("type")(e.target.value)}><option>Standard</option><option>Engineering</option><option>Flexible</option><option>Silk</option></select></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{ padding: "4px 8px", height: 38 }} value={form.color} onChange={e => sf("color")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Code</label><input className="fi" placeholder="A00042" value={form.code || ""} onChange={e => sf("code")(e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Total Volume (ml)</label><input type="number" className="fi" defaultValue={1000} /></div>
                    <div className="fg"><label className="fl">Min Order Qty</label><input type="number" className="fi" value={form.reorder} onChange={e => sf("reorder")(+e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Min Stock Level</label><input type="number" className="fi" value={form.minQty} onChange={e => sf("minQty")(+e.target.value)} /></div>
                    <div className="fg"><label className="fl">Finish</label><input className="fi" placeholder="e.g. Matte, Glossy, Satin, Silk" value={form.finish || ""} onChange={e => sf("finish")(e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Number of Spools</label><input type="number" className="fi" value={form.qty} onChange={e => sf("qty")(+e.target.value)} /></div>
                </div>
            </>
        );
        if (matTab === "resins") return (
            <>
                <div className="frow"><div className="fg"><label className="fl">Name</label><input className="fi" placeholder="e.g. Standard Grey" value={form.name} onChange={e => sf("name")(e.target.value)} /></div></div>
                <div className="frow">
                    <div className="fg"><label className="fl">Brand</label><input className="fi" value={form.brand || ""} onChange={e => sf("brand")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Material</label><select className="fsel" value={form.type} onChange={e => sf("type")(e.target.value)}><option>ABS-Like</option><option>Flexible</option><option>Tough 2000</option><option>Model V2</option><option>Standard</option><option>Castable</option></select></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{ padding: "4px 8px", height: 38 }} value={form.color} onChange={e => sf("color")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Code</label><input className="fi" value={form.code || ""} onChange={e => sf("code")(e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Finish</label><input className="fi" placeholder="e.g. Matte, Glossy, Translucent" value={form.finish || ""} onChange={e => sf("finish")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Min Order Qty</label><input type="number" className="fi" value={form.minQty} onChange={e => sf("minQty")(+e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Type Weight (g)</label><input type="number" className="fi" defaultValue={1000} /></div>
                    <div className="fg"><label className="fl">Number of Bottles</label><input type="number" className="fi" value={form.qty} onChange={e => sf("qty")(+e.target.value)} /></div>
                </div>
            </>
        );
        return (
            <>
                <div className="frow"><div className="fg"><label className="fl">Name</label><input className="fi" placeholder="e.g. PA12 White" value={form.name} onChange={e => sf("name")(e.target.value)} /></div></div>
                <div className="frow">
                    <div className="fg"><label className="fl">Brand</label><input className="fi" value={form.brand || ""} onChange={e => sf("brand")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Material</label><input className="fi" value={form.type || "Nylon PA12"} onChange={e => sf("type")(e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{ padding: "4px 8px", height: 38 }} value={form.color} onChange={e => sf("color")(e.target.value)} /></div>
                    <div className="fg"><label className="fl">Code</label><input className="fi" value={form.code || ""} onChange={e => sf("code")(e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Total Weight (kg)</label><input type="number" className="fi" value={form.qty} onChange={e => sf("qty")(+e.target.value)} /></div>
                    <div className="fg"><label className="fl">Min Order (batches)</label><input type="number" className="fi" value={form.minQty} onChange={e => sf("minQty")(+e.target.value)} /></div>
                </div>
                <div className="frow">
                    <div className="fg"><label className="fl">Number of Batches</label><input type="number" className="fi" defaultValue={1} /></div>
                </div>
            </>
        );
    }

    return (
        <div>
            <div className="pg-hd"><span className="pg-eyebrow">OPERATIONS</span><h1 className="pg-title">Raw Material Inventory</h1></div>

            {/* Top-level tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                {[{ id: "dashboard", label: "Dashboard" }, { id: "filaments", label: "Filaments" }, { id: "resins", label: "Resins" }, { id: "powders", label: "Powders" }, { id: "reorder", label: "Reorder" }].map(t => (
                    <button key={t.id} className={`tab ${tab === t.id ? "act" : ""}`} onClick={() => { setTab(t.id); setMatTab(t.id === "dashboard" || t.id === "reorder" ? matTab : t.id); setSearch(""); setBrandFilter("all"); setMatFilter("all"); setStatusFilter("all"); }}>{t.label}</button>
                ))}
            </div>

            {/* ── Dashboard ── */}
            {tab === "dashboard" && (
                <div>
                    <div className="g g3 mb16" style={{ gap: 12 }}>
                        {[
                            { l: "Total Items", v: totalItems, c: "cc" },
                            { l: "Low Stock Items", v: lowStock.length, c: "cy" },
                            { l: "Critical Stock", v: criticalStock.length, c: "cr" },
                        ].map(k => (
                            <div key={k.l} className={`kpi ${k.c}`}><div className="kl">{k.l}</div><div className="kv" style={{ fontSize: 24 }}>{k.v}</div></div>
                        ))}
                    </div>

                    {/* Category cards */}
                    <div className="g g3 mb16" style={{ gap: 12 }}>
                        {[{ id: "filaments", l: "Filaments", items: filaments, icon: "⊟", color: "var(--accent)" }, { id: "resins", l: "Resins", items: resins, icon: "◈", color: "var(--purple)" }, { id: "powders", l: "Powders", items: powders, icon: "◇", color: "var(--gold)" }].map(c => (
                            <div key={c.id} className="card" style={{ cursor: "pointer", borderTop: `3px solid ${c.color}` }} onClick={() => setTab(c.id)}>
                                <div className="cb" style={{ padding: "14px 16px" }}>
                                    <div className="row mb6"><span style={{ fontSize: 20 }}>{c.icon}</span><span style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>{c.l}</span></div>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{c.items.length} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text2)" }}>groups</span></div>
                                    {c.items.filter(x => x.status !== "ok").length > 0
                                        ? <div className="tiny" style={{ color: "var(--gold)" }}>⚠ {c.items.filter(x => x.status !== "ok").length} need attention</div>
                                        : <div className="tiny" style={{ color: "var(--green)" }}>✓ All stocked</div>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Attention table */}
                    {matProcReqs.length > 0 && (
                        <div className="card mb16" style={{ border: "1px solid var(--accent)" }}>
                            <div className="ch" style={{ background: "rgba(37,99,235,.05)", borderBottom: "1px solid rgba(37,99,235,.15)" }}>
                                <span className="ct" style={{ color: "var(--accent)" }}>AM Review Procurement Requests</span>
                                <span className="tiny" style={{ color: "var(--accent)" }}>Requested directly from production planning</span>
                            </div>
                            <div className="tw">
                                <table>
                                    <thead><tr><th>Project / WO</th><th>Material / Item Name</th><th>Requested Qty</th><th>Notes</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {matProcReqs.map((req, i) => (
                                            <tr key={i} style={{ background: "var(--bg1)" }}>
                                                <td>
                                                    <div style={{ fontWeight: 700 }}>{req.woId}</div>
                                                    <div className="tiny dim">{req.project}</div>
                                                </td>
                                                <td style={{ fontWeight: 600, color: "var(--text)" }}>{req.name}</td>
                                                <td className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>{req.qty}</td>
                                                <td className="tiny">{req.notes || "—"}</td>
                                                <td><span className="b bidle" style={{ fontSize: 9 }}>Pending Purchase</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {lowStock.length > 0 && (
                        <div className="card">
                            <div className="ch">
                                <span className="ct">Items Needing Attention</span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span className="tiny">Stock at or below minimum level</span>
                                    <button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => {
                                        lowStock.forEach(x => {
                                            const suggestedQty = x.reorder || x.minQty * 2 || x.minQty || 5;
                                            const unit = x.unit || (x._type === "resin" ? "L" : x._type === "powder" ? "kg" : "spools");
                                            setReorderQueue(prev => {
                                                if (prev.find(r => r.itemId === x.id)) return prev;
                                                return [...prev, { itemId: x.id, type: x._type, qty: suggestedQty, name: x.name, unit }];
                                            });
                                        });
                                        setTab("reorder");
                                    }}>⟳ Add All to Reorder</button>
                                </div>
                            </div>
                            <div className="tw">
                                <table>
                                    <thead><tr><th>#</th><th>Group</th><th>Name</th><th>Brand</th><th>Type</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {lowStock.map((x, i) => (
                                            <tr key={x.id}>
                                                <td className="mono">{i + 1}</td>
                                                <td><div style={{ width: 10, height: 10, borderRadius: "50%", background: x.color, display: "inline-block", marginRight: 6 }} />{x._type}</td>
                                                <td style={{ fontWeight: 500 }}>{x.name}</td>
                                                <td className="tdim">{x.brand}</td>
                                                <td className="tdim">{x.material || x.type || "—"}</td>
                                                <td><span className="mono" style={{ color: RMI_STATUS_COLOR[x.status] }}>{x.qty} {x.unit || "spools"}</span></td>
                                                <td><span className={`b ${RMI_STATUS_BADGE[x.status]}`} style={{ fontSize: 9 }}>{RMI_STATUS_LBL[x.status]}</span></td>
                                                <td><button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => openReorderModal(x, x._type)}>⟳ Reorder</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {lowStock.length === 0 && <div className="card"><div className="cb" style={{ textAlign: "center", padding: 24, color: "var(--green)" }}>✓ All items are well stocked.</div></div>}
                </div>
            )}

            {tab === "filaments" && <MatTabContent items={filaments} type="filament" typeLabel="Filaments" {...sharedProps} />}
            {tab === "resins" && <MatTabContent items={resins} type="resin" typeLabel="Resins" {...sharedProps} />}
            {tab === "powders" && <MatTabContent items={powders} type="powder" typeLabel="Powders" {...sharedProps} />}

            {/* ── Reorder ── */}
            {tab === "reorder" && (
                <div>
                    <div className="card mb16">
                        <div className="ch">
                            <div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>Reorder Queue</div>
                                <div className="tiny">Review and confirm items to reorder.</div>
                            </div>
                            {reorderQueue.length > 0 && (
                                <button className="btn btp bts" style={{ fontSize: 11 }} onClick={placeAllReorders}>
                                    Place All Orders ({reorderQueue.length})
                                </button>
                            )}
                        </div>
                        <div className="tw">
                            {reorderQueue.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, color: "var(--text3)" }}>
                                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                                    <div style={{ fontFamily: "var(--fd)", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No Items in Reorder Queue</div>
                                    <div className="tiny">Click "Reorder" on any item card to add it here.</div>
                                </div>
                            ) : (
                                <table>
                                    <thead><tr><th>Color</th><th>Item Name</th><th>Brand</th><th>Type</th><th>Current Qty</th><th>Reorder Qty</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {reorderQueue.map(r => {
                                            let item;
                                            if (r.type === "filament") item = filaments.find(x => x.id === r.itemId);
                                            else if (r.type === "resin") item = resins.find(x => x.id === r.itemId);
                                            else item = powders.find(x => x.id === r.itemId);
                                            if (!item) return null;
                                            return (
                                                <tr key={r.itemId}>
                                                    <td><div style={{ width: 24, height: 24, borderRadius: "50%", background: item.color, border: "1px solid var(--border2)" }} /></td>
                                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                                    <td className="tdim">{item.brand}</td>
                                                    <td className="tdim">{item.type || item.material || "—"}</td>
                                                    <td><span className="mono" style={{ color: RMI_STATUS_COLOR[item.status] }}>{item.qty} {item.unit || "spools"}</span></td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            className="fi" 
                                                            style={{ width: 80, fontSize: 12 }} 
                                                            min={1} 
                                                            value={r.qty} 
                                                            onChange={e => updateReorderQty(r.itemId, parseInt(e.target.value) || 1)} 
                                                        />
                                                    </td>
                                                    <td><span className={`b ${RMI_STATUS_BADGE[item.status]}`} style={{ fontSize: 9 }}>{RMI_STATUS_LBL[item.status]}</span></td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            <button className="btn btp bts" style={{ fontSize: 10 }} onClick={() => placeReorder(r.itemId)}>Place Order</button>
                                                            <button className="btn btd bts" style={{ fontSize: 10 }} onClick={() => removeFromReorderQueue(r.itemId)}>✕</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Order History */}
                    {orderHistory.length > 0 && (
                        <div className="card">
                            <div className="ch">
                                <span className="ct">Order History</span>
                                <span className="tiny dim">{orderHistory.length} orders placed</span>
                            </div>
                            <div className="tw">
                                <table>
                                    <thead><tr><th>Item Name</th><th>Type</th><th>Quantity Ordered</th><th>Ordered At</th></tr></thead>
                                    <tbody>
                                        {[...orderHistory].reverse().map((order, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 500 }}>{order.name}</td>
                                                <td className="tdim">{order.type}</td>
                                                <td><span className="mono" style={{ color: "var(--green)" }}>+{order.qty} {order.unit}</span></td>
                                                <td className="tiny dim">{order.orderedAt}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Add Modal */}
            {showAdd && (
                <Modal title={`Add New ${matTab === "filaments" ? "Filament" : matTab === "resins" ? "Resin" : "Powder"}`} onClose={() => setShowAdd(false)} footer={(
                    <><button className="btn btg bts" onClick={() => setShowAdd(false)}>Cancel</button>
                        <button className="btn btp bts" onClick={saveNew} disabled={!form.name}>Save</button></>
                )}>
                    <AddFields />
                </Modal>
            )}

            {/* Edit / Add Stock Modal */}
            {editItem && (
                <Modal title={`Edit: ${editItem.item.name}`} onClose={() => setEditItem(null)} footer={(
                    <><button className="btn btg bts" onClick={() => setEditItem(null)}>Cancel</button>
                        <button className="btn btp bts" onClick={saveEdit}>Save Changes</button></>
                )}>
                    <div className="frow"><div className="fg"><label className="fl">Name</label><input className="fi" value={editItem.item.name} onChange={e => setEf("name", e.target.value)} /></div></div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Brand</label><input className="fi" value={editItem.item.brand || ""} onChange={e => setEf("brand", e.target.value)} /></div>
                        <div className="fg"><label className="fl">Code</label><input className="fi" value={editItem.item.code || ""} onChange={e => setEf("code", e.target.value)} /></div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Color</label><input type="color" className="fi" style={{ padding: "4px 8px", height: 38 }} value={editItem.item.color} onChange={e => setEf("color", e.target.value)} /></div>
                        <div className="fg"><label className="fl">Finish</label><input className="fi" placeholder="e.g. Matte, Glossy, Satin, Silk" value={editItem.item.finish || ""} onChange={e => setEf("finish", e.target.value)} /></div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Min Stock Level</label><input type="number" className="fi" value={editItem.item.minQty || 0} onChange={e => setEf("minQty", +e.target.value)} /></div>
                    </div>
                    <div style={{ background: "var(--adim)", border: "1px solid rgba(37,99,235,.15)", borderRadius: "var(--r2)", padding: 12, marginBottom: 12 }}>
                        <div style={{ fontFamily: "var(--fd)", fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>Update Stock Quantity</div>
                        <div className="frow" style={{ marginBottom: 0 }}>
                            <div className="fg"><label className="fl">Current Qty ({editItem.item.unit || (editItem.type === "resin" ? "L" : editItem.type === "powder" ? "kg" : "spools")})</label><input type="number" className="fi" value={editItem.item.qty} onChange={e => setEf("qty", +e.target.value)} /></div>
                            <div className="fg"><label className="fl">Quick Add</label>
                                <div className="row" style={{ gap: 6 }}>
                                    {[5, 10, 20, 50].map(n => (
                                        <button key={n} className="btn btg bts" style={{ fontSize: 11 }} onClick={() => setEf("qty", (editItem.item.qty || 0) + n)}>+{n}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reorder Modal */}
            {pendingReorder && (
                <ReorderModal
                    item={pendingReorder.item}
                    type={pendingReorder.type}
                    suggestedQty={pendingReorder.item.reorder || Math.max(pendingReorder.item.minQty * 2 - pendingReorder.item.qty, pendingReorder.item.minQty)}
                    unit={pendingReorder.item.unit || (pendingReorder.type === "resin" ? "L" : pendingReorder.type === "powder" ? "kg" : "spools")}
                    onConfirm={confirmReorder}
                    onClose={() => setPendingReorder(null)}
                />
            )}
        </div>
    );
}
