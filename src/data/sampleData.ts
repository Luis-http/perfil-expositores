import type { Implantado, Pipeline } from "../types";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

export const SAMPLE_IMPLANTADOS: Implantado[] = [
  { cliente: "Mercado São João", tipo: "Vertical", quantidade: 2, pedido: "240001", liberacaoPCP: d(2024, 1, 10), dataEntrega: d(2024, 2, 5), diasAteEntrega: 26 },
  { cliente: "Supermercado Central", tipo: "Vitrine", quantidade: 3, pedido: "240002", liberacaoPCP: d(2024, 1, 15), dataEntrega: d(2024, 2, 20), diasAteEntrega: 36 },
  { cliente: "Padaria Bela Vista", tipo: "Semivertical", quantidade: 1, pedido: "240003", liberacaoPCP: d(2024, 2, 1), dataEntrega: d(2024, 3, 1), diasAteEntrega: 29 },
  { cliente: "Empório do Frio", tipo: "Ilha self", quantidade: 4, pedido: "240004", liberacaoPCP: d(2024, 2, 10), dataEntrega: d(2024, 3, 15), diasAteEntrega: 34 },
  { cliente: "Hortifruti Novo Mundo", tipo: "Mesa refrigerada", quantidade: 2, pedido: "240005", liberacaoPCP: d(2024, 3, 5), dataEntrega: d(2024, 4, 1), diasAteEntrega: 27 },
  { cliente: "Atacado Premium", tipo: "Combinado", quantidade: 5, pedido: "240006", liberacaoPCP: d(2024, 3, 20), dataEntrega: d(2024, 5, 5), diasAteEntrega: 46 },
  { cliente: "Mercado Bom Preço", tipo: "Vertical", quantidade: 3, pedido: "240007", liberacaoPCP: d(2024, 4, 8), dataEntrega: d(2024, 5, 10), diasAteEntrega: 32 },
  { cliente: "Supermercado Família", tipo: "Vitrine", quantidade: 2, pedido: "240008", liberacaoPCP: d(2024, 5, 2), dataEntrega: d(2024, 5, 28), diasAteEntrega: 26 },
  { cliente: "Mercearia Três Irmãos", tipo: "Semivertical", quantidade: 1, pedido: "240009", liberacaoPCP: d(2024, 5, 14), dataEntrega: d(2024, 6, 12), diasAteEntrega: 29 },
  { cliente: "Distribuidora Gelada", tipo: "Ilha self", quantidade: 6, pedido: "240010", liberacaoPCP: d(2024, 6, 3), dataEntrega: d(2024, 7, 1), diasAteEntrega: 28 },
  { cliente: "Supermercado Norte Sul", tipo: "Vertical", quantidade: 4, pedido: "240011", liberacaoPCP: d(2024, 6, 18), dataEntrega: d(2024, 7, 22), diasAteEntrega: 34 },
  { cliente: "Açougue Modelo", tipo: "Mesa refrigerada", quantidade: 2, pedido: "240012", liberacaoPCP: d(2024, 7, 5), dataEntrega: d(2024, 8, 2), diasAteEntrega: 28 },
  { cliente: "Mercado do Zé", tipo: "Vitrine", quantidade: 1, pedido: "240013", liberacaoPCP: d(2024, 7, 22), dataEntrega: d(2024, 8, 20), diasAteEntrega: 29 },
  { cliente: "Supermercado Horizonte", tipo: "Combinado", quantidade: 3, pedido: "240014", liberacaoPCP: d(2024, 8, 10), dataEntrega: d(2024, 9, 15), diasAteEntrega: 36 },
  { cliente: "Padaria Santa Luzia", tipo: "Semivertical", quantidade: 2, pedido: "240015", liberacaoPCP: d(2024, 9, 4), dataEntrega: d(2024, 10, 3), diasAteEntrega: 29 },
  { cliente: "Mercadinho Popular", tipo: "Vertical", quantidade: 2, pedido: "240016", liberacaoPCP: d(2024, 9, 20), dataEntrega: d(2024, 10, 25), diasAteEntrega: 35 },
  { cliente: "Empório Gourmet", tipo: "Ilha self", quantidade: 3, pedido: "240017", liberacaoPCP: d(2024, 10, 7), dataEntrega: d(2024, 11, 5), diasAteEntrega: 29 },
  { cliente: "Supercenter Oeste", tipo: "Vitrine", quantidade: 5, pedido: "240018", liberacaoPCP: d(2024, 10, 22), dataEntrega: d(2024, 11, 28), diasAteEntrega: 37 },
  { cliente: "Minimercado Azul", tipo: "Semivertical", quantidade: 1, pedido: "240019", liberacaoPCP: d(2024, 11, 8), dataEntrega: d(2024, 12, 6), diasAteEntrega: 28 },
  { cliente: "Hipermercado Planeta", tipo: "Combinado", quantidade: 8, pedido: "240020", liberacaoPCP: d(2024, 11, 25), dataEntrega: d(2025, 1, 10), diasAteEntrega: 46 },
  { cliente: "Atacarejo Máximo", tipo: "Vertical", quantidade: 6, pedido: "250001", liberacaoPCP: d(2025, 1, 8), dataEntrega: d(2025, 2, 12), diasAteEntrega: 35 },
  { cliente: "Mercado Esperança", tipo: "Mesa refrigerada", quantidade: 2, pedido: "250002", liberacaoPCP: d(2025, 1, 20), dataEntrega: d(2025, 2, 20), diasAteEntrega: 31 },
  { cliente: "Supermercado Vitória", tipo: "Vitrine", quantidade: 4, pedido: "250003", liberacaoPCP: d(2025, 2, 5), dataEntrega: d(2025, 3, 7), diasAteEntrega: 30 },
  { cliente: "Mercearia Boa Vista", tipo: "Ilha self", quantidade: 2, pedido: "250004", liberacaoPCP: d(2025, 2, 18), dataEntrega: d(2025, 3, 20), diasAteEntrega: 30 },
  { cliente: "Empório dos Frios", tipo: "Semivertical", quantidade: 3, pedido: "250005", liberacaoPCP: d(2025, 3, 3), dataEntrega: d(2025, 4, 1), diasAteEntrega: 29 },
];

