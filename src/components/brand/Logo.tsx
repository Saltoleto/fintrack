export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center">
        <span className="font-semibold text-primary">F</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-semibold">FinTrack</div>
          <div className="text-xs text-muted">Gestão de Investimentos</div>
        </div>
      )}
    </div>
  );
}
