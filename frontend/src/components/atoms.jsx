import React, { useState, useEffect, useRef } from "react";
import { SM, SL, DEPT_CLS } from '../data/constants.js';

// TB = Technology Badge, SB = Status Badge, DB = Dept Badge
export const TB = ({ tech }) => <span className={`b b${tech?.toLowerCase()}`}>{tech}</span>;
export const SB = ({ s }) => <span className={`b ${SM[s] || "bidle"}`}>{SL[s] || s}</span>;
export const DB = ({ code }) => <span className={`b ${DEPT_CLS[code] || "bidle"}`}>{code}</span>;

export function Ring({ value, color, label, size = 72 }) {
    const r = (size - 10) / 2, c = size / 2, circ = 2 * Math.PI * r, fill = circ * (Math.min(value, 100) / 100);
    return (
        <div className="oring" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle cx={c} cy={c} r={r} fill="none" stroke="var(--bg4)" strokeWidth={7} />
                <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={7} strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
            </svg>
            <div className="ocenter">
                <span className="opct" style={{ color, fontSize: size < 60 ? 11 : size < 80 ? 15 : 19 }}>{value}%</span>
                {label && <span className="olbl">{label}</span>}
            </div>
        </div>
    );
}
export function Spark({ data, color, h = 32 }) {
    const mx = Math.max(...data, 1);
    return <div className="spark" style={{ height: h }}>{data.map((v, i) => <div key={i} className="spb" style={{ height: `${(v / mx) * 100}%`, background: color, opacity: .35 + .65 * (i / (data.length - 1)) }} />)}</div>;
}
export function Prog({ pct, color = "cyan", h = 4 }) {
    const bg = color === "green" ? "var(--green)" : color === "yellow" ? "var(--yellow)" : color === "red" ? "var(--red)" : color === "purple" ? "var(--purple)" : "var(--accent)";
    return <div className="prog" style={{ height: h }}><div className="pf" style={{ width: `${Math.min(pct, 100)}%`, background: bg, height: h }} /></div>;
}
export function GRow({ label, val, max, lw = 130 }) {
    const pct = Math.min((val / max) * 100, 100), c = pct >= 100 ? "var(--red)" : pct > 75 ? "var(--yellow)" : "var(--green)";
    return <div className="grow"><div className="dim small" style={{ width: lw, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div><div className="gtrack"><div className="gfill" style={{ width: `${pct}%`, background: c }} /></div><div className="mono" style={{ width: 38, textAlign: "right", color: c }}>{val}/{max}</div></div>;
}
export function AStrip({ type, text, time }) {
    const cls = type === "err" || type === "error" ? "err" : type === "warn" || type === "warning" ? "warn" : "info";
    return <div className={`astrip ${cls}`}><span style={{ flexShrink: 0, fontSize: 14 }}>{cls === "err" ? "⛔" : cls === "warn" ? "⚠️" : "ℹ️"}</span><div><div style={{ fontSize: 12 }}>{text}</div>{time && <div className="tiny mt4">{time}</div>}</div></div>;
}
export function Modal({ title, onClose, children, footer, zIndex, wide, backdropClose = false }) {
    return <div className="mback" style={zIndex ? { zIndex } : {}} onClick={backdropClose ? onClose : undefined}><div className={`mod ${wide ? 'wide' : ''}`} onClick={e => e.stopPropagation()}><div className="mh"><span className="mtitle">{title}</span><button type="button" className="mclose" onClick={onClose}>×</button></div><div className="mbody">{children}</div>{footer && <div className="mfoot">{footer}</div>}</div></div>;
}
export function Tabs({ tabs, active, onChange }) {
    return <div className="tabs">{tabs.map(t => <button type="button" key={t.id} className={`tab ${active === t.id ? "act" : ""}`} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>;
}
export function LiveBadge() {
    return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--green)", fontFamily: "var(--fm)" }}><span className="pd g" />Live</div>;
}
export function BudgetBar({ spent, budget, color }) {
    const pct = Math.round((spent / budget) * 100);
    const c = pct >= 90 ? "var(--red)" : pct >= 70 ? "var(--yellow)" : color || "var(--green)";
    return <div><div className="budget-bar"><div className="budget-fill" style={{ width: `${Math.min(pct, 100)}%`, background: c }} /></div><div className="rowsb mt4"><span className="tiny">{pct}% of budget used</span><span className="tiny" style={{ color: c }}>AED {spent.toLocaleString()} / {budget.toLocaleString()}</span></div></div>;
}
