import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  Clock,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/simulados")({
  head: () => ({
    meta: [
      { title: "Simulados — QBMed" },
      {
        name: "description",
        content:
          "Simulados oficiais e simulados personalizados do QBMed.",
      },
    ],
  }),
  component: SimuladosPage,
});

type SimuladoOficial = {
  id: number;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  created_at: string;
};

type SimuladoUsuario = {
  id: number;
  nome: string;
  quantidade_questoes: number;
  status: string;
  questao_atual: number;
};

function SimuladosPage() {
  const navigate = useNavigate();

  const [simuladosOficiais, setSimuladosOficiais] = useState<
    SimuladoOficial[]
  >([]);

  const [meusSimulados, setMeusSimulados] = useState<
    SimuladoUsuario[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(
    null,
  );

  async function carregarDados() {
    setCarregando(true);

    const { data: oficiais, error: erroOficiais } =
      await supabase
        .from("simulados")
        .select(
          "id, nome, descricao, duracao_minutos, created_at",
        )
        .eq("ativo", true)
        .order("created_at", { ascending: false });

    if (erroOficiais) {
      console.error(erroOficiais);
      toast.error("Erro ao carregar os simulados.");
    } else {
      setSimuladosOficiais(oficiais ?? []);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: perfil, error: erroPerfil } =
        await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

      if (erroPerfil) {
        console.error(erroPerfil);
        setIsAdmin(false);
      } else {
        setIsAdmin(perfil?.is_admin === true);
      }

      const {
        data: pessoais,
        error: erroPessoais,
      } = await supabase
        .from("simulados_usuario")
        .select(
          "id, nome, quantidade_questoes, status, questao_atual",
        )
        .order("criado_em", { ascending: false });

      if (erroPessoais) {
        console.error(erroPessoais);
        toast.error("Erro ao carregar seus simulados.");
      } else {
        setMeusSimulados(pessoais ?? []);
      }
    } else {
      setIsAdmin(false);
    }

    setCarregando(false);
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  function criarSimulado() {
    void navigate({
      to: "/simulados/criar",
    });
  }

  function criarSimuladoOficial() {
    window.location.assign("/simulados/admin/criar");
  }

  function iniciarSimulado(id: number) {
    void navigate({
      to: "/simulados/executar/$tipo/$id",
      params: {
        tipo: "oficial",
        id: String(id),
      },
    });
  }

  function continuarSimulado(id: number) {
    void navigate({
      to: "/simulados/executar/$tipo/$id",
      params: {
        tipo: "pessoal",
        id: String(id),
      },
    });
  }

  function verDesempenho(id: number) {
    void navigate({
      to: "/simulados/resultado/$tipo/$id",
      params: {
        tipo: "pessoal",
        id: String(id),
      },
    });
  }

  async function refazerSimulado(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja refazer este simulado? Todas as respostas serão apagadas.",
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(id);

    const { error: erroQuestoes } = await supabase
      .from("simulado_usuario_questoes")
      .update({
        resposta: null,
        acertou: null,
        respondida_em: null,
      })
      .eq("simulado_usuario_id", id);

    if (erroQuestoes) {
      console.error(erroQuestoes);
      toast.error("Não foi possível zerar as respostas.");
      setProcessandoId(null);
      return;
    }

    const { error: erroSimulado } = await supabase
      .from("simulados_usuario")
      .update({
        status: "Em andamento",
        questao_atual: 0,
        iniciado_em: new Date().toISOString(),
        concluido_em: null,
      })
      .eq("id", id);

    if (erroSimulado) {
      console.error(erroSimulado);
      toast.error("Não foi possível reiniciar o simulado.");
      setProcessandoId(null);
      return;
    }

    setMeusSimulados((simulados) =>
      simulados.map((simulado) =>
        simulado.id === id
          ? {
              ...simulado,
              status: "Em andamento",
              questao_atual: 0,
            }
          : simulado,
      ),
    );

    toast.success("Simulado zerado. Bom estudo!");

    setProcessandoId(null);

    void navigate({
      to: "/simulados/executar/$tipo/$id",
      params: {
        tipo: "pessoal",
        id: String(id),
      },
    });
  }

  async function excluirSimulado(id: number) {
    const confirmou = window.confirm(
      "Tem certeza que deseja excluir este simulado? Essa ação não pode ser desfeita.",
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(id);

    const { error } = await supabase
      .from("simulados_usuario")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("Não foi possível excluir o simulado.");
      setProcessandoId(null);
      return;
    }

    setMeusSimulados((simulados) =>
      simulados.filter((simulado) => simulado.id !== id),
    );

    toast.success("Simulado excluído.");

    setProcessandoId(null);
  }

  return (
    <AppShell
      titulo="Simulados"
      descricao="Treine em condições de prova ou crie seu próprio simulado."
    >
      <div className="mb-6 flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Crie seu próprio simulado
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Escolha a quantidade de questões e os filtros que
            deseja estudar.
          </p>
        </div>

        <Button onClick={criarSimulado}>
          <Plus className="mr-2 size-4" />
          Criar simulado
        </Button>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Simulados disponíveis
              </h2>

              <p className="text-sm text-muted-foreground">
                Provas oficiais disponibilizadas pela
                administração.
              </p>
            </div>

            {isAdmin ? (
              <Button onClick={criarSimuladoOficial}>
                <Plus className="mr-2 size-4" />
                Criar simulado
              </Button>
            ) : null}
          </div>

          {carregando ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Carregando simulados...
              </CardContent>
            </Card>
          ) : simuladosOficiais.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="mx-auto mb-3 size-10 text-muted-foreground" />

                <h3 className="font-semibold">
                  Nenhum simulado disponível
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Os simulados oficiais aparecerão aqui quando
                  forem publicados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {simuladosOficiais.map((simulado) => (
                <Card key={simulado.id}>
                  <CardContent className="space-y-4 p-6">
                    <Badge>Simulado oficial</Badge>

                    <div>
                      <h3 className="text-lg font-semibold">
                        {simulado.nome}
                      </h3>

                      {simulado.descricao && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {simulado.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-4" />

                        {new Intl.DateTimeFormat(
                          "pt-BR",
                        ).format(
                          new Date(simulado.created_at),
                        )}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock className="size-4" />

                        {simulado.duracao_minutos} min
                      </span>
                    </div>

                    <Button
                      onClick={() =>
                        iniciarSimulado(simulado.id)
                      }
                    >
                      <Play className="mr-2 size-4" />
                      Iniciar simulado
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Meus simulados
            </h2>

            <p className="text-sm text-muted-foreground">
              Simulados personalizados criados por você.
            </p>
          </div>

          {meusSimulados.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plus className="mx-auto mb-3 size-10 text-muted-foreground" />

                <h3 className="font-semibold">
                  Você ainda não criou nenhum simulado
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Clique em "Criar simulado" para começar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {meusSimulados.map((simulado) => {
                const processando =
                  processandoId === simulado.id;

                return (
                  <Card key={simulado.id}>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          {simulado.nome}
                        </h3>

                        <Badge variant="secondary">
                          {simulado.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {simulado.questao_atual} de{" "}
                        {simulado.quantidade_questoes} questões
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {simulado.status === "Em andamento" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              continuarSimulado(
                                simulado.id,
                              )
                            }
                            disabled={processando}
                          >
                            <Play className="mr-2 size-4" />
                            Continuar
                          </Button>
                        )}

                        {simulado.status === "Concluído" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              verDesempenho(simulado.id)
                            }
                            disabled={processando}
                          >
                            <BarChart3 className="mr-2 size-4" />
                            Ver desempenho
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void refazerSimulado(
                              simulado.id,
                            )
                          }
                          disabled={processando}
                        >
                          <RotateCcw className="mr-2 size-4" />
                          Refazer
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            void excluirSimulado(
                              simulado.id,
                            )
                          }
                          disabled={processando}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Excluir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}