export const SAMPLE_PIPELINE: Pipeline[] = [
  { cliente: "Supermercado Futuro", tipo: "Vertical", quantidade: 4, dataEntrega: new Date(2025, 4, 15), status: "Implantar", statusOriginal: "Implantar" },
  { cliente: "Padaria Nova Era", tipo: "Vitrine", quantidade: 2, dataEntrega: new Date(2025, 4, 20), status: "Implantar", statusOriginal: "Implantar" },
  { cliente: "Minimercado Brilhante", tipo: "Semivertical", quantidade: 1, dataEntrega: new Date(2025, 5, 1), status: "Configuração engenharia", statusOriginal: "Configuração engenharia" },
  { cliente: "Hipermercado Total", tipo: "Combinado", quantidade: 6, dataEntrega: new Date(2025, 5, 10), status: "Configuração engenharia", statusOriginal: "Configuração engenharia" },
  { cliente: "Açougue Premium", tipo: "Mesa refrigerada", quantidade: 3, dataEntrega: new Date(2025, 5, 15), status: "Aguardando documentação", statusOriginal: "Aguardando documentação" },
  { cliente: "Mercado Moderno", tipo: "Ilha self", quantidade: 5, dataEntrega: new Date(2025, 5, 22), status: "Aguardando documentação", statusOriginal: "Aguardando documentação" },
  { cliente: "Distribuidora Top Frio", tipo: "Vertical", quantidade: 3, dataEntrega: new Date(2025, 6, 5), status: "Aguardando informações", statusOriginal: "Aguardando informações" },
  { cliente: "Empório Gelado", tipo: "Vitrine", quantidade: 2, dataEntrega: new Date(2025, 6, 12), status: "Aguardando documentação", statusOriginal: "Aguardando documentação" },
];
