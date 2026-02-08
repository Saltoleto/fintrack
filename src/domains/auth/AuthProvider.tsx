import React, { createContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getInitialSession, onAuthStateChange, signOut } from "@/domains/auth/supabaseAuth";
import { LoadingState } from "@/components/states/LoadingState";
import { useToaster } from "@/components/feedback/useToaster";
import { toUserFriendlyError } from "@/utils/errors";

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const toaster = useToaster();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        const initial = await getInitialSession();
        setSession(initial);
        setUser(initial?.user ?? null);

        unsubscribe = onAuthStateChange((nextSession, nextUser) => {
          setSession(nextSession);
          setUser(nextUser);
        });
      } catch (e) {
        toaster.show({
          title: "Falha ao inicializar autenticação",
          message: toUserFriendlyError(e, "auth"),
          variant: "danger"
        });
      } finally {
        setIsLoading(false);
      }
    })();

    return () => unsubscribe?.();
  }, [toaster]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      session,
      user,
      signOut: async () => {
        try {
          await signOut();
        } catch (e) {
          toaster.show({
            title: "Não foi possível sair",
            message: toUserFriendlyError(e, "auth"),
            variant: "danger"
          });
        }
      }
    }),
    [isLoading, session, user, toaster]
  );

  if (isLoading) return <LoadingState title="Carregando..." />;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
