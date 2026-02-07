import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ErrorState({
  title = "Algo deu errado",
  message,
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="text-lg font-semibold">{title}</div>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      )}
    </Card>
  );
}
