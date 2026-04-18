import React, { useState, useEffect, useRef } from "react";
import { Modal } from '../components/atoms.jsx';
import { ImageUpload } from '../components/ImageUpload.jsx';

const SPARE_CATEGORIES = [
    { id: "packing", name: "Packing Material", icon: "📦", color: "var(--accent)" },
    { id: "electronics", name: "Electronics", icon: "⚡", color: "var(--gold)" },
    { id: "tools", name: "Tools", icon: "🔧", color: "var(--green)" },
    { id: "misc", name: "Miscellaneous", icon: "◇", color: "var(--purple)" },
];
const SPARE_SEED = [
    { id: "SP01", name: "Packing Boxes (Small)", cat: "packing", desc: "Tiny corrugated boxes 10x10x10cm", qty: 450, minStock: 100, location: "Shelf A-1", img: null, status: "ok" },
    { id: "SP02", name: "Packing Boxes (Medium)", cat: "packing", desc: "20x20x20cm cardboard boxes", qty: 300, minStock: 80, location: "Shelf A-2", img: null, status: "ok" },
    { id: "SP03", name: "Bubble Wrap (Roll)", cat: "packing", desc: "5m of protective bubble wrap", qty: 15, minStock: 5, location: "Shelf B-1", img: null, status: "low" },
    { id: "SP04", name: "Stepper Motors", cat: "electronics", desc: "NEMA 17, 1.2A, 400 steps/rev", qty: 8, minStock: 3, location: "Cabinet 1", img: null, status: "ok" },
    { id: "SP05", name: "Hotend Assembly", cat: "electronics", desc: "Complete hotend for FDM printers", qty: 5, minStock: 2, location: "Cabinet 1", img: null, status: "ok" },
    { id: "SP06", name: "Calipers", cat: "tools", desc: "Digital measuring tool, 0-150mm", qty: 3, minStock: 1, location: "Drawer B-1", img: null, status: "ok" },
    { id: "SP07", name: "Isopropyl Alcohol", cat: "misc", desc: "99% IPA, 1L bottles", qty: 2, minStock: 4, location: "Shelf C-1", img: null, status: "critical" },
    { id: "SP08", name: "Gloves (Box)", cat: "misc", desc: "Nitrile, powder-free, L size", qty: 6, minStock: 2, location: "Shelf C-2", img: null, status: "ok" },
];

export const SPARE_STATUS_BADGE = { ok: "brun", low: "bwait", critical: "berr" };
export const SPARE_STATUS_LABEL = { ok: "In Stock", low: "Low Stock", critical: "Out of Stock" };

function ItemCard({ item, setShowEdit, setItems, addToReorderQueue }) {
    const cat = SPARE_CATEGORIES.find(c => c.id === item.cat);
    const pct = Math.min((item.qty / Math.max(item.minStock * 2, 1)) * 100, 100);
    const barColor = item.status === "ok" ? "var(--green)" : item.status === "low" ? "var(--gold)" : "var(--red)";
    return (
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ height: 120, background: "var(--bg3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, borderBottom: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
                {item.img ? (
                    <img src={item.img} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    cat?.icon || "◇"
                )}
                <div style={{ position: "absolute", top: 8, right: 8 }}><span className={`b ${SPARE_STATUS_BADGE[item.status]}`} style={{ fontSize: 9 }}>{SPARE_STATUS_LABEL[item.status]}</span></div>
            </div>
            <div className="cb" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, padding: 12 }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 12.5, fontWeight: 700 }}>{item.name}</div>
                <div className="tiny" style={{ color: "var(--text2)", lineHeight: 1.4 }}>{item.desc}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                    <span className="tiny">Quantity</span><span className="tiny">Min Stock</span><span className="tiny">Location</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
                    <span style={{ color: barColor }}>{item.qty}</span>
                    <span className="mono">{item.minStock}</span>
                    <span className="mono" style={{ fontSize: 10 }}>{item.location}</span>
                </div>
                <div style={{ background: "var(--bg4)", borderRadius: 2, height: 4, overflow: "hidden", marginTop: 2 }}>
                    <div style={{ width: `${pct}%`, background: barColor, height: 4, borderRadius: 2, transition: "width .5s" }} />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button className="btn btg bts" style={{ flex: 1, justifyContent: "center", fontSize: 10 }} onClick={() => setShowEdit({ ...item })}>✎ Edit</button>
                    <button className="btn btg bts" style={{ fontSize: 10, padding: "3px 8px", color: "var(--gold)", borderColor: "rgba(184,134,11,.3)" }} onClick={() => addToReorderQueue(item)}>⟳ Reorder</button>
                </div>
            </div>
        </div>
    );
}

