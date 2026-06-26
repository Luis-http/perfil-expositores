import { useState, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import Header from "./components/layout/Header";
import TabNav from "./components/layout/TabNav";
import type { Aba } from "./components/layout/TabNav";
import PainelPage from "./components/painel/PainelPage";
import ImplantadosPage from "./components/implantados/ImplantadosPage";
import PipelinePage from "./components/pipeline/PipelinePage";
import { useExpositores } from "./hooks/useExpositores";
import "./App.css";

class TabBoundary extends Component<{ label: string; children: ReactNode }, { error: boolean; msg: string }> {
  state = { error: false, msg: "" };
  componentDidCatch(e: Error, _: ErrorInfo) {
    this.setState({ error: true, msg: e.message });
  }
  render() {
    if (this.state.error)
      return (
        <div className="tab-error">
          <h3>Erro na aba {this.props.label}</h3>
          <p>{this.state.msg}</p>
          <button onClick={() => this.setState({ error: false, msg: "" })}>
            Tentar novamente
          </button>
        </div>
      );
    return this.props.children;
  }
}

export default function App() {
  const [aba, setAba] = useState<Aba>("painel");
  const { dados, carregando, erro, recarregar } = useExpositores();

  return (
    <div className="app">
      <Header
        modoDemo={dados?.modoDemo ?? false}
        onRecarregar={recarregar}
        carregando={carregando}
      />
      <TabNav aba={aba} onChange={setAba} />

      <main className="app-main">
        {carregando && (
          <div className="loading">
            <div className="loading-spinner" />
            <span>Carregando dados…</span>
          </div>
        )}

        {erro && !carregando && (
          <div className="erro-banner">
            ⚠️ {erro}
          </div>
        )}

        {dados && !carregando && (
          <>
            {aba === "painel" && (
              <TabBoundary label="Painel">
                <PainelPage
                  implantados={dados.implantados}
                  pipeline={dados.pipeline}
                />
              </TabBoundary>
            )}
            {aba === "implantados" && (
              <TabBoundary label="Implantados">
                <ImplantadosPage implantados={dados.implantados} />
              </TabBoundary>
            )}
            {aba === "pipeline" && (
              <TabBoundary label="Pipeline">
                <PipelinePage pipeline={dados.pipeline} />
              </TabBoundary>
            )}
          </>
        )}
      </main>
    </div>
  );
}
