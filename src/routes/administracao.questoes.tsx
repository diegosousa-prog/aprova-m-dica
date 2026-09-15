import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Image,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Papa from "papaparse";

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
import { uploadImagemB2 } from "@/lib/b2.functions";

export const Route = createFileRoute("/administracao/questoes")({
  component: AdministracaoQuestoesPage,
});

const QUESTOES_POR_PAGINA = 20;
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

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

type LinhaCSV = {
  grande_area?: string;
  especialidade?: string;
  tema?: string;
  banca?: string;
  ano?: string;
  dificuldade?: string;
  enunciado?: string;
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  E?: string;
  correta?: string;
  explicacao?: string;
};

type QuestaoAdmin = {
  id: number;
  grande_area: string;
  especialidade: string;
  tema: string | null;
  instituicao: string | null;
  ano: number | null;
  dificuldade: string | null;
  enunciado: string;
};

type QuestaoCompleta = {
  id: number;
  grande_area: string;
  especialidade: string;
  tema: string | null;
  instituicao: string | null;
  ano: number | null;
  dificuldade: string | null;
  enunciado: string;
  alternativas: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    E?: string;
  };
  resposta_correta: string;
  explicacao: string | null;
  imagem_url: string | null;
};

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();

    leitor.onload = () => {
      const resultado = leitor.result;

      if (typeof resultado !== "string") {
        reject(new Error("Não foi possível ler a imagem."));
        return;
      }

      const base64 = resultado.split(",")[1];

      if (!base64) {
        reject(new Error("Não foi possível converter a imagem."));
        return;
      }

      resolve(base64);
    };

    leitor.onerror = () => {
      reject(new Error("Não foi possível ler a imagem."));
    };

    leitor.readAsDataURL(arquivo);
  });
}

