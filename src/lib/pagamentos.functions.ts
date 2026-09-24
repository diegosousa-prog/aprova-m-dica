import { createServerFn } from "@tanstack/react-start";

import { createSupabaseServerClient } from "./supabase.server";

export const prepararAssinaturaPremium = createServerFn({
  method: "POST",
}).handler(async () => {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();

  if (erroUsuario || !user) {
    return {
      sucesso: false,
      erro: "Usuário não autenticado.",
    };
  }

  const { data: plano, error: erroPlano } =
    await supabase
      .from("planos")
      .select(
        "id, codigo, nome, descricao, valor, periodicidade",
      )
      .eq("codigo", "premium")
      .eq("ativo", true)
      .maybeSingle();

  if (erroPlano) {
    console.error(
      "Erro ao carregar plano Premium:",
      erroPlano,
    );

    return {
      sucesso: false,
      erro: "Não foi possível carregar o plano Premium.",
    };
  }

  if (!plano) {
    return {
      sucesso: false,
      erro: "Plano Premium não encontrado.",
    };
  }

  return {
    sucesso: true,
    plano,
    usuarioId: user.id,
  };
});