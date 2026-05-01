export function ReviewSection({ num, title, status, children }) {
    const statusColors = {
        ok: { bg: "rgba(15,155,106,.06)", border: "rgba(15,155,106,.25)", dot: "var(--green)", text: "var(--green)" },
        warn: { bg: "var(--golddim)", border: "rgba(184,134,11,.3)", dot: "var(--yellow)", text: "var(--gold)" },
        null: { bg: "var(--bg2)", border: "var(--border)", dot: "var(--border2)", text: "var(--text3)" },
    };
    const colors = statusColors[status] || statusColors.null;
    return (
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "var(--r2)", padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: children ? 14 : 0 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: colors.dot, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{num}</span>
                <span style={{ fontFamily: "var(--fd)", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{title}</span>
                {status === "ok" && <span style={{ marginLeft: "auto", color: colors.text, fontSize: 11, fontWeight: 600 }}>✓ Complete</span>}
                {status === "warn" && <span style={{ marginLeft: "auto", color: colors.text, fontSize: 11, fontWeight: 600 }}>⚠ Needs Attention</span>}
            </div>
            {children}
        </div>
    );
}