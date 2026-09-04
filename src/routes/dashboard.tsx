import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { evolucaoMensal, progressoSemanal, questaoDoDia, simulados, usuario } from "@/data/mock";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard do aluno — QBMed" },
      { name: "description", content: "Acompanhe acertos, streak, questão do dia e progresso semanal no QBMed." },
      { property: "og:title", content: "Dashboard do aluno — QBMed" },
      { property: "og:description", content: "Seu painel de estudos para a Residência Médica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const totalSemana = progressoSemanal.reduce((s, d) => s + d.questoes, 0);
  const metaSemana = progressoSemanal.reduce((s, d) => s + d.meta, 0);

  return (
    <AppShell titulo={`Olá, ${usuario.nome} 👋`} descricao="Veja seu resumo de estudos de hoje.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Taxa de acertos</p>
              <CheckCircle2 className="size-4 text-success" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">72%</p>
            <p className="mt-1 text-xs text-success">+4 p.p. em relação ao mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Questões resolvidas</p>
              <Target className="size-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">2.451</p>
            <p className="mt-1 text-xs text-muted-foreground">340 nos últimos 7 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Streak</p>
              <Flame className="size-4 text-warning" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">{usuario.streak} dias</p>
            <p className="mt-1 text-xs text-muted-foreground">Seu recorde é de 21 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Meta semanal</p>
              <TrendingUp className="size-4 text-accent" />
            </div>
            <p className="mt-2 text-3xl font-bold text-primary">
              {totalSemana}/{metaSemana}
            </p>
            <Progress value={(totalSemana / metaSemana) * 100} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Progresso semanal</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressoSemanal}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="questoes" name="Questões" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="meta" name="Meta" fill="var(--chart-1)" radius={[6, 6, 0, 0]} opacity={0.35} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução do aproveitamento</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[40, 90]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Questão do dia</h2>
            <Badge className="bg-accent text-accent-foreground">+10 XP</Badge>
          </div>
          <QuestaoCard questao={questaoDoDia} />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Próximos simulados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {simulados
              .filter((s) => s.status === "Disponível")
              .map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{s.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.data} • {s.questoes} questões • {s.duracao}
                  </p>
                </div>
              ))}
            <Button asChild variant="outline" className="w-full">
              <Link to="/simulados">Ver todos os simulados</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}