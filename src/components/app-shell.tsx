import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  BookOpenCheck,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  NotebookPen,
  Search,
  Stethoscope,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { notificacoes, usuario } from "@/data/mock";

const navegacao = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/questoes", label: "Questões", icon: BookOpenCheck },
  { to: "/simulados", label: "Simulados", icon: ClipboardList },
  { to: "/desempenho", label: "Desempenho", icon: LineChart },
  { to: "/anotacoes", label: "Anotações", icon: NotebookPen },
] as const;

export function AppShell({
  children,
  titulo,
  descricao,
}: {
  children: ReactNode;
  titulo: string;
  descricao?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "group fixed inset-y-0 left-0 z-40 flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-sm transition-[width,transform] duration-200 lg:flex lg:w-16 lg:translate-x-0 lg:hover:w-64",
          aberto ? "flex w-64 translate-x-0" : "hidden -translate-x-full",
        )}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex h-[88px] shrink-0 items-center gap-3 px-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Stethoscope className="size-5" />
          </span>

          <span className="whitespace-nowrap text-lg font-bold tracking-tight opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            QBMed
          </span>
        </Link>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 px-2">
          {navegacao.map((item) => {
            const ativo = pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0" />

                <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Plano atual */}
        <div className="m-3 shrink-0 overflow-hidden rounded-xl bg-sidebar-accent p-4 text-sidebar-accent-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <p className="whitespace-nowrap text-xs uppercase tracking-wide opacity-70">
            Plano atual
          </p>

          <p className="whitespace-nowrap text-sm font-semibold">
            {usuario.plano}
          </p>

          <p className="mt-1 whitespace-nowrap text-xs opacity-70">
            Renova em 18/12/2026
          </p>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-16">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setAberto((v) => !v)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar questões, temas ou simulados..."
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              🔥 {usuario.streak} dias
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Notificações"
                >
                  <Bell className="size-5" />

                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>
                  Notificações
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notificacoes.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex-col items-start gap-0.5"
                  >
                    <span className="text-sm">{n.titulo}</span>

                    <span className="text-xs text-muted-foreground">
                      {n.tempo}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {usuario.iniciais}
                    </AvatarFallback>
                  </Avatar>

                  <span className="hidden text-sm font-medium sm:inline">
                    {usuario.nome}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span>{usuario.nome}</span>

                  <span className="text-xs font-normal text-muted-foreground">
                    {usuario.email}
                  </span>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/perfil">Meu perfil</Link>
                </DropdownMenuItem>

                <DropdownMenuItem>Assinatura</DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/auth">
                    <LogOut className="mr-2 size-4" />
                    Sair
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {titulo}
            </h1>

            {descricao ? (
              <p className="text-sm text-muted-foreground">
                {descricao}
              </p>
            ) : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}