import { createFileRoute } from "@tanstack/react-router";
import { Filter, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEstudo } from "@/hooks/use-estudo";
import { supabase } from "@/lib/supabase";
import { statusQuestao } from "@/data/mock";
import type { Questao } from "@/data/questao";

export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "Banco de questões — QBMed" },
      {
        name: "description",
        content:
          "Banco de questões do QBMed com filtros por grande área, especialidade e tema.",
      },
    ],
  }),
  component: QuestoesPage,
});

const TODOS = "todos";

type StatusQuestao =
  | "Não respondidas"
  | "Acertadas"
  | "Erradas"
  | "Favoritas";

const grandeAreas = [
  "Clínica Médica",
  "Cirurgia Geral",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Medicina Preventiva e Social / Saúde Coletiva",
  "Miscelânea",
];

const especialidadesPorGrandeArea: Record<string, string[]> = {
  "Clínica Médica": [
    "Alergia e Imunologia",
    "Angiologia",
    "Cardiologia",
    "Clínica Médica",
    "Dermatologia",
    "Endocrinologia e Metabologia",
    "Gastroenterologia",
    "Geriatria",
    "Hematologia e Hemoterapia",
    "Infectologia",
    "Nefrologia",
    "Neurologia",
    "Oncologia Clínica",
    "Pneumologia",
    "Reumatologia",
  ],

  "Cirurgia Geral": [
    "Cirurgia Cardiovascular",
    "Cirurgia da Mão",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral",
    "Cirurgia Oncológica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Coloproctologia",
    "Mastologia",
    "Neurocirurgia",
    "Oftalmologia",
    "Ortopedia e Traumatologia",
    "Otorrinolaringologia",
    "Urologia",
  ],

  "Ginecologia e Obstetrícia": ["Ginecologia e Obstetrícia"],

  Pediatria: ["Cirurgia Pediátrica", "Pediatria"],

  "Medicina Preventiva e Social / Saúde Coletiva": [
    "Medicina da Família e Comunidade",
    "Medicina do Trabalho",
    "Medicina do Tráfego",
    "Medicina Legal e Perícia Médica",
    "Medicina Preventiva e Social",
  ],

  Miscelânea: [
    "Acupuntura",
    "Anestesiologia",
    "Endoscopia",
    "Genética Médica",
    "Homeopatia",
    "Medicina Aeroespacial",
    "Medicina de Emergência",
    "Medicina do Esporte",
    "Medicina Física e Reabilitação",
    "Medicina Intensiva",
    "Medicina Nuclear",
    "Nutrologia",
    "Patologia",
    "Patologia Clínica / Medicina Laboratorial",
    "Psiquiatria",
    "Radiologia e Diagnóstico por Imagem",
    "Radioterapia",
  ],
};

