import { CONFIG } from "../../config";
import "./Header.css";

interface Props {
  modoDemo: boolean;
  onRecarregar: () => void;
  carregando: boolean;
}

export default function Header({ modoDemo, onRecarregar, carregando }: Props) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <img
            src={CONFIG.LOGO_PATH}
            alt="Logo"
            className="header-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div>
            <span className="header-title">{CONFIG.NOME_EMPRESA}</span>
            <span className="header-sub">{CONFIG.SUBTITULO}</span>
          </div>
        </div>
        <div className="header-actions">
          {modoDemo && (
            <span className="badge-demo">MODO DEMONSTRAÇÃO</span>
          )}
          <button
            className="btn-reload"
            onClick={onRecarregar}
            disabled={carregando}
            title="Recarregar dados da planilha"
          >
            {carregando ? "⟳ Carregando…" : "⟳ Atualizar"}
          </button>
        </div>
      </div>
    </header>
  );
}
