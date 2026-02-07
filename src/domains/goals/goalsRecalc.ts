import { updateGoal } from "@/domains/goals/goalsService";
import { sumInvestmentsByGoal } from "@/domains/investments/investmentsService";

/**
 * Recalcula invested_amount da meta a partir dos investimentos vinculados.
 * Sem triggers: esta função é o ponto único para manter consistência.
 */
export async function recalcGoalInvestedAmount(userId: string, goalId: string) {
  const total = await sumInvestmentsByGoal(userId, goalId);
  await updateGoal(goalId, userId, { invested_amount: total });
}
