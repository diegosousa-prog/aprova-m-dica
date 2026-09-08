import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Flame, Target, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
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
import {
  evolucaoMensal,
  progressoSemanal,
  questaoDoDia,
  simulados,
} from "@/data/mock";
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

function Dashboard() {
  const [carregando, setCarregando] = useState(true);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [totalAcertos, setTotalAcertos] = useState(0);
  const [questoesSemana, setQuestoesSemana] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recordeStreak, setRecordeStreak] = useState(0);

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
        const dataResposta = new Date(
          resposta.respondida_em,
        );

        return dataResposta >= limiteSemana;
      });

      setQuestoesSemana(respostasSemana.length);

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

      // Se não estudou hoje, mas estudou ontem,
      // o streak começa contando a partir de ontem.
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

      setCarregando(false);
    }

    carregarDados();
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

  return (
    <AppShell
      titulo="Olá! 👋"
      descricao="Veja seu resumo de estudos de hoje."
    >
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
          POR ENQUANTO CONTINUAM COM DADOS MOCK
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Progresso semanal
            </CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={progressoSemanal}>
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
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />

                <Bar
                  dataKey="questoes"
                  name="Questões"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  dataKey="meta"
                  name="Meta"
                  fill="var(--chart-1)"
                  radius={[6, 6, 0, 0]}
                  opacity={0.35}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolução do aproveitamento
            </CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart data={evolucaoMensal}>
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
                  domain={[40, 90]}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border:
                      "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="aproveitamento"
                  name="Aproveitamento (%)"
                  stroke="var(--chart-2)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================
          QUESTÃO DO DIA E SIMULADOS
          POR ENQUANTO CONTINUAM COM DADOS MOCK
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
            {simulados
              .filter(
                (s) => s.status === "Disponível",
              )
              .map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-medium">
                    {s.nome}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {s.data} • {s.questoes} questões •{" "}
                    {s.duracao}
                  </p>
                </div>
              ))}

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