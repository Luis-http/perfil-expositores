export interface Implantado {
  cliente: string;
  tipo: string;
  quantidade: number;
  pedido: string;
  liberacaoPCP: Date | null;
  dataEntrega: Date | null;
  diasAteEntrega: number | null;
}

export interface Pipeline {
  cliente: string;
  tipo: string;
  quantidade: number;
  dataEntrega: Date | null;
  status: string;
  statusOriginal: string;
}

export interface DadosCarregados {
  implantados: Implantado[];
  pipeline: Pipeline[];
  modoDemo: boolean;
  erro?: string;
}
