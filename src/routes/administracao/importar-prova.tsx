import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  FileUp,
  Loader2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  processarPDF,
  type BlocoQuestao,
} from "@/lib/importador-prova";

export const Route = createFileRoute("/administracao/importar-prova")({
  component: ImportarProvaPage,
});

function ImportarProvaPage() {
  const [arquivoProva, setArquivoProva] = useState<File | null>(null);
  const [arquivoGabarito, setArquivoGabarito] = useState<File | null>(null);

  const [instituicao, setInstituicao] = useState("");
  const [ano, setAno] = useState("");
  const [nomeProva, setNomeProva] = useState("");

  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const [paginasLidas, setPaginasLidas] = useState(0);
  const [questoes, setQuestoes] = useState<BlocoQuestao[]>([]);

  function selecionarProva(
    evento: React.ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = evento.target.files?.[0] ?? null;

    if (!arquivo) {
      return;
    }

    if (arquivo.type !== "application/pdf") {
      setErro("O arquivo da prova precisa estar em formato PDF.");
      return;
    }

    setErro("");
    setQuestoes([]);
    setPaginasLidas(0);
    setArquivoProva(arquivo);
  }

  function selecionarGabarito(
    evento: React.ChangeEvent<HTMLInputElement>,
  ) {
    const arquivo = evento.target.files?.[0] ?? null;

    if (!arquivo) {
      return;
    }

    setArquivoGabarito(arquivo);
  }

  async function processarProva() {
    if (
      !arquivoProva ||
      !arquivoGabarito ||
      !instituicao.trim() ||
      !ano.trim() ||
      !nomeProva.trim()
    ) {
      return;
    }

    setProcessando(true);
    setErro("");
    setQuestoes([]);
    setPaginasLidas(0);

    try {
      const resultado = await processarPDF(arquivoProva);

      setPaginasLidas(resultado.paginas);
      setQuestoes(resultado.questoes);

      if (resultado.questoes.length === 0) {
        setErro(
          "O PDF foi lido, mas nenhuma questão pôde ser identificada. Vamos analisar a estrutura deste documento antes de continuar.",
        );
      }
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar o PDF.",
      );
    } finally {
      setProcessando(false);
    }
  }

  const formularioValido =
    Boolean(arquivoProva) &&
    Boolean(arquivoGabarito) &&
    Boolean(instituicao.trim()) &&
    Boolean(ano.trim()) &&
    Boolean(nomeProva.trim());

  const quantidadeAlternativas = questoes.reduce(
    (total, questao) => total + questao.alternativas.length,
    0,
  );

  return (
    <AppShell
      titulo="Importar prova"
      descricao="Envie uma prova e seu gabarito para transformar o conteúdo em questões e simulados."
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nova importação</CardTitle>

            <CardDescription>
              O sistema analisa a estrutura do PDF automaticamente, sem
              depender de um formato específico de banca ou ano.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <Label>PDF da prova *</Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Envie o caderno completo da prova.
                  </p>
                </div>

                <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40">
                  {arquivoProva ? (
                    <>
                      <FileCheck2 className="mb-3 size-10 text-emerald-600" />

                      <span className="max-w-full truncate text-sm font-medium">
                        {arquivoProva.name}
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        {(arquivoProva.size / 1024 / 1024).toFixed(2)} MB
                      </span>

                      <span className="mt-3 text-xs text-primary">
                        Clique para trocar o arquivo
                      </span>
                    </>
                  ) : (
                    <>
                      <FileUp className="mb-3 size-10 text-muted-foreground" />

                      <span className="text-sm font-medium">
                        Selecionar PDF da prova
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        Formato PDF
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={selecionarProva}
                    disabled={processando}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Gabarito *</Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Envie o gabarito correspondente à prova.
                  </p>
                </div>

                <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40">
                  {arquivoGabarito ? (
                    <>
                      <CheckCircle2 className="mb-3 size-10 text-emerald-600" />

                      <span className="max-w-full truncate text-sm font-medium">
                        {arquivoGabarito.name}
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        {(arquivoGabarito.size / 1024 / 1024).toFixed(2)} MB
                      </span>

                      <span className="mt-3 text-xs text-primary">
                        Clique para trocar o arquivo
                      </span>
                    </>
                  ) : (
                    <>
                      <FileText className="mb-3 size-10 text-muted-foreground" />

                      <span className="text-sm font-medium">
                        Selecionar gabarito
                      </span>

                      <span className="mt-1 text-xs text-muted-foreground">
                        PDF ou arquivo de texto
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept=".pdf,.txt,.csv,application/pdf,text/plain,text/csv"
                    onChange={selecionarGabarito}
                    disabled={processando}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">
                  Dados da prova
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Essas informações serão associadas às questões e ao
                  simulado.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="instituicao">
                    Instituição *
                  </Label>

                  <Input
                    id="instituicao"
                    value={instituicao}
                    onChange={(evento) =>
                      setInstituicao(evento.target.value)
                    }
                    placeholder="Ex.: USP"
                    disabled={processando}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ano">Ano *</Label>

                  <Input
                    id="ano"
                    type="number"
                    value={ano}
                    onChange={(evento) =>
                      setAno(evento.target.value)
                    }
                    placeholder="Ex.: 2026"
                    disabled={processando}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nome-prova">
                    Nome da prova *
                  </Label>

                  <Input
                    id="nome-prova"
                    value={nomeProva}
                    onChange={(evento) =>
                      setNomeProva(evento.target.value)
                    }
                    placeholder="Ex.: USP 2026"
                    disabled={processando}
                  />
                </div>
              </div>
            </div>

            {erro && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {erro}
              </div>
            )}

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex gap-3">
                <Upload className="mt-0.5 size-5 shrink-0 text-primary" />

                <div>
                  <p className="text-sm font-medium">
                    Extração adaptativa
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    O sistema analisa texto, posição dos elementos e
                    diferentes padrões de numeração e alternativas. Ele não
                    depende de um modelo fixo de prova.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={() => void processarProva()}
                disabled={!formularioValido || processando}
              >
                {processando ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Lendo PDF...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 size-4" />
                    Processar prova
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {processando && (
          <Card>
            <CardContent className="flex items-center gap-3 py-6">
              <Loader2 className="size-5 animate-spin text-primary" />

              <div>
                <p className="text-sm font-medium">
                  Analisando estrutura do PDF...
                </p>

                <p className="text-xs text-muted-foreground">
                  O sistema está lendo texto e posição dos elementos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {questoes.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Resultado da extração</CardTitle>

                <CardDescription>
                  O sistema identificou {questoes.length} blocos que
                  provavelmente correspondem a questões.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                      Questões encontradas
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {questoes.length}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                      Páginas lidas
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {paginasLidas}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <p className="text-xs text-muted-foreground">
                      Alternativas identificadas
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {quantidadeAlternativas}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prévia das questões</CardTitle>

                <CardDescription>
                  Esta é a estrutura que o sistema conseguiu reconstruir.
                  Ainda não foi salva no banco.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {questoes.slice(0, 10).map((questao, indice) => (
                  <div
                    key={`${questao.numero ?? "sem-numero"}-${indice}`}
                    className="rounded-xl border p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {questao.numero !== null
                          ? `Questão ${questao.numero}`
                          : `Bloco ${indice + 1}`}
                      </span>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        Confiança{" "}
                        {Math.round(questao.confianca * 100)}%
                      </span>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        Página
                        {questao.paginas.length > 1 ? "s" : ""}{" "}
                        {questao.paginas.join(", ")}
                      </span>
                    </div>

                    <p className="text-sm leading-6">
                      {questao.texto || "Texto não identificado."}
                    </p>

                    {questao.alternativas.length > 0 ? (
                      <div className="mt-4 space-y-2 border-t pt-4">
                        {questao.alternativas.map((alternativa) => (
                          <p
                            key={`${questao.numero}-${alternativa.letra}`}
                            className="text-sm text-muted-foreground"
                          >
                            <span className="font-medium text-foreground">
                              {alternativa.letra})
                            </span>{" "}
                            {alternativa.texto}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-amber-600">
                        Nenhuma alternativa foi identificada neste bloco.
                      </p>
                    )}
                  </div>
                ))}

                {questoes.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Mostrando as primeiras 10 questões de{" "}
                    {questoes.length}.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fluxo da importação</CardTitle>

            <CardDescription>
              O processamento será construído em etapas para funcionar com
              diferentes formatos de prova.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              <Etapa numero="1" titulo="Enviar arquivos" ativa />

              <Etapa numero="2" titulo="Extrair questões" />

              <Etapa numero="3" titulo="Extrair imagens" />

              <Etapa numero="4" titulo="Revisar conteúdo" />

              <Etapa numero="5" titulo="Criar questões e simulado" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Etapa({
  numero,
  titulo,
  ativa = false,
}: {
  numero: string;
  titulo: string;
  ativa?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        ativa ? "border-primary/40 bg-primary/5" : "bg-muted/20"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
            ativa
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {numero}
        </div>

        <span
          className={`text-sm font-medium ${
            ativa ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {titulo}
        </span>
      </div>
    </div>
  );
}