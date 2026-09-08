import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { AppShell } from "@/components/app-shell";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/administracao/questoes")({
  component: AdministracaoQuestoesPage,
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

  "Ginecologia e Obstetrícia": [
    "Ginecologia e Obstetrícia",
  ],

  Pediatria: [
    "Cirurgia Pediátrica",
    "Pediatria",
  ],

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

function AdministracaoQuestoesPage() {
  const [grandeArea, setGrandeArea] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [tema, setTema] = useState("");

  const [banca, setBanca] = useState("");
  const [ano, setAno] = useState("");
  const [dificuldade, setDificuldade] = useState("");

  const [enunciado, setEnunciado] = useState("");

  const [alternativas, setAlternativas] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
  });

  const [respostaCorreta, setRespostaCorreta] = useState("");
  const [explicacao, setExplicacao] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const especialidades = useMemo(() => {
    return especialidadesPorGrandeArea[grandeArea] ?? [];
  }, [grandeArea]);

  useEffect(() => {
    setEspecialidade("");
  }, [grandeArea]);

  function alterarAlternativa(
    letra: keyof typeof alternativas,
    valor: string,
  ) {
    setAlternativas((atual) => ({
      ...atual,
      [letra]: valor,
    }));
  }

  function limparFormulario() {
    setGrandeArea("");
    setEspecialidade("");
    setTema("");
    setBanca("");
    setAno("");
    setDificuldade("");
    setEnunciado("");

    setAlternativas({
      A: "",
      B: "",
      C: "",
      D: "",
      E: "",
    });

    setRespostaCorreta("");
    setExplicacao("");
  }

  async function salvarQuestao() {
    setMensagem(null);
    setErro(null);

    if (
      !grandeArea ||
      !especialidade ||
      !enunciado ||
      !alternativas.A ||
      !alternativas.B ||
      !alternativas.C ||
      !alternativas.D ||
      !respostaCorreta ||
      !dificuldade
    ) {
      setErro(
        "Preencha os campos obrigatórios, incluindo as alternativas A, B, C e D.",
      );
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("questions").insert({
      grande_area: grandeArea,
      especialidade,
      tema: tema || null,
      instituicao: banca || null,
      ano: ano ? Number(ano) : null,
      dificuldade,
      enunciado,
      alternativas,
      resposta_correta: respostaCorreta,
      explicacao: explicacao || null,
    });

    setSalvando(false);

    if (error) {
      console.error("ERRO AO SALVAR QUESTÃO:", error);
      setErro(error.message);
      return;
    }

    setMensagem("Questão cadastrada com sucesso!");
    limparFormulario();
  }

  return (
    <AppShell
      titulo="Administração de questões"
      descricao="Cadastre novas questões no banco do QBMed."
    >
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Nova questão</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Grande Área *</Label>

                <Select
                  value={grandeArea}
                  onValueChange={setGrandeArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a grande área" />
                  </SelectTrigger>

                  <SelectContent>
                    {grandeAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Especialidade *</Label>

                <Select
                  value={especialidade}
                  onValueChange={setEspecialidade}
                  disabled={!grandeArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>

                  <SelectContent>
                    {especialidades.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tema</Label>

                <Input
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex.: Insuficiência cardíaca"
                />
              </div>

              <div className="grid gap-2">
                <Label>Banca</Label>

                <Input
                  value={banca}
                  onChange={(e) => setBanca(e.target.value)}
                  placeholder="Ex.: USP"
                />
              </div>

              <div className="grid gap-2">
                <Label>Ano</Label>

                <Input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  placeholder="Ex.: 2025"
                />
              </div>

              <div className="grid gap-2">
                <Label>Dificuldade *</Label>

                <Select
                  value={dificuldade}
                  onValueChange={setDificuldade}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Enunciado *</Label>

              <Textarea
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Digite o enunciado completo da questão..."
                className="min-h-40"
              />
            </div>

            <div className="space-y-4">
              <Label>Alternativas *</Label>

              {(["A", "B", "C", "D", "E"] as const).map((letra) => (
                <div key={letra} className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted font-semibold">
                    {letra}
                  </div>

                  <Input
                    value={alternativas[letra]}
                    onChange={(e) =>
                      alterarAlternativa(letra, e.target.value)
                    }
                    placeholder={`Alternativa ${letra}`}
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              <Label>Resposta correta *</Label>

              <Select
                value={respostaCorreta}
                onValueChange={setRespostaCorreta}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a resposta correta" />
                </SelectTrigger>

                <SelectContent>
                  {(["A", "B", "C", "D", "E"] as const).map(
                    (letra) => (
                      <SelectItem key={letra} value={letra}>
                        Alternativa {letra}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Explicação / resolução</Label>

              <Textarea
                value={explicacao}
                onChange={(e) => setExplicacao(e.target.value)}
                placeholder="Digite a explicação da resposta..."
                className="min-h-32"
              />
            </div>

            {erro ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {erro}
              </div>
            ) : null}

            {mensagem ? (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                {mensagem}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                onClick={() => void salvarQuestao()}
                disabled={salvando}
              >
                {salvando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}

                {salvando ? "Salvando..." : "Salvar questão"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}