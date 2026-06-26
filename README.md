# Plataforma de Controle de Expositores — Perfil Refrigeração

## Configuração rápida

### 1. Adicionar o logo

Coloque o arquivo de imagem do logo em:
```
public/logo.png
```
Substitua o arquivo `logo.png` existente. Formatos aceitos: PNG, JPG, SVG.

### 2. Conectar o Google Sheets

Edite o arquivo `src/config.ts` e cole os links CSV nas variáveis indicadas:

```ts
CSV_URL_IMPLANTADOS: "https://docs.google.com/spreadsheets/d/.../pub?gid=...&single=true&output=csv",
CSV_URL_PIPELINE:    "https://docs.google.com/spreadsheets/d/.../pub?gid=...&single=true&output=csv",
```

**Como obter o link CSV:**
1. Abra a planilha no Google Sheets
2. Arquivo → Compartilhar → Publicar na web
3. Selecione a aba → Formato: **Valores separados por vírgula (.csv)** → Publicar
4. Copie o link gerado

> Enquanto os links estiverem vazios, a plataforma roda em **modo demonstração** com dados de exemplo.

### 3. Cabeçalhos esperados na planilha

**Aba Implantados** (nomes tolerantes a variações):

| Campo | Exemplos aceitos |
|---|---|
| Cliente | `Cliente` |
| Tipo | `Tipo`, `Tipo Expositor` |
| Quantidade | `Quantidade`, `Qtd`, `Qtde` |
| Pedido | `Nº do Pedido`, `Pedido`, `Numero` |
| Liberação PCP | `Liberação PCP`, `Lib PCP`, `Dt Liberação` |
| Data de entrega | `Data de Entrega`, `Entrega`, `Dt Entrega` |

**Aba A Entrar** (pipeline):

| Campo | Exemplos aceitos |
|---|---|
| Cliente | `Cliente` |
| Tipo | `Tipo`, `Tipo Expositor` |
| Quantidade | `Quantidade`, `Qtd` |
| Data de entrega | `Data de Entrega`, `Entrega`, `Previsão` |
| Status | `Status`, `Situação`, `Etapa` |

---

## Rodar localmente

> **Pré-requisito:** Node.js instalado em `C:\NODE\node-v22.13.1-win-x64\`

Abra o PowerShell ou Prompt de Comando na pasta do projeto e rode:

```powershell
$env:PATH = "C:\NODE\node-v22.13.1-win-x64;" + $env:PATH
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## Build e deploy

```powershell
$env:PATH = "C:\NODE\node-v22.13.1-win-x64;" + $env:PATH
npm run build
```

A pasta `dist/` gerada é um site estático. Faça upload dela em qualquer serviço:

- **Netlify:** arraste a pasta `dist/` em app.netlify.com/drop
- **Vercel:** `vercel --prod` (com CLI instalada)
- **GitHub Pages:** configure para servir a branch com o conteúdo de `dist/`

---

## Estrutura do projeto

```
src/
├── config.ts          ← ★ Configure os links CSV e o logo aqui
├── data/
│   ├── csvService.ts  ← busca e parse do CSV (troque aqui para API futura)
│   ├── normalizer.ts  ← normalização de datas, tipos e status
│   └── sampleData.ts  ← dados de demonstração
├── types/index.ts     ← tipos TypeScript
├── hooks/
│   └── useExpositores.ts
└── components/
    ├── layout/        ← Header, TabNav
    ├── painel/        ← Dashboard com gráficos e filtro de período
    ├── implantados/   ← Tabela com busca
    └── pipeline/      ← Grupos por status + exportação PDF
```
