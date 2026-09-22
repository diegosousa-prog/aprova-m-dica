import { useCallback, useEffect, useState } from "react";

import type { Questao } from "@/data/mock";
import { supabase } from "@/lib/supabase";

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

const estadoInicial: EstadoEstudo = {
  respostas: {},
  favoritas: [],
  anotacoes: {},
};

export type ResultadoConsumoQuestao = {
  permitido: boolean;
  quantidade: number;
  limite: number;
  premium: boolean;
  erro?: boolean;
};

export function useEstudo() {
  const [estado, setEstado] = useState<EstadoEstudo>(estadoInicial);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !ativo) return;

      const [respostasResult, favoritasResult, anotacoesResult] =
        await Promise.all([
          supabase
            .from("question_answers")
            .select("*")
            .eq("user_id", user.id),

          supabase
            .from("favorites")
            .select("questao_id")
            .eq("user_id", user.id),

          supabase
            .from("annotations")
            .select("questao_id, texto")
            .eq("user_id", user.id),
        ]);

      if (!ativo) return;

      const respostas: Record<string, RespostaUsuario> = {};

      for (const resposta of respostasResult.data ?? []) {
        respostas[resposta.questao_id] = {
          questaoId: resposta.questao_id,
          alternativaEscolhida:
            resposta.resposta as Questao["correta"],
          acertou: resposta.acertou,
          respondidaEm: resposta.respondida_em,
        };
      }

      const favoritas = (favoritasResult.data ?? []).map(
        (item: { questao_id: string }) => item.questao_id,
      );

      const anotacoes: Record<string, string> = {};

      for (const anotacao of anotacoesResult.data ?? []) {
        anotacoes[anotacao.questao_id] = anotacao.texto;
      }

      setEstado({
        respostas,
        favoritas,
        anotacoes,
      });
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  const registrarResposta = useCallback(
    async (
      questao: Questao,
      alternativaEscolhida: Questao["correta"],
    ): Promise<ResultadoConsumoQuestao> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          permitido: false,
          quantidade: 0,
          limite: 0,
          premium: false,
          erro: true,
        };
      }

      /*
       * Primeiro verificamos o plano do usuário.
       *
       * Usuário premium não precisa passar pela função
       * de limite diário.
       */
      const { data: perfil, error: perfilError } = await supabase
        .from("profiles")
        .select("plano")
        .eq("id", user.id)
        .maybeSingle();

      if (perfilError) {
        console.error(
          "Erro ao verificar plano do usuário:",
          perfilError,
        );

        return {
          permitido: false,
          quantidade: 0,
          limite: 0,
          premium: false,
          erro: true,
        };
      }

      const premium = perfil?.plano === "premium";

      /*
       * PREMIUM:
       * não consulta nem consome o limite diário.
       */
      if (premium) {
        const acertou = alternativaEscolhida === questao.correta;
        const respondidaEm = new Date().toISOString();

        const resposta: RespostaUsuario = {
          questaoId: questao.id,
          alternativaEscolhida,
          acertou,
          respondidaEm,
        };

        setEstado((atual) => ({
          ...atual,
          respostas: {
            ...atual.respostas,
            [questao.id]: resposta,
          },
        }));

        const { error } = await supabase
          .from("question_answers")
          .upsert(
            {
              user_id: user.id,
              questao_id: questao.id,
              resposta: alternativaEscolhida,
              acertou,
              respondida_em: respondidaEm,
            },
            {
              onConflict: "user_id,questao_id",
            },
          );

        if (error) {
          console.error("Erro ao salvar resposta:", error);

          setEstado((atual) => {
            const respostas = { ...atual.respostas };
            delete respostas[questao.id];

            return {
              ...atual,
              respostas,
            };
          });

          return {
            permitido: false,
            quantidade: 0,
            limite: 0,
            premium: true,
            erro: true,
          };
        }

        return {
          permitido: true,
          quantidade: 0,
          limite: 0,
          premium: true,
        };
      }

      /*
       * GRATUITO:
       * agora sim verifica e consome o limite diário.
       */
      const { data: consumo, error: consumoError } = await supabase.rpc(
        "consumir_questao_diaria",
      );

      if (consumoError) {
        console.error(
          "Erro ao verificar limite diário de questões:",
          consumoError,
        );

        return {
          permitido: false,
          quantidade: 0,
          limite: 0,
          premium: false,
          erro: true,
        };
      }

      const resultado =
        Array.isArray(consumo) && consumo.length > 0
          ? consumo[0]
          : null;

      if (!resultado) {
        console.error(
          "A função de limite diário não retornou um resultado válido.",
        );

        return {
          permitido: false,
          quantidade: 0,
          limite: 0,
          premium: false,
          erro: true,
        };
      }

      const resultadoConsumo: ResultadoConsumoQuestao = {
        permitido: Boolean(resultado.permitido),
        quantidade: Number(resultado.quantidade ?? 0),
        limite: Number(resultado.limite ?? 10),
        premium: false,
      };

      /*
       * Usuário gratuito atingiu o limite.
       * O QuestaoCard poderá mostrar o popup.
       */
      if (!resultadoConsumo.permitido) {
        return resultadoConsumo;
      }

      const acertou = alternativaEscolhida === questao.correta;
      const respondidaEm = new Date().toISOString();

      const resposta: RespostaUsuario = {
        questaoId: questao.id,
        alternativaEscolhida,
        acertou,
        respondidaEm,
      };

      setEstado((atual) => ({
        ...atual,
        respostas: {
          ...atual.respostas,
          [questao.id]: resposta,
        },
      }));

      const { error } = await supabase
        .from("question_answers")
        .upsert(
          {
            user_id: user.id,
            questao_id: questao.id,
            resposta: alternativaEscolhida,
            acertou,
            respondida_em: respondidaEm,
          },
          {
            onConflict: "user_id,questao_id",
          },
        );

      if (error) {
        console.error("Erro ao salvar resposta:", error);

        setEstado((atual) => {
          const respostas = { ...atual.respostas };
          delete respostas[questao.id];

          return {
            ...atual,
            respostas,
          };
        });
      }

      return resultadoConsumo;
    },
    [],
  );

  const alternarFavorita = useCallback(
    async (questaoId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const favorita = estado.favoritas.includes(questaoId);

      if (favorita) {
        setEstado((atual) => ({
          ...atual,
          favoritas: atual.favoritas.filter(
            (id) => id !== questaoId,
          ),
        }));

        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("questao_id", questaoId);

        if (error) {
          console.error("Erro ao remover favorita:", error);
        }
      } else {
        setEstado((atual) => ({
          ...atual,
          favoritas: [...atual.favoritas, questaoId],
        }));

        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          questao_id: questaoId,
        });

        if (error) {
          console.error("Erro ao salvar favorita:", error);
        }
      }
    },
    [estado.favoritas],
  );

  const salvarAnotacao = useCallback(
    async (questaoId: string, texto: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const textoLimpo = texto.trim();

      if (!textoLimpo) {
        setEstado((atual) => {
          const anotacoes = { ...atual.anotacoes };
          delete anotacoes[questaoId];

          return {
            ...atual,
            anotacoes,
          };
        });

        await supabase
          .from("annotations")
          .delete()
          .eq("user_id", user.id)
          .eq("questao_id", questaoId);

        return;
      }

      setEstado((atual) => ({
        ...atual,
        anotacoes: {
          ...atual.anotacoes,
          [questaoId]: textoLimpo,
        },
      }));

      const { error } = await supabase
        .from("annotations")
        .upsert(
          {
            user_id: user.id,
            questao_id: questaoId,
            texto: textoLimpo,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,questao_id",
          },
        );

      if (error) {
        console.error("Erro ao salvar anotação:", error);
      }
    },
    [],
  );

  const limparResposta = useCallback(async (questaoId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEstado((atual) => {
      const respostas = { ...atual.respostas };
      delete respostas[questaoId];

      return {
        ...atual,
        respostas,
      };
    });

    const { error } = await supabase
      .from("question_answers")
      .delete()
      .eq("user_id", user.id)
      .eq("questao_id", questaoId);

    if (error) {
      console.error("Erro ao limpar resposta:", error);
    }
  }, []);

  const estaFavorita = useCallback(
    (questaoId: string) =>
      estado.favoritas.includes(questaoId),
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