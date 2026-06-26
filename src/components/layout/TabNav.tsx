import "./TabNav.css";

export type Aba = "painel" | "implantados" | "pipeline";

interface Props {
  aba: Aba;
  onChange: (aba: Aba) => void;
}

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "painel", label: "Painel", icon: "📊" },
  { id: "implantados", label: "Implantados", icon: "✅" },
  { id: "pipeline", label: "A Entrar", icon: "🔄" },
];

export default function TabNav({ aba, onChange }: Props) {
  return (
    <nav className="tab-nav">
      <div className="tab-nav-inner">
        {ABAS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${aba === t.id ? "active" : ""}`}
            onClick={() => onChange(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
