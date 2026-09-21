import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleAlert,
  Home,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { gerarUrlImagemB2 } from "@/lib/b2.functions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute(
  "/simulados_/resultado/$tipo/$id",
)({
  head: () => ({
    meta: [
      { title: "Resultado do simulado — QBMed" },
      {
        name: "description",
        content: "Resultado do simulado do QBMed.",
      },
    ],
  }),
  component: ResultadoSimuladoPage,
});

type ResultadoSalvo = {
  nome: string;
  tipo: "oficial" | "pessoal";
  total: number;
  ordem: number[];
  respostas: Record<string, string | null>;
  corretas: Record<string, string>;
};

type QuestaoResultado = {
  id: number;
  enunciado: string;
  alternativas: Record<string, string>;
  resposta_correta: string;
  explicacao: string | null;
  especialidade: string;
  tema: string | null;
  instituicao: string | null;
  ano: number | null;
  imagem_url: string | null;
};

function ResultadoSimuladoPage() {
  const navigate = useNavigate();
  const { tipo, id } = Route.useParams();

  const [resultado, setResultado] =
    useState<ResultadoSalvo | null>(null);

  const [questoes, setQuestoes] = useState<
    QuestaoResultado[]
  >([]);

  const [carregandoQuestoes, setCarregandoQuestoes] =
    useState(false);

  const [questaoSelecionada, setQuestaoSelecionada] =
    useState(0);

  const [imagemUrl, setImagemUrl] = useState<string | null>(
    null,
  );

  const [carregandoImagem, setCarregandoImagem] =
    useState(false);

  useEffect(() => {
    try {
      const chave = `qbmed-resultado-simulado-${tipo}-${id}`;

      const salvo = sessionStorage.getItem(chave);

      if (!salvo) {
        return;
      }

      const dados = JSON.parse(salvo) as ResultadoSalvo;

      setResultado(dados);
    } catch (erro) {
      console.error(
        "Erro ao carregar resultado do simulado:",
        erro,
      );
    }
  }, [id, tipo]);

  useEffect(() => {
    async function carregarQuestoes() {
      if (!resultado) return;

      const ids = resultado.ordem;

      if (ids.length === 0) {
        return;
      }

      setCarregandoQuestoes(true);

      try {
        const { data, error } = await supabase
          .from("questions")
          .select(
            `
              id,
              enunciado,
              alternativas,
              resposta_correta,
              explicacao,
              especialidade,
              tema,
              instituicao,
              ano,
              imagem_url
            `,
          )
          .in("id", ids);

        if (error) {
          console.error(error);
          return;
        }

        const mapa = new Map(
          (data ?? []).map((questao) => [
            questao.id,
            questao,
          ]),
        );

        const ordemOriginal: QuestaoResultado[] = [];

        for (const idQuestao of ids) {
          const questao = mapa.get(idQuestao);

          if (questao) {
            ordemOriginal.push(questao);
          }
        }

        setQuestoes(ordemOriginal);
      } catch (erro) {
        console.error(
          "Erro ao carregar questões do resultado:",
          erro,
        );
      } finally {
        setCarregandoQuestoes(false);
      }
    }

    void carregarQuestoes();
  }, [resultado]);

  const questaoAtual =
    questoes[questaoSelecionada] ?? null;

  useEffect(() => {
    if (!questaoAtual?.imagem_url) {
      setImagemUrl(null);
      setCarregandoImagem(false);
      return;
    }

    let ativo = true;

    async function carregarImagem() {
      try {
        setCarregandoImagem(true);
        setImagemUrl(null);

        const resultadoImagem =
          await gerarUrlImagemB2({
            data: {
              nomeArquivo: questaoAtual.imagem_url!,
            },
          });

        if (
          ativo &&
          resultadoImagem.sucesso &&
          resultadoImagem.url
        ) {
          setImagemUrl(resultadoImagem.url);
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

  if (!resultado) {
    return (
      <AppShell
        titulo="Resultado"
        descricao="Resultado do simulado"
      >
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <h2 className="text-lg font-semibold">
              Resultado não encontrado
            </h2>

            <p className="text-sm text-muted-foreground">
              Não encontramos os dados deste resultado.
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

  const questoesResultado = Object.entries(
    resultado.respostas,
  );

  let acertadas = 0;
  let respondidas = 0;

  for (const [questaoId, resposta] of questoesResultado) {
    if (resposta !== null) {
      respondidas += 1;

      if (resposta === resultado.corretas[questaoId]) {
        acertadas += 1;
      }
    }
  }

  const erradas = respondidas - acertadas;
  const naoRespondidas = resultado.total - respondidas;

  const percentual =
    resultado.total > 0
      ? Math.round((acertadas / resultado.total) * 100)
      : 0;

  let respostaUsuario: string | null = null;
  let respostaCorreta: string | null = null;
  let naoRespondida = false;
  let acertou = false;

  if (questaoAtual) {
    respostaUsuario =
      resultado.respostas[String(questaoAtual.id)] ?? null;

    respostaCorreta =
      resultado.corretas[String(questaoAtual.id)] ??
      questaoAtual.resposta_correta;

    naoRespondida = respostaUsuario === null;

    acertou =
      !naoRespondida &&
      respostaUsuario === respostaCorreta;
  }

  return (
    <AppShell
      titulo="Resultado do simulado"
      descricao={resultado.nome}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 pb-4 text-center">
            <p className="text-sm text-muted-foreground">
              Simulado finalizado
            </p>

            <h2 className="text-2xl font-bold">
              {resultado.nome}
            </h2>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aproveitamento
              </p>

              <p className="mt-2 text-5xl font-bold text-primary">
                {percentual}%
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                {acertadas} de {resultado.total} questões
                acertadas
              </p>

              <Progress
                value={percentual}
                className="mt-5 h-3"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-success" />

                  <span className="text-sm font-medium">
                    Acertos
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {acertadas}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CircleAlert className="size-5 text-destructive" />

                  <span className="text-sm font-medium">
                    Erros
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {erradas}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CircleAlert className="size-5 text-muted-foreground" />

                  <span className="text-sm font-medium">
                    Não respondidas
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold">
                  {naoRespondidas}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  void navigate({
                    to: "/simulados",
                  })
                }
              >
                <Home className="mr-2 size-4" />
                Voltar para simulados
              </Button>

              <Button
                onClick={() =>
                  void navigate({
                    to: "/simulados/executar/$tipo/$id",
                    params: {
                      tipo,
                      id,
                    },
                  })
                }
              >
                <RotateCcw className="mr-2 size-4" />
                Ver simulado novamente
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">
              Revisão das questões
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Clique em uma questão para revisar sua resposta.
            </p>
          </div>

          {carregandoQuestoes ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Carregando questões...
              </CardContent>
            </Card>
          ) : null}

          {!carregandoQuestoes &&
          questoes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Não foi possível carregar as questões da revisão.
              </CardContent>
            </Card>
          ) : null}

          {questoes.length > 0 ? (
            <>
              <Card>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-sm bg-success" />
                      Acertou
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-sm bg-destructive" />
                      Errou
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-sm bg-muted-foreground/40" />
                      Não respondida
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {questoes.map((questao, indice) => {
                      const resposta =
                        resultado.respostas[
                          String(questao.id)
                        ];

                      const correta =
                        resultado.corretas[
                          String(questao.id)
                        ] ?? questao.resposta_correta;

                      const naoRespondida =
                        resposta === null ||
                        resposta === undefined;

                      const acertou =
                        !naoRespondida &&
                        resposta === correta;

                      return (
                        <button
                          key={questao.id}
                          type="button"
                          onClick={() =>
                            setQuestaoSelecionada(indice)
                          }
                          className={cn(
                            "flex size-10 items-center justify-center rounded-md border text-sm font-semibold transition-all",
                            "hover:scale-105",
                            acertou &&
                              "border-success bg-success text-success-foreground",
                            !acertou &&
                              !naoRespondida &&
                              "border-destructive bg-destructive text-destructive-foreground",
                            naoRespondida &&
                              "border-border bg-muted text-muted-foreground",
                            indice === questaoSelecionada &&
                              "ring-2 ring-primary ring-offset-2",
                          )}
                        >
                          {indice + 1}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {questaoAtual ? (
                <Card
                  className={cn(
                    "overflow-hidden",
                    acertou && "border-success/50",
                    !acertou &&
                      !naoRespondida &&
                      "border-destructive/50",
                  )}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold">
                          Questão {questaoSelecionada + 1}
                        </span>

                        {acertou ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="size-3.5" />
                            Acertou
                          </span>
                        ) : naoRespondida ? (
                          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            Não respondida
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            <CircleAlert className="size-3.5" />
                            Errou
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-muted-foreground">
                        ID {questaoAtual.id}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                        {questaoAtual.especialidade}
                      </span>

                      {questaoAtual.tema ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {questaoAtual.tema}
                        </span>
                      ) : null}

                      {questaoAtual.instituicao ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {questaoAtual.instituicao}
                        </span>
                      ) : null}

                      {questaoAtual.ano ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {questaoAtual.ano}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-base leading-relaxed">
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
                          const ehCorreta =
                            letra === respostaCorreta;

                          const foiMarcada =
                            letra === respostaUsuario;

                          const marcouErrada =
                            foiMarcada && !ehCorreta;

                          return (
                            <div
                              key={letra}
                              className={cn(
                                "flex items-start gap-3 rounded-lg border p-3 text-sm",
                                "border-border bg-background",
                                ehCorreta &&
                                  "border-success bg-success/10",
                                marcouErrada &&
                                  "border-destructive bg-destructive/10",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                                  ehCorreta &&
                                    "border-success bg-success text-success-foreground",
                                  marcouErrada &&
                                    "border-destructive bg-destructive text-destructive-foreground",
                                  !ehCorreta &&
                                    !marcouErrada &&
                                    "border-border",
                                )}
                              >
                                {letra}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="pt-1">
                                  {texto}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {ehCorreta ? (
                                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                                      Resposta correta
                                    </span>
                                  ) : null}

                                  {marcouErrada ? (
                                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                                      Sua resposta
                                    </span>
                                  ) : null}

                                  {ehCorreta &&
                                  foiMarcada ? (
                                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                                      Sua resposta
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {questaoAtual.explicacao ? (
                      <>
                        <Separator />

                        <div className="rounded-lg bg-muted/40 p-4">
                          <p className="mb-2 text-sm font-semibold">
                            Resolução
                          </p>

                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {questaoAtual.explicacao}
                          </p>
                        </div>
                      </>
                    ) : null}

                    <Separator />

                    <div className="flex items-center justify-between gap-3">
                      <Button
                        variant="outline"
                        disabled={questaoSelecionada === 0}
                        onClick={() =>
                          setQuestaoSelecionada(
                            (atual) => atual - 1,
                          )
                        }
                      >
                        Anterior
                      </Button>

                      <span className="text-sm text-muted-foreground">
                        {questaoSelecionada + 1} de{" "}
                        {questoes.length}
                      </span>

                      <Button
                        variant="outline"
                        disabled={
                          questaoSelecionada ===
                          questoes.length - 1
                        }
                        onClick={() =>
                          setQuestaoSelecionada(
                            (atual) => atual + 1,
                          )
                        }
                      >
                        Próxima
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}