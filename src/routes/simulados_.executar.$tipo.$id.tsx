import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { gerarUrlImagemB2 } from "@/lib/b2.functions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute(
  "/simulados_/executar/$tipo/$id",
)({
  head: () => ({
    meta: [
      { title: "Simulado — QBMed" },
      {
        name: "description",
        content: "Execução de simulado do QBMed.",
      },
    ],
  }),
  component: ExecutarSimuladoPage,
});

type TipoSimulado = "oficial" | "pessoal";

type QuestaoSimulado = {
  id: number;
  enunciado: string;
  alternativas: Record<string, string>;
  resposta_correta: "A" | "B" | "C" | "D" | "E";
  explicacao: string | null;
  especialidade: string;
  subespecialidade: string | null;
  tema: string | null;
  instituicao: string | null;
  ano: number | null;
  prova: string | null;
  dificuldade: "Fácil" | "Média" | "Difícil" | null;
  tags: string[] | null;
  imagem_url: string | null;
};

type QuestaoComResposta = QuestaoSimulado & {
  ordem: number;
  resposta: string | null;
  acertou: boolean | null;
};

type SimuladoInfo = {
  id: number;
  nome: string;
  descricao?: string | null;
  duracao_minutos?: number;
};

function ExecutarSimuladoPage() {
  const navigate = useNavigate();
  const { tipo, id } = Route.useParams();

  const tipoSimulado: TipoSimulado =
    tipo === "pessoal" ? "pessoal" : "oficial";

  const simuladoId = Number(id);

  const [simulado, setSimulado] =
    useState<SimuladoInfo | null>(null);

  const [questoes, setQuestoes] = useState<
    QuestaoComResposta[]
  >([]);

  const [indiceAtual, setIndiceAtual] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [imagemUrl, setImagemUrl] = useState<string | null>(
    null,
  );

  const [carregandoImagem, setCarregandoImagem] =
    useState(false);

  const [tempoRestante, setTempoRestante] = useState<
    number | null
  >(null);

  const questaoAtual = questoes[indiceAtual];

  const respostaAtual = questaoAtual?.resposta ?? null;

  const respondida = respostaAtual !== null;

  useEffect(() => {
    async function carregarSimulado() {
      setCarregando(true);

      try {
        if (!Number.isFinite(simuladoId)) {
          toast.error("Simulado inválido.");
          void navigate({ to: "/simulados" });
          return;
        }

        let info: SimuladoInfo | null = null;

        let questaoIds: {
          questao_id: number;
          ordem: number;
        }[] = [];

        const respostasSalvas: Record<
          number,
          {
            resposta: string | null;
            acertou: boolean | null;
          }
        > = {};

        if (tipoSimulado === "oficial") {
          const { data: simuladoData, error: simuladoError } =
            await supabase
              .from("simulados")
              .select(
                "id, nome, descricao, duracao_minutos",
              )
              .eq("id", simuladoId)
              .eq("ativo", true)
              .single();

          if (simuladoError) {
            console.error(simuladoError);

            throw new Error(
              "Não foi possível carregar o simulado.",
            );
          }

          info = simuladoData;

          const {
            data: questoesData,
            error: questoesError,
          } = await supabase
            .from("simulado_questoes")
            .select("questao_id, ordem")
            .eq("simulado_id", simuladoId)
            .order("ordem", { ascending: true });

          if (questoesError) {
            console.error(questoesError);

            throw new Error(
              "Não foi possível carregar as questões.",
            );
          }

          questaoIds = questoesData ?? [];
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            toast.error(
              "Você precisa estar logado para acessar seus simulados.",
            );

            void navigate({ to: "/auth" });
            return;
          }

          const {
            data: simuladoData,
            error: simuladoError,
          } = await supabase
            .from("simulados_usuario")
            .select(
              "id, nome, quantidade_questoes, questao_atual, status",
            )
            .eq("id", simuladoId)
            .eq("user_id", user.id)
            .single();

          if (simuladoError) {
            console.error(simuladoError);

            throw new Error(
              "Não foi possível carregar seu simulado.",
            );
          }

          info = {
            id: simuladoData.id,
            nome: simuladoData.nome,
          };

          const {
            data: questoesData,
            error: questoesError,
          } = await supabase
            .from("simulado_usuario_questoes")
            .select(
              "questao_id, ordem, resposta, acertou",
            )
            .eq("simulado_usuario_id", simuladoId)
            .order("ordem", { ascending: true });

          if (questoesError) {
            console.error(questoesError);

            throw new Error(
              "Não foi possível carregar as questões.",
            );
          }

          questaoIds = (questoesData ?? []).map((item) => ({
            questao_id: item.questao_id,
            ordem: item.ordem,
          }));

          for (const item of questoesData ?? []) {
            respostasSalvas[item.questao_id] = {
              resposta: item.resposta,
              acertou: item.acertou,
            };
          }

          const questaoAtualSalva =
            simuladoData.questao_atual ?? 0;

          setIndiceAtual(
            Math.min(
              questaoAtualSalva,
              Math.max(
                (questoesData?.length ?? 1) - 1,
                0,
              ),
            ),
          );
        }

        setSimulado(info);

        if (questaoIds.length === 0) {
          throw new Error(
            "Este simulado ainda não possui questões.",
          );
        }

        const ids = questaoIds.map(
          (item) => item.questao_id,
        );

        const {
          data: questoesData,
          error: questoesError,
        } = await supabase
          .from("questions")
          .select(
            `
              id,
              enunciado,
              alternativas,
              resposta_correta,
              explicacao,
              especialidade,
              subespecialidade,
              tema,
              instituicao,
              ano,
              prova,
              dificuldade,
              tags,
              imagem_url
            `,
          )
          .in("id", ids);

        if (questoesError) {
          console.error(questoesError);

          throw new Error(
            "Não foi possível carregar o conteúdo das questões.",
          );
        }

        const mapaQuestoes = new Map(
          (questoesData ?? []).map((questao) => [
            questao.id,
            questao,
          ]),
        );

        const listaOrdenada: QuestaoComResposta[] = [];

        for (const item of questaoIds) {
          const questao = mapaQuestoes.get(
            item.questao_id,
          );

          if (!questao) continue;

          const respostaSalva =
            respostasSalvas[item.questao_id];

          listaOrdenada.push({
            ...questao,
            ordem: item.ordem,
            resposta: respostaSalva?.resposta ?? null,
            acertou: respostaSalva?.acertou ?? null,
          });
        }

        setQuestoes(listaOrdenada);

        if (
          tipoSimulado === "oficial" &&
          info?.duracao_minutos
        ) {
          setTempoRestante(
            info.duracao_minutos * 60,
          );
        }
      } catch (erro) {
        console.error(erro);

        toast.error(
          erro instanceof Error
            ? erro.message
            : "Erro ao carregar o simulado.",
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregarSimulado();
  }, [navigate, simuladoId, tipoSimulado]);

  useEffect(() => {
    const questao = questaoAtual;

    if (!questao) {
      setImagemUrl(null);
      return;
    }

    let ativo = true;

    async function carregarImagem() {
      if (!questao.imagem_url) {
        setImagemUrl(null);
        return;
      }

      try {
        setCarregandoImagem(true);

        const resultado = await gerarUrlImagemB2({
          data: {
            nomeArquivo: questao.imagem_url,
          },
        });

        if (ativo && resultado.sucesso) {
          setImagemUrl(resultado.url);
        }
      } catch (erro) {
        console.error(
          "Erro ao carregar imagem da questão:",
          erro,
        );

        if (ativo) {
          setImagemUrl(null);
        }
      } finally {
        if (ativo) {
          setCarregandoImagem(false);
        }
      }
    }

    void carregarImagem();

    return () => {
      ativo = false;
    };
  }, [questaoAtual]);

  useEffect(() => {
    if (
      tipoSimulado !== "oficial" ||
      tempoRestante === null
    ) {
      return;
    }

    if (tempoRestante <= 0) {
      toast.error("O tempo do simulado acabou.");
      void finalizarSimulado();

      return;
    }

    const intervalo = window.setInterval(() => {
      setTempoRestante((tempo) =>
        tempo === null
          ? null
          : Math.max(tempo - 1, 0),
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [tempoRestante, tipoSimulado]);

  function formatarTempo(segundos: number) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;

    return `${String(minutos).padStart(2, "0")}:${String(
      segundosRestantes,
    ).padStart(2, "0")}`;
  }

  async function selecionarAlternativa(
    letra: string,
  ) {
    if (!questaoAtual) return;

    setQuestoes((lista) =>
      lista.map((questao) =>
        questao.id === questaoAtual.id
          ? {
              ...questao,
              resposta: letra,
            }
          : questao,
      ),
    );

    if (tipoSimulado === "pessoal") {
      setSalvando(true);

      try {
        const { error } = await supabase
          .from("simulado_usuario_questoes")
          .update({
            resposta: letra,
            respondida_em: new Date().toISOString(),
          })
          .eq("simulado_usuario_id", simuladoId)
          .eq("questao_id", questaoAtual.id);

        if (error) {
          console.error(error);

          toast.error(
            "Não foi possível salvar sua resposta.",
          );
        }
      } catch (erro) {
        console.error(erro);

        toast.error(
          "Não foi possível salvar sua resposta.",
        );
      } finally {
        setSalvando(false);
      }
    }
  }

  async function irParaQuestao(indice: number) {
    if (
      indice < 0 ||
      indice >= questoes.length
    ) {
      return;
    }

    setIndiceAtual(indice);

    if (tipoSimulado === "pessoal") {
      const { error } = await supabase
        .from("simulados_usuario")
        .update({
          questao_atual: indice,
        })
        .eq("id", simuladoId);

      if (error) {
        console.error(error);
      }
    }
  }

  async function finalizarSimulado() {
  if (questoes.length === 0) {
    return;
  }

  const respostas: Record<string, string | null> = {};
  const corretas: Record<string, string> = {};

  for (const questao of questoes) {
    respostas[String(questao.id)] = questao.resposta;
    corretas[String(questao.id)] = questao.resposta_correta;
  }

  const resultado = {
    nome: simulado?.nome ?? "Simulado",
    tipo: tipoSimulado,
    total: questoes.length,
    respostas,
    corretas,
  };

  const chave = `qbmed-resultado-simulado-${tipoSimulado}-${simuladoId}`;

  sessionStorage.setItem(
    chave,
    JSON.stringify(resultado),
  );

  if (tipoSimulado === "pessoal") {
    const { error } = await supabase
      .from("simulados_usuario")
      .update({
        status: "Concluído",
        questao_atual: questoes.length,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", simuladoId);

    if (error) {
      console.error(error);

      toast.error(
        "Não foi possível finalizar o simulado.",
      );

      return;
    }
  }

  toast.success("Simulado finalizado!");

  void navigate({
    to: "/simulados/resultado/$tipo/$id",
    params: {
      tipo: tipoSimulado,
      id: String(simuladoId),
    },
  });
}

  if (carregando) {
    return (
      <AppShell
        titulo="Simulado"
        descricao="Carregando questões..."
      >
        <Card>
          <CardContent className="flex min-h-60 items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" />

            <span className="text-sm text-muted-foreground">
              Carregando simulado...
            </span>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  if (!simulado || !questaoAtual) {
    return (
      <AppShell
        titulo="Simulado"
        descricao="Não foi possível carregar este simulado."
      >
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <h2 className="font-semibold">
              Simulado indisponível
            </h2>

            <p className="text-sm text-muted-foreground">
              Não encontramos questões para este simulado.
            </p>

            <Button
              onClick={() =>
                void navigate({
                  to: "/simulados",
                })
              }
            >
              Voltar para simulados
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const questoesRespondidas = questoes.filter(
    (questao) => questao.resposta !== null,
  ).length;

  return (
    <AppShell
      titulo={simulado.nome}
      descricao={
        tipoSimulado === "oficial"
          ? "Simulado oficial"
          : "Simulado personalizado"
      }
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
          <main className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm font-medium">
                    Questão {indiceAtual + 1} de{" "}
                    {questoes.length}
                  </p>

                  <span className="text-xs text-muted-foreground">
                    {questoesRespondidas} respondida
                    {questoesRespondidas === 1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted sm:w-80">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        ((indiceAtual + 1) /
                          questoes.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {tipoSimulado === "oficial" &&
              tempoRestante !== null ? (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold",
                    tempoRestante <= 300
                      ? "border-destructive text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  <Clock className="size-4" />
                  {formatarTempo(tempoRestante)}
                </div>
              ) : null}
            </div>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {questaoAtual.id}
                  </Badge>

                  <Badge className="bg-primary text-primary-foreground">
                    {questaoAtual.especialidade}
                  </Badge>

                  {questaoAtual.instituicao ? (
                    <Badge variant="outline">
                      {questaoAtual.instituicao}
                    </Badge>
                  ) : null}

                  {questaoAtual.ano ? (
                    <Badge variant="outline">
                      {questaoAtual.ano}
                    </Badge>
                  ) : null}

                  {questaoAtual.dificuldade ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        questaoAtual.dificuldade ===
                          "Fácil" &&
                          "border-success text-success",
                        questaoAtual.dificuldade ===
                          "Média" &&
                          "border-warning text-warning",
                        questaoAtual.dificuldade ===
                          "Difícil" &&
                          "border-destructive text-destructive",
                      )}
                    >
                      {questaoAtual.dificuldade}
                    </Badge>
                  ) : null}
                </div>

                <p className="text-base leading-relaxed text-foreground">
                  {questaoAtual.enunciado}
                </p>

                {questaoAtual.imagem_url ? (
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    {carregandoImagem ? (
                      <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Carregando imagem...
                      </div>
                    ) : imagemUrl ? (
                      <img
                        src={imagemUrl}
                        alt="Imagem da questão"
                        className="mx-auto max-h-[600px] w-auto max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">
                        Não foi possível carregar a imagem.
                      </div>
                    )}
                  </div>
                ) : null}

                {questaoAtual.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {questaoAtual.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(
                    questaoAtual.alternativas,
                  )
                    .filter(
                      ([, texto]) =>
                        typeof texto === "string" &&
                        texto.trim() !== "",
                    )
                    .sort(([a], [b]) =>
                      a.localeCompare(b),
                    )
                    .map(([letra, texto]) => {
                      const escolhida =
                        respostaAtual === letra;

                      return (
                        <button
                          key={letra}
                          type="button"
                          onClick={() =>
                            void selecionarAlternativa(
                              letra,
                            )
                          }
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                            "border-border hover:border-accent hover:bg-accent/5",
                            escolhida &&
                              "border-primary bg-primary/10",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                              escolhida &&
                                "border-primary bg-primary text-primary-foreground",
                            )}
                          >
                            {letra}
                          </span>

                          <span className="pt-1">
                            {texto}
                          </span>
                        </button>
                      );
                    })}
                </div>

                {salvando ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Salvando resposta...
                  </div>
                ) : null}

                <Separator />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    disabled={indiceAtual === 0}
                    onClick={() =>
                      void irParaQuestao(
                        indiceAtual - 1,
                      )
                    }
                  >
                    <ChevronLeft className="mr-2 size-4" />
                    Anterior
                  </Button>

                  {indiceAtual ===
                  questoes.length - 1 ? (
                    <Button
                      onClick={() =>
                        void finalizarSimulado()
                      }
                    >
                      Finalizar simulado
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        void irParaQuestao(
                          indiceAtual + 1,
                        )
                      }
                    >
                      Próxima questão
                      <ChevronRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      Questões
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {questoesRespondidas} de{" "}
                      {questoes.length} respondidas
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questoes.map((questao, indice) => {
                    const respondida =
                      questao.resposta !== null;

                    const atual =
                      indice === indiceAtual;

                    return (
                      <button
                        key={questao.id}
                        type="button"
                        onClick={() =>
                          void irParaQuestao(indice)
                        }
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                          atual &&
                            "border-primary bg-primary text-primary-foreground",
                          !atual &&
                            respondida &&
                            "border-success bg-success/15 text-success hover:bg-success/25",
                          !atual &&
                            !respondida &&
                            "border-border bg-background text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-foreground",
                        )}
                      >
                        {indice + 1}
                      </button>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-sm bg-primary" />
                    Questão atual
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-sm bg-success/40" />
                    Respondida
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-sm border border-border" />
                    Não respondida
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}