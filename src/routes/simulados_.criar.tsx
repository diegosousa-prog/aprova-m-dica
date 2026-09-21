import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Filter,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
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
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/simulados_/criar")({
  head: () => ({
    meta: [
      { title: "Criar simulado — QBMed" },
      {
        name: "description",
        content: "Crie um simulado personalizado no QBMed.",
      },
    ],
  }),
  component: CriarSimuladoPage,
});

const TODOS = "todos";

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

type QuestaoFiltro = {
  id: number;
  grande_area: string | null;
  especialidade: string;
  subespecialidade: string | null;
  tema: string | null;
  instituicao: string | null;
  ano: number | null;
  dificuldade: string | null;
};

type MultiSelectDropdownProps = {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
};

function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      const elemento = event.target as HTMLElement;

      if (!elemento.closest("[data-multiselect]")) {
        setAberto(false);
      }
    }

    if (aberto) {
      document.addEventListener(
        "mousedown",
        fecharAoClicarFora,
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora,
      );
    };
  }, [aberto]);

  function alternar(item: string) {
    if (selected.includes(item)) {
      onChange(
        selected.filter((valor) => valor !== item),
      );
    } else {
      onChange([...selected, item]);
    }
  }

  let textoSelecionado = placeholder;

  if (selected.length === 1) {
    textoSelecionado = selected[0];
  } else if (selected.length > 1) {
    textoSelecionado = `${selected.length} selecionadas`;
  }

  return (
    <div
      className="relative grid gap-2"
      data-multiselect
    >
      <Label>{label}</Label>

      <button
        type="button"
        onClick={() => setAberto((valor) => !valor)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-sm ring-offset-background transition-colors hover:bg-accent/5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span
          className={
            selected.length === 0
              ? "text-muted-foreground"
              : "truncate text-foreground"
          }
        >
          {textoSelecionado}
        </span>

        <ChevronDown
          className={`ml-2 size-4 shrink-0 text-muted-foreground transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhuma opção disponível.
            </div>
          ) : (
            options.map((item) => {
              const selecionado = selected.includes(item);

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => alternar(item)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    selecionado
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="truncate">
                    {item}
                  </span>

                  {selecionado && (
                    <Check className="ml-2 size-4 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function embaralhar<T>(array: T[]) {
  const copia = [...array];

  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
}

function CriarSimuladoPage() {
  const navigate = useNavigate();

  const [questoes, setQuestoes] = useState<QuestaoFiltro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [criando, setCriando] = useState(false);

  const [nomeSimulado, setNomeSimulado] = useState("");
  const [quantidade, setQuantidade] = useState("20");

  const [grandesAreasSelecionadas, setGrandesAreasSelecionadas] =
    useState<string[]>([]);

  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] =
    useState<string[]>([]);

  const [temasSelecionados, setTemasSelecionados] =
    useState<string[]>([]);

  const [banca, setBanca] = useState(TODOS);
  const [ano, setAno] = useState(TODOS);
  const [dificuldade, setDificuldade] = useState(TODOS);

  useEffect(() => {
    async function carregarQuestoes() {
      setCarregando(true);

      const { data, error } = await supabase
        .from("questions")
        .select(
          "id, grande_area, especialidade, subespecialidade, tema, instituicao, ano, dificuldade",
        )
        .order("id", { ascending: true });

      if (error) {
        console.error(
          "ERRO AO CARREGAR QUESTÕES:",
          error,
        );

        toast.error(
          "Não foi possível carregar as questões.",
        );

        setCarregando(false);
        return;
      }

      setQuestoes((data ?? []) as QuestaoFiltro[]);
      setCarregando(false);
    }

    void carregarQuestoes();
  }, []);

  const especialidades = useMemo(() => {
    if (grandesAreasSelecionadas.length === 0) {
      return Array.from(
        new Set(
          questoes
            .map((q) => q.especialidade)
            .filter(Boolean),
        ),
      ).sort();
    }

    return Array.from(
      new Set(
        grandesAreasSelecionadas.flatMap(
          (area) =>
            especialidadesPorGrandeArea[area] ?? [],
        ),
      ),
    ).sort();
  }, [grandesAreasSelecionadas, questoes]);

  const temas = useMemo(() => {
    return Array.from(
      new Set(
        questoes
          .filter((q) => {
            if (
              grandesAreasSelecionadas.length > 0 &&
              !grandesAreasSelecionadas.includes(
                q.grande_area ?? "",
              )
            ) {
              return false;
            }

            if (
              especialidadesSelecionadas.length > 0 &&
              !especialidadesSelecionadas.includes(
                q.especialidade,
              )
            ) {
              return false;
            }

            return true;
          })
          .map((q) => q.tema)
          .filter(
            (item): item is string => Boolean(item),
          ),
      ),
    ).sort();
  }, [
    grandesAreasSelecionadas,
    especialidadesSelecionadas,
    questoes,
  ]);

  const bancas = useMemo(() => {
    return Array.from(
      new Set(
        questoes
          .map((q) => q.instituicao)
          .filter(
            (item): item is string => Boolean(item),
          ),
      ),
    ).sort();
  }, [questoes]);

  const anos = useMemo(() => {
    return Array.from(
      new Set(
        questoes
          .map((q) => q.ano)
          .filter(
            (item): item is number => item !== null,
          ),
      ),
    ).sort((a, b) => b - a);
  }, [questoes]);

  const filtradas = useMemo(() => {
    return questoes.filter((q) => {
      if (
        grandesAreasSelecionadas.length > 0 &&
        !grandesAreasSelecionadas.includes(
          q.grande_area ?? "",
        )
      ) {
        return false;
      }

      if (
        especialidadesSelecionadas.length > 0 &&
        !especialidadesSelecionadas.includes(
          q.especialidade,
        )
      ) {
        return false;
      }

      if (
        temasSelecionados.length > 0 &&
        !temasSelecionados.includes(q.tema ?? "")
      ) {
        return false;
      }

      if (
        banca !== TODOS &&
        q.instituicao !== banca
      ) {
        return false;
      }

      if (
        ano !== TODOS &&
        String(q.ano) !== ano
      ) {
        return false;
      }

      if (
        dificuldade !== TODOS &&
        q.dificuldade !== dificuldade
      ) {
        return false;
      }

      return true;
    });
  }, [
    questoes,
    grandesAreasSelecionadas,
    especialidadesSelecionadas,
    temasSelecionados,
    banca,
    ano,
    dificuldade,
  ]);

  const filtrosAtivos =
    grandesAreasSelecionadas.length +
    especialidadesSelecionadas.length +
    temasSelecionados.length +
    (banca !== TODOS ? 1 : 0) +
    (ano !== TODOS ? 1 : 0) +
    (dificuldade !== TODOS ? 1 : 0);

  function alterarGrandesAreas(valores: string[]) {
    setGrandesAreasSelecionadas(valores);

    const especialidadesPermitidas =
      valores.length === 0
        ? []
        : valores.flatMap(
            (area) =>
              especialidadesPorGrandeArea[area] ?? [],
          );

    setEspecialidadesSelecionadas((atuais) =>
      atuais.filter((item) =>
        especialidadesPermitidas.includes(item),
      ),
    );

    setTemasSelecionados([]);
  }

  function alterarEspecialidades(valores: string[]) {
    setEspecialidadesSelecionadas(valores);
    setTemasSelecionados([]);
  }

  function alterarTemas(valores: string[]) {
    setTemasSelecionados(valores);
  }

  function limpar() {
    setNomeSimulado("");
    setGrandesAreasSelecionadas([]);
    setEspecialidadesSelecionadas([]);
    setTemasSelecionados([]);
    setBanca(TODOS);
    setAno(TODOS);
    setDificuldade(TODOS);
  }

  async function criarSimulado() {
    const quantidadeNumerica = Number(quantidade);

    if (
      !Number.isInteger(quantidadeNumerica) ||
      quantidadeNumerica < 1
    ) {
      toast.error(
        "Informe uma quantidade válida de questões.",
      );

      return;
    }

    if (quantidadeNumerica > 200) {
      toast.error(
        "O máximo é 200 questões por simulado.",
      );

      return;
    }

    if (filtradas.length === 0) {
      toast.error(
        "Nenhuma questão foi encontrada com esses filtros.",
      );

      return;
    }

    setCriando(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error(
          "Você precisa estar logado para criar um simulado.",
        );

        return;
      }

      const quantidadeReal = Math.min(
        quantidadeNumerica,
        filtradas.length,
      );

      const selecionadas = embaralhar(
        filtradas,
      ).slice(0, quantidadeReal);

      const nomePartes = [
        "Simulado personalizado",
      ];

      if (
        especialidadesSelecionadas.length === 1
      ) {
        nomePartes.push(
          especialidadesSelecionadas[0],
        );
      } else if (
        grandesAreasSelecionadas.length === 1
      ) {
        nomePartes.push(
          grandesAreasSelecionadas[0],
        );
      }

      const nomeAutomatico = nomePartes.join(" — ");
      const nome =
        nomeSimulado.trim() || nomeAutomatico;

      const { data: simulado, error: erroSimulado } =
        await supabase
          .from("simulados_usuario")
          .insert({
            user_id: user.id,
            nome,
            quantidade_questoes: quantidadeReal,
            grande_area:
              grandesAreasSelecionadas.length === 1
                ? grandesAreasSelecionadas[0]
                : null,
            especialidade:
              especialidadesSelecionadas.length === 1
                ? especialidadesSelecionadas[0]
                : null,
            tema:
              temasSelecionados.length === 1
                ? temasSelecionados[0]
                : null,
            instituicao:
              banca === TODOS ? null : banca,
            ano:
              ano === TODOS ? null : Number(ano),
            dificuldade:
              dificuldade === TODOS
                ? null
                : dificuldade,
            status: "Em andamento",
            questao_atual: 0,
          })
          .select("id")
          .single();

      if (erroSimulado || !simulado) {
        console.error(erroSimulado);

        toast.error(
          "Erro ao criar o simulado.",
        );

        return;
      }

      const questoesParaSalvar =
        selecionadas.map((questao, index) => ({
          simulado_usuario_id: simulado.id,
          questao_id: questao.id,
          ordem: index,
        }));

      const { error: erroQuestoes } =
        await supabase
          .from("simulado_usuario_questoes")
          .insert(questoesParaSalvar);

      if (erroQuestoes) {
        console.error(erroQuestoes);

        await supabase
          .from("simulados_usuario")
          .delete()
          .eq("id", simulado.id);

        toast.error(
          "Erro ao salvar as questões do simulado.",
        );

        return;
      }

      if (
        quantidadeReal < quantidadeNumerica
      ) {
        toast.success(
          `Simulado criado com ${quantidadeReal} questões, pois foram encontradas apenas essas questões com os filtros escolhidos.`,
        );
      } else {
        toast.success(
          "Simulado criado com sucesso!",
        );
      }

      void navigate({
        to: "/simulados/executar/$tipo/$id",
        params: {
          tipo: "pessoal",
          id: String(simulado.id),
        },
      });
    } finally {
      setCriando(false);
    }
  }

  return (
    <AppShell
      titulo="Criar simulado"
      descricao="Monte seu próprio simulado usando as questões do banco do QBMed."
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate({ to: "/simulados" })
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          Voltar para simulados
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-accent" />

              Filtros

              {filtrosAtivos > 0 ? (
                <Badge variant="secondary">
                  {filtrosAtivos}
                </Badge>
              ) : null}
            </CardTitle>

            <Button
              variant="ghost"
              size="sm"
              onClick={limpar}
            >
              <RotateCcw className="mr-1 size-3.5" />
              Limpar
            </Button>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="nome-simulado">
                Nome do simulado{" "}
                <span className="text-muted-foreground">
                  (opcional)
                </span>
              </Label>

              <Input
                id="nome-simulado"
                value={nomeSimulado}
                onChange={(event) =>
                  setNomeSimulado(event.target.value)
                }
                placeholder="Ex.: Revisão de Cardiologia"
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <Label>
                Quantidade de questões
              </Label>

              <Input
                type="number"
                min={1}
                max={200}
                value={quantidade}
                onChange={(event) =>
                  setQuantidade(
                    event.target.value,
                  )
                }
                placeholder="Ex.: 20"
              />
            </div>

            <MultiSelectDropdown
              label="Grande Área"
              placeholder="Todas"
              options={grandeAreas}
              selected={
                grandesAreasSelecionadas
              }
              onChange={
                alterarGrandesAreas
              }
            />

            <MultiSelectDropdown
              label="Especialidade"
              placeholder="Todas"
              options={especialidades}
              selected={
                especialidadesSelecionadas
              }
              onChange={
                alterarEspecialidades
              }
            />

            <MultiSelectDropdown
              label="Tema"
              placeholder="Todos"
              options={temas}
              selected={temasSelecionados}
              onChange={alterarTemas}
            />

            <div className="grid gap-2">
              <Label>Banca</Label>

              <select
                value={banca}
                onChange={(event) =>
                  setBanca(event.target.value)
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={TODOS}>
                  Todas
                </option>

                {bancas.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label>Ano</Label>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setAno(TODOS)
                  }
                >
                  <Badge
                    variant={
                      ano === TODOS
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                  >
                    Todos
                  </Badge>
                </button>

                {anos.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setAno(String(item))
                    }
                  >
                    <Badge
                      variant={
                        ano === String(item)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {item}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Dificuldade</Label>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "todos",
                  "Fácil",
                  "Média",
                  "Difícil",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setDificuldade(item)
                    }
                  >
                    <Badge
                      variant={
                        dificuldade === item
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                    >
                      {item === "todos"
                        ? "Todas"
                        : item}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() =>
                  void criarSimulado()
                }
                disabled={
                  criando ||
                  carregando ||
                  filtradas.length === 0
                }
              >
                {criando ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar simulado"
                )}
              </Button>
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
              questões disponíveis para os
              filtros atuais.
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">
                Simulado personalizado
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Serão escolhidas{" "}
                <span className="font-medium text-foreground">
                  {Math.min(
                    Number(quantidade) || 0,
                    filtradas.length,
                  )}
                </span>{" "}
                questões aleatórias entre as
                questões encontradas.
              </p>

              {filtradas.length > 0 &&
                filtradas.length <
                  Number(quantidade) && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Foram encontradas apenas{" "}
                    <span className="font-medium text-foreground">
                      {filtradas.length}
                    </span>{" "}
                    questões. O simulado será
                    criado com essa quantidade.
                  </p>
                )}
            </CardContent>
          </Card>

          {carregando && (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando questões...
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}