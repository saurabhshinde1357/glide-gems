import { useApp } from '@/context/AppContext';
import { calculateStats } from '@/utils/calculateStats';
import { formatCurrency } from '@/utils/formatCurrency';
import { MetricCard } from '@/components/Dashboard/MetricCard';
import { ExpenseChart } from '@/components/Dashboard/ExpenseChart';
import { TrendChart } from '@/components/Dashboard/TrendChart';
import { BudgetProgress } from '@/components/Dashboard/BudgetProgress';
import { AIInsights } from '@/components/Dashboard/AIInsights';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

export default function Dashboard() {
  const { transactions, settings } = useApp();
  const stats = calculateStats(transactions, settings.monthlyBudget);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* AI Insights */}
      <div className="mb-8">
        <AIInsights />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <MetricCard
          title="Total Income"
          value={formatCurrency(stats.totalIncome, settings.currency)}
          icon={TrendingUp}
          variant="success"
          delay={0}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses, settings.currency)}
          icon={TrendingDown}
          variant="expense"
          delay={0.1}
        />
        <MetricCard
          title="Net Savings"
          value={formatCurrency(stats.netSavings, settings.currency)}
          icon={DollarSign}
          variant={stats.netSavings >= 0 ? 'success' : 'expense'}
          delay={0.2}
        />
        <MetricCard
          title="Budget Used"
          value={`${stats.budgetUtilization.toFixed(1)}%`}
          icon={PieChart}
          variant={stats.budgetUtilization >= 90 ? 'expense' : 'default'}
          delay={0.3}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ExpenseChart data={stats.categoryBreakdown} />
        <TrendChart data={stats.monthlyTrend} />
      </div>

      {/* Budget Progress */}
      <BudgetProgress
        utilized={stats.totalExpenses}
        budget={settings.monthlyBudget}
        percentage={stats.budgetUtilization}
      />
    </div>
  );
}
