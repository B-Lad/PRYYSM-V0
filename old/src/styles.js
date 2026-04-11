const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F0F4FA;--bg1:#FFFFFF;--bg2:#FFFFFF;--bg3:#F5F7FC;--bg4:#EBF0F8;--bg5:#E2E8F4;
  --border:#DDE4EF;--border2:#C8D4E8;--border3:#A8BDD8;
  --text:#1A2540;--text2:#4A6080;--text3:#7A95B8;--text4:#A8BDD0;
  --accent:#2563EB;--accent2:#1D4ED8;--adim:rgba(37,99,235,.07);
  --gold:#B8860B;--gold2:#996E08;--golddim:rgba(184,134,11,.08);
  --green:#0F9B6A;--gdim:rgba(15,155,106,.07);
  --yellow:#B8860B;--ydim:rgba(184,134,11,.08);
  --red:#DC2626;--rdim:rgba(220,38,38,.07);
  --orange:#C2620A;--purple:#6366F1;--pdim:rgba(99,102,241,.07);
  --blue:#2563EB;--bdim:rgba(37,99,235,.07);
  --fdm:#2563EB;--sla:#6366F1;--sls:#B8860B;
  --eng:#2563EB;--rd:#6366F1;--des:#0284C7;--mfg:#B8860B;--npi:#C2620A;
  --fd:'Plus Jakarta Sans',sans-serif;--fm:'IBM Plex Mono',monospace;--fb:'Plus Jakarta Sans',sans-serif;
  --r:4px;--r2:8px;--r3:12px;
  --shadow:0 1px 4px rgba(26,37,64,.07),0 2px 6px rgba(26,37,64,.04);
  --shadow2:0 6px 24px rgba(26,37,64,.09),0 2px 8px rgba(26,37,64,.05);
}
html,body,#root{height:100%;overflow:hidden;background:var(--bg);color:var(--text);font-family:var(--fb);font-size:13px;line-height:1.5}
::selection{background:rgba(37,99,235,.15)}
::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
button{cursor:pointer;font-family:inherit}
.app{display:flex;height:100vh;overflow:hidden}
/* SIDEBAR */
.sb{display:flex;flex-direction:column;background:#1e2a5e;border-right:none;transition:width .2s;overflow:hidden;flex-shrink:0}
.sb.open{width:224px}.sb.col{width:52px}
.sb-brand{display:flex;align-items:center;gap:10px;padding:16px 14px;border-bottom:none;cursor:pointer;user-select:none;flex-shrink:0}
.sb-mark{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#002068,#003399);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;color:#fff;font-weight:900;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.sb-name{font-family:var(--fd);font-size:15px;font-weight:800;white-space:nowrap;letter-spacing:-.3px;color:#fff}
.sb-name span{color:#d0a60d}
.sb-sub{font-size:9px;color:rgba(255,255,255,.35);font-family:var(--fm);letter-spacing:1px;text-transform:uppercase;margin-top:1px;white-space:nowrap}
.sb-nav{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 0}
.nav-grp{font-size:9px;font-family:var(--fm);letter-spacing:1.8px;text-transform:uppercase;color:rgba(255,255,255,.28);padding:12px 14px 4px;white-space:nowrap}
.nav-btn{display:flex;align-items:center;gap:9px;padding:8px 14px;width:100%;background:none;border:none;border-left:2px solid transparent;color:rgba(255,255,255,.55);font-size:12.5px;text-align:left;transition:all .12s;white-space:nowrap;cursor:pointer;border-radius:var(--r)}
.nav-btn:hover{color:#fff;background:rgba(255,255,255,.08)}
.nav-btn.act{color:#fff;border-left-color:#d0a60d;background:rgba(255,255,255,.12);font-weight:700}
.nav-icon{font-size:13px;width:16px;text-align:center;flex-shrink:0}
.nav-badge{font-size:9px;font-family:var(--fm);padding:1px 5px;border-radius:10px;background:rgba(186,26,26,.85);color:#fff;font-weight:700}
.sb-foot{padding:10px 14px 14px;border-top:1px solid rgba(255,255,255,.1);flex-shrink:0}
/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:50px;background:rgba(255,255,255,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:none;display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0;gap:12px;box-shadow:0 1px 0 rgba(26,37,64,.07)}
.tb-l{display:flex;align-items:center;gap:10px}
.tb-icon{font-size:15px;color:var(--gold)}
.tb-title{font-family:var(--fd);font-size:14px;font-weight:700;white-space:nowrap;color:var(--text)}
.tb-r{display:flex;align-items:center;gap:10px}
.live-ind{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--green);font-family:var(--fm)}
.tb-alert{font-size:11px;padding:4px 10px;border-radius:var(--r);background:var(--rdim);color:var(--red);border:1px solid rgba(220,38,38,.2);font-family:var(--fm);cursor:pointer;transition:background .12s}
.tb-alert:hover{background:rgba(220,38,38,.12)}
.tb-chip{font-size:10px;padding:3px 8px;border-radius:var(--r);background:var(--bg4);color:var(--text3);border:1px solid var(--border);font-family:var(--fm);white-space:nowrap}
.uavt{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--accent2),var(--gold));color:#fff;font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center}
.page{flex:1;overflow-y:auto;background:var(--bg)}
.pinner{padding:24px 28px;max-width:1600px}
/* ATOMS */
.pd{width:6px;height:6px;border-radius:50%;flex-shrink:0;animation:pu 2s ease-in-out infinite}
.pd.g{background:var(--green)}.pd.r{background:var(--red)}.pd.y{background:var(--yellow)}
@keyframes pu{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}
/* CARDS */
.card{background:var(--bg2);border:none;border-radius:var(--r3);overflow:hidden;box-shadow:var(--shadow)}
.ch{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-shrink:0;background:var(--bg1)}
.ct{font-family:var(--fd);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--text2)}
.cb{padding:16px}
/* KPI */
.kpi{background:var(--bg2);border:none;border-radius:var(--r3);padding:16px 18px;position:relative;overflow:hidden;transition:box-shadow .15s;box-shadow:var(--shadow)}
.kpi:hover{box-shadow:var(--shadow2)}
.kpi::after{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kpi.cc::after{background:var(--accent)}.kpi.cg::after{background:var(--green)}.kpi.cy::after{background:var(--gold)}.kpi.cr::after{background:var(--red)}.kpi.cp::after{background:var(--purple)}.kpi.cb2::after{background:var(--gold)}
.kl{font-size:9px;font-family:var(--fm);letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:10px}
.kv{font-family:var(--fd);font-size:32px;font-weight:800;line-height:1;color:var(--text)}
.ks{margin-top:6px;font-size:11px;color:var(--text2)}
.kd{font-family:var(--fm);font-size:10px}.kd.up{color:var(--green)}.kd.dn{color:var(--red)}
/* BADGES */
.b{display:inline-flex;align-items:center;padding:2px 7px;border-radius:4px;font-family:var(--fm);font-size:10px;font-weight:500;white-space:nowrap;border:1px solid transparent}
.brun{background:rgba(15,155,106,.1);color:var(--green);border-color:rgba(15,155,106,.25)}
.bidle{background:var(--bg4);color:var(--text2);border-color:var(--border)}
.berr{background:rgba(220,38,38,.08);color:var(--red);border-color:rgba(220,38,38,.2)}
.bwait{background:rgba(184,134,11,.08);color:var(--gold);border-color:rgba(184,134,11,.25)}
.bplan{background:var(--bg4);color:var(--text3);border-color:var(--border)}
.bsched{background:rgba(37,99,235,.07);color:var(--accent);border-color:rgba(37,99,235,.2)}
.bprod{background:rgba(37,99,235,.07);color:var(--accent);border-color:rgba(37,99,235,.2)}
.bpost{background:rgba(99,102,241,.07);color:var(--purple);border-color:rgba(99,102,241,.2)}
.bqa{background:rgba(184,134,11,.08);color:var(--gold);border-color:rgba(184,134,11,.25)}
.bcomp{background:rgba(15,155,106,.08);color:var(--green);border-color:rgba(15,155,106,.2)}
.brwk{background:rgba(220,38,38,.07);color:var(--red);border-color:rgba(220,38,38,.2)}
.bappr{background:rgba(37,99,235,.07);color:var(--accent);border-color:rgba(37,99,235,.2)}
.bpend{background:rgba(184,134,11,.08);color:var(--gold);border-color:rgba(184,134,11,.25)}
.bpass{background:rgba(15,155,106,.08);color:var(--green);border-color:rgba(15,155,106,.2)}
.bfail{background:rgba(220,38,38,.07);color:var(--red);border-color:rgba(220,38,38,.2)}
.bhigh{background:rgba(184,134,11,.08);color:var(--gold);border-color:rgba(184,134,11,.25)}
.burgent{background:rgba(220,38,38,.07);color:var(--red);border-color:rgba(220,38,38,.2)}
.bnorm{background:var(--bg4);color:var(--text3);border-color:var(--border)}
.bfdm{background:rgba(37,99,235,.07);color:var(--fdm);border-color:rgba(37,99,235,.2)}
.bsla{background:rgba(99,102,241,.07);color:var(--sla);border-color:rgba(99,102,241,.2)}
.bsls{background:rgba(184,134,11,.08);color:var(--sls);border-color:rgba(184,134,11,.25)}
/* DEPT BADGES */
.bdeng{background:rgba(37,99,235,.07);color:var(--eng);border-color:rgba(37,99,235,.2)}
.bdrd{background:rgba(99,102,241,.07);color:var(--rd);border-color:rgba(99,102,241,.2)}
.bddes{background:rgba(2,132,199,.07);color:var(--des);border-color:rgba(2,132,199,.2)}
.bdmfg{background:rgba(184,134,11,.08);color:var(--mfg);border-color:rgba(184,134,11,.25)}
.bdnpi{background:rgba(194,98,10,.08);color:var(--npi);border-color:rgba(194,98,10,.2)}
/* TABLE */
.tw{overflow-x:auto}
table{width:100%;border-collapse:collapse}
th{padding:9px 14px;text-align:left;white-space:nowrap;font-family:var(--fm);font-size:9px;letter-spacing:1.4px;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);font-weight:500;background:var(--bg3)}
td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:middle;color:var(--text);font-size:12.5px}
tr:last-child td{border-bottom:none}
tbody tr{transition:background .1s}
tbody tr:hover td{background:var(--bg3)}
tbody tr.cl{cursor:pointer}
.tm{font-family:var(--fm);font-size:11px}.tdim{color:var(--text2);font-size:11.5px}.tacc{color:var(--gold);font-family:var(--fm);font-size:11px}
/* PROGRESS */
.prog{background:var(--bg4);border-radius:2px;overflow:hidden}
.pf{border-radius:2px;transition:width .6s ease}
/* OEE RING */
.oring{position:relative;display:inline-flex;align-items:center;justify-content:center}
.oring svg{transform:rotate(-90deg)}
.ocenter{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center}
.opct{font-family:var(--fd);font-weight:800;line-height:1}
.olbl{font-family:var(--fm);font-size:8px;letter-spacing:.5px;color:var(--text3);margin-top:2px;text-transform:uppercase}
/* SPARK */
.spark{display:flex;align-items:flex-end;gap:2px}
.spb{flex:1;border-radius:1px 1px 0 0;min-width:3px}
/* ALERT */
.astrip{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-radius:var(--r2);margin-bottom:8px;border:1px solid}
.astrip.err{background:rgba(220,38,38,.06);border-color:rgba(220,38,38,.2)}
.astrip.warn{background:rgba(184,134,11,.06);border-color:rgba(184,134,11,.2)}
.astrip.info{background:rgba(37,99,235,.05);border-color:rgba(37,99,235,.15)}
/* MACHINE CARD */
.mc{background:var(--bg2);border:none;border-radius:var(--r3);padding:14px;position:relative;overflow:hidden;transition:box-shadow .15s;box-shadow:var(--shadow)}
.mc:hover{box-shadow:var(--shadow2)}
.mc::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.mc.running::before{background:var(--green)}.mc.error::before{background:var(--red)}.mc.waiting::before{background:var(--yellow)}.mc.idle::before{background:var(--border2)}.mc.maintenance::before{background:var(--purple)}
/* KANBAN */
.kanban{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.kcol{background:var(--bg3);border:1px solid var(--border);border-radius:var(--r3);display:flex;flex-direction:column;max-height:600px;overflow:hidden}
.kch{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--bg1)}
.kct{font-family:var(--fd);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text)}
.kwip{font-size:9px;font-family:var(--fm);padding:1px 5px;border-radius:3px}
.kwip.ok{background:rgba(15,155,106,.08);color:var(--green)}.kwip.ov{background:rgba(220,38,38,.08);color:var(--red);animation:fl 1s infinite}
@keyframes fl{0%,100%{opacity:1}50%{opacity:.35}}
.kbody{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px}
.kcard{background:var(--bg2);border:none;border-radius:var(--r2);padding:10px 12px;cursor:pointer;transition:box-shadow .12s;border-left:2px solid transparent;box-shadow:var(--shadow)}
.kcard:hover{box-shadow:var(--shadow2)}
.kcard.urgent{border-left-color:var(--red)}.kcard.high{border-left-color:var(--gold)}
/* TASK */
.trow{background:var(--bg2);border:none;border-radius:var(--r2);padding:12px 16px;display:flex;align-items:center;gap:12px;margin-bottom:8px;transition:box-shadow .12s;border-left:2px solid transparent;box-shadow:var(--shadow)}
.trow:hover{background:var(--bg3);box-shadow:var(--shadow2)}
.trow.urgent{border-left-color:var(--red)}.trow.high{border-left-color:var(--gold)}
/* GAUGE */
.grow{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.gtrack{flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden}
.gfill{height:100%;border-radius:3px;transition:width .5s}
/* COST SEG */
.cseg{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.cstrack{flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden}
.csfill{height:100%;border-radius:3px}
/* TABS */
.tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:16px;overflow-x:auto;gap:0}
.tab{padding:9px 16px;font-size:12px;font-weight:600;font-family:var(--fd);color:var(--text3);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none;transition:all .12s}
.tab:hover{color:var(--text2)}.tab.act{color:var(--accent);border-bottom-color:var(--accent)}
/* TIMELINE */
.tli{display:flex;gap:12px;padding-bottom:14px;position:relative}
.tldot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:5px}
.tlline{position:absolute;left:3px;top:14px;bottom:0;width:1px;background:var(--border)}
/* MODAL */
.mback{position:fixed;inset:0;background:rgba(26,37,64,.4);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);animation:fi .15s ease}
.mod{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r3);width:520px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,37,64,.2);animation:su .15s ease}
.mh{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg2);z-index:1}
.mtitle{font-family:var(--fd);font-size:15px;font-weight:700;color:var(--text)}
.mclose{background:none;border:none;color:var(--text3);font-size:20px;line-height:1;padding:2px 6px;border-radius:var(--r);transition:all .12s}
.mclose:hover{color:var(--text);background:var(--bg4)}
.mbody{padding:20px}.mfoot{padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}
/* FORM */
.frow{display:flex;gap:12px;margin-bottom:12px}
.fg{flex:1;min-width:0}
.fl{display:block;font-family:var(--fm);font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}
.fi,.fsel,.fta{width:100%;padding:8px 12px;background:var(--bg1);border:1px solid var(--border2);border-radius:var(--r);color:var(--text);font-size:12.5px;font-family:var(--fb);outline:none;transition:border-color .12s}
.fi:focus,.fsel:focus,.fta:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
.fsel{appearance:none;cursor:pointer}.fta{resize:vertical;min-height:80px}
/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--r);font-size:12.5px;font-family:var(--fb);border:1px solid;transition:all .12s;white-space:nowrap;font-weight:500;cursor:pointer}
.btp{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600;box-shadow:0 1px 3px rgba(37,99,235,.3)}
.btp:hover{background:var(--accent2);box-shadow:0 2px 6px rgba(37,99,235,.35)}
.btg{background:var(--bg1);color:var(--text2);border-color:var(--border2)}
.btg:hover{color:var(--text);border-color:var(--border3);background:var(--bg3)}
.bts{padding:4px 10px;font-size:11px}
/* GRID */
.g{display:grid;gap:14px}
.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}.g4{grid-template-columns:1fr 1fr 1fr 1fr}
.g12{grid-template-columns:1fr 2fr}.g21{grid-template-columns:2fr 1fr}.g13{grid-template-columns:1fr 3fr}
@media(max-width:1100px){.g4{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr}}
@media(max-width:800px){.g2,.g3,.g4,.g12,.g21,.g13{grid-template-columns:1fr}}
/* UTILS */
.row{display:flex;align-items:center;gap:8px}
.rowsb{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sep{height:1px;background:var(--border);margin:12px 0}
.mb4{margin-bottom:4px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt12{margin-top:12px}
.mono{font-family:var(--fm);font-size:11px}.dim{color:var(--text2)}.small{font-size:11px}
.tiny{font-size:10px;color:var(--text3);font-family:var(--fm)}
.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ITEM ROW */
.ii{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
.ii:last-child{border-bottom:none}
.iicon{width:34px;height:34px;border-radius:var(--r2);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;background:var(--bg4)}
/* REQUEST CARD */
.req-card{background:var(--bg2);border:none;border-radius:var(--r3);padding:16px;border-left:3px solid transparent;transition:box-shadow .15s;box-shadow:var(--shadow)}
.req-card:hover{box-shadow:var(--shadow2)}
.req-card.eng{border-left-color:var(--eng)}.req-card.rd{border-left-color:var(--rd)}.req-card.des{border-left-color:var(--des)}.req-card.mfg{border-left-color:var(--mfg)}.req-card.npi{border-left-color:var(--npi)}
/* BUDGET BAR */
.budget-bar{height:6px;background:var(--bg4);border-radius:3px;overflow:hidden;margin-top:6px}
.budget-fill{height:100%;border-radius:3px;transition:width .5s}
/* PERM TABLE */
.ptbl{width:100%;border-collapse:collapse}
.ptbl th,.ptbl td{padding:8px 10px;border-bottom:1px solid var(--border)}
.ptbl th{background:var(--bg3);font-family:var(--fm);font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);text-align:center}
.ptbl th:first-child{text-align:left}.ptbl td{font-size:11.5px;text-align:center;color:var(--text2)}.ptbl td:first-child{text-align:left}
.pck{color:var(--green);font-size:13px}.px{color:var(--border2);font-size:13px}
.pinner>*{animation:sin .18s ease}
@keyframes sin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
/* LIFECYCLE TIMELINE */
.tl{display:flex;flex-direction:column}
.tl-item{display:flex;gap:14px;padding-bottom:18px;position:relative}
.tl-item:last-child{padding-bottom:0}
.tl-spine{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:28px}
.tl-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0;border:2px solid;transition:all .3s;z-index:1}
.tl-dot.sd{background:var(--green);border-color:var(--green);color:#fff}
.tl-dot.sa{background:var(--accent);border-color:var(--accent);color:#fff;animation:pu 2s infinite}
.tl-dot.sf{background:var(--bg4);border-color:var(--border2);color:var(--text3)}
.tl-line{width:2px;flex:1;background:var(--border);margin-top:2px;min-height:14px;border-radius:1px}
.tl-line.ld{background:var(--green);opacity:.4}
.tl-line.la{background:linear-gradient(to bottom,var(--accent),var(--border));opacity:.5}
.tl-content{flex:1;padding-top:3px}
.tl-sname{font-family:var(--fd);font-size:13px;font-weight:700;margin-bottom:3px}
.tl-item.sd .tl-sname{color:var(--green)}
.tl-item.sa .tl-sname{color:var(--accent)}
.tl-item.sf .tl-sname{color:var(--text2)}
.tl-meta{display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap}
.tl-time{font-family:var(--fm);font-size:10px;color:var(--text3)}
.sbox{background:var(--bg3);border:1px solid var(--border);border-radius:var(--r2);padding:12px;margin-top:4px;animation:sin .2s ease}
/* PIPELINE BAR */
.pipeline{display:flex;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r3);overflow:hidden;margin-bottom:20px;box-shadow:var(--shadow)}
.ps{flex:1;padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;border-right:1px solid var(--border);transition:background .15s}
.ps:last-child{border-right:none}
.ps.psd{background:rgba(15,155,106,.06)}.ps.psa{background:rgba(37,99,235,.05)}.ps.psf{opacity:.5}
.ps-num{width:19px;height:19px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--fm);font-size:9px;font-weight:700;border:1px solid;flex-shrink:0}
.psd .ps-num{background:var(--green);border-color:var(--green);color:#fff}
.psa .ps-num{background:var(--accent);border-color:var(--accent);color:#fff;animation:pu 2s infinite}
.psf .ps-num{background:var(--bg4);border-color:var(--border2);color:var(--text3)}
.ps-lbl{font-family:var(--fd);font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;text-align:center;line-height:1.2}
.psd .ps-lbl{color:var(--green)}.psa .ps-lbl{color:var(--accent)}.psf .ps-lbl{color:var(--text3)}
/* WIZARD */
.wiz-steps{display:flex;border-bottom:1px solid var(--border);margin-bottom:20px}
.wz-s{flex:1;padding:8px 6px;text-align:center;font-family:var(--fm);font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:var(--text3);border-bottom:2px solid transparent;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .15s}
.wz-s.wz-done{color:var(--green);border-bottom-color:var(--green)}
.wz-s.wz-act{color:var(--accent);border-bottom-color:var(--accent)}
.wz-num{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;border:1px solid currentColor}
.wz-s.wz-done .wz-num{background:var(--green);border-color:var(--green);color:#fff}
.wz-s.wz-act .wz-num{background:var(--accent);border-color:var(--accent);color:#fff}
/* QA ROW */
.qa-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
.qa-row:last-child{border-bottom:none}
.qa-box{width:18px;height:18px;border-radius:3px;border:1px solid var(--border2);background:var(--bg4);flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;transition:all .12s}
.qa-box.on{background:var(--green);border-color:var(--green);color:#fff}
/* MODAL WIDE */
.mod.wide{width:640px}
/* TOAST */
.toast-wrap{position:fixed;top:16px;right:16px;z-index:2000;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:10px 16px;font-size:12px;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(26,37,64,.15);min-width:260px;animation:su .2s ease;pointer-events:none}
.toast.ts{border-left:3px solid var(--green)}.toast.ti{border-left:3px solid var(--accent)}.toast.tw{border-left:3px solid var(--gold)}.toast.te{border-left:3px solid var(--red)}

/* PAGE HEADER — editorial */
.pg-hd{margin-bottom:24px}
.pg-eyebrow{font-size:9px;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:4px;display:block}
.pg-title{font-family:var(--fd);font-size:26px;font-weight:800;letter-spacing:-.03em;color:var(--text);line-height:1.2;margin-bottom:0}
`;

/* ══════════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════════ */

export default CSS;
