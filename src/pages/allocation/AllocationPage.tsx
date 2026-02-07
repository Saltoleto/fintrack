import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useToaster } from "@/components/feedback/useToaster";
import { useAuth } from "@/domains/auth/useAuth";
import {
  deleteAllocationTarget,
  listAllocationTargets,
  upsertAllocationTarget,
  type AllocationTarget
} from "@/domains/allocation/allocationService";

type FormState = { asset_class: string; target_percent: string };
const emptyForm: FormState = { asset_class: "", target_percent: "" };

export function AllocationPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const toaster = useToaster();

  const [items, setItems] = useState<AllocationTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function reload() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAllocationTargets(userId);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function resetForm() {
    setForm(emptyForm);
  }

  async function onSubmit() {
    if (!userId) return;

    const assetClass = form.asset_class.trim();
    const pct = Number(form.target_percent);

    if (!assetClass) {
      toaster.show({ title: "Classe obrigatória", message: "Informe a classe de investimento.", variant: "warning" });
      return;
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toaster.show({ title: "Percentual inválido", message: "Use um valor entre 0 e 100.", variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      await upsertAllocationTarget({ user_id: userId, asset_class: assetClass, target_percent: pct });
      toaster.show({ title: "Concentração salva", variant: "success" });
      resetForm();
      await reload();
    } catch (e) {
      toaster.show({
        title: "Não foi possível salvar",
        message: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: AllocationTarget) {
    const ok = confirm(`Remover a classe "${item.asset_class}"?`);
    if (!ok) return;

    try {
      await deleteAllocationTarget(item.id, userId);
      toaster.show({ title: "Concentração removida", variant: "success" });
      await reload();
    } catch (e) {
      toaster.show({
        title: "Não foi possível remover",
        message: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "danger"
      });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Concentração por classe</h1>
        <p className="mt-1 text-sm text-muted">Defina a concentração desejada por classe para sua carteira (em %).</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="font-semibold">Nova / atualizar</div>
          <div className="mt-4 space-y-4">
            <Input
              label="Classe de investimento"
              placeholder="Ex.: Renda Fixa, Ações, FIIs..."
              value={form.asset_class}
              onChange={(e) => setForm((s) => ({ ...s, asset_class: e.target.value }))}
              required
            />
            <Input
              label="Percentual desejado (%)"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.target_percent}
              onChange={(e) => setForm((s) => ({ ...s, target_percent: e.target.value }))}
              min={0}
              max={100}
              required
            />

            <div className="flex items-center gap-2">
              <Button onClick={() => void onSubmit()} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="secondary" onClick={resetForm} disabled={saving}>
                Limpar
              </Button>
            </div>

            <div className="text-xs text-muted">
              Observação: Se você salvar uma classe que já existe, ela será atualizada (upsert).
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">Suas classes</div>

          {loading ? (
            <div className="mt-4 text-sm text-muted">Carregando...</div>
          ) : error ? (
            <div className="mt-4">
              <ErrorState message={error} onRetry={() => void reload()} />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Nenhuma concentração cadastrada" message="Adicione classes ao lado." />
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="rounded-xl border border-border p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-medium">{it.asset_class}</div>
                    <div className="mt-1 text-xs text-muted">{String(it.target_percent)}%</div>
                  </div>
                  <Button variant="danger" onClick={() => void onDelete(it)}>
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
