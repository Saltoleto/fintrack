import { useContext } from "react";
import { ToasterContext } from "@/components/feedback/ToasterProvider";

export function useToaster() {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error("useToaster deve ser usado dentro de ToasterProvider");
  return ctx;
}
