import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { QuestaoCard } from "@/components/questao-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { questaoDoDia } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard do aluno — QBMed" },
      {
        name: "description",
        content:
          "Acompanhe acertos, streak, questão do dia e progresso semanal no QBMed.",
      },
      {
        property: "og:title",
        content: "Dashboard do aluno — QBMed",
      },
      {
        property: "og:description",
        content: "Seu painel de estudos para a Residência Médica.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: Dashboard,
});

type Resposta = {
  acertou: boolean;
  respondida_em: string;
};

type AproveitamentoDia = {
  dia: string;
  aproveitamento: number;
  questoes: number;
};

type AproveitamentoMes = {
  mes: string;
  aproveitamento: number;
  questoes: number;
};

type SimuladoOficial = {
  id: number;
  nome: string;
  duracao_minutos: number;
  created_at: string;
  questoes: number;
};

function Dashboard() {
  const [carregando, setCarregando] = useState(true);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [totalAcertos, setTotalAcertos] = useState(0);
  const [questoesSemana, setQuestoesSemana] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recordeStreak, setRecordeStreak] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [aproveitamentoSemanal, setAproveitamentoSemanal] =
    useState<AproveitamentoDia[]>([]);
  const [aproveitamentoMensal, setAproveitamentoMensal] =
    useState<AproveitamentoMes[]>([]);
  const [simuladosOficiais, setSimuladosOficiais] = useState<
    SimuladoOficial[]
  >([]);

  useEffect(() => {
    async function carregarDados() {
      setCarregando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCarregando(false);
        return;
      }

      // ==================================================
      // VERIFICAR SE O USUÁRIO É ADMINISTRADOR
      // ==================================================

      const { data: perfil, error: erroPerfil } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (erroPerfil) {
        console.error(
          "ERRO AO VERIFICAR PERMISSÃO DE ADMIN:",
          erroPerfil,
        );
      }

      setIsAdmin(perfil?.is_admin === true);

      // ==================================================
      // CARREGAR RESPOSTAS
      // ==================================================

      const { data, error } = await supabase
        .from("question_answers")
        .select("acertou, respondida_em")
        .eq("user_id", user.id)
        .order("respondida_em", { ascending: true });

      if (error) {
        console.error(
          "ERRO AO CARREGAR DADOS DA DASHBOARD:",
          error,
        );
        setCarregando(false);
        return;
      }

      const respostas = (data ?? []) as Resposta[];

      // ==================================================
      // TOTAL DE QUESTÕES E ACERTOS
      // ==================================================

      const total = respostas.length;

      const acertos = respostas.filter(
        (resposta) => resposta.acertou,
      ).length;

      setTotalQuestoes(total);
      setTotalAcertos(acertos);

      // ==================================================
      // QUESTÕES DOS ÚLTIMOS 7 DIAS
      // ==================================================

      const agora = new Date();

      const limiteSemana = new Date(agora);

      limiteSemana.setHours(0, 0, 0, 0);
      limiteSemana.setDate(limiteSemana.getDate() - 6);

      const respostasSemana = respostas.filter((resposta) => {
        const dataResposta = new Date(resposta.respondida_em);

        return dataResposta >= limiteSemana;
      });

      setQuestoesSemana(respostasSemana.length);

      // ==================================================
      // APROVEITAMENTO DOS ÚLTIMOS 7 DIAS
      // ==================================================

      const nomesDias = [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb",
      ];

      const dadosSemana: AproveitamentoDia[] = [];

      for (let i = 0; i < 7; i++) {
        const dataDia = new Date(limiteSemana);

        dataDia.setDate(limiteSemana.getDate() + i);

        const inicioDia = new Date(dataDia);

        inicioDia.setHours(0, 0, 0, 0);

        const fimDia = new Date(dataDia);

        fimDia.setHours(23, 59, 59, 999);

        const respostasDoDia = respostas.filter((resposta) => {
          const dataResposta = new Date(resposta.respondida_em);

          return (
            dataResposta >= inicioDia &&
            dataResposta <= fimDia
          );
        });

        const quantidade = respostasDoDia.length;

        const acertosDoDia = respostasDoDia.filter(
          (resposta) => resposta.acertou,
        ).length;

        const aproveitamento =
          quantidade > 0
            ? Math.round(
                (acertosDoDia / quantidade) * 100,
              )
            : 0;

        dadosSemana.push({
          dia: nomesDias[dataDia.getDay()] ?? "",
          aproveitamento,
          questoes: quantidade,
        });
      }

      setAproveitamentoSemanal(dadosSemana);

      // ==================================================
      // APROVEITAMENTO DOS ÚLTIMOS 6 MESES
      // ==================================================

      const nomesMeses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      const dadosMensais: AproveitamentoMes[] = [];

      const inicioMesAtual = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1,
      );

      for (let i = 5; i >= 0; i--) {
        const dataMes = new Date(inicioMesAtual);

        dataMes.setMonth(dataMes.getMonth() - i);

        const inicioMes = new Date(
          dataMes.getFullYear(),
          dataMes.getMonth(),
          1,
        );

        const fimMes = new Date(
          dataMes.getFullYear(),
          dataMes.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );

        const respostasDoMes = respostas.filter((resposta) => {
          const dataResposta = new Date(resposta.respondida_em);

          return (
            dataResposta >= inicioMes &&
            dataResposta <= fimMes
          );
        });

        const quantidade = respostasDoMes.length;

        const acertosDoMes = respostasDoMes.filter(
          (resposta) => resposta.acertou,
        ).length;

        const aproveitamento =
          quantidade > 0
            ? Math.round(
                (acertosDoMes / quantidade) * 100,
              )
            : 0;

        dadosMensais.push({
          mes: nomesMeses[dataMes.getMonth()] ?? "",
          aproveitamento,
          questoes: quantidade,
        });
      }

      setAproveitamentoMensal(dadosMensais);

      // ==================================================
      // DIAS COM ATIVIDADE
      // ==================================================

      const diasComAtividade = new Set(
        respostas.map((resposta) => {
          const data = new Date(resposta.respondida_em);

          return `${data.getFullYear()}-${String(
            data.getMonth() + 1,
          ).padStart(2, "0")}-${String(
            data.getDate(),
          ).padStart(2, "0")}`;
        }),
      );

      const transformarData = (data: Date) =>
        `${data.getFullYear()}-${String(
          data.getMonth() + 1,
        ).padStart(2, "0")}-${String(
          data.getDate(),
        ).padStart(2, "0")}`;

      // ==================================================
      // STREAK ATUAL
      // ==================================================

      const hoje = new Date();

      hoje.setHours(0, 0, 0, 0);

      const ontem = new Date(hoje);

      ontem.setDate(ontem.getDate() - 1);

      let diaAtual = new Date(hoje);

      if (!diasComAtividade.has(transformarData(diaAtual))) {
        if (diasComAtividade.has(transformarData(ontem))) {
          diaAtual = ontem;
        } else {
          setStreak(0);
        }
      }

      if (
        diasComAtividade.has(transformarData(hoje)) ||
        diasComAtividade.has(transformarData(ontem))
      ) {
        let streakAtual = 0;

        while (
          diasComAtividade.has(transformarData(diaAtual))
        ) {
          streakAtual++;

          diaAtual.setDate(
            diaAtual.getDate() - 1,
          );
        }

        setStreak(streakAtual);
      }

      // ==================================================
      // RECORDE DE STREAK
      // ==================================================

      const diasOrdenados =
        Array.from(diasComAtividade).sort();

      let maiorStreak = 0;
      let streakAtual = 0;
      let dataAnterior: Date | null = null;

      for (const dia of diasOrdenados) {
        const dataAtual = new Date(
          `${dia}T00:00:00`,
        );

        if (!dataAnterior) {
          streakAtual = 1;
        } else {
          const diferenca =
            (dataAtual.getTime() -
              dataAnterior.getTime()) /
            (1000 * 60 * 60 * 24);

          if (diferenca === 1) {
            streakAtual++;
          } else {
            streakAtual = 1;
          }
        }

        maiorStreak = Math.max(
          maiorStreak,
          streakAtual,
        );

        dataAnterior = dataAtual;
      }

      setRecordeStreak(maiorStreak);

      // ==================================================
      // CARREGAR SIMULADOS OFICIAIS
      // ==================================================

      const {
        data: simulados,
        error: erroSimulados,
      } = await supabase
        .from("simulados")
        .select(
          "id, nome, duracao_minutos, created_at",
        )
        .eq("ativo", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      if (erroSimulados) {
        console.error(
          "ERRO AO CARREGAR SIMULADOS OFICIAIS:",
          erroSimulados,
        );
        setSimuladosOficiais([]);
      } else if (simulados && simulados.length > 0) {
        const idsSimulados = simulados.map(
          (simulado) => simulado.id,
        );

        const {
          data: questoesSimulados,
          error: erroQuestoesSimulados,
        } = await supabase
          .from("simulado_questoes")
          .select("simulado_id")
          .in("simulado_id", idsSimulados);

        if (erroQuestoesSimulados) {
          console.error(
            "ERRO AO CARREGAR QUESTÕES DOS SIMULADOS:",
            erroQuestoesSimulados,
          );

          setSimuladosOficiais(
            simulados.map((simulado) => ({
              id: simulado.id,
              nome: simulado.nome,
              duracao_minutos:
                simulado.duracao_minutos,
              created_at: simulado.created_at,
              questoes: 0,
            })),
          );
        } else {
          const quantidadePorSimulado =
            new Map<number, number>();

          for (const questao of questoesSimulados ?? []) {
            const atual =
              quantidadePorSimulado.get(
                questao.simulado_id,
              ) ?? 0;

            quantidadePorSimulado.set(
              questao.simulado_id,
              atual + 1,
            );
          }

          setSimuladosOficiais(
            simulados.map((simulado) => ({
              id: simulado.id,
              nome: simulado.nome,
              duracao_minutos:
                simulado.duracao_minutos,
              created_at: simulado.created_at,
              questoes:
                quantidadePorSimulado.get(
                  simulado.id,
                ) ?? 0,
            })),
          );
        }
      } else {
        setSimuladosOficiais([]);
      }

      setCarregando(false);
    }

    void carregarDados();
  }, []);

  // ==================================================
  // TAXA DE ACERTOS
  // ==================================================

  const taxaAcertos =
    totalQuestoes > 0
      ? Math.round(
          (totalAcertos / totalQuestoes) * 100,
        )
      : 0;

  // ==================================================
  // META SEMANAL
  // ==================================================

  const metaSemana = 350;

  const progressoMeta =
    metaSemana > 0
      ? Math.min(
          (questoesSemana / metaSemana) * 100,
          100,
        )
      : 0;

  function formatarDataSimulado(data: string) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    ).format(new Date(data));
  }

  function formatarDuracao(
    minutos: number,
  ) {
    const horas = Math.floor(
      minutos / 60,
    );

    const minutosRestantes =
      minutos % 60;

    if (horas === 0) {
      return `${minutosRestantes}min`;
    }

    return `${horas}h${String(
      minutosRestantes,
    ).padStart(2, "0")}`;
  }

  return (
    <AppShell
      titulo="Olá! 👋"
      descricao="Veja seu resumo de estudos de hoje."
    >
      {/* ==================================================
          ÁREA ADMINISTRATIVA
          ================================================== */}

      {isAdmin ? (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Settings className="size-5" />
              </div>

              <div>
                <p className="font-semibold">
                  Área administrativa
                </p>

                <p className="text-sm text-muted-foreground">
                  Gerencie questões e conteúdos do QBMed.
                </p>
              </div>
            </div>

            <Button asChild>
              <Link to="/administracao/questoes">
                Acessar administração
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* ==================================================
          CARDS PRINCIPAIS
          ================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* TAXA DE ACERTOS */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Taxa de acertos
              </p>

              <CheckCircle2 className="size-4 text-success" />
            </div>

            <p className="mt-2 text-3xl font-bold text-primary">
              {carregando
                ? "..."
                : `${taxaAcertos}%`}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {carregando
                ? "Carregando seus dados..."
                : `${totalAcertos} acertos de ${totalQuestoes} questões`}
            </p>
          </CardContent>
        </Card>

        {/* QUESTÕES RESOLVIDAS */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Questões resolvidas
              </p>

              <Target className="size-4 text-accent" />
            </div>

            <p className="mt-2 text-3xl font-bold text-primary">
              {carregando
                ? "..."
                : totalQuestoes.toLocaleString(
                    "pt-BR",
                  )}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {carregando
                ? "Carregando..."
                : `${questoesSemana} nos últimos 7 dias`}
            </p>
          </CardContent>
        </Card>

        {/* STREAK */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Streak
              </p>

              <Flame className="size-4 text-warning" />
            </div>

            <p className="mt-2 text-3xl font-bold text-primary">
              {carregando
                ? "..."
                : `${streak} dias`}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {carregando
                ? "Calculando..."
                : `Seu recorde é de ${recordeStreak} dias`}
            </p>
          </CardContent>
        </Card>

        {/* META SEMANAL */}

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Meta semanal
              </p>

              <TrendingUp className="size-4 text-accent" />
            </div>

            <p className="mt-2 text-3xl font-bold text-primary">
              {carregando
                ? "..."
                : `${questoesSemana}/${metaSemana}`}
            </p>

            <Progress
              value={progressoMeta}
              className="mt-3"
            />
          </CardContent>
        </Card>
      </div>

      {/* ==================================================
          GRÁFICOS
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* PROGRESSO SEMANAL */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Progresso semanal
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Evolução do seu aproveitamento nos últimos 7 dias.
            </p>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={aproveitamentoSemanal}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="dia"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />

                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(valor) => `${valor}%`}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(
                    valor,
                    nome,
                    propriedades,
                  ) => {
                    if (nome === "Aproveitamento") {
                      return [
                        `${valor}%`,
                        "Aproveitamento",
                      ];
                    }

                    return [
                      valor,
                      propriedades?.payload
                        ?.questoes
                        ? "Questões"
                        : nome,
                    ];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="aproveitamento"
                  name="Aproveitamento"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* EVOLUÇÃO MENSAL */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolução do aproveitamento
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              Aproveitamento dos últimos 6 meses.
            </p>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={aproveitamentoMensal}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />

                <XAxis
                  dataKey="mes"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                />

                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(valor) => `${valor}%`}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(
                    valor,
                    nome,
                    propriedades,
                  ) => {
                    if (nome === "Aproveitamento (%)") {
                      return [
                        `${valor}%`,
                        "Aproveitamento",
                      ];
                    }

                    return [
                      valor,
                      propriedades?.payload
                        ?.questoes
                        ? "Questões"
                        : nome,
                    ];
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="aproveitamento"
                  name="Aproveitamento (%)"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================
          QUESTÃO DO DIA E SIMULADOS
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Questão do dia
            </h2>

            <Badge className="bg-accent text-accent-foreground">
              +10 XP
            </Badge>
          </div>

          <QuestaoCard questao={questaoDoDia} />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              Próximos simulados
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {simuladosOficiais.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                Nenhum simulado oficial disponível no momento.
              </p>
            ) : (
              simuladosOficiais.map((simulado) => (
                <div
                  key={simulado.id}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-medium">
                    {simulado.nome}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatarDataSimulado(
                      simulado.created_at,
                    )}{" "}
                    • {simulado.questoes} questões •{" "}
                    {formatarDuracao(
                      simulado.duracao_minutos,
                    )}
                  </p>
                </div>
              ))
            )}

            <Button
              asChild
              variant="outline"
              className="w-full"
            >
              <Link to="/simulados">
                Ver todos os simulados
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}