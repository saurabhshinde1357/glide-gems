import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetProgressProps {
  utilized: number;
  budget: number;
  percentage: number;
}

export function BudgetProgress({ utilized, budget, percentage }: BudgetProgressProps) {
  const getProgressColor = () => {
    if (percentage >= 90) return 'expense';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const colorClass = getProgressColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="chart-container"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Budget Progress</h3>
        <span className="text-sm text-muted-foreground">
          ${utilized.toFixed(0)} / ${budget.toFixed(0)}
        </span>
      </div>
      
      <div className="relative h-3 mb-4 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full smooth-transition ${
            colorClass === 'expense'
              ? 'bg-expense'
              : colorClass === 'warning'
              ? 'bg-yellow-500'
              : 'bg-success'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{percentage.toFixed(1)}% utilized</span>
        <span className="font-medium">
          ${(budget - utilized).toFixed(0)} remaining
        </span>
      </div>

      {percentage >= 90 && (
        <Alert className="mt-4 border-expense/30 bg-expense/5">
          <AlertCircle className="h-4 w-4 text-expense" />
          <AlertDescription className="text-expense">
            You're approaching your monthly budget limit!
          </AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}
