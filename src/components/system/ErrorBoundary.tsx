import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-bg text-fg grid place-items-center px-4">
        <Card className="p-6 w-full max-w-md">
          <div className="text-lg font-semibold">Ocorreu um erro</div>
          <p className="mt-2 text-sm text-muted">
            A aplicação encontrou um problema inesperado. Você pode recarregar a página.
          </p>
          {this.state.message ? (
            <pre className="mt-3 text-xs text-muted" style={{ whiteSpace: "pre-wrap" }}>
              {this.state.message}
            </pre>
          ) : null}
          <div className="mt-4">
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Recarregar
            </Button>
          </div>
        </Card>
      </div>
    );
  }
}
