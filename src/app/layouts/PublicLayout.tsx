import { Outlet } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/layout/Container";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <Container>
        <div className="py-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center justify-center">
              <Logo />
            </div>
            <div className="card p-6">
              <Outlet />
            </div>
            <p className="mt-6 text-center text-sm text-muted">
              FinTrack — Gestão de Investimentos
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
