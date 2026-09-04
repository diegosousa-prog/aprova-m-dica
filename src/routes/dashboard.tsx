import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Flame,
  Heart,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { QuestaoCard } from "@/components/questao-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { questaoDoDia, questoes, usuario } from "@/data/mock";
import { useEstudo } from "@/hooks/use-estudo";

export function Dashboard() {
  const { estado } = useEstudo();

  // ==========================================
  // ESTATÍSTICAS REAIS DAS QUESTÕES
  // ==========================================

  const respostas = Object.values(estado.respostas);

  const totalRespondidas = respostas.length;

  const totalAcertos = respostas.filter(
    (resposta) => resposta.acertou
  ).length;

  const totalErros = respostas.filter(
    (resposta) => !resposta.acertou
  ).length;

  const totalFavoritas = estado.favoritas.length;

  const taxaAcerto =
    totalRespondidas > 0
      ? Math.round((totalAcertos / totalRespondidas) * 100)
      : 0;

  const progressoBanco =
    questoes.length > 0
      ? Math.round((totalRespondidas / questoes.length) * 100)
      : 0;

  // ==========================================
  // DESEMPENHO POR ESPECIALIDADE
  // ==========================================

  const desempenhoEspecialidades = Array.from(
    new Set(questoes.map((questao) => questao.especialidade))
  )
    .map((especialidade) => {
      const questoesDaEspecialidade = questoes.filter(
        (questao) => questao.especialidade === especialidade
      );

      const ids = new Set(
        questoesDaEspecialidade.map((questao) => questao.id)
      );

      const respostasDaEspecialidade = respostas.filter((resposta) =>
        ids.has(resposta.questaoId)
      );

      const acertos = respostasDaEspecialidade.filter(
        (resposta) => resposta.acertou
      ).length;

      const respondidas = respostasDaEspecialidade.length;

      const percentual =
        respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0;

      return {
        especialidade,
        acertos,
        respondidas,
        percentual,
      };
    })
    .filter((item) => item.respondidas > 0)
    .sort((a, b) => b.respondidas - a.respondidas);

  // ==========================================
  // IDENTIFICAR PONTO FRACO
  // ==========================================

  const especialidadeMaisFraca =
    desempenhoEspecialidades.length > 0
      ? [...desempenhoEspecialidades].sort(
          (a, b) => a.percentual - b.percentual
        )[0]
      : null;

  // ==========================================
  // META DIÁRIA
  // ==========================================

  const metaDiaria = 40;

  const progressoMeta = Math.min(
    Math.round((totalRespondidas / metaDiaria) * 100),
    100
  );

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ==========================================
            CABEÇALHO
        ========================================== */}

        <div>
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {usuario.nome.split(" ")[0]}! 👋
          </h1>

          <p className="mt-1 text-muted-foreground">
            Acompanhe seu progresso e continue seus estudos.
          </p>
        </div>

        {/* ==========================================
            CARDS PRINCIPAIS
        ========================================== */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Taxa de acerto */}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Taxa de acerto
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {taxaAcerto}%
                  </p>
                </div>

                <div className="rounded-full bg-primary/10 p-3">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {totalRespondidas === 0
                  ? "Nenhuma questão respondida"
                  : `${totalAcertos} acertos de ${totalRespondidas} questões`}
              </p>
            </CardContent>
          </Card>

          {/* Questões respondidas */}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Respondidas
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {totalRespondidas}
                  </p>
                </div>

                <div className="rounded-full bg-primary/10 p-3">
                  <CircleHelp className="h-5 w-5 text-primary" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                de {questoes.length} questões disponíveis
              </p>
            </CardContent>
          </Card>

          {/* Acertos */}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Acertos
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {totalAcertos}
                  </p>
                </div>

                <div className="rounded-full bg-green-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {totalRespondidas > 0
                  ? `${taxaAcerto}% das questões respondidas`
                  : "Comece a responder questões"}
              </p>
            </CardContent>
          </Card>

          {/* Erros */}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Erros
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {totalErros}
                  </p>
                </div>

                <div className="rounded-full bg-red-500/10 p-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Questões para revisar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            META + FAVORITAS
        ========================================== */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Meta diária */}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Meta de hoje
                </CardTitle>

                <Badge variant="secondary">
                  {totalRespondidas}/{metaDiaria}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Progress value={progressoMeta} />

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {progressoMeta}% concluído
                </span>

                <span className="font-medium">
                  {Math.max(metaDiaria - totalRespondidas, 0)} restantes
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Favoritas */}

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-red-500/10 p-3">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Questões favoritas
                  </p>

                  <p className="text-2xl font-bold">
                    {totalFavoritas}
                  </p>
                </div>
              </div>

              <Button variant="outline" asChild>
                <Link to="/questoes">
                  Ver favoritas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ==========================================
            PROGRESSO DO BANCO
        ========================================== */}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Progresso no banco de questões
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Questões que você já respondeu
                </p>
              </div>

              <span className="text-2xl font-bold">
                {progressoBanco}%
              </span>
            </div>
          </CardHeader>

          <CardContent>
            <Progress value={progressoBanco} />

            <div className="mt-3 flex justify-between text-sm text-muted-foreground">
              <span>
                {totalRespondidas} respondidas
              </span>

              <span>
                {Math.max(questoes.length - totalRespondidas, 0)} não respondidas
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ==========================================
            DESEMPENHO POR ESPECIALIDADE
        ========================================== */}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Desempenho por especialidade
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Calculado com base nas questões que você respondeu
                </p>
              </div>

              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>

          <CardContent>
            {desempenhoEspecialidades.length === 0 ? (
              <div className="py-10 text-center">
                <CircleHelp className="mx-auto h-10 w-10 text-muted-foreground/50" />

                <p className="mt-3 font-medium">
                  Ainda não há dados suficientes
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Responda algumas questões para visualizar seu desempenho.
                </p>
              </div>
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={desempenhoEspecialidades}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="especialidade"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />

                    <Tooltip
                      formatter={(value) => [`${value}%`, "Acerto"]}
                    />

                    <Bar
                      dataKey="percentual"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ==========================================
            RECOMENDAÇÃO
        ========================================== */}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Flame className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="font-semibold">
                  {especialidadeMaisFraca
                    ? `Foque em ${especialidadeMaisFraca.especialidade}`
                    : "Comece sua sessão de estudos"}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {especialidadeMaisFraca
                    ? `Seu aproveitamento atual é de ${especialidadeMaisFraca.percentual}%. Resolva mais questões para melhorar seu desempenho.`
                    : "Responda questões para que o QBMed possa analisar seu desempenho."}
                </p>
              </div>
            </div>

            <Button asChild>
              <Link to="/questoes">
                Resolver questões
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* ==========================================
            QUESTÃO DO DIA
        ========================================== */}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Questão do dia
              </h2>

              <p className="text-sm text-muted-foreground">
                Uma questão para manter seu ritmo de estudos.
              </p>
            </div>

            <Button variant="ghost" asChild>
              <Link to="/questoes">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <QuestaoCard questao={questaoDoDia} />
        </div>
      </div>
    </AppShell>
  );
}