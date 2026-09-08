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
import {
  especialidades,
  statusQuestao,
  subespecialidades,
  type Alternativa,
  type Questao,
  type StatusQuestao,
} from "@/data/mock";

export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "Banco de questões — QBMed" },
      {
        name: "description",
        content:
          "Banco de questões do QBMed com filtros por especialidade, banca, ano e status.",
      },
    ],
  }),
  component: QuestoesPage,
});

const TODOS = "todos";

type QuestaoSupabase = {
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
};

function transformarQuestao(q: QuestaoSupabase): Questao {
  const letras: Alternativa["letra"][] = ["A", "B", "C", "D", "E"];

  const alternativas = letras
    .filter((letra) => q.alternativas?.[letra])
    .map((letra) => ({
      letra,
      texto: q.alternativas[letra],
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
  };
}

function QuestoesPage() {
  const { estado } = useEstudo();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [especialidade, setEspecialidade] = useState(TODOS);
  const [subespecialidade, setSubespecialidade] = useState(TODOS);
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

      const questoesFormatadas = (data as QuestaoSupabase[]).map(
        transformarQuestao,
      );

      setQuestoes(questoesFormatadas);
      setCarregando(false);
    }

    void carregarQuestoes();
  }, []);

  const subOpcoes =
    especialidade === TODOS
      ? []
      : (subespecialidades[especialidade] ?? []);

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
        if (
          especialidade !== TODOS &&
          q.especialidade !== especialidade
        ) {
          return false;
        }

        if (
          subespecialidade !== TODOS &&
          q.subespecialidade !== subespecialidade
        ) {
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
          !`${q.enunciado} ${q.tags.join(" ")} ${q.subespecialidade}`
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

        if (status === "Acertadas" && (!resposta || !resposta.acertou)) {
          return false;
        }

        if (status === "Erradas" && (!resposta || resposta.acertou)) {
          return false;
        }

        if (status === "Favoritas" && !favorita) {
          return false;
        }

        return true;
      }),
    [
      questoes,
      especialidade,
      subespecialidade,
      banca,
      ano,
      busca,
      status,
      estado.respostas,
      estado.favoritas,
    ],
  );

  function limpar() {
    setEspecialidade(TODOS);
    setSubespecialidade(TODOS);
    setBanca(TODOS);
    setAno(TODOS);
    setStatus(TODOS);
    setBusca("");
  }

  const filtrosAtivos = [
    especialidade,
    subespecialidade,
    banca,
    ano,
    status,
  ].filter((f) => f !== TODOS).length;

  return (
    <AppShell
      titulo="Questões"
      descricao="Monte seu caderno com filtros avançados e resolva com feedback imediato."
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
              <Label>Buscar por tema</Label>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ex.: insuficiência cardíaca"
              />
            </div>

            <div className="grid gap-2">
              <Label>Especialidade</Label>

              <Select
                value={especialidade}
                onValueChange={(v) => {
                  setEspecialidade(v);
                  setSubespecialidade(TODOS);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {especialidades.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Subespecialidade</Label>

              <Select
                value={subespecialidade}
                onValueChange={setSubespecialidade}
                disabled={subOpcoes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {subOpcoes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Banca</Label>

              <Select value={banca} onValueChange={setBanca}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>

                  {bancas.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Ano</Label>

              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setAno(TODOS)}>
                  <Badge
                    variant={ano === TODOS ? "default" : "outline"}
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
                <button type="button" onClick={() => setStatus(TODOS)}>
                  <Badge
                    variant={status === TODOS ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    Todas
                  </Badge>
                </button>

                {statusQuestao.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                  >
                    <Badge
                      variant={status === s ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {s}
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
                Nenhuma questão encontrada com esses filtros. Tente limpar
                alguns critérios.
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