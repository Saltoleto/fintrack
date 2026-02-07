import { Card } from "@/components/ui/Card";

export function LoadingState({ title = "Carregando..." }: { title?: string }) {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <Card className="p-6 w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="spinner" aria-hidden="true" />
          <div>
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted">Aguarde um instante.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
