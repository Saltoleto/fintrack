import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { PrivateLayout } from "@/app/layouts/PrivateLayout";
import { RequireAuth } from "@/domains/auth/RequireAuth";

import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";

import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { InvestmentsPage } from "@/pages/investments/InvestmentsPage";
import { GoalsPage } from "@/pages/goals/GoalsPage";
import { AllocationPage } from "@/pages/allocation/AllocationPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <PrivateLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/allocation" element={<AllocationPage />} />
        <Route path="/settings" element={<PlaceholderPage title="Configurações" />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
