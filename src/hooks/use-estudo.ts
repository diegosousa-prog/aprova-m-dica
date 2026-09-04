import { useCallback, useEffect, useState } from "react";

import type { Questao } from "@/data/mock";

export type RespostaUsuario = {
  questaoId: string;
  alternativaEscolhida: Questao["correta"];
  acertou: boolean;
  respondidaEm: string;
};

export type EstadoEstudo = {
  respostas: Record<string, RespostaUsuario>;
  favoritas: string[];
  anotacoes: Record<string, string>;
};

const STORAGE_KEY = "qbmed-estado-estudo";

const estadoInicial: EstadoEstudo = {
  respostas: {},
  favoritas: [],
  anotacoes: {},
};

function carregarEstado(): EstadoEstudo {
  if (typeof window === "undefined") {
    return estadoInicial;
  }

  try {
    const salvo = window.localStorage.getItem(STORAGE_KEY);

    if (!salvo) {
      return estadoInicial;
    }

    const parsed = JSON.parse(salvo) as Partial<EstadoEstudo>;

    return {
      respostas: parsed.respostas ?? {},
      favoritas: parsed.favoritas ?? [],
      anotacoes: parsed.anotacoes ?? {},
    };
  } catch {
    return estadoInicial;
  }
}

export function useEstudo() {
  const [estado, setEstado] = useState<EstadoEstudo>(carregarEstado);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }, [estado]);

  const registrarResposta = useCallback(
    (
      questao: Questao,
      alternativaEscolhida: Questao["correta"],
    ) => {
      const resposta: RespostaUsuario = {
        questaoId: questao.id,
        alternativaEscolhida,
        acertou: alternativaEscolhida === questao.correta,
        respondidaEm: new Date().toISOString(),
      };

      setEstado((atual) => ({
        ...atual,
        respostas: {
          ...atual.respostas,
          [questao.id]: resposta,
        },
      }));
    },
    [],
  );

  const alternarFavorita = useCallback((questaoId: string) => {
    setEstado((atual) => {
      const favorita = atual.favoritas.includes(questaoId);

      return {
        ...atual,
        favoritas: favorita
          ? atual.favoritas.filter((id) => id !== questaoId)
          : [...atual.favoritas, questaoId],
      };
    });
  }, []);

  const salvarAnotacao = useCallback(
    (questaoId: string, texto: string) => {
      setEstado((atual) => {
        const anotacoes = { ...atual.anotacoes };

        if (texto.trim()) {
          anotacoes[questaoId] = texto.trim();
        } else {
          delete anotacoes[questaoId];
        }

        return {
          ...atual,
          anotacoes,
        };
      });
    },
    [],
  );

  const limparResposta = useCallback((questaoId: string) => {
    setEstado((atual) => {
      const respostas = { ...atual.respostas };
      delete respostas[questaoId];

      return {
        ...atual,
        respostas,
      };
    });
  }, []);

  const estaFavorita = useCallback(
    (questaoId: string) => estado.favoritas.includes(questaoId),
    [estado.favoritas],
  );

  return {
    estado,
    registrarResposta,
    alternarFavorita,
    salvarAnotacao,
    limparResposta,
    estaFavorita,
  };
}