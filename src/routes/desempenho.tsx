import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { desempenhoPorEspecialidade, evolucaoMensal, simulados } from "@/data/mock";

export const Route = createFileRoute("/desempenho")({
  head: () => ({
    meta: [
      { title: "Desempenho e analytics — QBMed" },
      { name: "description", content: "Gráficos de acertos e erros, desempenho por especialidade e evolução mensal." },
      { property: "og:title", content: "Desempenho e analytics — QBMed" },
      { property: "og:description", content: "Analise seus pontos fortes e fracos com gráficos interativos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesempenhoPage,
});

function DesempenhoPage() {
  const [periodo, setPeriodo] = useState("6m");

  const totalAcertos = desempenhoPorEspecialidade.reduce((s, d) => s + d.acertos, 0);
  const totalQuestoes = desempenhoPorEspecialidade.reduce((s, d) => s + d.total, 0);
  const rosca = [
    { nome: "Acertos", valor: totalAcertos, cor: "var(--chart-3)" },
    { nome: "Erros", valor: totalQuestoes - totalAcertos, cor: "var(--chart-5)" },
  ];

  const evolucao = periodo === "3m" ? evolucaoMensal.slice(-3) : evolucaoMensal;

  const barras = desempenhoPorEspecialidade.map((d) => ({
    especialidade: d.especialidade,
    aproveitamento: Math.round((d.acertos / d.total) * 100),
  }));

  return (
    <AppShell titulo="Desempenho" descricao="Analytics completo do seu ciclo de estudos.">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Últimos 3 meses</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Acertos x Erros</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rosca} dataKey="valor" nameKey="nome" innerRadius={62} outerRadius={95} paddingAngle={3}>
                  {rosca.map((r) => (
                    <Cell key={r.nome} fill={r.cor} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Aproveitamento por especialidade</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barras} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="especialidade" width={110} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                />
                <Bar dataKey="aproveitamento" name="Aproveitamento" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                />
                <Legend />
                <Line type="monotone" dataKey="aproveitamento" name="Aproveitamento (%)" stroke="var(--chart-2)" strokeWidth={3} />
                <Line type="monotone" dataKey="questoes" name="Questões resolvidas" stroke="var(--chart-4)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de simulados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulados
                  .filter((s) => s.status === "Concluído")
                  .map((s) => {
                    const pct = Math.round((s.acertos / s.questoes) * 100);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{s.data}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={pct >= 70 ? "bg-success" : "bg-warning text-warning-foreground"}>
                            {s.acertos}/{s.questoes} · {pct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
