// ============================================================
//  CONFIGURAÇÃO DA PLATAFORMA DE EXPOSITORES — PERFIL REFRIGERAÇÃO
// ============================================================
//
//  ★ PASSO 1 — Cole aqui os dois links CSV do Google Sheets:
//
//    Como obter:
//    1. Abra a planilha no Google Sheets
//    2. Arquivo → Compartilhar → Publicar na web
//    3. Selecione a aba desejada → Formato: CSV → Publicar
//    4. Copie o link gerado e cole abaixo
//
// ============================================================

export const CONFIG = {
  // Link CSV da aba "Implantados"
  CSV_URL_IMPLANTADOS: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2jK7hOXVAivrq05EnzjVqcaqgO9SF7mZyYrOkqPEcCdEiRsifR6ma278va5xKgA/pub?gid=1344649262&single=true&output=csv",

  // Link CSV da aba "A entrar" (pipeline)
  CSV_URL_PIPELINE: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2jK7hOXVAivrq05EnzjVqcaqgO9SF7mZyYrOkqPEcCdEiRsifR6ma278va5xKgA/pub?gid=2123474043&single=true&output=csv",

  // ★ PASSO 2 — Logo:
  //    Coloque o arquivo do logo em: public/logo.png
  //    (substitua o arquivo logo.png que está na pasta public/)
  LOGO_PATH: "/logo-perfil.png",

  // Nome exibido no cabeçalho
  NOME_EMPRESA: "Perfil Refrigeração",
  SUBTITULO: "Controle de Expositores — Setor de Vendas",

  // Quando true, exibe status exatamente como vem da planilha.
  // Quando false, normaliza para o padrão definido em STATUS_LABELS abaixo.
  EXIBIR_STATUS_ORIGINAL: false,
};

// Mapeamento de status (normalização para exibição)
// Chave: versão em minúsculas/sem acento para comparação
// Valor: como será exibido na interface
export const STATUS_MAP: Record<string, string> = {
  "aguardando documentacao": "Aguardando documentação",
  "aguardando documentação": "Aguardando documentação",
  "configuracao engenharia": "Configuração engenharia",
  "configuração engenharia": "Configuração engenharia",
  "implantar": "Implantar",
  "aguardando informacoes": "Aguardando informações",
  "aguardando informações": "Aguardando informações",
};

// Ordem dos status no pipeline (do fluxo)
export const STATUS_ORDER = [
  "Aguardando documentação",
  "Configuração engenharia",
  "Implantar",
  "Aguardando informações",
];

// Cores por status
export const STATUS_COLORS: Record<string, string> = {
  "Aguardando documentação": "#e67e22",
  "Configuração engenharia": "#2980b9",
  "Implantar": "#27ae60",
  "Aguardando informações": "#8e44ad",
};