function gerarNomeImagem(arquivo: File) {
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";

  const extensoesPermitidas = ["jpg", "jpeg", "png", "webp"];

  const extensaoFinal = extensoesPermitidas.includes(extensao)
    ? extensao
    : "jpg";

  return `questions/${crypto.randomUUID()}.${extensaoFinal}`;
}

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

  const [imagemArquivo, setImagemArquivo] = useState<File | null>(
    null,
  );

  const [imagemAtual, setImagemAtual] = useState<string | null>(
    null,
  );

  const [salvando, setSalvando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(
    null,
  );

  const [questoes, setQuestoes] = useState<QuestaoAdmin[]>([]);
  const [carregandoQuestoes, setCarregandoQuestoes] =
    useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalQuestoes, setTotalQuestoes] = useState(0);

  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const especialidades = useMemo(() => {
    return especialidadesPorGrandeArea[grandeArea] ?? [];
  }, [grandeArea]);

  const totalPaginas = Math.ceil(
    totalQuestoes / QUESTOES_POR_PAGINA,
  );

  useEffect(() => {
    if (!editandoId) {
      setEspecialidade("");
    }
  }, [grandeArea, editandoId]);

  async function carregarQuestoes(pagina = 1) {
    setCarregandoQuestoes(true);

    const inicio = (pagina - 1) * QUESTOES_POR_PAGINA;
    const fim = inicio + QUESTOES_POR_PAGINA - 1;

    const { data, error, count } = await supabase
      .from("questions")
      .select(
        "id, grande_area, especialidade, tema, instituicao, ano, dificuldade, enunciado",
        { count: "exact" },
      )
      .order("id", { ascending: false })
      .range(inicio, fim);

    if (error) {
      console.error("ERRO AO CARREGAR QUESTÕES:", error);
      setErro("Não foi possível carregar as questões.");
      setCarregandoQuestoes(false);
      return;
    }

    setQuestoes(data ?? []);
    setTotalQuestoes(count ?? 0);
    setPaginaAtual(pagina);
    setCarregandoQuestoes(false);
  }

  useEffect(() => {
    void carregarQuestoes(1);
  }, []);

  function alterarAlternativa(
    letra: keyof typeof alternativas,
    valor: string,
  ) {
    setAlternativas((atual) => ({
      ...atual,
      [letra]: valor,
    }));
  }

  function selecionarImagem(
    evento: React.ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = evento.target.files?.[0] ?? null;

    if (!arquivo) {
      setImagemArquivo(null);
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      setImagemArquivo(null);
      evento.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      setErro("A imagem deve ter no máximo 5 MB.");
      setImagemArquivo(null);
      evento.target.value = "";
      return;
    }

    setErro(null);
    setImagemArquivo(arquivo);
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
    setImagemArquivo(null);
    setImagemAtual(null);
    setEditandoId(null);
  }

  async function editarQuestao(id: number) {
    setMensagem(null);
    setErro(null);
    setCarregandoEdicao(true);

    const { data, error } = await supabase
      .from("questions")
      .select(
        "id, grande_area, especialidade, tema, instituicao, ano, dificuldade, enunciado, alternativas, resposta_correta, explicacao, imagem_url",
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("ERRO AO CARREGAR QUESTÃO:", error);
      setErro("Não foi possível carregar a questão para edição.");
      setCarregandoEdicao(false);
      return;
    }

    const questao = data as QuestaoCompleta;

    setGrandeArea(questao.grande_area);
    setEspecialidade(questao.especialidade);
    setTema(questao.tema ?? "");
    setBanca(questao.instituicao ?? "");
    setAno(questao.ano?.toString() ?? "");
    setDificuldade(questao.dificuldade ?? "");
    setEnunciado(questao.enunciado);

    setAlternativas({
      A: questao.alternativas?.A ?? "",
      B: questao.alternativas?.B ?? "",
      C: questao.alternativas?.C ?? "",
      D: questao.alternativas?.D ?? "",
      E: questao.alternativas?.E ?? "",
    });

    setRespostaCorreta(questao.resposta_correta);
    setExplicacao(questao.explicacao ?? "");
    setImagemArquivo(null);
    setImagemAtual(questao.imagem_url);

    setEditandoId(id);
    setCarregandoEdicao(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function excluirQuestao(id: number) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a questão #${id}? Essa ação não pode ser desfeita.`,
    );

    if (!confirmar) {
      return;
    }

    setMensagem(null);
    setErro(null);
    setExcluindoId(id);

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    setExcluindoId(null);

    if (error) {
      console.error("ERRO AO EXCLUIR QUESTÃO:", error);
      setErro(error.message);
      return;
    }

    if (editandoId === id) {
      limparFormulario();
    }

    setMensagem(`Questão #${id} excluída com sucesso!`);

    const novoTotal = totalQuestoes - 1;
    const novasPaginas = Math.ceil(
      novoTotal / QUESTOES_POR_PAGINA,
    );

    const paginaParaCarregar =
      paginaAtual > novasPaginas && novasPaginas > 0
        ? novasPaginas
        : paginaAtual;

    await carregarQuestoes(
      paginaParaCarregar > 0 ? paginaParaCarregar : 1,
    );
  }

  async function enviarImagemParaB2(arquivo: File) {
    const arquivoBase64 = await arquivoParaBase64(arquivo);
    const nomeArquivo = gerarNomeImagem(arquivo);

    const resultado = await uploadImagemB2({
      data: {
        nomeArquivo,
        arquivoBase64,
        contentType: arquivo.type,
      },
    });

    if (!resultado.sucesso) {
      throw new Error("Não foi possível enviar a imagem.");
    }

    return resultado.nomeArquivo;
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

    try {
      let imagemUrl = imagemAtual;

      if (imagemArquivo) {
        setMensagem("Enviando imagem...");

        imagemUrl = await enviarImagemParaB2(imagemArquivo);
      }

      const dadosQuestao = {
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
        imagem_url: imagemUrl,
      };

      if (editandoId !== null) {
        const { error } = await supabase
          .from("questions")
          .update(dadosQuestao)
          .eq("id", editandoId);

        if (error) {
          console.error("ERRO AO EDITAR QUESTÃO:", error);
          throw new Error(error.message);
        }

        setMensagem(
          `Questão #${editandoId} atualizada com sucesso!`,
        );

        limparFormulario();
        await carregarQuestoes(paginaAtual);
        return;
      }

      const { error } = await supabase
        .from("questions")
        .insert(dadosQuestao);

      if (error) {
        console.error("ERRO AO SALVAR QUESTÃO:", error);
        throw new Error(error.message);
      }

      setMensagem("Questão cadastrada com sucesso!");
      limparFormulario();

      await carregarQuestoes(1);
    } catch (errorSalvar) {
      console.error("ERRO AO SALVAR QUESTÃO:", errorSalvar);

      setErro(
        errorSalvar instanceof Error
          ? errorSalvar.message
          : "Não foi possível salvar a questão.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function cancelarEdicao() {
    limparFormulario();
    setMensagem(null);
    setErro(null);
  }

  async function importarCSV(
    evento: React.ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = evento.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setMensagem(null);
    setErro(null);
    setImportando(true);

    Papa.parse<LinhaCSV>(arquivo, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",

      complete: async (resultado) => {
        try {
          if (resultado.errors.length > 0) {
  const erroPapa = resultado.errors[0];

  if (erroPapa) {
    throw new Error(
      `Erro no CSV na linha ${(erroPapa.row ?? 0) + 2}: ${erroPapa.message}`,
    );
  }
}

          if (resultado.data.length === 0) {
            throw new Error("O arquivo CSV não contém questões.");
          }

          const questoesImportadas = resultado.data.map(
            (linha, index) => {
              const correta = (linha.correta ?? "")
                .trim()
                .toUpperCase();

              const dificuldadeCSV = (
                linha.dificuldade ?? ""
              ).trim();

              const anoCSV = (linha.ano ?? "").trim();

              if (anoCSV && !/^\d{4}$/.test(anoCSV)) {
                throw new Error(
                  `Ano inválido na linha ${index + 2}: "${anoCSV}". Use um ano com 4 dígitos.`,
                );
              }

              const grandeAreaCSV = (
                linha.grande_area ?? ""
              ).trim();

              const especialidadeCSV = (
                linha.especialidade ?? ""
              ).trim();

              const especialidadesValidas =
                especialidadesPorGrandeArea[grandeAreaCSV] ??
                [];

              if (!grandeAreas.includes(grandeAreaCSV)) {
                throw new Error(
                  `Grande Área inválida na linha ${index + 2}: "${grandeAreaCSV}".`,
                );
              }

              if (
                !especialidadesValidas.includes(
                  especialidadeCSV,
                )
              ) {
                throw new Error(
                  `Especialidade inválida na linha ${index + 2}: "${especialidadeCSV}" não pertence à Grande Área "${grandeAreaCSV}".`,
                );
              }

              if (
                !linha.grande_area?.trim() ||
                !linha.especialidade?.trim() ||
                !linha.enunciado?.trim() ||
                !linha.A?.trim() ||
                !linha.B?.trim() ||
                !linha.C?.trim() ||
                !linha.D?.trim() ||
                !correta ||
                !["A", "B", "C", "D", "E"].includes(
                  correta,
                )
              ) {
                throw new Error(
                  `Dados obrigatórios inválidos na linha ${index + 2}.`,
                );
              }

              if (
                !["Fácil", "Média", "Difícil"].includes(
                  dificuldadeCSV,
                )
              ) {
                throw new Error(
                  `Dificuldade inválida na linha ${index + 2}. Use Fácil, Média ou Difícil.`,
                );
              }

              return {
                grande_area: grandeAreaCSV,
                especialidade: especialidadeCSV,
                tema: linha.tema?.trim() || null,
                instituicao: linha.banca?.trim() || null,
                ano: anoCSV ? Number(anoCSV) : null,
                dificuldade: dificuldadeCSV,
                enunciado: linha.enunciado.trim(),
                alternativas: {
                  A: linha.A.trim(),
                  B: linha.B.trim(),
                  C: linha.C.trim(),
                  D: linha.D.trim(),
                  ...(linha.E?.trim()
                    ? { E: linha.E.trim() }
                    : {}),
                },
                resposta_correta: correta,
                explicacao:
                  linha.explicacao?.trim() || null,
              };
            },
          );

          const { error } = await supabase
            .from("questions")
            .insert(questoesImportadas);

          if (error) {
            console.error(
              "ERRO AO IMPORTAR QUESTÕES:",
              error,
            );

            throw new Error(error.message);
          }

          setMensagem(
            questoesImportadas.length === 1
              ? "1 questão importada com sucesso!"
              : `${questoesImportadas.length} questões importadas com sucesso!`,
          );

          await carregarQuestoes(1);
        } catch (errorImportacao) {
          console.error(
            "ERRO NA IMPORTAÇÃO CSV:",
            errorImportacao,
          );

          setErro(
            errorImportacao instanceof Error
              ? errorImportacao.message
              : "Não foi possível importar o CSV.",
          );
        } finally {
          setImportando(false);
          evento.target.value = "";
        }
      },

      error: (error) => {
        console.error("ERRO AO LER CSV:", error);

        setErro(
          `Não foi possível ler o arquivo CSV: ${error.message}`,
        );

        setImportando(false);
        evento.target.value = "";
      },
    });
  }

  return (
    <AppShell
      titulo="Administração de questões"
      descricao="Cadastre e gerencie as questões do banco do QBMed."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Importar questões por CSV</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium">
                Formato esperado
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                grande_area;especialidade;tema;banca;ano;dificuldade;enunciado;A;B;C;D;E;correta;explicacao
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                {importando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <FileUp className="mr-2 size-4" />
                )}

                {importando
                  ? "Importando..."
                  : "Selecionar CSV"}

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(evento) =>
                    void importarCSV(evento)
                  }
                  disabled={importando}
                  className="hidden"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {editandoId !== null
                ? `Editar questão #${editandoId}`
                : "Nova questão"}
            </CardTitle>
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
                    <SelectItem value="Fácil">
                      Fácil
                    </SelectItem>

                    <SelectItem value="Média">
                      Média
                    </SelectItem>

                    <SelectItem value="Difícil">
                      Difícil
                    </SelectItem>
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

              {(["A", "B", "C", "D", "E"] as const).map(
                (letra) => (
                  <div
                    key={letra}
                    className="flex items-center gap-3"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted font-semibold">
                      {letra}
                    </div>

                    <Input
                      value={alternativas[letra]}
                      onChange={(e) =>
                        alterarAlternativa(
                          letra,
                          e.target.value,
                        )
                      }
                      placeholder={`Alternativa ${letra}`}
                    />
                  </div>
                ),
              )}
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
                      <SelectItem
                        key={letra}
                        value={letra}
                      >
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

            <div className="grid gap-2">
              <Label>Imagem da questão</Label>

              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-input bg-muted/20 p-6 text-sm transition-colors hover:bg-muted/40">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Image className="size-8 text-muted-foreground" />

                  <span className="font-medium">
                    {imagemArquivo
                      ? imagemArquivo.name
                      : imagemAtual
                        ? "Imagem atual salva"
                        : "Selecionar imagem"}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    JPG, PNG ou WEBP — máximo 5 MB
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarImagem}
                  disabled={salvando}
                  className="hidden"
                />
              </label>

              {imagemArquivo ? (
                <p className="text-xs text-muted-foreground">
                  Nova imagem selecionada. Ela será enviada para o
                  Backblaze B2 ao salvar a questão.
                </p>
              ) : imagemAtual ? (
                <p className="text-xs text-muted-foreground">
                  Esta questão já possui uma imagem salva. Se você
                  selecionar outra, a nova imagem substituirá a
                  referência atual.
                </p>
              ) : null}
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

            <div className="flex justify-end gap-2">
              {editandoId !== null ? (
                <Button
                  variant="outline"
                  onClick={cancelarEdicao}
                  disabled={salvando}
                >
                  <X className="mr-2 size-4" />
                  Cancelar
                </Button>
              ) : null}

              <Button
                onClick={() => void salvarQuestao()}
                disabled={salvando || carregandoEdicao}
              >
                {salvando ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : editandoId !== null ? (
                  <Check className="mr-2 size-4" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}

                {salvando
                  ? "Salvando..."
                  : editandoId !== null
                    ? "Salvar alterações"
                    : "Salvar questão"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Gerenciar questões</CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  {totalQuestoes}{" "}
                  {totalQuestoes === 1
                    ? "questão cadastrada"
                    : "questões cadastradas"}
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Página {totalPaginas > 0 ? paginaAtual : 0} de{" "}
                {totalPaginas}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {carregandoQuestoes ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : questoes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Nenhuma questão cadastrada.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">
                          ID
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Grande Área
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Especialidade
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Tema
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Banca
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Ano
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Dificuldade
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Enunciado
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Ações
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {questoes.map((questao) => (
                        <tr
                          key={questao.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">
                            #{questao.id}
                          </td>

                          <td className="px-4 py-3">
                            {questao.grande_area}
                          </td>

                          <td className="px-4 py-3">
                            {questao.especialidade}
                          </td>

                          <td className="px-4 py-3">
                            {questao.tema || "—"}
                          </td>

                          <td className="px-4 py-3">
                            {questao.instituicao || "—"}
                          </td>

                          <td className="px-4 py-3">
                            {questao.ano || "—"}
                          </td>

                          <td className="px-4 py-3">
                            {questao.dificuldade || "—"}
                          </td>

                          <td className="max-w-md px-4 py-3">
                            <p className="line-clamp-2">
                              {questao.enunciado}
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  void editarQuestao(
                                    questao.id,
                                  )
                                }
                                disabled={
                                  carregandoEdicao ||
                                  salvando ||
                                  excluindoId !== null
                                }
                              >
                                {carregandoEdicao ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <Pencil className="mr-2 size-4" />
                                )}
                                Editar
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  void excluirQuestao(
                                    questao.id,
                                  )
                                }
                                disabled={
                                  excluindoId !== null ||
                                  carregandoEdicao ||
                                  salvando
                                }
                              >
                                {excluindoId === questao.id ? (
                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="mr-2 size-4" />
                                )}
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {(paginaAtual - 1) *
                      QUESTOES_POR_PAGINA +
                      1}{" "}
                    até{" "}
                    {Math.min(
                      paginaAtual * QUESTOES_POR_PAGINA,
                      totalQuestoes,
                    )}{" "}
                    de {totalQuestoes}
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        paginaAtual === 1 ||
                        carregandoQuestoes
                      }
                      onClick={() =>
                        void carregarQuestoes(
                          paginaAtual - 1,
                        )
                      }
                    >
                      <ChevronLeft className="mr-1 size-4" />
                      Anterior
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        paginaAtual >= totalPaginas ||
                        carregandoQuestoes
                      }
                      onClick={() =>
                        void carregarQuestoes(
                          paginaAtual + 1,
                        )
                      }
                    >
                      Próxima
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}