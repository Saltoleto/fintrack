import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/app/routes/AppRoutes";
import { AuthProvider } from "@/domains/auth/AuthProvider";
import { ToasterProvider } from "@/components/feedback/ToasterProvider";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToasterProvider>
          <AuthProvider>
            <AppRoutes />
            <PwaUpdatePrompt />
          </AuthProvider>
        </ToasterProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
