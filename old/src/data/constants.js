// Status maps & lookup tables
export const SM = { running: "brun", idle: "bidle", error: "berr", waiting: "bwait", planned: "bplan", scheduled: "bsched", production: "bprod", postproc: "bpost", qa: "bqa", completed: "bcomp", rework: "brwk", approved: "bappr", pending: "bpend", pass: "bpass", fail: "bfail", high: "bhigh", urgent: "burgent", normal: "bnorm", "on-hold": "bidle", active: "brun" };
const SL = { running: "Running", idle: "Idle", error: "Error", waiting: "Waiting", planned: "Planned", scheduled: "Scheduled", production: "In Production", postproc: "Post-proc", qa: "QA", completed: "Completed", rework: "Rework", approved: "Approved", pending: "Pending", pass: "Pass", fail: "Fail", high: "High", urgent: "Urgent", normal: "Normal", "on-hold": "On Hold", active: "Active" };

export const TECH_C = { FDM: "var(--fdm)", SLA: "var(--sla)", SLS: "var(--sls)" };
const DEPT_C = { ENG: "var(--eng)", RND: "var(--rd)", DES: "var(--des)", MFG: "var(--mfg)", NPI: "var(--npi)" };
const DEPT_CLS = { ENG: "bdeng", RND: "bdrd", DES: "bddes", MFG: "bdmfg", NPI: "bdnpi" };

export const DT_CODES = ["Jam / Clog","Waiting Material","Setup / Changeover","Planned Maintenance","Breakdown","Waiting Operator","Software / Slicer Error","Environmental"];
