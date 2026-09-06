import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { User, GraduationCap, Stethoscope, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";

import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/perfil")({
  component: Perfil,
});

function Perfil() {
    const [nome, setNome] = useState("");
const [email, setEmail] = useState("");

useEffect(() => {
  async function carregarPerfil() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setEmail(user.email ?? "");

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle();

    setNome(
      perfil?.nome ||
        user.user_metadata?.nome ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Usuário",
    );
  }

  carregarPerfil();
}, []);
  return (
    <AppShell
      titulo="Meu perfil"
      descricao="Gerencie suas informações pessoais e preferências de estudo."
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardContent className="flex items-center gap-5 p-6">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                US
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-bold">Meu perfil</h2>
              <p className="text-sm text-muted-foreground">
                Suas informações no QBMed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Informações pessoais
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
  id="nome"
  placeholder="Seu nome"
  value={nome}
  onChange={(e) => setNome(e.target.value)}
/>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
  id="email"
  type="email"
  value={email}
  disabled
/>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              Formação
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="ano">Ano de formação</Label>
              <Input id="ano" placeholder="Ex.: 2027" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-5" />
              Especialidades de interesse
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground">
              Suas especialidades selecionadas aparecerão aqui.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 size-4" />
            Salvar alterações
          </Button>
        </div>
      </div>
    </AppShell>
  );
}