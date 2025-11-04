import { Transaction } from '@/context/AppContext';

export interface BudgetStats {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  budgetUtilization: number;
  categoryBreakdown: Record<string, number>;
  monthlyTrend: { month: string; income: number; expenses: number }[];
}

export function calculateStats(transactions: Transaction[], monthlyBudget: number): BudgetStats {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const currentMonthTransactions = transactions.filter(
    (t) => t.date.startsWith(currentMonth)
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const budgetUtilization = monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  // Category breakdown for expenses
  const categoryBreakdown: Record<string, number> = {};
  currentMonthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });

  // Monthly trend (last 6 months)
  const monthlyTrend: { month: string; income: number; expenses: number }[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().slice(0, 7);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    const monthTransactions = transactions.filter((t) => t.date.startsWith(monthKey));
    
    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    monthlyTrend.push({ month: monthName, income, expenses });
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    budgetUtilization,
    categoryBreakdown,
    monthlyTrend,
  };
}
