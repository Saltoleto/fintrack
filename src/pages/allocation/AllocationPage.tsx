import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useToaster } from "@/components/feedback/useToaster";
import { useAuth } from "@/domains/auth/useAuth";
import { embedName } from "@/utils/embeds";
import { getErrorMessage, toUserFriendlyError } from "@/utils/errors";
import { listAssetClasses, type AssetClass } from "@/domains/reference/assetClassesService";
import {
  deleteAllocationTarget,
  listAllocationTargets,
  upsertAllocationTarget,
  type AllocationTarget
} from "@/domains/allocation/allocationService";


type FormState = { asset_class_id: string; target_percent: string };
const emptyForm: FormState = { asset_class_id: "", target_percent: "" };

export function AllocationPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const toaster = useToaster();

  const [items, setItems] = useState<AllocationTarget[]>([]);
  const [classes, setClasses] = useState<AssetClass[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);

  async function reload() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, cls] = await Promise.all([listAllocationTargets(userId), listAssetClasses()]);
      setItems(data);
      setClasses(cls);
    } catch (e) {
      setError(toUserFriendlyError(e, "allocation.load"));
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
  
    const asset_class_id = form.asset_class_id.trim();
    const pct = Number(form.target_percent);
  
    if (!asset_class_id) {
      toaster.show({ title: "Classe obrigatória", message: "Selecione a classe de investimento.", variant: "warning" });
      return;
    }
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      toaster.show({ title: "Percentual inválido", message: "Use um valor entre 0 e 100.", variant: "warning" });
      return;
    }
  
    setSaving(true);
    try {
      await upsertAllocationTarget({ user_id: userId, asset_class_id, target_percent: pct });
      toaster.show({ title: "Concentração salva", variant: "success" });
      resetForm();
      await reload();
    } catch (e) {
      toaster.show({
        title: "Não foi possível salvar",
        message: toUserFriendlyError(e, "allocation.save"),
        variant: "danger"
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item: AllocationTarget) {
    const className = embedName(item.asset_classes) ?? classMap.get(item.asset_class_id) ?? "classe";
    const ok = confirm(`Remover a classe "${className}"?`);
    if (!ok) return;

    try {
      await deleteAllocationTarget(item.id, userId);
      toaster.show({ title: "Concentração removida", variant: "success" });
      await reload();
    } catch (e) {
      toaster.show({
        title: "Não foi possível remover",
        message: getErrorMessage(e),
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
            <div className="space-y-2">
              <div className="text-sm font-medium">Classe de investimento</div>
              <select
                className="select"
                value={form.asset_class_id}
                onChange={(e) => setForm((s) => ({ ...s, asset_class_id: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted">A classe é padronizada (entidade) para garantir consistência.</div>
            </div>

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
              Observação: Se você salvar uma classe já existente, ela será atualizada (upsert por user+classe).
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="font-semibold">Suas classes</div>
          <div className="mt-1 text-xs text-muted">
            Total configurado: {items.reduce((acc, i) => acc + Number(i.target_percent), 0)}% — Faltam: {Math.max(0, 100 - items.reduce((acc, i) => acc + Number(i.target_percent), 0))}%
          </div>


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
              {items.map((it) => {
                const name = embedName(it.asset_classes) ?? classMap.get(it.asset_class_id) ?? "—";
                return (
                  <div
                    key={it.id}
                    className="rounded-xl border border-border p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="mt-1 text-xs text-muted">{String(it.target_percent)}%</div>
                      <div className="mt-2" style={{ width: 220 }}>
                        <ProgressBar value={Number(it.target_percent)} tone={Number(it.target_percent) >= 80 ? "warning" : "neutral"} />
                      </div>
                    </div>
                    <Button variant="danger" onClick={() => void onDelete(it)}>
                      Remover
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
