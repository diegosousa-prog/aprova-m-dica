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
import { useEffect, useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { simulados } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/desempenho")({
  head: () => ({
    meta: [
      { title: "Desempenho e analytics — QBMed" },
      {
        name: "description",
        content:
          "Gráficos de acertos e erros, desempenho por especialidade e evolução mensal.",
      },
      {
        property: "og:title",
        content: "Desempenho e analytics — QBMed",
      },
      {
        property: "og:description",
        content:
          "Analise seus pontos fortes e fracos com gráficos interativos.",
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
  component: DesempenhoPage,
});

type Resposta = {
  questao_id: string;
  acertou: boolean;
  respondida_em: string;
};

type Questao = {
  id: number;
  especialidade: string;
};

type DesempenhoEspecialidade = {
  especialidade: string;
  acertos: number;
  total: number;
  aproveitamento: number;
};

type EvolucaoMensal = {
  mes: string;
  aproveitamento: number;
  questoes: number;
};

function DesempenhoPage() {
  const [periodo, setPeriodo] = useState("6m");
  const [carregando, setCarregando] = useState(true);

  const [totalAcertos, setTotalAcertos] = useState(0);
  const [totalQuestoes, setTotalQuestoes] = useState(0);

  const [desempenhoPorEspecialidade, setDesempenhoPorEspecialidade] =
    useState<DesempenhoEspecialidade[]>([]);

  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);

  useEffect(() => {
    async function carregarDesempenho() {
      setCarregando(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCarregando(false);
        return;
      }

      // ==================================================
      // CARREGAR RESPOSTAS DO USUÁRIO
      // ==================================================

      const { data: respostasData, error: erroRespostas } = await supabase
        .from("question_answers")
        .select("questao_id, acertou, respondida_em")
        .eq("user_id", user.id)
        .order("respondida_em", { ascending: true });

      if (erroRespostas) {
        console.error(
          "ERRO AO CARREGAR RESPOSTAS DO DESEMPENHO:",
          erroRespostas,
        );
        setCarregando(false);
        return;
      }

      const respostas = (respostasData ?? []) as Resposta[];

      // ==================================================
      // TOTAL DE ACERTOS E ERROS
      // ==================================================

      const acertos = respostas.filter(
        (resposta) => resposta.acertou,
      ).length;

      setTotalAcertos(acertos);
      setTotalQuestoes(respostas.length);

      // ==================================================
      // CARREGAR QUESTÕES
      // ==================================================

      const idsQuestoes = Array.from(
        new Set(respostas.map((resposta) => resposta.questao_id)),
      );

      let questoes: Questao[] = [];

      if (idsQuestoes.length > 0) {
        const { data: questoesData, error: erroQuestoes } = await supabase
          .from("questions")
          .select("id, especialidade")
          .in("id", idsQuestoes.map(Number));

        if (erroQuestoes) {
          console.error(
            "ERRO AO CARREGAR QUESTÕES DO DESEMPENHO:",
            erroQuestoes,
          );
        } else {
          questoes = (questoesData ?? []) as Questao[];
        }
      }

      // ==================================================
      // APROVEITAMENTO POR ESPECIALIDADE
      // ==================================================

      const mapaQuestoes = new Map(
        questoes.map((questao) => [
          String(questao.id),
          questao.especialidade,
        ]),
      );

      const mapaEspecialidades = new Map<
        string,
        { acertos: number; total: number }
      >();

      for (const resposta of respostas) {
        const especialidade =
          mapaQuestoes.get(String(resposta.questao_id)) ??
          "Não identificada";

        const atual = mapaEspecialidades.get(especialidade) ?? {
          acertos: 0,
          total: 0,
        };

        atual.total++;

        if (resposta.acertou) {
          atual.acertos++;
        }

        mapaEspecialidades.set(especialidade, atual);
      }

      const dadosEspecialidades: DesempenhoEspecialidade[] = Array.from(
        mapaEspecialidades.entries(),
      )
        .map(([especialidade, dados]) => ({
          especialidade,
          acertos: dados.acertos,
          total: dados.total,
          aproveitamento:
            dados.total > 0
              ? Math.round((dados.acertos / dados.total) * 100)
              : 0,
        }))
        .sort((a, b) => b.aproveitamento - a.aproveitamento);

      setDesempenhoPorEspecialidade(dadosEspecialidades);

      // ==================================================
      // EVOLUÇÃO MENSAL
      // ==================================================

      const agora = new Date();

      const quantidadeMeses = periodo === "3m" ? 3 : 6;

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

      const dadosMensais: EvolucaoMensal[] = [];

      for (let i = quantidadeMeses - 1; i >= 0; i--) {
        const dataMes = new Date(
          agora.getFullYear(),
          agora.getMonth() - i,
          1,
        );

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
            ? Math.round((acertosDoMes / quantidade) * 100)
            : 0;

        dadosMensais.push({
          mes: nomesMeses[dataMes.getMonth()] ?? "",
          aproveitamento,
          questoes: quantidade,
        });
      }

      setEvolucaoMensal(dadosMensais);

      setCarregando(false);
    }

    carregarDesempenho();
  }, [periodo]);

  // ==================================================
  // GRÁFICO DE ACERTOS X ERROS
  // ==================================================

  const rosca = [
    {
      nome: "Acertos",
      valor: totalAcertos,
      cor: "var(--chart-3)",
    },
    {
      nome: "Erros",
      valor: totalQuestoes - totalAcertos,
      cor: "var(--chart-5)",
    },
  ];

  return (
    <AppShell
      titulo="Desempenho"
      descricao="Analytics completo do seu ciclo de estudos."
    >
      {/* ==================================================
          FILTRO DE PERÍODO
          ================================================== */}

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Período:
        </span>

        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="3m">
              Últimos 3 meses
            </SelectItem>

            <SelectItem value="6m">
              Últimos 6 meses
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ==================================================
            ACERTOS X ERROS
            ================================================== */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Acertos x Erros
            </CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            {carregando ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Carregando desempenho...
              </div>
            ) : totalQuestoes === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Você ainda não respondeu questões.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={rosca}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {rosca.map((r) => (
                      <Cell
                        key={r.nome}
                        fill={r.cor}
                      />
                    ))}
                  </Pie>

                  <Legend />

                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ==================================================
            APROVEITAMENTO POR ESPECIALIDADE
            ================================================== */}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Aproveitamento por especialidade
            </CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            {carregando ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Carregando desempenho...
              </div>
            ) : desempenhoPorEspecialidade.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                Responda algumas questões para visualizar seu desempenho por especialidade.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={desempenhoPorEspecialidade}
                  layout="vertical"
                  margin={{ left: 30 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    unit="%"
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />

                  <YAxis
                    type="category"
                    dataKey="especialidade"
                    width={110}
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(valor) => [
                      `${valor}%`,
                      "Aproveitamento",
                    ]}
                  />

                  <Bar
                    dataKey="aproveitamento"
                    name="Aproveitamento"
                    fill="var(--chart-1)"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================================================
          EVOLUÇÃO MENSAL
          ================================================== */}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolução mensal
            </CardTitle>
          </CardHeader>

          <CardContent className="h-72">
            {carregando ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Carregando evolução...
              </div>
            ) : (
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
                    domain={[0, 100]}
                    tickFormatter={(valor) => `${valor}%`}
                  />

                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                    formatter={(valor, nome) => {
                      if (nome === "Aproveitamento (%)") {
                        return [
                          `${valor}%`,
                          "Aproveitamento",
                        ];
                      }

                      return [
                        valor,
                        "Questões resolvidas",
                      ];
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="aproveitamento"
                    name="Aproveitamento (%)"
                    stroke="var(--chart-2)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="questoes"
                    name="Questões resolvidas"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* ==================================================
            HISTÓRICO DE SIMULADOS
            ================================================== */}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Histórico de simulados
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Simulado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">
                    Resultado
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {simulados
                  .filter(
                    (s) => s.status === "Concluído",
                  )
                  .map((s) => {
                    const pct = Math.round(
                      (s.acertos / s.questoes) * 100,
                    );

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.nome}
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {s.data}
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge
                            className={
                              pct >= 70
                                ? "bg-success"
                                : "bg-warning text-warning-foreground"
                            }
                          >
                            {s.acertos}/{s.questoes} ·{" "}
                            {pct}%
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