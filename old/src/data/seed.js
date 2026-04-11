// Seed data — replace with Supabase queries in production
export const MACHINES_BASE = [
    { id: "M01", name: "Ender Pro 1", tech: "FDM", model: "Creality Ender-7", wc: "FDM Bay A", status: "running", job: "WO-2041", pct: 68, remaining: "2h 14m", oee: 81, avail: 88, perf: 92, qual: 95 },
    { id: "M02", name: "Bambu X1-C", tech: "FDM", model: "Bambu X1 Carbon", wc: "FDM Bay A", status: "running", job: "WO-2044", pct: 34, remaining: "4h 52m", oee: 76, avail: 85, perf: 89, qual: 94 },
    { id: "M03", name: "Ender Pro 2", tech: "FDM", model: "Creality Ender-7", wc: "FDM Bay B", status: "idle", job: "—", pct: 0, remaining: "—", oee: 84, avail: 91, perf: 92, qual: 97 },
    { id: "M04", name: "Form 4 Alpha", tech: "SLA", model: "Formlabs Form 4", wc: "SLA Station 1", status: "running", job: "WO-2038", pct: 91, remaining: "0h 28m", oee: 88, avail: 93, perf: 94, qual: 97 },
    { id: "M05", name: "Form 4 Beta", tech: "SLA", model: "Formlabs Form 4", wc: "SLA Station 1", status: "error", job: "WO-2039", pct: 45, remaining: "ERR", oee: 72, avail: 78, perf: 88, qual: 95 },
    { id: "M06", name: "EOS P396", tech: "SLS", model: "EOS Formiga P396", wc: "SLS Bay", status: "running", job: "WO-2036", pct: 55, remaining: "6h 10m", oee: 79, avail: 86, perf: 91, qual: 93 },
    { id: "M07", name: "Fuse 1+", tech: "SLS", model: "Formlabs Fuse 1+", wc: "SLS Bay", status: "waiting", job: "WO-2048", pct: 0, remaining: "Waiting powder", oee: 68, avail: 74, perf: 90, qual: 96 },
];