type QuestaoSupabase = {
  id: number;
  enunciado: string;
  alternativas: Record<string, string>;
  resposta_correta: "A" | "B" | "C" | "D" | "E";
  explicacao: string | null;
  grande_area: string | null;
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

function transformarQuestao(q: QuestaoSupabase): Questao {
  const letras: ("A" | "B" | "C" | "D" | "E")[] = [
    "A",
    "B",
    "C",
    "D",
    "E",
  ];

  const alternativas = letras
  .filter((letra) => q.alternativas?.[letra])
  .map((letra) => ({
    letra,
    texto: q.alternativas[letra] ?? "",
  }));

  return {
    id: String(q.id),
    enunciado: q.enunciado,
    especialidade: q.especialidade,
    subespecialidade: q.subespecialidade ?? "",
    banca: q.instituicao ?? q.prova ?? "Não informada",
    ano: q.ano ?? new Date().getFullYear(),
    dificuldade: q.dificuldade ?? "Média",
    tags: q.tags ?? (q.tema ? [q.tema] : []),
    alternativas,
    correta: q.resposta_correta,
    resolucao: q.explicacao ?? "",
    comentarios: [],
    imagem_url: q.imagem_url,
  };
}

function QuestoesPage() {
  const { estado } = useEstudo();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questoesOriginais, setQuestoesOriginais] = useState<
    QuestaoSupabase[]
  >([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [grandeArea, setGrandeArea] = useState(TODOS);
  const [especialidade, setEspecialidade] = useState(TODOS);
  const [tema, setTema] = useState(TODOS);

  const [banca, setBanca] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [status, setStatus] = useState<StatusQuestao | "todos">(TODOS);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function carregarQuestoes() {
      setCarregando(true);
      setErro(null);

      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("ERRO AO CARREGAR QUESTÕES:", error);
        setErro(error.message);
        setCarregando(false);
        return;
      }

      const dados = (data ?? []) as QuestaoSupabase[];

      setQuestoesOriginais(dados);
      setQuestoes(dados.map(transformarQuestao));
      setCarregando(false);
    }

    void carregarQuestoes();
  }, []);

  const especialidades = useMemo(() => {
    if (grandeArea === TODOS) {
      return Array.from(
        new Set(
          questoesOriginais
            .map((q) => q.especialidade)
            .filter(Boolean),
        ),
      ).sort();
    }

    return especialidadesPorGrandeArea[grandeArea] ?? [];
  }, [grandeArea, questoesOriginais]);

  const temas = useMemo(() => {
    return Array.from(
      new Set(
        questoesOriginais
          .filter(
            (q) =>
              grandeArea === TODOS || q.grande_area === grandeArea,
          )
          .filter(
            (q) =>
              especialidade === TODOS ||
              q.especialidade === especialidade,
          )
          .map((q) => q.tema)
          .filter(Boolean),
      ),
    ).sort() as string[];
  }, [grandeArea, especialidade, questoesOriginais]);

  const bancas = useMemo(() => {
    return Array.from(
      new Set(
        questoes
          .map((q) => q.banca)
          .filter(Boolean),
      ),
    ).sort();
  }, [questoes]);

  const anos = useMemo(() => {
    return Array.from(
      new Set(
        questoes
          .map((q) => q.ano)
          .filter(Boolean),
      ),
    ).sort((a, b) => b - a);
  }, [questoes]);

  const filtradas = useMemo(
    () =>
      questoes.filter((q) => {
        const original = questoesOriginais.find(
          (item) => String(item.id) === q.id,
        );

        if (!original) {
          return false;
        }

        if (
          grandeArea !== TODOS &&
          original.grande_area !== grandeArea
        ) {
          return false;
        }

        if (
          especialidade !== TODOS &&
          q.especialidade !== especialidade
        ) {
          return false;
        }

        if (tema !== TODOS && original.tema !== tema) {
          return false;
        }

        if (banca !== TODOS && q.banca !== banca) {
          return false;
        }

        if (ano !== TODOS && String(q.ano) !== ano) {
          return false;
        }

        if (
          busca &&
          !`${q.enunciado} ${q.tags.join(" ")} ${
            q.especialidade
          } ${original.tema ?? ""}`
            .toLowerCase()
            .includes(busca.toLowerCase())
        ) {
          return false;
        }

        const resposta = estado.respostas[q.id];
        const favorita = estado.favoritas.includes(q.id);

        if (status === "Não respondidas" && resposta) {
          return false;
        }

        if (
          status === "Acertadas" &&
          (!resposta || !resposta.acertou)
        ) {
          return false;
        }

        if (
          status === "Erradas" &&
          (!resposta || resposta.acertou)
        ) {
          return false;
        }

        if (status === "Favoritas" && !favorita) {
          return false;
        }

        return true;
      }),
    [
      questoes,
      questoesOriginais,
      grandeArea,
      especialidade,
      tema,
      banca,
      ano,
      busca,
      status,
      estado.respostas,
      estado.favoritas,
    ],
  );

  function alterarGrandeArea(valor: string) {
    setGrandeArea(valor);
    setEspecialidade(TODOS);
    setTema(TODOS);
  }

  function alterarEspecialidade(valor: string) {
    setEspecialidade(valor);
    setTema(TODOS);
  }

  function limpar() {
    setGrandeArea(TODOS);
    setEspecialidade(TODOS);
    setTema(TODOS);
    setBanca(TODOS);
    setAno(TODOS);
    setStatus(TODOS);
    setBusca("");
  }

  const filtrosAtivos = [
    grandeArea,
    especialidade,
    tema,
    banca,
    ano,
    status,
  ].filter((f) => f !== TODOS).length;

  return (
    <AppShell
      titulo="Questões"
      descricao="Monte seu caderno com filtros por grande área, especialidade e tema."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-accent" />
              Filtros

              {filtrosAtivos > 0 ? (
                <Badge variant="secondary">{filtrosAtivos}</Badge>
              ) : null}
            </CardTitle>

            <Button variant="ghost" size="sm" onClick={limpar}>
              <RotateCcw className="mr-1 size-3.5" />
              Limpar
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Buscar</Label>

              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: insuficiência cardíaca"
              />
            </div>

            <div className="grid gap-2">
              <Label>Grande Área</Label>

              <Select
                value={grandeArea}
                onValueChange={alterarGrandeArea}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {grandeAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Especialidade</Label>

              <Select
                value={especialidade}
                onValueChange={alterarEspecialidade}
                disabled={grandeArea === TODOS}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      grandeArea === TODOS
                        ? "Selecione uma grande área"
                        : "Todas"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {especialidades.map((especialidadeItem) => (
                    <SelectItem
                      key={especialidadeItem}
                      value={especialidadeItem}
                    >
                      {especialidadeItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tema</Label>

              <Select
                value={tema}
                onValueChange={setTema}
                disabled={
                  grandeArea === TODOS || especialidade === TODOS
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      grandeArea === TODOS
                        ? "Selecione uma grande área"
                        : especialidade === TODOS
                          ? "Selecione uma especialidade"
                          : "Todos os temas"
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>

                  {temas.map((temaItem) => (
                    <SelectItem key={temaItem} value={temaItem}>
                      {temaItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Banca</Label>

              <Select value={banca} onValueChange={setBanca}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {bancas.map((bancaItem) => (
                    <SelectItem key={bancaItem} value={bancaItem}>
                      {bancaItem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Ano</Label>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setAno(TODOS)}
                >
                  <Badge
                    variant={
                      ano === TODOS ? "default" : "outline"
                    }
                    className="cursor-pointer"
                  >
                    Todos
                  </Badge>
                </button>

                {anos.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAno(String(a))}
                  >
                    <Badge
                      variant={
                        ano === String(a) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {a}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(TODOS)}
                >
                  <Badge
                    variant={
                      status === TODOS ? "default" : "outline"
                    }
                    className="cursor-pointer"
                  >
                    Todas
                  </Badge>
                </button>

                {statusQuestao.map((statusItem) => (
                  <button
                    key={statusItem}
                    type="button"
                    onClick={() => setStatus(statusItem)}
                  >
                    <Badge
                      variant={
                        status === statusItem
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {statusItem}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
            <Filter className="size-4 text-accent" />

            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filtradas.length}
              </span>{" "}
              questões encontradas
              {status !== TODOS ? ` • status: ${status}` : ""}
            </p>
          </div>

          {carregando ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando questões...
              </CardContent>
            </Card>
          ) : erro ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-sm font-medium text-destructive">
                  Não foi possível carregar as questões.
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  {erro}
                </p>
              </CardContent>
            </Card>
          ) : filtradas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                Nenhuma questão encontrada com esses filtros.
                Tente limpar alguns critérios.
              </CardContent>
            </Card>
          ) : (
            filtradas.map((q) => (
              <QuestaoCard key={q.id} questao={q} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}