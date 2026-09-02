import {
  CheckCircle2,
  ChevronDown,
  Heart,
  MessageSquare,
  NotebookPen,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Comentario, Questao } from "@/data/mock";

export function QuestaoCard({ questao }: { questao: Questao }) {
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [favorita, setFavorita] = useState(false);
  const [anotando, setAnotando] = useState(false);
  const [anotacao, setAnotacao] = useState("");
  const [resolucaoAberta, setResolucaoAberta] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>(questao.comentarios);
  const [novoComentario, setNovoComentario] = useState("");

  const acertou = respondida && selecionada === questao.correta;

  function responder() {
    if (!selecionada) {
      toast.warning("Selecione uma alternativa antes de responder.");
      return;
    }
    setRespondida(true);
    setResolucaoAberta(true);
    if (selecionada === questao.correta) toast.success("Resposta correta! Muito bem.");
    else toast.error("Resposta incorreta. Confira a resolução comentada.");
  }

  function reiniciar() {
    setRespondida(false);
    setSelecionada(null);
    setResolucaoAberta(false);
  }

  function comentar() {
    if (!novoComentario.trim()) return;
    setComentarios((c) => [
      {
        id: `local-${Date.now()}`,
        autor: "Diego Henrique",
        avatar: "DH",
        tempo: "agora",
        texto: novoComentario.trim(),
        curtidas: 0,
      },
      ...c,
    ]);
    setNovoComentario("");
    toast.success("Comentário publicado no fórum.");
  }

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{questao.id}</Badge>
          <Badge className="bg-primary text-primary-foreground">{questao.especialidade}</Badge>
          <Badge variant="outline">{questao.subespecialidade}</Badge>
          <Badge variant="outline">{questao.banca}</Badge>
          <Badge variant="outline">{questao.ano}</Badge>
          <Badge
            variant="outline"
            className={cn(
              questao.dificuldade === "Fácil" && "border-success text-success",
              questao.dificuldade === "Média" && "border-warning text-warning",
              questao.dificuldade === "Difícil" && "border-destructive text-destructive",
            )}
          >
            {questao.dificuldade}
          </Badge>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Favoritar questão"
              onClick={() => {
                setFavorita((f) => !f);
                toast(favorita ? "Removida dos favoritos" : "Adicionada aos favoritos");
              }}
            >
              <Heart className={cn("size-4", favorita && "fill-destructive text-destructive")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Anotar"
              onClick={() => setAnotando((a) => !a)}
            >
              <NotebookPen className={cn("size-4", anotando && "text-accent")} />
            </Button>
          </div>
        </div>
        <p className="text-base leading-relaxed text-foreground">{questao.enunciado}</p>
        <div className="flex flex-wrap gap-1.5">
          {questao.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {anotando ? (
          <div className="rounded-lg border border-dashed border-accent/60 bg-accent/5 p-3">
            <Textarea
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              placeholder="Escreva sua anotação sobre esta questão..."
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  toast.success("Anotação salva em Anotações.");
                  setAnotando(false);
                }}
              >
                Salvar anotação
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          {questao.alternativas.map((alt) => {
            const escolhida = selecionada === alt.letra;
            const correta = respondida && alt.letra === questao.correta;
            const errada = respondida && escolhida && alt.letra !== questao.correta;
            return (
              <button
                key={alt.letra}
                type="button"
                disabled={respondida}
                onClick={() => setSelecionada(alt.letra)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                  "border-border hover:border-accent hover:bg-accent/5",
                  escolhida && !respondida && "border-accent bg-accent/10",
                  correta && "border-success bg-success/10",
                  errada && "border-destructive bg-destructive/10",
                  respondida && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    escolhida && !respondida && "border-accent bg-accent text-accent-foreground",
                    correta && "border-success bg-success text-success-foreground",
                    errada && "border-destructive bg-destructive text-destructive-foreground",
                  )}
                >
                  {alt.letra}
                </span>
                <span className="pt-1">{alt.texto}</span>
                {correta ? <CheckCircle2 className="ml-auto size-5 text-success" /> : null}
                {errada ? <XCircle className="ml-auto size-5 text-destructive" /> : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!respondida ? (
            <Button onClick={responder}>Responder</Button>
          ) : (
            <>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold",
                  acertou ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {acertou ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                {acertou
                  ? "Você acertou! Gabarito " + questao.correta
                  : `Você errou. Gabarito: ${questao.correta}`}
              </div>
              <Button variant="outline" onClick={reiniciar}>
                Refazer questão
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            className="ml-auto gap-1"
            onClick={() => setResolucaoAberta((v) => !v)}
          >
            Resolução comentada
            <ChevronDown className={cn("size-4 transition-transform", resolucaoAberta && "rotate-180")} />
          </Button>
        </div>

        {resolucaoAberta ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="mb-1 text-sm font-semibold text-primary">Resolução</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{questao.resolucao}</p>
          </div>
        ) : null}

        <Separator />

        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="size-4 text-accent" /> Fórum de comentários ({comentarios.length})
          </p>
          <div className="flex gap-2">
            <Textarea
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Compartilhe seu raciocínio com outros alunos..."
              rows={2}
            />
            <Button onClick={comentar}>Enviar</Button>
          </div>
          <div className="space-y-3">
            {comentarios.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-lg border border-border p-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                    {c.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {c.autor} <span className="text-xs font-normal text-muted-foreground">• {c.tempo}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.texto}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                    onClick={() =>
                      setComentarios((list) =>
                        list.map((x) => (x.id === c.id ? { ...x, curtidas: x.curtidas + 1 } : x)),
                      )
                    }
                  >
                    <ThumbsUp className="size-3.5" /> {c.curtidas}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
