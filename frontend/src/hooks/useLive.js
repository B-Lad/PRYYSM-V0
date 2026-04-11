import React, { useState, useEffect, useRef } from "react";
import { MACHINES_BASE } from '../data/seed.jsx';

export function useLive() {
    const [machines, setMachines] = useState(MACHINES_BASE);
    useEffect(() => {
        const id = setInterval(() => {
            setMachines(prev => prev.map(m => {
                if (m.status !== "running") return m;
                const p = Math.min(m.pct + Math.random() * .4, 100);
                const mins = Math.round((100 - p) * .6), h = Math.floor(mins / 60), mn = mins % 60;
                return { ...m, pct: Math.round(p * 10) / 10, remaining: p >= 99 ? "Almost done!" : h + "h " + String(mn).padStart(2, "0") + "m" };
            }));
        }, 2000);
        return () => clearInterval(id);
    }, []);
    return machines;
}

/* ══════════════════════════════════════════════════════════════════
   OVERVIEW
══════════════════════════════════════════════════════════════════ */
