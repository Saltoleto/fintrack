import { Outlet, NavLink } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/domains/auth/useAuth";
import { Button } from "@/components/ui/Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/investments", label: "Investimentos" },
  { to: "/goals", label: "Metas" },
  { to: "/allocation", label: "Concentração" },
  { to: "/settings", label: "Configurações" }
];

export function PrivateLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-surface glass">
        <Container>
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Logo compact />
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => "navlink " + (isActive ? "navlink-active" : "")}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted">{user?.email ?? "—"}</span>
              <Button variant="ghost" onClick={signOut}>
                Sair
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <Container>
          <div className="py-6">
            <Outlet />
          </div>
        </Container>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border bg-surface">
        <Container>
          <div className="grid grid-cols-5 gap-1 py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => "tab " + (isActive ? "tab-active" : "")}
              >
                <span className="text-[11px] leading-4">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </Container>
      </nav>

      <div className="h-16 md:hidden" />
    </div>
  );
}