function SpareFormModal({ title, data, setData, onSave, onClose }) {
    return (
        <div className="mback" onClick={onClose}>
            <div className="mod" onClick={e => e.stopPropagation()}>
                <div className="mh"><span className="mtitle">{title}</span><button className="mclose" onClick={onClose}>×</button></div>
                <div className="mbody">
                    <div className="frow">
                        <div className="fg"><label className="fl">Item Name *</label><input className="fi" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} /></div>
                        <div className="fg"><label className="fl">Category *</label><select className="fsel" value={data.cat} onChange={e => setData(p => ({ ...p, cat: e.target.value }))}>{SPARE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    </div>
                    <div className="mb12">
                        <label className="fl">Item Image</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            {data.img ? (
                                <img src={data.img} alt={data.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--r2)", border: "1px solid var(--border)" }} />
                            ) : (
                                <div style={{ width: 80, height: 80, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{SPARE_CATEGORIES.find(c => c.id === data.cat)?.icon || "◇"}</div>
                            )}
                            <ImageUpload onUpload={(url) => setData(p => ({ ...p, img: url }))} />
                        </div>
                    </div>
                    <div className="frow">
                        <div className="fg"><label className="fl">Quantity *</label><input className="fi" type="number" min={0} value={data.qty} onChange={e => setData(p => ({ ...p, qty: +e.target.value }))} /></div>
                        <div className="fg"><label className="fl">Minimum Stock Level</label><input className="fi" type="number" min={0} value={data.minStock} onChange={e => setData(p => ({ ...p, minStock: +e.target.value }))} /></div>
                    </div>
                    <div className="mb12"><label className="fl">Location</label><input className="fi" placeholder="e.g. Shelf A-1, Drawer B-2" value={data.location} onChange={e => setData(p => ({ ...p, location: e.target.value }))} /></div>
                    <div><label className="fl">Description</label><textarea className="fta" placeholder="Enter a brief description of the item" value={data.desc} onChange={e => setData(p => ({ ...p, desc: e.target.value }))}></textarea></div>
                </div>
                <div className="mfoot"><button className="btn btg bts" onClick={onClose}>Cancel</button><button className="btn btp bts" onClick={onSave}>Save Changes</button></div>
            </div>
        </div>
    );
}

export function SpareStores() {
    const [tab, setTab] = useState("dashboard");
    const [items, setItems] = useState(SPARE_SEED);
    const [catFilter, setCatFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showScan, setShowScan] = useState(false);
    const [reorderQueue, setReorderQueue] = useState([]); // { itemId, qty }
    const [form, setForm] = useState({ name: "", cat: "packing", desc: "", qty: 0, minStock: 0, location: "", img: null });
    const sf = k => v => setForm(p => ({ ...p, [k]: v }));

    const lowStock = items.filter(i => i.status === "low" || i.status === "critical");
    const outOfStock = items.filter(i => i.qty === 0);
    const catCount = SPARE_CATEGORIES.length;

    const filtered = items.filter(i => {
        if (catFilter !== "all" && i.cat !== catFilter) return false;
        if (statusFilter === "instock" && i.status !== "ok") return false;
        if (statusFilter === "low" && i.status !== "low") return false;
        if (statusFilter === "out" && i.qty !== 0) return false;
        if (statusFilter === "reorder" && i.status === "ok" && i.qty > i.minStock) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    function saveItem() {
        const id = "SP" + (items.length + 10).toString().padStart(2, "0");
        const status = form.qty === 0 ? "critical" : form.qty <= form.minStock ? "low" : "ok";
        setItems(p => [...p, { ...form, id, status }]);
        setShowAdd(false);
        setForm({ name: "", cat: "packing", desc: "", qty: 0, minStock: 0, location: "", img: null });
    }
    function saveEdit() {
        setItems(p => p.map(i => {
            if (i.id !== showEdit.id) return i;
            const status = showEdit.qty === 0 ? "critical" : showEdit.qty <= showEdit.minStock ? "low" : "ok";
            return { ...showEdit, status };
        }));
        setShowEdit(null);
    }
    function deleteItem(id) { setItems(p => p.filter(i => i.id !== id)); }

    function addToReorderQueue(item) {
        const suggestedQty = Math.max(item.minStock * 2 - item.qty, item.minStock);
        setReorderQueue(prev => {
            if (prev.find(r => r.itemId === item.id)) {
                return prev; // Already in queue
            }
            return [...prev, { itemId: item.id, qty: suggestedQty }];
        });
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
        setItems(p => p.map(i => {
            if (i.id !== itemId) return i;
            return { ...i, qty: i.qty + reorderItem.qty, status: i.qty + reorderItem.qty > i.minStock ? "ok" : "low" };
        }));
        removeFromReorderQueue(itemId);
    }

    function placeAllReorders() {
        reorderQueue.forEach(r => {
            setItems(p => p.map(i => {
                if (i.id !== r.itemId) return i;
                return { ...i, qty: i.qty + r.qty, status: i.qty + r.qty > i.minStock ? "ok" : "low" };
            }));
        });
        setReorderQueue([]);
    }

    const statusBadge = SPARE_STATUS_BADGE;
    const statusLabel = SPARE_STATUS_LABEL;

    return (
        <div>
            {/* Header */}
            <div className="row mb16" style={{ gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "var(--r2)", background: "var(--adim)", border: "1px solid rgba(37,99,235,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⊡</div>
                <div>
                    <div style={{ fontFamily: "var(--fd)", fontSize: 15, fontWeight: 800 }}>Spares and Stores</div>
                    <div className="tiny">Manage all your spare parts and store items.</div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
                {[{ id: "dashboard", label: "Dashboard", icon: "◈" }, { id: "inventory", label: "Inventory", icon: "◇" }, { id: "additem", label: "Add Item", icon: "⊕" }, { id: "reorder", label: "Reorder", icon: "⟳" }].map(t => (
                    <button key={t.id} className={`tab ${tab === t.id ? "act" : ""}`} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
                    </button>
                ))}
            </div>

            {/* ── Dashboard ── */}
            {tab === "dashboard" && (
                <div>
                    <div className="g g4 mb16">
                        {[
                            { l: "Total Items", v: items.length, icon: "◇", c: "cc" },
                            { l: "Low Stock", v: lowStock.length, icon: "⚠", c: "cy" },
                            { l: "Out of Stock", v: outOfStock.length, icon: "✕", c: "cr" },
                            { l: "Categories", v: catCount, icon: "⊞", c: "cg" },
                        ].map(k => (
                            <div key={k.l} className={`kpi ${k.c}`}>
                                <div className="kl">{k.l}</div>
                                <div className="kv">{k.v}</div>
                            </div>
                        ))}
                    </div>

                    <div className="card mb16">
                        <div className="ch"><span className="ct">Inventory Categories</span><span className="tiny">Browse items by category</span></div>
                        <div className="cb">
                            <div className="g g4">
                                {SPARE_CATEGORIES.map(cat => {
                                    const count = items.filter(i => i.cat === cat.id).length;
                                    return (
                                        <div key={cat.id} onClick={() => { setCatFilter(cat.id); setTab("inventory"); }} style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "all .15s", borderTop: `3px solid ${cat.color}` }} onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow2)"} onMouseLeave={e => e.currentTarget.style.boxShadow = ""}>
                                            <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                                            <div style={{ fontFamily: "var(--fd)", fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{cat.name}</div>
                                            <div className="tiny">{count} items</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {lowStock.length > 0 && (
                        <div className="card">
                            <div className="ch">
                                <span className="ct">Items Needing Attention</span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <span className="b berr" style={{ fontSize: 9 }}>{lowStock.length} items</span>
                                    <button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => { lowStock.forEach(item => addToReorderQueue(item)); }}>⟳ Add All to Reorder</button>
                                </div>
                            </div>
                            <div className="tw">
                                <table>
                                    <thead><tr><th>#</th><th>Item Name</th><th>Category</th><th>Quantity</th><th>Min Stock</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {lowStock.map((item, i) => {
                                            const cat = SPARE_CATEGORIES.find(c => c.id === item.cat);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="mono">{i + 1}</td>
                                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                                    <td><span style={{ fontSize: 12 }}>{cat?.icon} {cat?.name}</span></td>
                                                    <td><span className="mono" style={{ color: item.status === "critical" ? "var(--red)" : "var(--gold)" }}>{item.qty}</span></td>
                                                    <td className="mono">{item.minStock}</td>
                                                    <td><span className={`b ${statusBadge[item.status]}`} style={{ fontSize: 9 }}>{statusLabel[item.status]}</span></td>
                                                    <td><button className="btn btg bts" style={{ fontSize: 10 }} onClick={() => addToReorderQueue(item)}>⟳ Mark for Reorder</button></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {lowStock.length === 0 && <div className="card"><div className="cb" style={{ textAlign: "center", padding: 24, color: "var(--green)" }}>✓ All items are sufficiently stocked.</div></div>}
                </div>
            )}

            {/* ── Inventory ── */}
            {tab === "inventory" && (
                <div>
                    <div className="card mb16">
                        <div className="ch">
                            <div>
                                <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>All Inventory Items</div>
                                <div className="tiny">Manage all your 3D printing materials and components.</div>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <input className="fi" placeholder="Search by name or description…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220, fontSize: 11 }} />
                                <select className="fsel" style={{ width: 130, fontSize: 11 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                                    <option value="all">All Categories</option>
                                    {SPARE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                {["all", "instock", "low", "out", "reorder"].map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "3px 10px", borderRadius: "var(--r)", border: "1px solid", fontSize: 10, fontFamily: "var(--fm)", cursor: "pointer", background: statusFilter === s ? "var(--accent)" : "transparent", color: statusFilter === s ? "#fff" : "var(--text2)", borderColor: statusFilter === s ? "var(--accent)" : "var(--border2)", transition: "all .12s", whiteSpace: "nowrap" }}>
                                        {{ all: "All", instock: "In Stock", low: "Low Stock", out: "Out of Stock", reorder: "Need Reorder" }[s]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="g g4">
                        {filtered.map(item => <ItemCard key={item.id} item={item} setShowEdit={setShowEdit} setItems={setItems} addToReorderQueue={addToReorderQueue} />)}
                        {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--text3)" }}>No items match your filters.</div>}
                    </div>
                </div>
            )}

            {/* ── Add Item ── */}
            {tab === "additem" && (
                <div className="card" style={{ maxWidth: 600 }}>
                    <div className="ch"><span className="ct">Add New Item</span></div>
                    <div className="cb">
                        <div className="frow">
                            <div className="fg"><label className="fl">Item Name *</label><input className="fi" placeholder="Enter item name" value={form.name} onChange={e => sf("name")(e.target.value)} /></div>
                            <div className="fg"><label className="fl">Category *</label><select className="fsel" value={form.cat} onChange={e => sf("cat")(e.target.value)}>{SPARE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        </div>
                        <div className="mb12">
                            <label className="fl">Item Image</label>
                            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                {form.img ? (
                                    <img src={form.img} alt={form.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "var(--r2)", border: "1px solid var(--border)" }} />
                                ) : (
                                    <div style={{ width: 80, height: 80, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "var(--r2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{SPARE_CATEGORIES.find(c => c.id === form.cat)?.icon || "◇"}</div>
                                )}
                                <ImageUpload onUpload={(url) => sf("img")(url)} />
                            </div>
                        </div>
                        <div className="frow">
                            <div className="fg"><label className="fl">Quantity *</label><input className="fi" type="number" min={0} value={form.qty} onChange={e => sf("qty")(+e.target.value)} /></div>
                            <div className="fg"><label className="fl">Minimum Stock Level</label><input className="fi" type="number" min={0} value={form.minStock} onChange={e => sf("minStock")(+e.target.value)} /></div>
                        </div>
                        <div className="mb12"><label className="fl">Location</label><input className="fi" placeholder="e.g. Shelf A-1, Drawer B-2" value={form.location} onChange={e => sf("location")(e.target.value)} /></div>
                        <div className="mb12"><label className="fl">Description</label><textarea className="fta" placeholder="Enter a brief description of the item" value={form.desc} onChange={e => sf("desc")(e.target.value)}></textarea></div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button className="btn btp" onClick={saveItem} disabled={!form.name}>Add Item</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reorder ── */}
            {tab === "reorder" && (
                <div className="card">
                    <div className="ch">
                        <div>
                            <div style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700 }}>Reorder Request</div>
                            <div className="tiny">Specify quantities for items you need to restock.</div>
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
                                <thead><tr><th>Item Name</th><th>Category</th><th>Current Qty</th><th>Reorder Qty</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {reorderQueue.map(r => {
                                        const item = items.find(i => i.id === r.itemId);
                                        if (!item) return null;
                                        const cat = SPARE_CATEGORIES.find(c => c.id === item.cat);
                                        return (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                                <td className="tdim">{cat?.icon} {cat?.name}</td>
                                                <td><span className="mono" style={{ color: item.status === "critical" ? "var(--red)" : "var(--gold)" }}>{item.qty}</span></td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        className="fi" 
                                                        style={{ width: 80, fontSize: 12 }} 
                                                        min={1} 
                                                        value={r.qty} 
                                                        onChange={e => updateReorderQty(item.id, parseInt(e.target.value) || 1)} 
                                                    />
                                                </td>
                                                <td><span className={`b ${statusBadge[item.status]}`} style={{ fontSize: 9 }}>{statusLabel[item.status]}</span></td>
                                                <td>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button className="btn btp bts" style={{ fontSize: 10 }} onClick={() => placeReorder(item.id)}>Order</button>
                                                        <button className="btn btd bts" style={{ fontSize: 10 }} onClick={() => removeFromReorderQueue(item.id)}>✕</button>
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
            )}

            {/* Edit Modal */}
            {showEdit && <SpareFormModal title={`Edit: ${showEdit.name}`} data={showEdit} setData={setShowEdit} onSave={saveEdit} onClose={() => setShowEdit(null)} />}
        </div>
    );
}
