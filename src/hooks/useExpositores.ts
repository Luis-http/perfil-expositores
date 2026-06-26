import { useState, useEffect, useCallback } from "react";
import type { DadosCarregados } from "../types";
import { carregarDados } from "../data/csvService";

interface Estado {
  dados: DadosCarregados | null;
  carregando: boolean;
  erro: string | null;
}

export function useExpositores() {
  const [estado, setEstado] = useState<Estado>({
    dados: null,
    carregando: true,
    erro: null,
  });

  const carregar = useCallback(async () => {
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    try {
      const dados = await carregarDados();
      setEstado({ dados, carregando: false, erro: dados.erro || null });
    } catch (e) {
      setEstado({
        dados: null,
        carregando: false,
        erro: (e as Error).message,
      });
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { ...estado, recarregar: carregar };
}
