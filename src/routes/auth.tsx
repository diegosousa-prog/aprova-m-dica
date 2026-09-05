import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Chrome, Facebook, Loader2, Stethoscope } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { especialidades } from "@/data/mock";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — QBMed" },
      {
        name: "description",
        content:
          "Acesse o QBMed e continue seus estudos para a Residência Médica.",
      },
      { property: "og:title", content: "Entrar ou criar conta — QBMed" },
      {
        property: "og:description",
        content: "Login, cadastro e onboarding personalizado do QBMed.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState<"auth" | "onboarding">("auth");
  const [carregando, setCarregando] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [ano, setAno] = useState("");
  const [escolhidas, setEscolhidas] = useState<string[]>([]);

  async function entrar() {
    if (!email || !senha) {
      toast.warning("Preencha e-mail e senha para continuar.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  }

  async function criarConta() {
    if (!email || !senha) {
      toast.warning("Preencha e-mail e senha para continuar.");
      return;
    }

    if (senha.length < 6) {
      toast.warning("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.user || !data.session) {
      toast.error(
        "A conta foi criada, mas não foi possível iniciar a sessão automaticamente."
      );
      return;
    }

    toast.success("Conta criada com sucesso!");
    setEtapa("onboarding");
  }

  async function concluirOnboarding() {
    if (!ano || escolhidas.length === 0) {
      toast.warning(
        "Escolha o ano de formação e ao menos uma especialidade."
      );
      return;
    }

    setCarregando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCarregando(false);
      toast.error("Sua sessão não foi encontrada. Faça login novamente.");
      setEtapa("auth");
      return;
    }

    const { data: perfilSalvo, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        ano_formacao: ano,
        especialidades: escolhidas,
        updated_at: new Date().toISOString(),
      })
      .select();

    console.log("PERFIL SALVO:", perfilSalvo);
    console.log("ERRO AO SALVAR PERFIL:", error);

    setCarregando(false);

    if (error) {
      toast.error(`Erro ao salvar perfil: ${error.message}`);
      return;
    }

    toast.success("Perfil configurado! Bons estudos.");
    navigate({ to: "/dashboard" });
  }

  function social(rede: string) {
    toast.info(
      `Login com ${rede} ainda será configurado. Por enquanto, use e-mail e senha.`
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="hidden flex-col justify-between p-12 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Stethoscope className="size-5" />
          </span>
          <span className="text-lg font-bold">QBMed</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Sua aprovação na Residência Médica começa aqui
          </h2>

          <p className="mt-4 max-w-md text-primary-foreground/80">
            Mais de 42 mil questões fictícias comentadas, simulados
            cronometrados e um painel que mostra exatamente onde você precisa
            melhorar.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/60">
          Conteúdo demonstrativo e fictício.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          {etapa === "auth" ? (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Acessar sua conta</CardTitle>
                    <CardDescription>
                      Use seu e-mail e senha para continuar.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email-login">E-mail</Label>
                      <Input
                        id="email-login"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="senha-login">Senha</Label>
                      <Input
                        id="senha-login"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={carregando}
                      onClick={entrar}
                    >
                      {carregando ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Entrar
                    </Button>

                    <div className="flex items-center gap-3">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        ou continue com
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => social("Google")}
                      >
                        <Chrome className="mr-2 size-4" />
                        Google
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => social("Facebook")}
                      >
                        <Facebook className="mr-2 size-4" />
                        Facebook
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cadastro" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Comece grátis por 7 dias</CardTitle>
                    <CardDescription>
                      Crie sua conta e personalize seu plano de estudos.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email-cadastro">E-mail</Label>
                      <Input
                        id="email-cadastro"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="senha-cadastro">Senha</Label>
                      <Input
                        id="senha-cadastro"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={carregando}
                      onClick={criarConta}
                    >
                      {carregando ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Criar conta grátis
                    </Button>

                    <div className="flex items-center gap-3">
                      <Separator className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        ou continue com
                      </span>
                      <Separator className="flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => social("Google")}
                      >
                        <Chrome className="mr-2 size-4" />
                        Google
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => social("Facebook")}
                      >
                        <Facebook className="mr-2 size-4" />
                        Facebook
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Vamos personalizar seus estudos</CardTitle>
                <CardDescription>
                  Etapa 2 de 2 — leva menos de um minuto.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-2">
                  <Label>Ano de formação</Label>

                  <Select value={ano} onValueChange={setAno}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>

                    <SelectContent>
                      {[
                        "2023",
                        "2024",
                        "2025",
                        "2026",
                        "2027",
                        "Ainda cursando",
                      ].map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Especialidades de interesse</Label>

                  <div className="flex flex-wrap gap-2">
                    {especialidades.map((e) => {
                      const ativa = escolhidas.includes(e);

                      return (
                        <button
                          key={e}
                          type="button"
                          onClick={() =>
                            setEscolhidas((lista) =>
                              ativa
                                ? lista.filter((x) => x !== e)
                                : [...lista, e]
                            )
                          }
                        >
                          <Badge
                            variant={ativa ? "default" : "outline"}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 text-sm",
                              ativa &&
                                "bg-accent text-accent-foreground"
                            )}
                          >
                            {e}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {escolhidas.length} selecionada(s) — usamos isso para
                    montar sua trilha.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={carregando}
                    onClick={() => setEtapa("auth")}
                  >
                    Voltar
                  </Button>

                  <Button
                    className="flex-1"
                    disabled={carregando}
                    onClick={concluirOnboarding}
                  >
                    {carregando ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Concluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Voltar para a página inicial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}