import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, Play, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simulados } from "@/data/mock";

export const Route = createFileRoute("/simulados")({
  head: () => ({
    meta: [
      { title: "Simulados — QBMed" },
      { name: "description", content: "Simulados cronometrados fictícios com correção automática e histórico de resultados." },
      { property: "og:title", content: "Simulados — QBMed" },
      { property: "og:description", content: "Faça simulados temáticos e nacionais e acompanhe seus resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SimuladosPage,
});

function SimuladosPage() {
  const [aba, setAba] = useState("disponiveis");
  const concluidos = simulados.filter((s) => s.status === "Concluído");
  const disponiveis = simulados.filter((s) => s.status === "Disponível");
  const historico = concluidos
    .map((s) => ({ nome: s.id, aproveitamento: Math.round((s.acertos / s.questoes) * 100) }))
    .reverse();

  return (
    <AppShell titulo="Simulados" descricao="Treine em condições de prova e compare seus resultados.">
      <Tabs value={aba} onValueChange={setAba}>
        <TabsList>
          <TabsTrigger value="disponiveis">Disponíveis ({disponiveis.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico ({concluidos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="mt-6 grid gap-4 md:grid-cols-2">
          {disponiveis.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3 p-6">
                <Badge className="bg-accent text-accent-foreground">Novo</Badge>
                <h3 className="text-lg font-semibold">{s.nome}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" /> {s.data}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" /> {s.duracao}
                  </span>
                  <span>{s.questoes} questões</span>
                </div>
                <Button onClick={() => toast.success(`Simulado ${s.nome} iniciado (demonstração).`)}>
                  <Play className="mr-2 size-4" /> Iniciar simulado
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aproveitamento por simulado</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="nome" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                  />
                  <Bar dataKey="aproveitamento" name="Aproveitamento" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {concluidos.map((s) => {
              const pct = Math.round((s.acertos / s.questoes) * 100);
              return (
                <Card key={s.id}>
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{s.nome}</h3>
                      <Badge variant={pct >= 70 ? "default" : "secondary"} className={pct >= 70 ? "bg-success" : ""}>
                        {pct}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.data} • {s.acertos}/{s.questoes} acertos • {s.duracao}
                    </p>
                    <Progress value={pct} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toast("Abrindo espelho de prova (demonstração).")}
                    >
                      <Trophy className="mr-2 size-4" /> Ver desempenho
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