const DEPARTMENTS = [
export const DEPARTMENTS = [
    { id: "D01", name: "Engineering", code: "ENG", color: "var(--eng)", head: "Arjun Sharma", budget: 120000, spent: 74200, cls: "eng" },
    { id: "D02", name: "R&D", code: "RND", color: "var(--rd)", head: "Dr. Priya Nair", budget: 180000, spent: 98400, cls: "rd" },
    { id: "D03", name: "Product Design", code: "DES", color: "var(--des)", head: "Lena Kovács", budget: 60000, spent: 31800, cls: "des" },
    { id: "D04", name: "Manufacturing", code: "MFG", color: "var(--mfg)", head: "Marco Russo", budget: 90000, spent: 86100, cls: "mfg" },
    { id: "D05", name: "NPI", code: "NPI", color: "var(--npi)", head: "Yuki Tanaka", budget: 75000, spent: 41200, cls: "npi" },
];

const PROJECTS = [
    { id: "PRJ-011", name: "Falcon Wing Bracket Rev 4", dept: "ENG", code: "ENG", priority: "urgent", status: "active", wos: 4, budget: 28000, spent: 18400, due: "2025-07-22", owner: "Arjun S." },
    { id: "PRJ-009", name: "Biocompatible Housing v2", dept: "R&D", code: "RND", priority: "high", status: "active", wos: 3, budget: 45000, spent: 22100, due: "2025-07-30", owner: "Dr. Priya N." },
    { id: "PRJ-008", name: "Consumer Handle Concept C", dept: "DES", code: "DES", priority: "normal", status: "active", wos: 2, budget: 8000, spent: 4200, due: "2025-08-05", owner: "Lena K." },
    { id: "PRJ-012", name: "Jig & Fixture Set Mk3", dept: "MFG", code: "MFG", priority: "urgent", status: "active", wos: 6, budget: 18000, spent: 16200, due: "2025-07-18", owner: "Marco R." },
    { id: "PRJ-010", name: "Alpha Unit Prototype", dept: "NPI", code: "NPI", priority: "high", status: "active", wos: 5, budget: 32000, spent: 19800, due: "2025-07-28", owner: "Yuki T." },
    { id: "PRJ-007", name: "Thermal Enclosure Rev 2", dept: "ENG", code: "ENG", priority: "normal", status: "active", wos: 2, budget: 12000, spent: 7600, due: "2025-08-10", owner: "Arjun S." },
    { id: "PRJ-006", name: "Robotic Arm End-Effector", dept: "R&D", code: "RND", priority: "normal", status: "on-hold", wos: 1, budget: 22000, spent: 9100, due: "2025-09-01", owner: "Dr. Priya N." },
    { id: "PRJ-005", name: "Legacy Mount Adapter", dept: "MFG", code: "MFG", priority: "normal", status: "completed", wos: 3, budget: 6000, spent: 5800, due: "2025-07-10", owner: "Marco R." },
];

const WOS = [
export const WOS = [
    { id: "WO-2041", project: "PRJ-011", dept: "ENG", part: "Bracket Assy Rev4-A", tech: "FDM", material: "PETG-CF", qty: 4, status: "production", due: "2025-07-18", priority: "urgent", machine: "M01", requestor: "Arjun S." },
    { id: "WO-2044", project: "PRJ-009", dept: "R&D", part: "Bio Housing Upper Shell", tech: "FDM", material: "PLA-M Medical", qty: 2, status: "production", due: "2025-07-17", priority: "high", machine: "M02", requestor: "Dr. Priya N." },
    { id: "WO-2038", project: "PRJ-011", dept: "ENG", part: "Turbine Shroud Jig", tech: "SLA", material: "Rigid 10K", qty: 1, status: "production", due: "2025-07-19", priority: "urgent", machine: "M04", requestor: "Arjun S." },
    { id: "WO-2039", project: "PRJ-010", dept: "NPI", part: "Alpha Lens Holder ×8", tech: "SLA", material: "Model V2 Resin", qty: 8, status: "production", due: "2025-07-16", priority: "high", machine: "M05", requestor: "Yuki T." },
    { id: "WO-2036", project: "PRJ-012", dept: "MFG", part: "Fixture Block Set", tech: "SLS", material: "PA12 GF", qty: 12, status: "production", due: "2025-07-20", priority: "urgent", machine: "M06", requestor: "Marco R." },
    { id: "WO-2048", project: "PRJ-010", dept: "NPI", part: "Alpha Enclosure Lid", tech: "SLS", material: "PA12 Natural", qty: 20, status: "scheduled", due: "2025-07-22", priority: "high", machine: "M07", requestor: "Yuki T." },
    { id: "WO-2031", project: "PRJ-012", dept: "MFG", part: "Duct Clamp ×40", tech: "FDM", material: "ABS Black", qty: 40, status: "postproc", due: "2025-07-15", priority: "high", machine: "—", requestor: "Marco R." },
    { id: "WO-2029", project: "PRJ-009", dept: "R&D", part: "Micro-fluidic Insert", tech: "SLA", material: "Surgical Guide", qty: 3, status: "qa", due: "2025-07-15", priority: "urgent", machine: "—", requestor: "Dr. Priya N." },
    { id: "WO-2025", project: "PRJ-008", dept: "DES", part: "Handle Concept C1", tech: "FDM", material: "PLA+", qty: 1, status: "completed", due: "2025-07-14", priority: "normal", machine: "—", requestor: "Lena K." },
    { id: "WO-2020", project: "PRJ-005", dept: "MFG", part: "Legacy Adapter Plate", tech: "SLS", material: "PA12 GF", qty: 6, status: "completed", due: "2025-07-13", priority: "normal", machine: "—", requestor: "Marco R." },
    { id: "WO-2050", project: "PRJ-009", dept: "R&D", part: "Bio Sensor Bracket", tech: "SLA", material: "Model V2 Resin", qty: 12, status: "planned", due: "2025-07-24", priority: "normal", machine: "—", requestor: "Dr. Priya N." },
    { id: "WO-2052", project: "PRJ-007", dept: "ENG", part: "Thermal Clip Array", tech: "FDM", material: "ABS Black", qty: 50, status: "planned", due: "2025-07-26", priority: "normal", machine: "—", requestor: "Arjun S." },
];

const PRINT_REQUESTS = [
    { id: "REQ-088", title: "Drone Prop Guard Prototype", dept: "R&D", code: "RND", requestor: "Dr. Priya N.", project: "PRJ-009", tech: "FDM", qty: 4, priority: "high", status: "approved", submitted: "2h ago", notes: "Must clear 120mm rotor. PETG preferred." },
    { id: "REQ-089", title: "PCB Alignment Jig v3", dept: "MFG", code: "MFG", requestor: "Marco R.", project: "PRJ-012", tech: "FDM", qty: 2, priority: "urgent", status: "approved", submitted: "45m ago", notes: "Tolerances ±0.1mm. Needs ESD-safe material." },
    { id: "REQ-090", title: "Handle Grip Ergonomic Test B", dept: "DES", code: "DES", requestor: "Lena K.", project: "PRJ-008", tech: "SLA", qty: 3, priority: "normal", status: "pending", submitted: "1h ago", notes: "Shore 50A feel. Flexible resin if possible." },
    { id: "REQ-091", title: "Structural Bracket Stress Test", dept: "ENG", code: "ENG", requestor: "Arjun S.", project: "PRJ-011", tech: "SLS", qty: 2, priority: "urgent", status: "pending", submitted: "30m ago", notes: "PA12 GF required. FEA validated geometry." },
    { id: "REQ-092", title: "NPI Alpha Chassis Iteration 3", dept: "NPI", code: "NPI", requestor: "Yuki T.", project: "PRJ-010", tech: "FDM", qty: 1, priority: "high", status: "pending", submitted: "20m ago", notes: "Check wall thickness before slicing." },
    { id: "REQ-087", title: "Cooling Duct Internal Rev1", dept: "ENG", code: "ENG", requestor: "Arjun S.", project: "PRJ-007", tech: "FDM", qty: 8, priority: "normal", status: "approved", submitted: "4h ago", notes: "Internal channels — check support strategy." },
    { id: "REQ-086", title: "Sensor Mount SLA Clear", dept: "R&D", code: "RND", requestor: "Dr. Priya N.", project: "PRJ-009", tech: "SLA", qty: 5, priority: "normal", status: "completed", submitted: "Yesterday", notes: "Clear resin, optical quality required." },
];

const MATERIALS_DATA = [
    { id: "MAT-01", name: "PETG-CF", tech: "FDM", type: "Filament", qty: 4.2, unit: "kg", lot: "PC-3301", expiry: "2026-06", location: "Shelf A1", low: false },
    { id: "MAT-02", name: "PLA+", tech: "FDM", type: "Filament", qty: 7.8, unit: "kg", lot: "PL-3310", expiry: "2026-06", location: "Shelf A2", low: false },
    { id: "MAT-03", name: "ABS Black", tech: "FDM", type: "Filament", qty: 0.8, unit: "kg", lot: "AB-1210", expiry: "2025-12", location: "Shelf A2", low: true },
    { id: "MAT-04", name: "PLA-M Medical", tech: "FDM", type: "Filament", qty: 1.8, unit: "kg", lot: "PM-0881", expiry: "2026-02", location: "Shelf B1", low: false },
    { id: "MAT-05", name: "Rigid 10K", tech: "SLA", type: "Resin", qty: 1.1, unit: "L", lot: "R1-0442", expiry: "2025-10", location: "Shelf C2", low: true },
    { id: "MAT-06", name: "Model V2 Resin", tech: "SLA", type: "Resin", qty: 3.6, unit: "L", lot: "MV-2200", expiry: "2026-01", location: "Shelf C1", low: false },
    { id: "MAT-07", name: "Surgical Guide", tech: "SLA", type: "Resin", qty: 0.9, unit: "L", lot: "SG-0120", expiry: "2025-08", location: "Shelf C3", low: true },
    { id: "MAT-08", name: "PA12 GF", tech: "SLS", type: "Powder", qty: 20.0, unit: "kg", lot: "PA-5511", expiry: "2026-12", location: "Silo 1", low: false },
    { id: "MAT-09", name: "PA12 Natural", tech: "SLS", type: "Powder", qty: 13.5, unit: "kg", lot: "PA-5500", expiry: "2026-12", location: "Silo 2", low: false },
];

const WCS = [
    { id: "WC-01", name: "FDM Bay A", type: "Printer", load: 2, cap: 2, machines: ["M01", "M02"] },
    { id: "WC-02", name: "FDM Bay B", type: "Printer", load: 0, cap: 2, machines: ["M03"] },
    { id: "WC-03", name: "SLA Station 1", type: "Printer", load: 2, cap: 2, machines: ["M04", "M05"] },
    { id: "WC-04", name: "SLS Bay", type: "Printer", load: 2, cap: 2, machines: ["M06", "M07"] },
    { id: "WC-05", name: "Wash / Cure Sta.", type: "Post-process", load: 1, cap: 2, machines: [] },
    { id: "WC-06", name: "Depowdering Sta.", type: "Post-process", load: 1, cap: 1, machines: [] },
    { id: "WC-07", name: "QA Benches 1+2", type: "QA", load: 2, cap: 3, machines: [] },
    { id: "WC-08", name: "Packing / Handoff", type: "Handoff", load: 1, cap: 4, machines: [] },
];

const TASKS_DATA = [
    { id: "TSK-441", name: "Depowder Batch WO-2036", wc: "Depowdering Sta.", priority: "high", wo: "WO-2036", eta: "Now", tech: "SLS" },
    { id: "TSK-442", name: "Wash + Cure WO-2038 parts", wc: "Wash / Cure Sta.", priority: "normal", wo: "WO-2038", eta: "1h", tech: "SLA" },
    { id: "TSK-443", name: "QA inspection WO-2029", wc: "QA Bench 2", priority: "urgent", wo: "WO-2029", eta: "Now", tech: "SLA" },
    { id: "TSK-444", name: "Hand off WO-2025 to Design", wc: "Packing / Handoff", priority: "normal", wo: "WO-2025", eta: "30m", tech: "FDM" },
    { id: "TSK-445", name: "Reload PETG-CF on Ender Pro 2", wc: "FDM Bay B", priority: "normal", wo: "—", eta: "—", tech: "FDM" },
    { id: "TSK-446", name: "Resin tank swap — Form 4 Beta", wc: "SLA Station 1", priority: "urgent", wo: "WO-2039", eta: "Now", tech: "SLA" },
    { id: "TSK-447", name: "Mix PA12 powder for WO-2048", wc: "SLS Bay", priority: "high", wo: "WO-2048", eta: "2h", tech: "SLS" },
];

const ALERTS_DATA = [
    { type: "err", text: "Form 4 Beta (M05) error on WO-2039 (NPI / PRJ-010) — operator required", time: "2m ago" },
    { type: "warn", text: "ABS Black critically low (0.8 kg) — WO-2052 ENG may be delayed", time: "12m ago" },
    { type: "warn", text: "PRJ-012 MFG budget at 90% — 3 work orders still pending", time: "18m ago" },
    { type: "warn", text: "WIP limit breached at Post-processing (6 of 5 max)", time: "35m ago" },
    { type: "warn", text: "Surgical Guide resin low — REQ-086 R&D delivery at risk", time: "52m ago" },
    { type: "info", text: "WO-2036 SLS 55% complete — MFG / PRJ-012 depowdering team alerted", time: "1h ago" },
    { type: "info", text: "REQ-091 (ENG Structural Bracket) approved, slicing in progress", time: "2h ago" },
];

const QC_DATA = [
    { id: "QC-220", wo: "WO-2029", dept: "R&D", tech: "SLA", result: "pass", defects: 0, note: "Dims ±0.05mm — pass", op: "Marie D.", time: "Today 11:20" },
    { id: "QC-219", wo: "WO-2031", dept: "MFG", tech: "FDM", result: "fail", defects: 3, note: "Layer delamination — 3 of 40", op: "Alex R.", time: "Today 10:05" },
    { id: "QC-218", wo: "WO-2025", dept: "DES", tech: "FDM", result: "pass", defects: 0, note: "Surface finish OK", op: "Marie D.", time: "Today 09:30" },
    { id: "QC-217", wo: "WO-2036", dept: "MFG", tech: "SLS", result: "pending", defects: 0, note: "Awaiting depowdering", op: "—", time: "Pending" },
    { id: "QC-216", wo: "WO-2020", dept: "MFG", tech: "SLS", result: "pass", defects: 0, note: "Visual + dimensional pass", op: "Alex R.", time: "Yesterday" },
];

const ROUTES_DATA = [
    { tech: "SLA", name: "SLA Precision", steps: ["SLA Print", "IPA Wash", "UV Cure", "Support Removal", "QA Inspection", "Handoff to Dept"] },
    { tech: "SLS", name: "SLS Functional", steps: ["SLS Print", "Cool Down (12h)", "Depowder", "Media Blast", "QA Inspection", "Handoff to Dept"] },
    { tech: "FDM", name: "FDM Prototype", steps: ["FDM Print", "Support Removal", "Sand / Finish", "QA Inspection", "Handoff to Dept"] },
];

const INTEGRATIONS = [
    { name: "Jira / Project Tracker", status: "connected" },
    { name: "ERP / SAP Materials", status: "connected" },
    { name: "LDAP / Active Directory", status: "connected" },
    { name: "Formlabs Fleet API", status: "connected" },
    { name: "Bambu Connect", status: "pending" },
    { name: "CAD Vault (PDM)", status: "disconnected" },
];

const DT_CODES = ["Jam / Clog", "Waiting Material", "Setup / Changeover", "Planned Maintenance", "Breakdown", "Waiting Operator", "Software / Slicer Error", "Environmental"];

const TECH_C = { FDM: "var(--fdm)", SLA: "var(--sla)", SLS: "var(--sls)" };
export const LIFECYCLE_STAGES = [
    { id: "submitted", label: "Submitted", icon: "📋" },
    { id: "review", label: "AM Review", icon: "🔍" },
    { id: "planning", label: "Planning", icon: "📐" },
    { id: "printing", label: "Printing", icon: "🖨" },
    { id: "postproc", label: "Post-Process", icon: "⚙" },
    { id: "qa", label: "QA Inspection", icon: "✅" },
    { id: "handoff", label: "Dept Handoff", icon: "📦" },
    { id: "evaluation", label: "Evaluation", icon: "⭐" },
    { id: "closed", label: "Closed", icon: "🎯" },
];
function lcIdx(id) { return LIFECYCLE_STAGES.findIndex(s => s.id === id); }
function lcPct(stage) { return Math.round((lcIdx(stage) / (LIFECYCLE_STAGES.length - 1)) * 100); }
function lcHistory(upTo, notes = {}) {
    return LIFECYCLE_STAGES.map((s, i) => {
        const idx = lcIdx(upTo);
        if (i < idx) return { stage: s.id, done: true, time: `Jul ${10 + i} 09:0${i}`, note: notes[s.id] || s.label + " completed." };
        if (i === idx) return { stage: s.id, done: false, time: "In progress", note: notes[s.id] || "" };
        return { stage: s.id, done: false, time: "Pending", note: "" };
    });
}
const MATS_BY_TECH = {
    FDM: MATERIALS_DATA.filter(m => m.tech === "FDM").map(m => m.name),
    SLA: MATERIALS_DATA.filter(m => m.tech === "SLA").map(m => m.name),
    SLS: MATERIALS_DATA.filter(m => m.tech === "SLS").map(m => m.name),
};
const LC_SEED = [
export const LC_SEED = [
    {
        id: "PRJ-011", name: "Falcon Wing Bracket Rev 4", dept: "ENG", priority: "urgent",
        owner: "Arjun Sharma", description: "Structural bracket for falcon UAV wing mount. 180N pull test required.",
        stage: "printing", created: "Jul 10", due: "2025-07-22",
        tech: "SLS", material: "PA12 GF", qty: 4, printPct: 62,
        requestNote: "PA12 GF only — FEA validated geometry. No substitutions.",
        woId: "WO-2041", machine: "EOS P396",
        history: lcHistory("printing", {
            submitted: "Request submitted by Arjun S. — 4 parts, SLS PA12 GF.",
            review: "Approved. Material in stock. Schedule clear.",
            planning: "WO-2041 created. EOS P396 assigned. Est. print time 18h 10m.",
            printing: "EOS P396 printing now.",
        }),
    },
    {
        id: "PRJ-009", name: "Biocompatible Housing v2", dept: "RND", priority: "high",
        owner: "Dr. Priya Nair", description: "SLA bio-compatible housing for micro-fluidic sensor. ISO 10993 required.",
        stage: "qa", created: "Jul 08", due: "2025-07-30",
        tech: "SLA", material: "Surgical Guide", qty: 3, printPct: 100,
        requestNote: "Surgical Guide resin only. Tolerances +/-0.05mm.",
        woId: "WO-2029", machine: "Form 4 Alpha",
        history: lcHistory("qa", {
            submitted: "Request submitted by Dr. Priya N. — 3 units, SLA Surgical Guide.",
            review: "Approved. Low stock flagged — resin reserved from lot SG-0120.",
            planning: "WO-2029 created. Form 4 Alpha assigned.",
            printing: "3 parts printed. 0 failures.",
            postproc: "IPA wash 15min + UV cure 30min. All parts clean.",
            qa: "Dimensional check in progress. Awaiting ISO 10993 sign-off.",
        }),
    },
    {
        id: "PRJ-012", name: "Jig & Fixture Set Mk3", dept: "MFG", priority: "urgent",
        owner: "Marco Russo", description: "PCB alignment jig set. ESD-safe PETG-CF required. Line stoppage risk.",
        stage: "review", created: "Jul 12", due: "2025-07-18",
        tech: "FDM", material: "PETG-CF", qty: 12, printPct: 0,
        requestNote: "ESD-safe PETG-CF. 12 units, 3 variants. Urgent — line stops without these.",
        woId: null, machine: null,
        history: lcHistory("review", {
            submitted: "Request submitted by Marco R. — 12 parts FDM PETG-CF.",
            review: "Under review — checking stock and machine capacity.",
        }),
    },
];
const SM = { running: "brun", idle: "bidle", error: "berr", waiting: "bwait", planned: "bplan", scheduled: "bsched", production: "bprod", postproc: "bpost", qa: "bqa", completed: "bcomp", rework: "brwk", approved: "bappr", pending: "bpend", pass: "bpass", fail: "bfail", high: "bhigh", urgent: "burgent", normal: "bnorm", "on-hold": "bidle", active: "brun" };
export const SCHEDULE_JOBS = [
    { id: "JB01", printer: "Prusa i3 MK3S+", printerCode: "PRUSA01", job: "Job 1 for PRUSA01", start: 5, dur: 7, tech: "FDM", status: "printing" },
    { id: "JB02", printer: "Creality Ender 3 Pro", printerCode: "ENDER01", job: "Job 1 for ENDER01", start: 3, dur: 4, tech: "FDM", status: "idle" },
    { id: "JB03", printer: "Ultimaker S5", printerCode: "ULT01", job: "Job 1 for ULT01", start: 2, dur: 9, tech: "FDM", status: "printing" },
    { id: "JB04", printer: "Anycubic Mega X", printerCode: "ANYC01", job: null, start: 0, dur: 0, tech: "FDM", status: "maintenance" },
    { id: "JB05", printer: "Bambu Lab A1 mini", printerCode: "BAMB01", job: "Job 2 for BAMB01", start: 8, dur: 5, tech: "FDM", status: "idle" },
    { id: "JB06", printer: "Prusa MINI+", printerCode: "PRUSA02", job: null, start: 0, dur: 0, tech: "FDM", status: "idle" },
    { id: "JB07", printer: "EOS Formiga P 110", printerCode: "EOS01", job: null, start: 0, dur: 0, tech: "SLS", status: "idle" },
    { id: "JB08", printer: "HP Jet Fusion 5200", printerCode: "HPJF01", job: null, start: 0, dur: 0, tech: "SLS", status: "maintenance" },
    { id: "JB09", printer: "Anycubic Photon M3", printerCode: "ANYC02", job: null, start: 0, dur: 0, tech: "SLA", status: "idle" },
];

const CONFIRM_QUEUE = [
    { id: "CQ01", name: "Job 2 for PRUSA01", code: "BUSY-PRUSA01-1", start: "19 Mar, 6:29 PM", status: "pending" },
    { id: "CQ02", name: "Job 3 for PRUSA01", code: "BUSY-PRUSA01-2", start: "20 Mar, 3:29 AM", status: "pending" },
    { id: "CQ03", name: "Job 1 for PRUSA01", code: "BUSY-PRUSA01-0", start: "19 Mar, 5:29 AM", status: "confirmed" },
    { id: "CQ04", name: "Job 4 for PRUSA01", code: "BUSY-PRUSA01-3", start: "20 Mar, 12:29 PM", status: "confirmed" },
    { id: "CQ05", name: "Job 5 for PRUSA01", code: "BUSY-PRUSA01-4", start: "21 Mar, 12:29 AM", status: "confirmed" },
];

function PrintSchedule() {
export const ALLOT_QUEUE = [
    { id: "ORD-102", code: "PRJ-1 103", name: "Batch SLS Part", estTime: "5h 0m", items: 14, priority: "low", tech: "SLS", deadline: "01-04-2026", status: "unassigned" },
    { id: "ORD-103", code: "PRJ-1 103", name: "FDM Prototype Set", estTime: "1h 5m", items: 20, priority: "medium", tech: "MJF", deadline: "31-03-2026", status: "unassigned" },
    { id: "ORD-104", code: "PRJ-1 104", name: "Bracket Assembly", estTime: "5h 5m", items: 4, priority: "high", tech: "FDM", deadline: "30-03-2026", status: "unassigned" },
    { id: "ORD-105", code: "PRJ-1 105", name: "Enclosure Lids", estTime: "3h 0m", items: 17, priority: "low", tech: "SLA", deadline: "29-03-2026", status: "unassigned" },
];

function JobAllotment() {
export const RAW_FILAMENTS = [
    { id: "RF01", name: "PLA Black", brand: "Hatchbox", type: "Standard", color: "#1a1a1a", colorName: "Black", code: "A00032", sku: "5040", qty: 12, minQty: 5, reorder: 5, status: "ok" },
    { id: "RF02", name: "PLA White", brand: "Hatchbox", type: "Standard", color: "#f5f5f5", colorName: "White", code: "A00033", sku: "5040", qty: 8, minQty: 5, reorder: 5, status: "ok" },
    { id: "RF03", name: "PLA Red", brand: "Hatchbox", type: "Standard", color: "#e53e3e", colorName: "Red", code: "A00034", sku: "BAMB01", reorderCat: "Standard", qty: 2, minQty: 3, reorder: 5, status: "low" },
    { id: "RF04", name: "ABS Red", brand: "Overture", type: "Standard", color: "#c53030", colorName: "Red", code: "A00035", sku: "None", qty: 0, minQty: 2, reorder: 3, status: "critical" },
    { id: "RF05", name: "PETG Blue", brand: "eSun", type: "Engineering", color: "#2b6cb0", colorName: "Blue", code: "A00040", sku: "5040", qty: 6, minQty: 4, reorder: 5, status: "ok" },
    { id: "RF06", name: "TPU Grey", brand: "NinjaFlex", type: "Flexible", color: "#718096", colorName: "Grey", code: "A00041", sku: "5040", qty: 3, minQty: 2, reorder: 4, status: "ok" },
];
const RAW_RESINS = [
    { id: "RR01", name: "Standard Resin Grey", brand: "Elegoo", material: "ABS-Like", color: "#a0aec0", colorName: "Grey", code: "B00010", qty: 4, minQty: 2, status: "ok" },
    { id: "RR02", name: "ABS Red", brand: "Anycubic", material: "ABS-Like", color: "#e53e3e", colorName: "Red", code: "B00011", qty: 1, minQty: 2, status: "low" },
    { id: "RR03", name: "Tough Resin White", brand: "Formlabs", material: "Tough 2000", color: "#f7fafc", colorName: "White", code: "B00012", qty: 5, minQty: 2, status: "ok" },
    { id: "RR04", name: "Flexible Resin Clear", brand: "Siraya", material: "Flexible", color: "#ebf8ff", colorName: "Clear", code: "B00013", qty: 3, minQty: 1, status: "ok" },
];
const RAW_POWDERS = [
    { id: "RP01", name: "PA12 White", brand: "EOS", material: "Nylon PA12", color: "#f7fafc", colorName: "White", code: "C00001", qty: 25, unit: "kg", minQty: 10, status: "ok" },
    { id: "RP02", name: "PA11 Black", brand: "HP", material: "Nylon PA11", color: "#1a1a1a", colorName: "Black", code: "C00002", qty: 8, unit: "kg", minQty: 10, status: "low" },
    { id: "RP03", name: "TPU Powder", brand: "Formlabs", material: "TPU", color: "#e2e8f0", colorName: "Grey", code: "C00003", qty: 15, unit: "kg", minQty: 5, status: "ok" },
];

/* ── MatCard & MatTabContent hoisted outside RawMaterialInventory
      so React doesn't treat them as new component types on every render,
      which caused the edit-card flicker on the 2s useLive() tick ── */
const RMI_STATUS_COLOR = { ok: "var(--green)", low: "var(--gold)", critical: "var(--red)" };
export const SPARE_CATEGORIES = [
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

const SPARE_STATUS_BADGE = { ok: "brun", low: "bwait", critical: "berr" };
const SPARE_STATUS_LABEL = { ok: "In Stock", low: "Low Stock", critical: "Out of Stock" };

function ItemCard({ item, setShowEdit, setItems }) {
