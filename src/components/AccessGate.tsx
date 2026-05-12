import { useState, useEffect, type ReactNode } from "react";
import { isUnlocked, unlock, lock } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Lock } from "lucide-react";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";
import storeBg from "@/assets/store-bg.jpg";

export function AccessGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOk(isUnlocked());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--gradient-soft)] px-4">
        <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-[var(--shadow-brand)]">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gradient-brand)] text-primary-foreground">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Aliança Óptica</h1>
            <p className="text-sm text-muted-foreground">Plataforma privada de gestão de posts</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (unlock(code)) {
                setOk(true);
                setError("");
              } else {
                setError("Código inválido");
              }
            }}
            className="space-y-3"
          >
            <Label htmlFor="code">Código de acesso</Label>
            <Input
              id="code"
              type="password"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Insere o teu código"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </div>
      </div>
    );
  }

  return <AppShell onLogout={() => { lock(); setOk(false); }}>{children}</AppShell>;
}

function AppShell({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const tab = (path: string, label: string) => (
    <Link
      to={path}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        loc.pathname === path || (path !== "/" && loc.pathname.startsWith(path))
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <button onClick={() => navigate({ to: "/" })} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[var(--gradient-brand)]" />
            <span className="font-bold">Aliança Óptica</span>
          </button>
          <nav className="hidden items-center gap-1 sm:flex">
            {tab("/", "Álbuns")}
            {tab("/gerar", "Gerar semana")}
          </nav>
          <Button size="sm" variant="ghost" onClick={onLogout}>
            <LogOut className="mr-1 h-4 w-4" /> Sair
          </Button>
        </div>
        <nav className="flex items-center justify-center gap-1 border-t px-4 py-2 sm:hidden">
          {tab("/", "Álbuns")}
          {tab("/gerar", "Gerar semana")}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
