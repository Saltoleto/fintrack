import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="text-lg font-semibold">{title}</div>
      {message && <p className="mt-2 text-sm text-muted">{message}</p>}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </Card>
  );
}
