import { TB } from "../../../components/atoms";

export function GroupSelector({ groups, selectedIndex, onSelect, project }) {
    const groupCount = groups?.length || 1;
    if (groupCount <= 1 && !groups?.length) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r2)", marginBottom: 14 }}>
                <span style={{ fontFamily: "var(--fd)", fontSize: 11, color: "var(--text3)" }}>Single Group Project</span>
            </div>
        );
    }
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--fd)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text3)", marginBottom: 8 }}>
                Select Group
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {groups.map((g, i) => (
                    <button
                        key={i}
                        onClick={() => onSelect(i)}
                        style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: `1.5px solid ${selectedIndex === i ? "var(--accent)" : "var(--border)"}`,
                            background: selectedIndex === i ? "var(--adim)" : "var(--bg3)",
                            color: selectedIndex === i ? "var(--accent)" : "var(--text2)",
                            fontFamily: "var(--fd)",
                            fontSize: 12,
                            fontWeight: selectedIndex === i ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "all .12s",
                        }}
                    >
                        <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: selectedIndex === i ? "var(--accent)" : "var(--border2)"
                        }} />
                        G{i + 1}
                        <span style={{ color: "var(--text3)", fontWeight: 400 }}>({g.qty || 0} pcs)</span>
                    </button>
                ))}
            </div>
            {project?.imageUrl && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 12px", background: "var(--bg3)", borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                    <img src={project.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />
                    <span style={{ fontSize: 11, color: "var(--text2)" }}>
                        {project.name} · {groups.length} groups
                    </span>
                </div>
            )}
        </div>
    );
}