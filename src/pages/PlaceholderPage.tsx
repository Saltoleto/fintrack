import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted">Esta página será implementada nas próximas sprints.</p>
        </div>
        <Badge>SPRINT 3</Badge>
      </div>

      <Card className="p-6">
        <div className="text-sm text-muted">Investimentos estão prontos. Próximas sprints irão adicionar dashboard e insights.</div>
      </Card>
    </div>
  );
}
