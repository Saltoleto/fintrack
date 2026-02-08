import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { registerSW } from "virtual:pwa-register";

export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        window.setTimeout(() => setOfflineReady(false), 2500);
      }
    });
  }, []);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      <div className="mx-auto max-w-2xl">
        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">
              {needRefresh ? "Atualização disponível" : "Pronto para uso offline"}
            </div>
            <div className="text-sm text-muted">
              {needRefresh
                ? "Recarregue para aplicar a nova versão."
                : "O app foi cacheado com sucesso."}
            </div>
          </div>

          {needRefresh ? (
            <Button
              onClick={async () => {
                setNeedRefresh(false);

                try {
                  const updateSW = updateSWRef.current;
                  if (updateSW) {
                    await updateSW(true);
                    return;
                  }
                } catch {}

                window.location.reload();
              }}
            >
              Recarregar
            </Button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
