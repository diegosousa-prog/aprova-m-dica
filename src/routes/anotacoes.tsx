import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { anotacoes as anotacoesMock, especialidades, type Anotacao } from "@/data/mock";

export const Route = createFileRoute("/anotacoes")({
  head: () => ({
    meta: [
      { title: "Anotações — QBMed" },
      { name: "description", content: "Organize seus resumos e checklists de estudo por especialidade no QBMed." },
      { property: "og:title", content: "Anotações — QBMed" },
      { property: "og:description", content: "Crie, filtre e revise suas anotações de estudo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnotacoesPage,
});

function AnotacoesPage() {
  const [lista, setLista] = useState<Anotacao[]>(anotacoesMock);
  const [filtro, setFiltro] = useState("todas");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [esp, setEsp] = useState(especialidades[0]!);

  const visiveis = filtro === "todas" ? lista : lista.filter((a) => a.especialidade === filtro);

  function criar() {
    if (!titulo.trim() || !texto.trim()) {
      toast.warning("Preencha título e conteúdo da anotação.");
      return;
    }
    setLista((l) => [
      { id: `N-${Date.now()}`, titulo, texto, especialidade: esp, data: "02/09/2026" },
      ...l,
    ]);
    setTitulo("");
    setTexto("");
    toast.success("Anotação criada.");
  }

  return (
    <AppShell titulo="Anotações" descricao="Seus resumos e checklists organizados por especialidade.">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Nova anotação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Conduta em sepse" />
            </div>
            <div className="grid gap-2">
              <Label>Especialidade</Label>
              <Select value={esp} onValueChange={setEsp}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Conteúdo</Label>
              <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} placeholder="Escreva aqui..." />
            </div>
            <Button className="w-full" onClick={criar}>
              <Plus className="mr-2 size-4" /> Adicionar
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {["todas", ...especialidades].map((e) => (
              <button key={e} type="button" onClick={() => setFiltro(e)}>
                <Badge
                  variant={filtro === e ? "default" : "outline"}
                  className={`cursor-pointer ${filtro === e ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {e === "todas" ? "Todas" : e}
                </Badge>
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                Nenhuma anotação nesta especialidade ainda.
              </CardContent>
            </Card>
          ) : (
            visiveis.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{a.titulo}</h3>
                      <p className="text-xs text-muted-foreground">
                        {a.especialidade} • {a.data}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir anotação"
                      onClick={() => {
                        setLista((l) => l.filter((x) => x.id !== a.id));
                        toast("Anotação removida.");
                      }}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{a.texto}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
